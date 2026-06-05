"""
Configuration and seed utilities for the Brain Tumor Segmentation project.
"""

import os
import random
from dataclasses import dataclass, field
from typing import Tuple

import numpy as np
import torch


@dataclass
class Config:
    """Central configuration for training, evaluation, and data paths."""

    # ── Data paths ──────────────────────────────────────────────────────
    base_dir: str = "segmentation_task"

    @property
    def train_image_dir(self) -> str:
        return os.path.join(self.base_dir, "train", "images")

    @property
    def train_mask_dir(self) -> str:
        return os.path.join(self.base_dir, "train", "masks")

    @property
    def test_image_dir(self) -> str:
        return os.path.join(self.base_dir, "test", "images")

    @property
    def test_mask_dir(self) -> str:
        return os.path.join(self.base_dir, "test", "masks")

    # ── Image / model ──────────────────────────────────────────────────
    img_size: Tuple[int, int] = (224, 224)
    num_classes: int = 2
    in_channels: int = 3
    base_c: int = 32  # Base channel count for DynamicLiteUNet

    # ── Optimiser ──────────────────────────────────────────────────────
    decoder_lr: float = 1e-4
    weight_decay: float = 1e-4

    # ── Training ───────────────────────────────────────────────────────
    batch_size: int = 8
    num_epochs: int = 5
    patience: int = 3
    grad_accum_steps: int = 1
    use_amp: bool = False  # Set True only if you have a CUDA GPU
    seed: int = 42

    # ── Subset limits (None = use all) ─────────────────────────────────
    max_train_samples: int = 100
    max_test_samples: int = 50
    val_split_ratio: float = 0.2  # 20% of train used for validation

    # ── Loss weights ───────────────────────────────────────────────────
    ce_weight: float = 0.5
    dice_weight: float = 1.0
    boundary_weight: float = 0.5
    label_smoothing: float = 0.1

    # ── Deep supervision weights ───────────────────────────────────────
    aux_weights: Tuple[float, ...] = (0.4, 0.6, 0.8)

    # ── Augmentation ───────────────────────────────────────────────────
    augment: bool = True
    use_cutmix: bool = True
    use_mixup: bool = True
    mixup_alpha: float = 0.2
    cutmix_alpha: float = 0.2

    # ── Evaluation / visualisation ─────────────────────────────────────
    eval_batch_size: int = 8
    num_visualize: int = 5
    use_tta: bool = True

    # ── Augmentation hyper-parameters ──────────────────────────────────
    aug_params: dict = field(default_factory=lambda: {
        "hflip_prob": 0.5,
        "vflip_prob": 0.5,
        "rotation_deg": 15,
        "brightness": 0.1,
        "contrast": 0.1,
    })

    # ── Checkpoint path ────────────────────────────────────────────────
    best_model_path: str = "best_model.pth"


def set_seed(seed: int) -> None:
    """Set all random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
