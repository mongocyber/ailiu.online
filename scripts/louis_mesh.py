"""r20C offline tool: turn Louis's front reference into the height field the 3D wireframe bust (louis.js) is built from.

Reads /workspace/deliverables/louis-refs/github/01_front.png (never copied into the site) and writes louis-data.js:
a COLS x ROWS grid, two bytes per cell
  byte 0 = depth 0..255 (× zmax, in units of the portrait width; larger = nearer the viewer)
  byte 1 = zone << 5 | albedo (0..31)
    zone   0 background · 1 skin · 2 hair · 3 sweater · 4 collar rib
    albedo locally stretched luminance, so brows, eyes, lip line and the beard shadow read as darker lines
The depth is not measured from the photo. It is a procedural bust fitted to the photo's silhouette and landmarks:
  · head, neck and torso are "inflated" from their own masks (distance to the edge → an elliptic profile), so the
    outline is his and the volume falls off like a rounded form;
  · the face gets sculpted features placed on measured landmarks (brow ridge, eye sockets, nose bridge, tip and wings,
    cheekbones, philtrum, lips, chin), the hair a thicker cap with a fringe step and bristle noise, the collar a rib ring;
  · a little of the photo's own high-pass light is added on the skin only, for fine form.
At this size the grid is a sculpting source, not a recoverable image.

Usage: python3 scripts/louis_mesh.py [--preview out.png]     Needs Pillow + numpy only.
"""
import sys, json, base64
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = "/workspace/deliverables/louis-refs/github/01_front.png"
COLS, ROWS = 128, 171
PREVIEW = sys.argv[sys.argv.index("--preview") + 1] if "--preview" in sys.argv else None

im = Image.open(SRC).convert("RGB")
W0, H0 = im.size
AY = H0 / W0                                  # portrait height in width units

# ---------------------------------------------------------------- segmentation (as scripts/louis_extract.py, r11)
sw, sh = W0 // 4, H0 // 4
small = np.asarray(im.resize((sw, sh), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))).astype(float)
R, G, B = small[..., 0], small[..., 1], small[..., 2]
L = 0.299 * R + 0.587 * G + 0.114 * B
corners = np.concatenate([small[:12, :12].reshape(-1, 3), small[:12, -12:].reshape(-1, 3), small[sh // 2:sh // 2 + 40, :8].reshape(-1, 3)])
dist = np.sqrt(((small - np.median(corners, 0)) ** 2).sum(-1))

def flood(cand, seeds):
    out = np.zeros_like(cand); q = deque()
    for y, x in seeds:
        if cand[y, x] and not out[y, x]: out[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < cand.shape[0] and 0 <= nx < cand.shape[1] and cand[ny, nx] and not out[ny, nx]:
                out[ny, nx] = True; q.append((ny, nx))
    return out

bg = flood(dist < 24, [(0, x) for x in range(sw)] + [(y, x) for y in range(sh) for x in (0, sw - 1)])
fg = flood(~bg, [(sh // 2, sw // 2)])
warm = R - B
yy, xx = np.mgrid[0:sh, 0:sw] / np.array([sh, sw])[:, None, None]
skin = fg & (warm > 30) & (L > 45)
dark = fg & ~skin
sweater = dark & ((G > R + 2) | (yy > 0.72))
hair = dark & ~sweater & ((yy < 0.30) | ((yy < 0.45) & ((xx < 0.3) | (xx > 0.7)))) & (xx > 0.12) & (xx < 0.84)
zone = np.zeros((sh, sw), np.uint8)
zone[fg] = 1; zone[hair] = 2; zone[sweater] = 3
rib = np.zeros_like(sweater)
for k in range(1, 20): rib |= sweater & np.roll(skin, k, axis=0) & (yy > 0.6)
zone[rib] = 4
# smooth the zone map a little (majority vote over 5x5) so the mesh edges are not ragged
zs = np.zeros((5, sh, sw))
for z in range(5): zs[z] = np.asarray(Image.fromarray(((zone == z) * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(2)))
zone = zs.argmax(0).astype(np.uint8)

zg = np.asarray(Image.fromarray(zone).resize((COLS, ROWS), Image.NEAREST))
X = (np.arange(COLS) + 0.5) / COLS                      # 0..1 across
Y = (np.arange(ROWS) + 0.5) / ROWS * AY                  # 0..AY down (width units)
Xg, Yg = np.meshgrid(X, Y)

# ---------------------------------------------------------------- helpers
def edt(mask):
    """chamfer distance (3-4) to the outside of mask, in width units"""
    INF = 1e9; d = np.where(mask, INF, 0.0)
    h, w = d.shape
    for y in range(h):
        for x in range(w):
            if d[y, x] == 0: continue
            v = d[y, x]
            if x > 0: v = min(v, d[y, x - 1] + 3)
            if y > 0:
                v = min(v, d[y - 1, x] + 3)
                if x > 0: v = min(v, d[y - 1, x - 1] + 4)
                if x < w - 1: v = min(v, d[y - 1, x + 1] + 4)
            d[y, x] = v
    for y in range(h - 1, -1, -1):
        for x in range(w - 1, -1, -1):
            if d[y, x] == 0: continue
            v = d[y, x]
            if x < w - 1: v = min(v, d[y, x + 1] + 3)
            if y < h - 1:
                v = min(v, d[y + 1, x] + 3)
                if x < w - 1: v = min(v, d[y + 1, x + 1] + 4)
                if x > 0: v = min(v, d[y + 1, x - 1] + 4)
            d[y, x] = v
    return d / 3 / COLS

def inflate(mask, depth, reach):
    """elliptic profile from the edge inwards: 0 at the outline, `depth` once `reach` inside"""
    t = np.clip(edt(mask) / reach, 0, 1)
    # blurred, so the medial-axis crease of a distance field does not show as a ridge
    return depth * blur(np.sqrt(t * (2 - t)), 3.0) * mask

def g(cx, cy, sx, sy, h):
    return h * np.exp(-((Xg - cx) ** 2) / (2 * sx * sx) - ((Yg - cy) ** 2) / (2 * sy * sy))

def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def blur(a, r):
    """separable gaussian (sigma r cells), edges clamped"""
    n = int(3 * r + 1); k = np.exp(-np.arange(-n, n + 1) ** 2 / (2 * r * r)); k /= k.sum()
    p = np.pad(a, n, mode="edge")
    p = np.apply_along_axis(lambda v: np.convolve(v, k, "valid"), 1, p)
    return np.apply_along_axis(lambda v: np.convolve(v, k, "valid"), 0, p)

# ---------------------------------------------------------------- landmarks (measured on the 1084 x 1451 reference, width units)
P = lambda x, y: (x / W0, y / W0)
EYE_L, EYE_R = P(372, 562), P(612, 556)                    # screen left / right
NOSE_TIP, NOSE_TOP = P(492, 702), P(492, 560)
MOUTH, CHIN = P(505, 850), P(500, 1010)
JAW_L, JAW_R = P(300, 880), P(735, 870)
CX = 0.462                                                  # facial midline (x)

# head = figure above the jaw curve (a parabola through the jaw corners and the chin), minus the sweater
jaw = CHIN[1] - (CHIN[1] - JAW_L[1]) * ((Xg - CHIN[0]) / (CHIN[0] - JAW_L[0])) ** 2
fig = zg > 0
head = fig & ((zg == 1) | (zg == 2)) & (Yg < np.maximum(jaw, 0.62))
neck = fig & (zg == 1) & ~head
body = fig & (zg >= 3)

# ---------------------------------------------------------------- volumes
zb = 0.04 + inflate(body | neck, 0.20, 0.42)                       # torso: broad and flat
zb += 0.05 * ss(0.95, 1.33, Yg)                                    # chest comes forward lower down
zn = 0.10 + inflate(neck | (head & (Yg > 0.72)), 0.12, 0.16)        # neck cylinder (reaches up under the jaw)
zh = 0.14 + inflate(head, 0.28, 0.20)                              # skull and face
# a face is flatter in front than a ball: push the central face forward, ease the sides back
face = np.exp(-((Xg - CX) / 0.2) ** 2 - ((Yg - 0.66) / 0.3) ** 2)
zh += 0.05 * face
# ears (the head mask at the far sides, eye-to-nose height) sit back and stick out a little
for ex in (0.205, 0.765):
    zh += g(ex, 0.585, 0.022, 0.07, -0.04) * (np.abs(Xg - ex) < 0.05)

# features on the face
feat = np.zeros_like(Xg)
feat += g(CX, 0.475, 0.11, 0.02, 0.022)                             # brow ridge
for ex, ey in (EYE_L, EYE_R):
    feat += g(ex, ey, 0.05, 0.025, -0.03)                           # socket
    feat += g(ex, ey + 0.003, 0.028, 0.013, 0.014)                  # eyeball / lids
    feat += g(ex + (0.035 if ex < CX else -0.035), ey + 0.11, 0.05, 0.035, 0.016)  # cheekbones
# nose: a ridge from between the eyes to the tip, rising and widening, then the wings
for k in np.linspace(0, 1, 24):
    y = NOSE_TOP[1] + (NOSE_TIP[1] - NOSE_TOP[1]) * k
    feat += g(CX + 0.003 * k, y, 0.012 + 0.016 * k, 0.012, (0.012 + 0.05 * k ** 1.6) / 6)
feat += g(CX - 0.042, NOSE_TIP[1] + 0.012, 0.018, 0.016, 0.016)       # wings
feat += g(CX + 0.048, NOSE_TIP[1] + 0.012, 0.018, 0.016, 0.016)
feat += g(CX + 0.003, NOSE_TIP[1] + 0.03, 0.03, 0.008, -0.01)         # under the nose
feat += g(CX + 0.005, 0.745, 0.012, 0.018, 0.006)                    # philtrum
feat += g(MOUTH[0], MOUTH[1] - 0.012, 0.075, 0.012, 0.016)           # upper lip
feat += g(MOUTH[0], MOUTH[1] + 0.016, 0.065, 0.014, 0.018)           # lower lip
feat += g(MOUTH[0], MOUTH[1] + 0.003, 0.085, 0.004, -0.008)          # lip line
feat += g(MOUTH[0], MOUTH[1] + 0.05, 0.05, 0.012, -0.008)            # under the lower lip
feat += g(CHIN[0], CHIN[1] - 0.06, 0.06, 0.035, 0.016)               # chin
for jx in (JAW_L[0] + 0.03, JAW_R[0] - 0.03):
    feat += g(jx, 0.84, 0.03, 0.06, -0.008)                          # under the cheekbones
zh += feat * (zg == 1)

# hair: a cap over the skull, a step at the fringe, crew-cut bristle
hm = (zg == 2).astype(float)
hsoft = blur(hm, 2.5)
rng = np.random.default_rng(7)
zh += 0.028 * hsoft + 0.007 * (rng.random(zh.shape) - 0.5) * hm

# skin: a touch of the photo's own high-pass light (fine form only)
Lf = np.asarray(im.convert("L").resize((COLS * 4, ROWS * 4), Image.LANCZOS)).astype(float).reshape(ROWS, 4, COLS, 4).mean((1, 3))
hp = Lf - blur(Lf, 4)
zh += 0.00012 * hp * (zg == 1)

z = np.where(body, zb, 0)
z = np.where(neck, np.maximum(zn, zb), z)
# smooth union of the head into the neck under the jaw
k = 0.03
hz = np.where(head, zh, 0)
nz = np.where(neck | head, np.maximum(zn * ((neck | head) & (Yg > 0.7)), 0), 0)
hnz = np.maximum(hz, nz)
z = np.where(head, hnz, z)
# collar rib: a rounded ring on the sweater around the neck
rm = blur((zg == 4).astype(float), 1.0)
z += 0.022 * rm * (zg >= 3)
z[zg == 0] = 0
# soften the joins (neck / collar / jaw) without rounding the face detail away
zbl = blur(z, 1.0)
z = np.where(zg == 1, 0.6 * z + 0.4 * zbl, zbl * (zg > 0))
z[zg == 0] = 0
z = np.clip(z, 0, None)
zmax = float(z.max())
q = np.clip(np.round(z / zmax * 255), 0, 255).astype(np.uint8)

# ---------------------------------------------------------------- albedo
Lfull = np.asarray(im.convert("L").resize((COLS * 4, ROWS * 4), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
Lbig = np.asarray(Image.fromarray(Lfull.astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(float)
Lfull = Lfull + 0.5 * (Lfull - Lbig)
Lg = Lfull.reshape(ROWS, 4, COLS, 4).mean((1, 3))
alb = np.zeros((ROWS, COLS))
for zz, (lo, hi) in {1: (2, 97), 2: (5, 99.5), 3: (2, 99.5), 4: (2, 99.5)}.items():
    m = zg == zz
    if m.any():
        a, b = np.percentile(Lg[m], lo), np.percentile(Lg[m], hi)
        alb[m] = np.clip((Lg[m] - a) / max(1, b - a), 0, 1)
a5 = np.clip(np.round(alb * 31), 0, 31).astype(np.uint8)
b1 = (zg.astype(np.uint8) << 5) | a5

data = {"cols": COLS, "rows": ROWS, "aspect": W0 / H0, "zmax": round(zmax, 4),
        "d": base64.b64encode(np.stack([q, b1], -1).tobytes()).decode()}
out = ("/* r20C: generated by scripts/louis_mesh.py — height field for the 3D wireframe bust (louis.js).\n"
       f"   {COLS}x{ROWS} cells, 2 bytes each: depth (× zmax) · zone<<5 | albedo. A sculpting source fitted to the\n"
       "   front reference's outline and landmarks; not the reference image. */\n"
       "window.LOUIS_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
open("louis-data.js", "w").write(out)
print("louis-data.js", len(out), "bytes; zmax", round(zmax, 3), "; zones:", {int(v): int((zg == v).sum()) for v in range(5)})

if PREVIEW:
    # depth as grey + a Lambert shade, side by side
    gy, gx = np.gradient(z * COLS)
    n = np.stack([-gx, gy, np.ones_like(z)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    l = np.array([-0.5, 0.55, 0.65]); l /= np.linalg.norm(l)
    sh_ = np.clip((n * l).sum(-1), 0, 1) * (zg > 0)
    a = np.concatenate([q / 255, sh_], 1)
    Image.fromarray((a * 255).astype(np.uint8)).resize((COLS * 8, ROWS * 4), Image.BILINEAR).save(PREVIEW)
