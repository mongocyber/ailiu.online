"""r11 one-off offline tool: turn Louis's front reference into the low-res field louis.js renders.

Reads /workspace/deliverables/louis-refs/github/01_front.png (never copied into the site) and writes
louis-data.js: a COLS x ROWS grid (default 84 x 112), one byte per cell = zone << 4 | level, where
  level = 0..15 quantized, locally contrast-stretched luminance (the "light" the scanlines carry)
  zone  = 0 background · 1 skin · 2 hair · 3 sweater · 4 sweater rib (collar)
plus a few feature anchors (normalized 0..1) the renderer needs: mouth band, scar line, eyes.
At this size the grid is a stylization source, not a recoverable image.

Usage: python3 scripts/louis_extract.py [src.png] [--preview out.png]
Needs Pillow + numpy only.
"""
import sys, json, base64
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = "/workspace/deliverables/louis-refs/github/01_front.png"
COLS, ROWS = 84, 112
PREVIEW = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None
args = [a for a in sys.argv[1:] if not a.startswith("--") and a != PREVIEW]
if args: SRC = args[0]

im = Image.open(SRC).convert("RGB")
W0, H0 = im.size
# work at 1/4 size for segmentation
sw, sh = W0 // 4, H0 // 4
small = np.asarray(im.resize((sw, sh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))).astype(float)
R, G, B = small[..., 0], small[..., 1], small[..., 2]
L = 0.299 * R + 0.587 * G + 0.114 * B

# background: the flat grey-brown backdrop (sampled from the corners), flood-filled from the border
corners = np.concatenate([small[:12, :12].reshape(-1, 3), small[:12, -12:].reshape(-1, 3), small[sh // 2:sh // 2 + 40, :8].reshape(-1, 3)])
bgc = np.median(corners, 0)
dist = np.sqrt(((small - bgc) ** 2).sum(-1))
cand = dist < 24
bg = np.zeros_like(cand)
q = deque()
for x in range(sw):
    for y in (0,):
        if cand[y, x]: bg[y, x] = True; q.append((y, x))
for y in range(sh):
    for x in (0, sw - 1):
        if cand[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < sh and 0 <= nx < sw and cand[ny, nx] and not bg[ny, nx]:
            bg[ny, nx] = True; q.append((ny, nx))
fg = ~bg
# keep only the figure: the foreground component connected to the face centre (drops the dark vignette corners)
keep = np.zeros_like(fg); q = deque([(sh // 2, sw // 2)]); keep[sh // 2, sw // 2] = True
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < sh and 0 <= nx < sw and fg[ny, nx] and not keep[ny, nx]:
            keep[ny, nx] = True; q.append((ny, nx))
fg = keep; bg = ~fg

# zones on the small grid
warm = (R - B)
zone = np.zeros((sh, sw), np.uint8)
skin = fg & (warm > 30) & (L > 45)
dark = fg & ~skin
yy, xx = np.mgrid[0:sh, 0:sw] / np.array([sh, sw])[:, None, None]
# sweater: dark + greenish (G > R) or below the collar line; hair: dark above the brows
sweater = dark & ((G > R + 2) | (yy > 0.72))
hair = dark & ~sweater & ((yy < 0.30) | ((yy < 0.45) & ((xx < 0.3) | (xx > 0.7))))
# the backdrop vignette darkens the top corners: keep only the hair connected to the head
hair &= (xx > 0.12) & (xx < 0.84)
zone[skin] = 1
zone[dark] = 1          # leftovers (eyes, brows, beard shadow) stay "skin"
zone[hair] = 2
zone[sweater] = 3
# collar rib: the band of sweater right below the neck (sweater cells with skin within a few rows above)
rib = np.zeros_like(sweater)
for k in range(1, 20):
    rib |= sweater & np.roll(skin, k, axis=0) & (yy > 0.6)
zone[rib] = 4
zone[bg] = 0

# luminance for the lines: local contrast stretch on the face so brows/eyes/nose read at low res
Lfull = np.asarray(im.convert("L").resize((COLS * 4, ROWS * 4), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
# unsharp at face scale: lift the features (brows, eyes, nostrils, lip line, jaw shadow) over the broad shading
Lbig = np.asarray(Image.fromarray(Lfull.astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(float)
Lfull = Lfull + 0.55 * (Lfull - Lbig)
Lg = Lfull.reshape(ROWS, 4, COLS, 4).mean((1, 3))
zg = np.asarray(Image.fromarray(zone).resize((COLS, ROWS), Image.NEAREST))
def stretch(vals, lo_p, hi_p):
    lo, hi = np.percentile(vals, lo_p), np.percentile(vals, hi_p)
    return np.clip((vals - lo) / max(1, hi - lo), 0, 1)
lev = np.zeros((ROWS, COLS))
for z, (lo, hi, gamma) in {1: (2, 98, 0.9), 2: (5, 99.5, 1.0), 3: (2, 99.5, 1.0), 4: (2, 99.5, 1.0)}.items():
    m = zg == z
    if m.any(): lev[m] = stretch(Lg[m], lo, hi) ** gamma
q16 = np.clip(np.round(lev * 15), 0, 15).astype(np.uint8)
q16[zg == 0] = 0
packed = (zg.astype(np.uint8) << 4) | q16

# feature anchors, measured on the reference (normalized x, y)
anchors = {
    "mouth": [0.465, 0.585, 0.115, 0.016],      # cx, cy, half-width, half-height of the lip line
    "scar": [0.618, 0.301, 0.609, 0.340],       # x0, y0, x1, y1 of the slanted scar through his left brow (r14B: no longer drawn)
    "dots": [[0.615, 0.287], [0.579, 0.617], [0.633, 0.689]],  # small dark marks: forehead by the scar (r14B: skipped), lower cheek, neck
    "eyes": [[0.34, 0.385], [0.565, 0.38]],
}
data = {"cols": COLS, "rows": ROWS, "aspect": W0 / H0, "anchors": anchors,
        "d": base64.b64encode(packed.tobytes()).decode()}
out = ("/* r11: generated by scripts/louis_extract.py — low-res zone/light field of Louis's front reference.\n"
       "   84x112 cells, zone<<4 | level(0..15). Stylization source only; not the reference image. */\n"
       "window.LOUIS_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
open("louis-data.js", "w").write(out)
print("louis-data.js", len(out), "bytes; zones:", {int(z): int((zg == z).sum()) for z in range(5)})

if PREVIEW:
    pal = {0: (0, 0, 0), 1: (255, 200, 170), 2: (120, 120, 160), 3: (80, 200, 120), 4: (200, 255, 200)}
    rgb = np.zeros((ROWS, COLS, 3))
    for z, c in pal.items():
        m = zg == z; rgb[m] = np.array(c) * (0.25 + 0.75 * q16[m, None] / 15)
    Image.fromarray(rgb.astype(np.uint8)).resize((COLS * 6, ROWS * 6), Image.NEAREST).save(PREVIEW)
