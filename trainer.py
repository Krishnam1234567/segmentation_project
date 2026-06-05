"""
Trainer class and learning-rate scheduler for DynamicLiteUNet.
"""

import random
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from tqdm import tqdm

from augmentation import cutmix_data, mixup_data
from config import Config
from metrics import mean_dice_score


# ── Learning-rate scheduler ──────────────────────────────────────────────


class WarmupCosineScheduler:
    """Linear warmup followed by cosine annealing."""

    def __init__(
        self,
        optimizer: torch.optim.Optimizer,
        warmup_epochs: int,
        total_epochs: int,
        base_lr: float,
    ):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs
        self.base_lr = base_lr

    def step(self, epoch: int) -> None:
        if epoch < self.warmup_epochs:
            lr = self.base_lr * (epoch + 1) / self.warmup_epochs
        else:
            denom = max(self.total_epochs - self.warmup_epochs, 1)
            progress = (epoch - self.warmup_epochs) / denom
            lr = self.base_lr * 0.5 * (1 + np.cos(np.pi * progress))
        for param_group in self.optimizer.param_groups:
            param_group["lr"] = lr


# ── Trainer ──────────────────────────────────────────────────────────────


class Trainer:
    """End-to-end training loop with AMP, deep supervision, and early stopping."""

    def __init__(
        self,
        model: nn.Module,
        loaders: Tuple[DataLoader, DataLoader],
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        scheduler: WarmupCosineScheduler,
        device: torch.device,
        config: Config,
    ):
        self.model = model.to(device)
        self.train_loader, self.val_loader = loaders
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.cfg = config

        # Use the modern API (fixes deprecation warning)
        self.scaler = torch.amp.GradScaler("cuda", enabled=config.use_amp)

        self.best_dice = 0.0
        self.history: Dict[str, List[float]] = {
            "loss": [], "val_loss": [], "dice": [], "val_dice": [],
        }

    # ── Single training epoch ────────────────────────────────────────

    def train_epoch(self, epoch: int) -> Tuple[float, float]:
        self.model.train()
        running_loss, running_dice = 0.0, 0.0
        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch} [Train]")

        for i, (imgs, masks) in enumerate(pbar):
            imgs, masks = imgs.to(self.device), masks.to(self.device)

            # Optional augmentation (MixUp / CutMix)
            if self.cfg.augment:
                if self.cfg.use_cutmix and random.random() < 0.5:
                    imgs, masks_a, masks_b, lam = cutmix_data(
                        imgs, masks, alpha=self.cfg.cutmix_alpha
                    )
                elif self.cfg.use_mixup:
                    imgs, masks_a, masks_b, lam = mixup_data(
                        imgs, masks, alpha=self.cfg.mixup_alpha
                    )
                else:
                    masks_a, masks_b, lam = masks, masks, 1.0
            else:
                masks_a, masks_b, lam = masks, masks, 1.0

            with torch.amp.autocast("cuda", enabled=self.cfg.use_amp):
                final, aux = self.model(imgs)

                loss_main = (
                    self.criterion(final, masks_a) * lam
                    + self.criterion(final, masks_b) * (1 - lam)
                )

                loss_aux = sum(
                    w
                    * (
                        self.criterion(
                            F.interpolate(
                                a, size=masks_a.shape[-2:],
                                mode="bilinear", align_corners=False,
                            ),
                            masks_a,
                        )
                        * lam
                        + self.criterion(
                            F.interpolate(
                                a, size=masks_b.shape[-2:],
                                mode="bilinear", align_corners=False,
                            ),
                            masks_b,
                        )
                        * (1 - lam)
                    )
                    for a, w in zip(aux, self.cfg.aux_weights)
                )

                loss = (loss_main + loss_aux) / self.cfg.grad_accum_steps

            self.scaler.scale(loss).backward()

            if (i + 1) % self.cfg.grad_accum_steps == 0:
                self.scaler.unscale_(self.optimizer)
                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(), max_norm=1.0
                )
                self.scaler.step(self.optimizer)
                self.scaler.update()
                self.optimizer.zero_grad()

            running_loss += loss.item() * self.cfg.grad_accum_steps
            with torch.no_grad():
                dice = lam * mean_dice_score(
                    final, masks_a, self.cfg.num_classes
                ) + (1 - lam) * mean_dice_score(
                    final, masks_b, self.cfg.num_classes
                )
                running_dice += dice.item()

            pbar.set_postfix(
                loss=loss.item() * self.cfg.grad_accum_steps, dice=dice.item()
            )

        n = len(self.train_loader)
        return running_loss / n, running_dice / n

    # ── Validation ───────────────────────────────────────────────────

    @torch.no_grad()
    def validate(self, epoch: int) -> Tuple[float, float]:
        self.model.eval()
        running_loss, running_dice = 0.0, 0.0

        for imgs, masks in tqdm(self.val_loader, desc=f"Epoch {epoch} [Val]"):
            imgs, masks = imgs.to(self.device), masks.to(self.device)
            final = self.model(imgs)
            loss = self.criterion(final, masks)
            running_loss += loss.item()
            running_dice += mean_dice_score(
                final, masks, self.cfg.num_classes
            ).item()

        n = len(self.val_loader)
        return running_loss / n, running_dice / n

    # ── Full training loop ───────────────────────────────────────────

    def fit(self) -> Dict[str, List[float]]:
        no_improvement = 0

        for epoch in range(1, self.cfg.num_epochs + 1):
            tl, td = self.train_epoch(epoch)
            vl, vd = self.validate(epoch)

            self.history["loss"].append(tl)
            self.history["val_loss"].append(vl)
            self.history["dice"].append(td)
            self.history["val_dice"].append(vd)

            print(
                f"Epoch {epoch}: "
                f"Train Loss {tl:.4f}, Dice {td:.4f} | "
                f"Val Loss {vl:.4f}, Dice {vd:.4f}"
            )

            self.scheduler.step(epoch)

            if vd > self.best_dice:
                self.best_dice = vd
                no_improvement = 0
                torch.save(
                    self.model.state_dict(), self.cfg.best_model_path
                )
                print(f"🎉 New Best Model! Dice: {vd:.4f}")
            else:
                no_improvement += 1
                if no_improvement >= self.cfg.patience:
                    print("Early stopping triggered.")
                    break

        return self.history
