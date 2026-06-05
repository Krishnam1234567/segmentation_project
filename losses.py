"""
Loss functions for brain-tumor segmentation.

Provides:
  - DiceLoss         — soft Dice loss over all classes
  - BoundaryLoss     — Sobel-edge-weighted entropy loss
  - CombinedLoss     — weighted sum of Dice + CE + Boundary
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class DiceLoss(nn.Module):
    """Soft Dice loss averaged over all classes."""

    def __init__(self, smooth: float = 1e-6):
        super().__init__()
        self.smooth = smooth

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        probs = F.softmax(logits, dim=1)
        targets_oh = (
            F.one_hot(targets, num_classes=logits.shape[1])
            .permute(0, 3, 1, 2)
            .float()
        )
        intersection = (probs * targets_oh).sum(dim=(2, 3))
        union = probs.sum(dim=(2, 3)) + targets_oh.sum(dim=(2, 3))
        dice = (2.0 * intersection + self.smooth) / (union + self.smooth)
        return 1.0 - dice.mean()


class BoundaryLoss(nn.Module):
    """
    Boundary-aware loss that applies a Sobel-derived edge mask to the
    entropy of the predicted probability distribution.
    """

    def __init__(self):
        super().__init__()
        self.register_buffer(
            "sobel_x",
            torch.tensor(
                [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=torch.float32
            ).view(1, 1, 3, 3),
        )
        self.register_buffer(
            "sobel_y",
            torch.tensor(
                [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=torch.float32
            ).view(1, 1, 3, 3),
        )

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        with torch.no_grad():
            targets_float = targets.float().unsqueeze(1)
            gx = F.conv2d(targets_float, self.sobel_x, padding=1)
            gy = F.conv2d(targets_float, self.sobel_y, padding=1)
            edge = (torch.sqrt(gx ** 2 + gy ** 2) > 0.5).float()

        probs = F.softmax(logits, dim=1)
        log_probs = F.log_softmax(logits, dim=1)
        boundary_ce = -(probs * log_probs).sum(dim=1) * edge.squeeze(1)
        return boundary_ce.mean()


class CombinedLoss(nn.Module):
    """Weighted combination of Dice, Cross-Entropy, and Boundary losses."""

    def __init__(
        self,
        dice_weight: float = 1.0,
        ce_weight: float = 1.0,
        boundary_weight: float = 0.5,
        label_smoothing: float = 0.0,
    ):
        super().__init__()
        self.dice = DiceLoss()
        self.ce = nn.CrossEntropyLoss(label_smoothing=label_smoothing)
        self.boundary = BoundaryLoss()
        self.w_dice = dice_weight
        self.w_ce = ce_weight
        self.w_boundary = boundary_weight

    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        return (
            self.w_dice * self.dice(logits, targets)
            + self.w_ce * self.ce(logits, targets)
            + self.w_boundary * self.boundary(logits, targets)
        )
