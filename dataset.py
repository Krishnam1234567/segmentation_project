"""
Dataset class for brain-tumor segmentation.

Includes mask pre-processing (morphological smoothing) and robust
mask-file lookup that handles the ``*_mask.png`` naming convention.
"""

import os
import warnings
from typing import Dict, Optional, Tuple

import albumentations as A
import cv2
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


# ── Mask pre-processing ──────────────────────────────────────────────────


def preprocess_mask(mask_pil: Image.Image, kernel_size: int = 5) -> Image.Image:
    """Apply morphological close + open to clean mask boundaries."""
    mask_np = np.array(mask_pil)
    if mask_np.max() <= 1:
        mask_np = mask_np * 255
    mask_np = mask_np.astype(np.uint8)
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
    )
    mask_np = cv2.morphologyEx(mask_np, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask_np = cv2.morphologyEx(mask_np, cv2.MORPH_OPEN, kernel, iterations=1)
    return Image.fromarray(mask_np)


# ── Mask-file resolver ───────────────────────────────────────────────────


def _resolve_mask_path(mask_dir: str, img_name: str) -> Optional[str]:
    """
    Try several naming conventions to find the mask file for *img_name*.

    Search order (first match wins):
      1. ``<base>_mask.png``   ← the convention used by this dataset
      2. ``<base>.png``        ← same name as image
      3. Exact image filename  ← fall-through
      4. Any file starting with ``<base>`` (glob fallback)
    """
    base_name = os.path.splitext(img_name)[0]

    # 1.  <base>_mask.png  (most common in this dataset)
    candidate = os.path.join(mask_dir, f"{base_name}_mask.png")
    if os.path.exists(candidate):
        return candidate

    # 2.  <base>.png
    candidate = os.path.join(mask_dir, f"{base_name}.png")
    if os.path.exists(candidate):
        return candidate

    # 3.  Exact image filename
    candidate = os.path.join(mask_dir, img_name)
    if os.path.exists(candidate):
        return candidate

    # 4.  Glob fallback — any file whose name starts with <base>
    possible = [
        f for f in os.listdir(mask_dir) if f.startswith(base_name)
    ]
    if possible:
        return os.path.join(mask_dir, possible[0])

    return None


# ── Dataset ──────────────────────────────────────────────────────────────


class UNetDataset(Dataset):
    """
    PyTorch Dataset that pairs images with their segmentation masks.

    Parameters
    ----------
    image_dir : str
        Directory containing the input images.
    mask_dir : str
        Directory containing the ground-truth masks.
    img_size : tuple of int
        Target ``(H, W)`` to resize images/masks to.
    pre_smooth : bool
        If *True*, apply morphological smoothing and cache the results.
    kernel_size : int
        Kernel size for morphological operations.
    augment : bool
        Whether to apply data augmentation.
    augment_params : dict, optional
        Augmentation hyper-parameters (rotation, flip probs, etc.).
    """

    _IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tif"}

    def __init__(
        self,
        image_dir: str,
        mask_dir: str,
        img_size: Tuple[int, int] = (224, 224),
        pre_smooth: bool = True,
        kernel_size: int = 5,
        augment: bool = False,
        augment_params: Optional[Dict] = None,
    ):
        self.image_dir = image_dir
        self.mask_dir = mask_dir
        self.img_size = img_size
        self.pre_smooth = pre_smooth
        self.kernel_size = kernel_size
        self.augment = augment
        self.cached_masks: dict = {} if pre_smooth else {}

        # ── Filter to images that actually have a matching mask ──
        all_images = sorted(
            f
            for f in os.listdir(image_dir)
            if os.path.splitext(f)[1].lower() in self._IMAGE_EXTS
        )

        self.image_files = []
        self.mask_paths: dict = {}

        for img_name in all_images:
            mask_path = _resolve_mask_path(mask_dir, img_name)
            if mask_path is not None:
                self.image_files.append(img_name)
                self.mask_paths[img_name] = mask_path
            else:
                warnings.warn(
                    f"No mask found for '{img_name}' — skipping at init time.",
                    stacklevel=2,
                )

        if not self.image_files:
            raise RuntimeError(
                f"No valid image–mask pairs found in:\n"
                f"  images: {image_dir}\n"
                f"  masks:  {mask_dir}"
            )

        # ── Transforms ──
        self.to_tensor = transforms.ToTensor()
        self.normalize = transforms.Normalize(
            mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
        )

        if augment and augment_params is not None:
            self.aug_transform = A.Compose(
                [
                    A.HorizontalFlip(p=augment_params.get("hflip_prob", 0.5)),
                    A.VerticalFlip(p=augment_params.get("vflip_prob", 0.5)),
                    A.Rotate(
                        limit=augment_params.get("rotation_deg", 15), p=0.5
                    ),
                    A.RandomBrightnessContrast(
                        brightness_limit=augment_params.get("brightness", 0.1),
                        contrast_limit=augment_params.get("contrast", 0.1),
                        p=0.5,
                    ),
                    A.Resize(*img_size),
                    A.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225],
                    ),
                    ToTensorV2(),
                ]
            )
        else:
            self.aug_transform = None

    def __len__(self) -> int:
        return len(self.image_files)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        img_name = self.image_files[idx]
        img_path = os.path.join(self.image_dir, img_name)
        mask_path = self.mask_paths[img_name]

        # Read image (BGR → RGB)
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Read mask (grayscale)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        # Morphological smoothing (with caching)
        if self.pre_smooth:
            if idx not in self.cached_masks:
                mask_pil = Image.fromarray(mask)
                mask_pil = preprocess_mask(mask_pil, self.kernel_size)
                mask = np.array(mask_pil)
                self.cached_masks[idx] = mask
            else:
                mask = self.cached_masks[idx]
        else:
            mask_pil = Image.fromarray(mask)
            mask_pil = preprocess_mask(mask_pil, self.kernel_size)
            mask = np.array(mask_pil)

        # Apply transforms
        if self.augment and self.aug_transform is not None:
            transformed = self.aug_transform(image=image, mask=mask)
            image = transformed["image"]
            mask = (transformed["mask"] // 255).long()
        else:
            image = cv2.resize(image, self.img_size)
            mask = cv2.resize(
                mask, self.img_size, interpolation=cv2.INTER_NEAREST
            )
            image = self.to_tensor(image)
            image = self.normalize(image)
            mask = torch.from_numpy(mask).long() // 255

        return image, mask
