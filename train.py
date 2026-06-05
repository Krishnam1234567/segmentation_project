"""
train.py — Main entry point for DynamicLiteUNet brain-tumor segmentation.

Usage
-----
  python train.py                                           # defaults (100 train, 50 test)
  python train.py --base-dir segmentation_task              # custom data dir
  python train.py --epochs 50 --batch-size 8 --no-tta       # override hypers
  python train.py --max-train 200 --max-test 100            # change subset sizes
"""

import argparse
import random

import matplotlib.pyplot as plt
import numpy as np
import torch
from torch.utils.data import DataLoader, Subset
from tqdm import tqdm

from config import Config, set_seed
from dataset import UNetDataset
from inference import predict_with_tta, show_advanced_predictions
from losses import CombinedLoss
from metrics import compute_extended_metrics
from model import DynamicLiteUNet
from trainer import Trainer, WarmupCosineScheduler


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train DynamicLiteUNet")
    p.add_argument("--base-dir", type=str, default=None,
                   help="Root of the dataset directory (default: segmentation_task).")
    p.add_argument("--epochs", type=int, default=None)
    p.add_argument("--batch-size", type=int, default=None)
    p.add_argument("--lr", type=float, default=None)
    p.add_argument("--max-train", type=int, default=None,
                   help="Max training samples to use (default: 100).")
    p.add_argument("--max-test", type=int, default=None,
                   help="Max test samples to use (default: 50).")
    p.add_argument("--no-tta", action="store_true",
                   help="Disable Test-Time Augmentation.")
    p.add_argument("--seed", type=int, default=None)
    return p.parse_args()


def build_config(args: argparse.Namespace) -> Config:
    """Merge CLI arguments into a Config instance."""
    kwargs = {}
    if args.base_dir is not None:
        kwargs["base_dir"] = args.base_dir
    if args.epochs is not None:
        kwargs["num_epochs"] = args.epochs
    if args.batch_size is not None:
        kwargs["batch_size"] = args.batch_size
    if args.lr is not None:
        kwargs["decoder_lr"] = args.lr
    if args.seed is not None:
        kwargs["seed"] = args.seed
    if args.max_train is not None:
        kwargs["max_train_samples"] = args.max_train
    if args.max_test is not None:
        kwargs["max_test_samples"] = args.max_test
    cfg = Config(**kwargs)
    if args.no_tta:
        cfg.use_tta = False
    return cfg


def subset_dataset(dataset, max_samples, seed=42):
    """Return a random Subset of the dataset, capped at max_samples."""
    if max_samples is None or max_samples >= len(dataset):
        return dataset
    rng = random.Random(seed)
    indices = rng.sample(range(len(dataset)), max_samples)
    return Subset(dataset, indices)


def split_train_val(dataset, val_ratio=0.2, seed=42):
    """Split a dataset into train and val Subsets."""
    n = len(dataset)
    indices = list(range(n))
    rng = random.Random(seed)
    rng.shuffle(indices)
    split = int(n * (1 - val_ratio))
    train_indices = indices[:split]
    val_indices = indices[split:]
    return Subset(dataset, train_indices), Subset(dataset, val_indices)


def plot_training_curves(history: dict, save_path: str = "training_curves.png") -> None:
    """Save loss and dice curves to a PNG file."""
    plt.figure(figsize=(10, 5))

    plt.subplot(1, 2, 1)
    plt.plot(history["loss"], label="Train")
    plt.plot(history["val_loss"], label="Val")
    plt.title("Loss")
    plt.xlabel("Epoch")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history["dice"], label="Train")
    plt.plot(history["val_dice"], label="Val")
    plt.title("Dice Score")
    plt.xlabel("Epoch")
    plt.legend()

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.show()
    print(f"📈 Training curves saved → {save_path}")


def main() -> None:
    args = parse_args()
    cfg = build_config(args)
    set_seed(cfg.seed)

    # ── Build full datasets ──────────────────────────────────────────
    full_train_ds = UNetDataset(
        cfg.train_image_dir, cfg.train_mask_dir, cfg.img_size,
        augment=cfg.augment, augment_params=cfg.aug_params,
    )
    full_test_ds = UNetDataset(
        cfg.test_image_dir, cfg.test_mask_dir, cfg.img_size, augment=False,
    )

    print(f"Full dataset — Train: {len(full_train_ds)}  |  Test: {len(full_test_ds)}")

    # ── Subset (100 train, 50 test by default) ───────────────────────
    train_subset = subset_dataset(full_train_ds, cfg.max_train_samples, cfg.seed)
    test_subset = subset_dataset(full_test_ds, cfg.max_test_samples, cfg.seed)

    # ── Split train into train + val (80/20) ─────────────────────────
    train_ds, val_ds = split_train_val(train_subset, cfg.val_split_ratio, cfg.seed)

    print(f"Using       — Train: {len(train_ds)}  |  Val: {len(val_ds)}  |  Test: {len(test_subset)}")

    train_loader = DataLoader(
        train_ds, batch_size=cfg.batch_size, shuffle=True, pin_memory=False,
    )
    val_loader = DataLoader(
        val_ds, batch_size=cfg.batch_size, shuffle=False, pin_memory=False,
    )
    test_loader = DataLoader(
        test_subset, batch_size=cfg.eval_batch_size, shuffle=False,
    )

    # ── Device ───────────────────────────────────────────────────────
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # ── Model ────────────────────────────────────────────────────────
    model = DynamicLiteUNet(
        in_channels=cfg.in_channels,
        num_classes=cfg.num_classes,
        base_c=cfg.base_c,
    )

    optimizer = torch.optim.AdamW(
        model.parameters(), lr=cfg.decoder_lr, weight_decay=cfg.weight_decay,
    )
    scheduler = WarmupCosineScheduler(
        optimizer, warmup_epochs=min(5, max(1, cfg.num_epochs // 2)),
        total_epochs=cfg.num_epochs, base_lr=cfg.decoder_lr,
    )
    criterion = CombinedLoss(
        dice_weight=cfg.dice_weight,
        ce_weight=cfg.ce_weight,
        boundary_weight=cfg.boundary_weight,
        label_smoothing=cfg.label_smoothing,
    )

    # ── 1. Train ─────────────────────────────────────────────────────
    trainer = Trainer(
        model, (train_loader, val_loader),
        criterion, optimizer, scheduler, device, cfg,
    )
    history = trainer.fit()

    # ── 2. Evaluate on test set ──────────────────────────────────────
    print("\nLoading best model for evaluation...")
    model.load_state_dict(torch.load(cfg.best_model_path, weights_only=True))
    model.eval()
    model.to(device)

    all_preds, all_masks = [], []

    for imgs, masks in tqdm(test_loader, desc="Testing"):
        imgs, masks = imgs.to(device), masks.to(device)
        if cfg.use_tta:
            outputs = predict_with_tta(model, imgs)
        else:
            with torch.no_grad():
                outputs = model(imgs)
        preds = torch.argmax(outputs, dim=1)
        all_preds.append(preds.cpu())
        all_masks.append(masks.cpu())

    all_preds = torch.cat(all_preds, dim=0)
    all_masks = torch.cat(all_masks, dim=0)

    # ── 3. Extended metrics ──────────────────────────────────────────
    results_df = compute_extended_metrics(
        all_preds, all_masks, num_classes=cfg.num_classes,
    )

    print("\n" + "=" * 60)
    print("EXTENDED EVALUATION MATRIX (Mean ± Std Dev)")
    print("=" * 60)

    vertical_df = results_df.T.reset_index()
    if vertical_df.shape[1] == 2:
        vertical_df.columns = ["Evaluation Metric", "Value"]
    else:
        cols = ["Evaluation Metric"] + [
            f"Class {i + 1}" for i in range(vertical_df.shape[1] - 1)
        ]
        vertical_df.columns = cols

    try:
        print(vertical_df.to_markdown(index=False, tablefmt="grid"))
    except ImportError:
        print(vertical_df.to_string(index=False, justify="left"))

    print("=" * 60)

    results_df.to_csv("segmentation_results_matrix.csv", index=False)
    print("✅ Metrics saved → segmentation_results_matrix.csv")

    # ── 4. Visualisations ────────────────────────────────────────────
    show_advanced_predictions(
        model, test_loader, device,
        num_samples=cfg.num_visualize,
        save_path="advanced_test_predictions.png",
    )

    # ── 5. Training curves ───────────────────────────────────────────
    plot_training_curves(history)


if __name__ == "__main__":
    main()
