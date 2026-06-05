"""
Inference utilities: Test-Time Augmentation and visual result rendering.
"""

from typing import Optional

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader


# ── Test-Time Augmentation ───────────────────────────────────────────────


@torch.no_grad()
def predict_with_tta(model: nn.Module, img: torch.Tensor) -> torch.Tensor:
    """
    Average predictions over four geometric augmentations:
    original, horizontal flip, vertical flip, 90° rotation.
    """
    model.eval()

    p1 = model(img)

    img_h = torch.flip(img, dims=[3])
    p2 = torch.flip(model(img_h), dims=[3])

    img_v = torch.flip(img, dims=[2])
    p3 = torch.flip(model(img_v), dims=[2])

    img_r = torch.rot90(img, k=1, dims=[2, 3])
    p4 = torch.rot90(model(img_r), k=-1, dims=[2, 3])

    return (p1 + p2 + p3 + p4) / 4.0


# ── Visualisation ────────────────────────────────────────────────────────

# ImageNet statistics used during normalisation
_MEAN = np.array([0.485, 0.456, 0.406])
_STD = np.array([0.229, 0.224, 0.225])


def show_advanced_predictions(
    model: nn.Module,
    dataloader: DataLoader,
    device: torch.device,
    num_samples: int = 5,
    save_path: Optional[str] = "advanced_results.png",
) -> None:
    """
    Render a grid showing:
    Original | Ground Truth | Prediction | GT Overlay | Pred Overlay | Error Map
    """
    model.eval()
    fig, axes = plt.subplots(num_samples, 6, figsize=(24, num_samples * 4))
    if num_samples == 1:
        axes = np.expand_dims(axes, 0)

    with torch.no_grad():
        for i, (images, masks) in enumerate(dataloader):
            if i >= num_samples:
                break
            images, masks = images.to(device), masks.to(device)
            outputs = model(images)
            preds = torch.argmax(outputs, dim=1)

            # De-normalise image
            img = images[0].cpu().numpy().transpose(1, 2, 0)
            img = np.clip(img * _STD + _MEAN, 0, 1)

            gt = masks[0].cpu().numpy()
            pred = preds[0].cpu().numpy()

            # Overlays
            overlay_gt = img.copy()
            overlay_gt[gt == 1] = overlay_gt[gt == 1] * 0.5 + np.array([0, 1, 0]) * 0.5

            overlay_pred = img.copy()
            overlay_pred[pred == 1] = (
                overlay_pred[pred == 1] * 0.5 + np.array([1, 0, 0]) * 0.5
            )

            # Error map: TP=Green, FP=Red, FN=Blue
            error_map = np.zeros_like(img)
            error_map[(pred == 1) & (gt == 1)] = [0, 1, 0]
            error_map[(pred == 1) & (gt == 0)] = [1, 0, 0]
            error_map[(pred == 0) & (gt == 1)] = [0, 0, 1]

            titles = [
                "Original Image",
                "Ground Truth",
                "Prediction",
                "GT Overlay",
                "Pred Overlay",
                "Error Map (G=TP, R=FP, B=FN)",
            ]
            plots = [img, gt, pred, overlay_gt, overlay_pred, error_map]

            for j in range(6):
                if j in (1, 2):
                    axes[i, j].imshow(plots[j], cmap="gray")
                else:
                    axes[i, j].imshow(plots[j])
                axes[i, j].set_title(titles[j])
                axes[i, j].axis("off")

    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches="tight")
    plt.show()
