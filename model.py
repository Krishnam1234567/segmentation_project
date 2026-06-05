"""
DynamicLiteUNet — a lightweight U-Net variant with:
  • Mixture-of-Experts dynamic convolutions  (DynamicConvBlock)
  • Gated skip connections                   (DynamicSkipGate)
  • Content-aware upsampling                 (DynamicUpsample)
  • Global bottleneck with depthwise conv    (LightweightGlobalBottleneck)
  • Deep-supervision auxiliary heads
"""

from typing import List, Tuple, Union

import torch
import torch.nn as nn
import torch.nn.functional as F


# ── Building blocks ──────────────────────────────────────────────────────


class DynamicConvBlock(nn.Module):
    """Depthwise-separable convolution with soft mixture-of-experts routing."""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        k: int = 3,
        stride: int = 1,
        experts: int = 4,
    ):
        super().__init__()
        self.experts = experts
        self.routing = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(in_channels, experts),
            nn.Sigmoid(),
        )
        self.convs = nn.ModuleList(
            [
                nn.Sequential(
                    nn.Conv2d(
                        in_channels, in_channels, k, stride, k // 2,
                        groups=in_channels, bias=False,
                    ),
                    nn.Conv2d(in_channels, out_channels, 1, bias=False),
                )
                for _ in range(experts)
            ]
        )
        self.bn = nn.BatchNorm2d(out_channels)
        self.act = nn.SiLU(inplace=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        weights = self.routing(x)
        out = sum(
            weights[:, i].view(-1, 1, 1, 1) * conv(x)
            for i, conv in enumerate(self.convs)
        )
        return self.act(self.bn(out))


class DynamicSkipGate(nn.Module):
    """Gated skip connection that modulates encoder features before fusion."""

    def __init__(self, skip_channels: int, dec_channels: int):
        super().__init__()
        self.gate = nn.Sequential(
            nn.Conv2d(skip_channels + dec_channels, skip_channels, 1),
            nn.Sigmoid(),
        )
        self.project = nn.Conv2d(skip_channels, dec_channels, 1, bias=False)

    def forward(
        self, skip_feat: torch.Tensor, dec_feat: torch.Tensor
    ) -> torch.Tensor:
        if dec_feat.shape[2:] != skip_feat.shape[2:]:
            dec_feat = F.interpolate(
                dec_feat, size=skip_feat.shape[2:],
                mode="bilinear", align_corners=False,
            )
        cat_feat = torch.cat([skip_feat, dec_feat], dim=1)
        return self.project(skip_feat * self.gate(cat_feat))


class DynamicUpsample(nn.Module):
    """Content-aware upsampling with a learned PixelShuffle kernel."""

    def __init__(self, channels: int, scale_factor: int = 2):
        super().__init__()
        self.scale = scale_factor
        self.kernel_generator = nn.Sequential(
            nn.Conv2d(channels, channels * (scale_factor ** 2), 3, padding=1),
            nn.PixelShuffle(scale_factor),
            nn.Sigmoid(),
        )
        self.project = nn.Conv2d(channels, channels, 3, padding=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        up_x = F.interpolate(x, scale_factor=self.scale, mode="nearest")
        return self.project(up_x * self.kernel_generator(x))


class LightweightGlobalBottleneck(nn.Module):
    """Bottleneck with a large depthwise conv for global context."""

    def __init__(self, dim: int):
        super().__init__()
        self.dwconv = nn.Conv2d(dim, dim, 7, padding=3, groups=dim, bias=False)
        self.proj1 = nn.Conv2d(dim, dim * 2, 1)
        self.act = nn.GELU()
        self.proj2 = nn.Conv2d(dim * 2, dim, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.proj2(self.act(self.proj1(self.dwconv(x))))


# ── Full model ───────────────────────────────────────────────────────────


class DynamicLiteUNet(nn.Module):
    """
    Lightweight U-Net with dynamic convolutions, gated skip connections,
    content-aware upsampling, and deep-supervision auxiliary heads.

    During training, ``forward()`` returns ``(final_logits, [aux3, aux2, aux1])``.
    During inference it returns ``final_logits`` only.
    """

    def __init__(
        self,
        in_channels: int = 3,
        num_classes: int = 2,
        base_c: int = 32,
    ):
        super().__init__()

        # ── Encoder ──
        self.enc1 = DynamicConvBlock(in_channels, base_c)
        self.enc2 = DynamicConvBlock(base_c, base_c * 2)
        self.enc3 = DynamicConvBlock(base_c * 2, base_c * 4)
        self.enc4 = DynamicConvBlock(base_c * 4, base_c * 8)
        self.pool = nn.MaxPool2d(2)

        # ── Bottleneck ──
        self.bottleneck = LightweightGlobalBottleneck(base_c * 8)

        # ── Skip gates ──
        self.gate3 = DynamicSkipGate(base_c * 8, base_c * 8)
        self.gate2 = DynamicSkipGate(base_c * 4, base_c * 4)
        self.gate1 = DynamicSkipGate(base_c * 2, base_c * 2)

        # ── Decoder ──
        self.up3 = DynamicUpsample(base_c * 8, scale_factor=2)
        self.dec3 = DynamicConvBlock(base_c * 16, base_c * 4)

        self.up2 = DynamicUpsample(base_c * 4, scale_factor=2)
        self.dec2 = DynamicConvBlock(base_c * 8, base_c * 2)

        self.up1 = DynamicUpsample(base_c * 2, scale_factor=2)
        self.dec1 = DynamicConvBlock(base_c * 4, base_c)

        # ── Output head ──
        self.out_conv = nn.Conv2d(base_c, num_classes, 1)

        # ── Auxiliary (deep supervision) heads ──
        self.aux3 = nn.Conv2d(base_c * 4, num_classes, 1)
        self.aux2 = nn.Conv2d(base_c * 2, num_classes, 1)
        self.aux1 = nn.Conv2d(base_c, num_classes, 1)

    def forward(
        self, x: torch.Tensor
    ) -> Union[torch.Tensor, Tuple[torch.Tensor, List[torch.Tensor]]]:
        # Encoder
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))

        # Bottleneck
        b = self.bottleneck(self.pool(e4))

        # Decoder
        d3_up = self.up3(b)
        d3 = self.dec3(torch.cat([d3_up, self.gate3(e4, d3_up)], dim=1))

        d2_up = self.up2(d3)
        d2 = self.dec2(torch.cat([d2_up, self.gate2(e3, d2_up)], dim=1))

        d1_up = self.up1(d2)
        d1 = self.dec1(torch.cat([d1_up, self.gate1(e2, d1_up)], dim=1))

        final_up = F.interpolate(
            d1, size=x.shape[2:], mode="bilinear", align_corners=False
        )
        final = self.out_conv(final_up)

        if self.training:
            return final, [self.aux3(d3), self.aux2(d2), self.aux1(d1)]
        return final
