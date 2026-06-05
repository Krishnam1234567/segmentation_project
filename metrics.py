"""
Evaluation metrics for segmentation.

Provides:
  - mean_dice_score          — batch-level mean Dice (for training loop)
  - get_surface_distance     — surface-to-surface distances for HD95 / ASD
  - compute_extended_metrics — full per-image evaluation table (Mean ± Std)
"""

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from scipy.ndimage import binary_erosion
from scipy.ndimage import distance_transform_edt as edt
from tqdm import tqdm


def mean_dice_score(
    logits: torch.Tensor, targets: torch.Tensor, num_classes: int
) -> torch.Tensor:
    """Compute the mean Dice score across all classes (batch-level)."""
    preds = torch.argmax(logits, dim=1)
    dice = 0.0
    for c in range(num_classes):
        p = (preds == c).float()
        t = (targets == c).float()
        dice += (2 * (p * t).sum() + 1e-8) / (p.sum() + t.sum() + 1e-8)
    return dice / num_classes


def get_surface_distance(
    mask1: np.ndarray, mask2: np.ndarray, voxelspacing=None
) -> np.ndarray:
    """Symmetric surface distances between two binary masks."""
    if voxelspacing is None:
        voxelspacing = [1.0] * mask1.ndim
    struct = np.ones((3, 3), dtype=bool)
    edge1 = mask1 ^ binary_erosion(mask1, structure=struct)
    edge2 = mask2 ^ binary_erosion(mask2, structure=struct)
    dt1 = edt(~edge1, sampling=voxelspacing)
    dt2 = edt(~edge2, sampling=voxelspacing)
    return np.concatenate([dt2[edge1], dt1[edge2]])


def compute_extended_metrics(
    preds: torch.Tensor,
    targets: torch.Tensor,
    num_classes: int = 2,
    network_name: str = "DynamicLiteUNet",
) -> pd.DataFrame:
    """
    Compute image-level metrics and return a DataFrame with Mean ± Std.

    Evaluated on foreground classes only (class index ≥ 1).
    """
    eps = 1e-7
    results = []

    preds_np = preds.cpu().numpy()
    targets_np = targets.cpu().numpy()

    for c in range(1, num_classes):
        p_c = (preds_np == c).astype(np.float32)
        t_c = (targets_np == c).astype(np.float32)

        metrics = {
            "iou": [], "dsc": [], "prec": [], "rec": [], "spec": [],
            "acc": [], "hd95": [], "asd": [], "voe": [], "mcc": [],
        }

        print(f"\nCalculating per-image metrics for Class {c} to get Std Dev...")
        for i in tqdm(range(p_c.shape[0]), desc="Evaluating instances"):
            p = p_c[i]
            t = t_c[i]

            tp = np.sum(p * t)
            fp = np.sum(p * (1 - t))
            fn = np.sum((1 - p) * t)
            tn = np.sum((1 - p) * (1 - t))

            # Both ground truth and prediction are completely empty → perfect
            if np.sum(t) == 0 and np.sum(p) == 0:
                metrics["iou"].append(1.0)
                metrics["dsc"].append(1.0)
                metrics["prec"].append(1.0)
                metrics["rec"].append(1.0)
                metrics["spec"].append(1.0)
                metrics["acc"].append(1.0)
                metrics["voe"].append(0.0)
                metrics["mcc"].append(1.0)
                metrics["hd95"].append(0.0)
                metrics["asd"].append(0.0)
                continue

            # Standard metrics
            iou = tp / (tp + fp + fn + eps)
            dsc = 2 * tp / (2 * tp + fp + fn + eps)
            prec = tp / (tp + fp + eps) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn + eps) if (tp + fn) > 0 else 0.0
            spec = tn / (tn + fp + eps)
            acc = (tp + tn) / (tp + tn + fp + fn + eps)

            mcc_num = (tp * tn) - (fp * fn)
            mcc_den = (
                np.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)) + eps
            )
            mcc = mcc_num / mcc_den
            voe = 1.0 - iou

            # Distance metrics (HD95, ASD)
            if np.sum(p) == 0 or np.sum(t) == 0:
                max_dist = np.sqrt(p.shape[0] ** 2 + p.shape[1] ** 2)
                hd95 = max_dist
                asd = max_dist
            else:
                surfdists = get_surface_distance(
                    p.astype(bool), t.astype(bool)
                )
                hd95 = np.percentile(surfdists, 95)
                asd = np.mean(surfdists)

            metrics["iou"].append(iou)
            metrics["dsc"].append(dsc)
            metrics["prec"].append(prec)
            metrics["rec"].append(rec)
            metrics["spec"].append(spec)
            metrics["acc"].append(acc)
            metrics["hd95"].append(hd95)
            metrics["asd"].append(asd)
            metrics["voe"].append(voe)
            metrics["mcc"].append(mcc)

        def fmt(lst, is_percent=True):
            arr = np.array(lst)
            if is_percent:
                arr = arr * 100
            return f"{np.mean(arr):.2f} ± {np.std(arr):.2f}"

        results.append(
            {
                "Network": network_name,
                "IoU (% ↑)": fmt(metrics["iou"]),
                "DSC (% ↑)": fmt(metrics["dsc"]),
                "Precision (% ↑)": fmt(metrics["prec"]),
                "Recall/Sens (% ↑)": fmt(metrics["rec"]),
                "Specificity (% ↑)": fmt(metrics["spec"]),
                "Accuracy (% ↑)": fmt(metrics["acc"]),
                "HD95 (mm ↓)": fmt(metrics["hd95"], is_percent=False),
                "ASD (mm ↓)": fmt(metrics["asd"], is_percent=False),
                "VOE (% ↓)": fmt(metrics["voe"]),
                "L-F1 (% ↑)": fmt(metrics["dsc"]),
                "F1-score (% ↑)": fmt(metrics["dsc"]),
                "MCC (% ↑)": fmt(metrics["mcc"]),
                "p-value": "N/A",
            }
        )

    return pd.DataFrame(results)
