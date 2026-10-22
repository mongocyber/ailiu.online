"""r13: one-off — build the Design Work images (assets/work/<case>-<n>.webp + -sm.webp) from the old site.

Source: /workspace/mongocyber.github.io (read only). Each picture was checked by eye for employer / product
names, logos, real people and internal figures; the only hit was the support "problem overview" card,
whose four description lines (one names the employer's assistant) are painted out here.
Usage: python3 scripts/work_images.py   (prints the size table used in DESIGN-NOTES)
"""
import io, os, sys
import numpy as np
from PIL import Image

SRC = "/workspace/mongocyber.github.io/projects/"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "work")
CAP = 90_000          # bytes per file, desktop
# (case, n, source, desktop width, phone width)
PICK = [
    ("agent", 1, "agent-builder/assets/workflow-editor.png", 1400, 720),
    ("agent", 2, "agent-builder/assets/process-visible.png", 1000, 720),
    ("agent", 3, "agent-builder/assets/xinxi.png", 1000, 720),
    ("annotation", 1, "data-annotation-service/assets/annotation-workbench.png", 1400, 720),
    ("annotation", 2, "data-annotation-service/assets/annotation-task-distribution.png", 1000, 720),
    ("annotation", 3, "data-annotation-service/assets/annotation-review-dashboard.png", 1000, 720),
    ("platform", 1, "data-platform/assets/data-platform-hero.png", 1400, 720),
    ("platform", 2, "data-platform/assets/data-platform-permission-consumption.png", 1000, 720),
    ("platform", 3, "data-platform/assets/data-platform-information-architecture.png", 1000, 720),
    ("analytics", 1, "self-service-analytics/assets/self-service-analytics-hero.png", 1400, 720),
    ("analytics", 2, "self-service-analytics/assets/self-service-analytics-data-field-selection.png", 1000, 720),
    ("analytics", 3, "self-service-analytics/assets/self-service-analytics-chart-config-panel.png", 1000, 720),
    ("support", 1, "support-service-upgrade/assets/ai-process-recommendation-flow.png", 1400, 720),
    ("support", 2, "support-service-upgrade/assets/problem-overview.png", 760, 560),
]


def scrub_support_overview(im):
    """Paint out the four description lines (x 512–1016) with a per-row blend of the card background."""
    a = np.array(im.convert("RGB")).astype(float)
    x0, x1 = 512, 1016
    t = np.linspace(0, 1, x1 - x0)[:, None]
    for top, bot in [(252, 304), (615, 666), (952, 1002), (1269, 1319)]:
        for y in range(top - 6, bot + 7):
            a[y, x0:x1] = a[y, x0] * (1 - t) + a[y, x1] * t
    return Image.fromarray(a.astype("uint8"))


def encode(im, w, cap):
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if im.width > w else im
    for q in range(82, 30, -4):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= cap:
            return im.size, buf.getvalue(), q
    return im.size, buf.getvalue(), q


def main():
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for case, n, src, w, wm in PICK:
        im = Image.open(SRC + src).convert("RGB")
        if src.endswith("problem-overview.png"):
            im = scrub_support_overview(im)
        for suffix, width, cap in (("", w, CAP), ("-sm", wm, 45_000)):
            size, data, q = encode(im, width, cap)
            name = f"{case}-{n}{suffix}.webp"
            open(os.path.join(OUT, name), "wb").write(data)
            total += len(data)
            print(f"{name:26s} {size[0]}x{size[1]}  q{q}  {len(data) / 1024:.1f}KB")
    print(f"total {total / 1024:.0f}KB")


if __name__ == "__main__":
    sys.exit(main())
