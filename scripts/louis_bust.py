"""r22: Louis as a real 3D bust — a procedural signed-distance model (skull, brow ridge, eye sockets and eyes, nose,
cheekbones, jaw, lips, chin, ears, short cropped hair with a straight fringe, neck, collar rib, shoulders and chest),
sculpted by hand to the approved front reference (/workspace/deliverables/louis-refs/github/01_front.png: wide face,
square jaw, straight thick brows, narrow eyes, short spiky crop with a blunt fringe, ears that stand out a little,
thick neck, dark crew-neck knit). No image is sampled — only proportions were read off the reference by eye.

The surface is meshed as a latitude / longitude grid: every grid row is one cone of rays (an origin on the vertical
axis, a polar angle and a cross-section aspect), every column one parametric angle around it. Rays are cast from the
inside out to the first exit (head rows look a little further for the ears). Rows are re-spaced to equal arc length.
Only the per-row ray parameters and one 16-bit word per vertex (13-bit radius, 3-bit zone) are written, so
louis.js rebuilds the exact mesh (and the low tier takes every second row / column).

Units: centimetres, y up, z toward the viewer, y = 0 at the chin.
Usage: python3 scripts/louis_bust.py [--debug]   → louis-data.js (and shots/r22-bust-profiles.png with --debug)"""
import base64, json, math, pathlib, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
NC, NR = 176, 216            # high tier grid (columns around, rows top → bottom); low tier = every second one
YCUT = -25.0                 # the bust is cut (and faded in louis.js) below this

# ---------------------------------------------------------------- SDF primitives (vectorised over (N, 3) arrays)
def vec(p, c):            # a centre whose components may vary per point
    return np.stack([np.broadcast_to(np.asarray(ci, float), (len(p),)) for ci in c], -1)

def ell(p, c, r):
    q = (p - vec(p, c)) / np.asarray(r, float)
    k0 = np.linalg.norm(q, axis=1); k1 = np.linalg.norm(q / np.asarray(r, float), axis=1)
    return k0 * (k0 - 1) / np.maximum(k1, 1e-6)

def sph(p, c, r): return np.linalg.norm(p - c, axis=1) - r

def cap(p, a, b, ra, rb):
    a = np.asarray(a, float); b = np.asarray(b, float); ba = b - a; pa = p - a
    h = np.clip(pa @ ba / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=1) - (ra + (rb - ra) * h)

def rbox(p, c, b, r):
    q = np.abs(p - c) - b
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(axis=1), 0) - r

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)

def smax(a, b, k): return -smin(-a, -b, k)

def rot_y(p, ang):
    c, s = math.cos(ang), math.sin(ang); q = p.copy()
    q[:, 0] = c * p[:, 0] + s * p[:, 2]; q[:, 2] = -s * p[:, 0] + c * p[:, 2]; return q

def rot_z(p, ang):
    c, s = math.cos(ang), math.sin(ang); q = p.copy()
    q[:, 0] = c * p[:, 0] - s * p[:, 1]; q[:, 1] = s * p[:, 0] + c * p[:, 1]; return q

def rot_x(p, ang):
    c, s = math.cos(ang), math.sin(ang); q = p.copy()
    q[:, 1] = c * p[:, 1] - s * p[:, 2]; q[:, 2] = s * p[:, 1] + c * p[:, 2]; return q

def mirror(p): q = p.copy(); q[:, 0] = np.abs(q[:, 0]); return q

# ---------------------------------------------------------------- the model
def parts(p):
    """returns the component distances; the final surface is model(p)"""
    m = mirror(p)
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    # skull: a broad cranium and a wide face mass
    cran = ell(p, (0, 15.2, -1.4), (7.7, 8.5, 9.7))
    face = ell(p, (0, 11.0, 2.4), (7.3, 7.8, 6.6))
    head = smin(cran, face, 3.0)
    # jaw: square and wide (rounded box), a strong chin block in front
    jaw = ell(p, (0, 4.3, 2.4), (6.1, 4.3, 6.0))
    head = smin(head, jaw, 2.6)
    mand = cap(m, (5.0, 3.7, -1.0), (2.6, 1.0, 5.6), 1.6, 1.7)     # the jawline, from the angle to the chin
    head = smin(head, mand, 3.2)
    chin = rbox(p, (0, 1.5, 6.0), (2.6, 1.2, 1.1), 1.3)
    head = smin(head, chin, 1.5)
    # cheekbones and the full cheeks under them
    cheek = ell(m, (4.9, 9.6, 5.0), (2.4, 1.6, 2.4))
    head = smin(head, cheek, 1.4)
    # muzzle (the mouth's curved base)
    muz = ell(p, (0, 4.6, 5.4), (4.3, 3.4, 3.2))
    head = smin(head, muz, 1.3)
    # brow ridge (a slight bar above the eyes)
    brow = ell(m, (2.9, 14.3, 6.9), (3.2, 1.1, 1.6))
    head = smin(head, brow, 1.2)
    brows = ell(m, (3.35, 14.1, 8.15), (2.3, 0.45, 0.5))           # the eyebrows themselves, a thin raised pad
    head = smin(head, brows, 0.3)
    # eye sockets, then eyeballs and lids (narrow eyes: a heavy upper lid that comes low)
    sock = ell(m, (3.15, 12.35, 8.0), (2.0, 1.1, 1.25))
    head = smax(head, -sock, 0.8)
    eye = sph(m, np.array([3.15, 12.3, 6.35]), 1.3)
    lid = ell(m, (3.15, 12.72, 6.75), (1.8, 0.72, 1.05))
    lowlid = ell(m, (3.2, 11.85, 6.65), (1.7, 0.48, 0.95))
    eyes = smin(smin(eye, lid, 0.25), lowlid, 0.25)
    head = smin(head, eyes, 0.35)
    # nose: a low bridge, a rounded tip, broad wings (alae)
    bridge = cap(p, (0, 12.6, 7.55), (0, 8.4, 9.75), 0.6, 0.9)
    tip = sph(p, np.array([0, 7.55, 9.95]), 1.2)
    alae = sph(m, np.array([1.6, 7.05, 8.7]), 1.02)
    nose = smin(smin(bridge, tip, 0.9), alae, 0.55)
    nost = ell(m, (0.8, 6.72, 9.2), (0.48, 0.22, 0.5))
    nose = smax(nose, -nost, 0.25)
    head = smin(head, nose, 0.55)
    # lips: full, closed, with a slight smile (the corners pulled up and back)
    ux = x / 2.6
    lip_up = ell(p, (0, 4.55 + 0.25 * ux * ux, 8.35 - 0.75 * ux * ux), (2.55, 0.62, 1.0))
    lip_lo = ell(p, (0, 3.72 + 0.15 * ux * ux, 8.2 - 0.6 * ux * ux), (2.25, 0.66, 1.0))
    lips = smin(lip_up, lip_lo, 0.3)
    head = smin(head, lips, 0.45)
    seam = ell(p, (0, 4.12 + 0.3 * ux * ux, 9.2), (2.5, 0.08, 1.2))
    head = smax(head, -seam, 0.1)
    # ears: flat ovals, tilted back, standing out from the head a little, with a hollow (concha)
    e = m - np.array([7.5, 11.3, -1.0]); e = rot_z(rot_y(e, 0.6), -0.12)
    ear = ell(e, (0.0, 0, 0), (0.8, 3.25, 2.05))
    conc = ell(e, (0.6, -0.3, 0.2), (0.5, 1.75, 1.1))
    ear = smax(ear, -conc, 0.25)
    head = smin(head, ear, 0.45)
    # neck → shoulders → chest as one loft: superellipse sections whose size follows a profile down the body
    # (sign-correct, which is all the meshing needs); the arms are cut off like a bust
    LY = [9.0, 0.0, -3.0, -4.6, -6.0, -7.5, -9.5, -12.0, -15.0, -19.0, -25.0, -36.0]
    yy = -y
    rx = np.interp(yy, [-v for v in LY], [6.0, 6.0, 6.0, 7.0, 10.6, 16.0, 19.8, 21.3, 21.2, 19.6, 18.6, 18.0])
    rz = np.interp(yy, [-v for v in LY], [5.6, 5.6, 5.6, 6.1, 7.0, 7.8, 8.5, 9.1, 9.5, 9.6, 9.4, 9.2])
    zc = np.interp(yy, [-v for v in LY], [-1.6, -0.9, -0.9, -0.9, -0.9, -0.8, -0.6, -0.3, 0.0, 0.2, 0.2, 0.2])
    ne = np.interp(yy, [-v for v in LY], [2.0, 2.0, 2.0, 2.0, 2.2, 2.6, 2.9, 3.0, 3.0, 2.8, 2.6, 2.6])
    sn = (np.abs(x / rx) ** ne + np.abs((z - zc) / rz) ** ne) ** (1 / ne)
    loft = (sn - 1) * np.minimum(rx, rz)
    loft = smax(loft, np.maximum(y - 9.0, -36.0 - y), 1.0)
    loft = smin(loft, sph(p, np.array([0, -1.4, 4.3]), 0.8), 1.0)            # a soft Adam's apple
    # crew-neck rib: a raised band where a plane (lower at the front) crosses the neck base
    q = rot_x(p - np.array([0, -5.2, -0.9]), -0.3)
    rad = np.hypot(x, z + 0.9)
    band = np.clip(1 - (q[:, 1] / 1.15) ** 2, 0, 1) * np.clip((11.0 - rad) / 2.0, 0, 1)
    knit = loft - 1.0 * np.sqrt(band) * (q[:, 1] > -1.15)
    body = smin(head, knit, 3.0)
    # hair: a shell over the cranium (volume on top, short at the sides), a jagged straight fringe and fine spikes
    phi = np.arctan2(x, z + 1.2)                                  # 0 front, ±π back
    hs = ell(p, (0, 16.2, -1.3), (8.3, 9.3, 10.4))
    spike = 0.08 * np.sin(x * 7.3 + np.sin(z * 3.1) * 2.0) * np.sin(z * 6.9 + y * 3.3) + 0.07 * np.sin(phi * 41.0 + y * 4.7)
    top = np.clip((y - 19.0) / 5.0, 0, 1)
    hs = hs - spike * (0.5 + 0.8 * top) - 0.7 * top
    a = np.abs(phi)
    hl = np.interp(a, [0, 0.55, 0.95, 1.35, 1.75, 2.4, math.pi], [16.15, 15.85, 14.6, 13.6, 12.3, 8.6, 7.0])
    fringe = 0.24 * np.sin(x * 6.1 + 0.7) + 0.16 * np.sin(x * 14.3 + 2.0)
    hl = hl - np.where(a < 0.75, fringe, 0)
    hair = np.maximum(hs, hl - y)                                  # sharp: the fringe edge stands as a small ledge
    hair = np.maximum(hair, -(y - 6.0))
    return dict(head=head, body=body, knit=knit, loft=loft, hair=hair, lips=lips, eyes=eyes, eye=eye, q=q, band=band, rad=rad, m=m, p=p)

def model(p):
    d = parts(p)
    return np.minimum(d["body"], d["hair"])

# zone codes (3 bits): 1 skin · 2 hair · 3 knit · 4 collar rib · 5 brow · 6 lips · 7 eye (iris / pupil)
def zones(p):
    d = parts(p); m = d["m"]; x, y, z = p[:, 0], p[:, 1], p[:, 2]
    zn = np.full(len(p), 1, np.uint8)
    base = d["body"]
    qy = d["q"][:, 1]
    below = (d["head"] > d["knit"] + 0.3) | (y < -9)
    zn[below & (qy < -1.15) & (d["rad"] < 30)] = 3
    zn[below & (np.abs(qy) <= 1.15) & (d["rad"] < 11)] = 4
    zn[(np.abs(d["lips"]) < 0.25) & (y > 2.6) & (y < 5.6) & (z > 6.5)] = 6
    # straight thick brows, slightly rising outward
    bx = m[:, 0]
    bc = 14.05 + 0.08 * (bx - 1.2)
    zn[(bx > 1.1) & (bx < 5.7 - 0.0) & (np.abs(y - bc) < 0.48 - 0.06 * np.clip((bx - 4.5), 0, 2)) & (z > 5.2) & (zn == 1)] = 5
    # iris: a disc on the eyeball's front, under the lid
    ir = np.hypot(m[:, 0] - 3.05, y - 12.25)
    zn[(np.abs(d["eye"]) < 0.12) & (ir < 0.62) & (z > 7.0)] = 7
    zn[d["hair"] <= base + 0.02] = 2
    return zn

# ---------------------------------------------------------------- the grid: a smooth lofted guide, offset to the surface
# Every grid row is one superellipse ring of the guide [centre y, centre z, half-width x, half-depth z, exponent], rows
# re-spaced to equal arc length down the guide, columns to equal arc length around each ring. Each vertex sits on the
# guide's normal at the outermost surface crossing within OUT / IN cm, so the grid is as even as the guide and the
# ears, nose and fringe ledge are reached from outside. louis.js rebuilds the guide and its normals the same way.
OUT, IN = 6.0, 7.0
GUIDE = np.array([      # y, zc, rx, rz, n   (hand-fitted to the model, crown → below the cut)
    [26.4, -1.3, 0.0, 0.0, 2.0],
    [26.0, -1.3, 2.6, 3.2, 2.0],
    [24.8, -1.3, 5.2, 6.4, 2.0],
    [22.4, -1.2, 7.3, 8.9, 2.0],
    [18.8, -1.0, 8.3, 10.1, 2.0],
    [15.0, -0.6, 8.2, 10.2, 2.0],
    [11.0, -0.1, 7.6, 9.8, 2.1],
    [7.0, 0.3, 7.0, 9.0, 2.2],
    [3.6, 0.5, 6.4, 7.9, 2.3],
    [1.2, 0.2, 6.0, 6.6, 2.2],
    [-0.6, -0.4, 5.9, 5.8, 2.1],
    [-3.0, -0.8, 6.1, 5.6, 2.1],
    [-5.2, -0.9, 6.9, 6.0, 2.2],
    [-6.6, -0.9, 9.6, 6.9, 2.4],
    [-7.8, -0.9, 14.0, 7.7, 2.6],
    [-9.4, -0.8, 18.6, 8.3, 2.8],
    [-12.2, -0.6, 21.6, 8.9, 2.9],
    [-16.0, -0.4, 21.8, 9.5, 2.9],
    [-21.0, -0.2, 19.8, 9.8, 2.7],
    [-27.0, 0.0, 18.4, 9.6, 2.6],
    [-31.0, 0.0, 18.0, 9.4, 2.6]])

def catmull(K, n_per):
    P = np.vstack([K[0], K, K[-1]]); out = []
    for i in range(1, len(P) - 2):
        for u in np.linspace(0, 1, n_per, endpoint=False):
            p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3))
    out.append(K[-1]); return np.array(out)

def ring(row, t):
    """guide points of one row at parametric angles t (0 = front, x = sin side)"""
    y, zc, rx, rz, n = row; s, c = np.sin(t), np.cos(t)
    return np.stack([rx * np.sign(s) * np.abs(s) ** (2 / n), np.full_like(t, y), zc + rz * np.sign(c) * np.abs(c) ** (2 / n)], -1)

NT = 1024
def ring_t(row, nc):
    """nc parametric angles at equal arc length around the row (the same table louis.js builds)"""
    t = np.arange(NT + 1) * 2 * math.pi / NT
    P = ring(row, t); L = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))])
    if L[-1] < 1e-6: return np.arange(nc) * 2 * math.pi / nc
    return np.interp(np.arange(nc) * L[-1] / nc, L, t)

def guide_rows(nr):
    D = catmull(GUIDE, 40)
    probe = np.array([0, math.pi / 2, math.pi, 1.5 * math.pi])
    G = np.stack([ring(r, probe) for r in D])                     # (n, 4, 3)
    seg = np.linalg.norm(np.diff(G, axis=0), axis=2).mean(axis=1)
    s = np.concatenate([[0], np.cumsum(seg)])
    u = np.interp(np.linspace(0, s[-1], nr), s, np.arange(len(D)))
    rows = np.stack([np.interp(u, np.arange(len(D)), D[:, k]) for k in range(5)], -1)
    rows[0, 2:4] = 0
    return rows, s[-1]

def guide_grid(rows, nc):
    G = np.stack([ring(r, ring_t(r, nc)) for r in rows])          # (nr, nc, 3)
    dt = np.roll(G, -1, 1) - np.roll(G, 1, 1)
    dv = np.empty_like(G); dv[1:-1] = G[2:] - G[:-2]; dv[0] = G[1] - G[0]; dv[-1] = G[-1] - G[-2]
    N = np.cross(dv, dt)                                          # t runs toward +x from the front, v runs down → outward
    N /= np.maximum(np.linalg.norm(N, axis=2, keepdims=True), 1e-9)
    N[0] = (0, 1, 0)
    return G, N

def offsets(G, N, chunk=6000):
    """outermost zero crossing of the model along each guide normal, scanning from +OUT inward to -IN"""
    G = G.reshape(-1, 3); N = N.reshape(-1, 3); out = np.zeros(len(G))
    ss = np.arange(OUT, -IN - 1e-9, -0.1)
    for a in range(0, len(G), chunk):
        g, n = G[a:a + chunk], N[a:a + chunk]; m = len(g)
        f = np.stack([model(g + n * s) for s in ss], 1)           # (m, len(ss))
        inside = f < 0
        k = np.where(inside.any(1), inside.argmax(1), len(ss) - 1)
        hi = ss[np.maximum(k - 1, 0)]; lo = ss[k]                  # hi outside, lo inside
        for _ in range(16):
            mid = (hi + lo) / 2; d = model(g + n * mid[:, None])
            hi = np.where(d >= 0, mid, hi); lo = np.where(d >= 0, lo, mid)
        out[a:a + chunk] = (hi + lo) / 2
    return out

def main():
    rows, arc = guide_rows(NR)
    G, N = guide_grid(rows, NC)
    s = offsets(G, N).reshape(NR, NC)
    P = G + N * s[..., None]
    zn = zones(P.reshape(-1, 3)).reshape(NR, NC)
    # folds: a quad whose surface normal turns against the guide normal
    du = np.roll(P, -1, 1) - P; dv = np.vstack([P[1:] - P[:-1], P[-1:] - P[-2:-1]])
    fold = (np.einsum("ijk,ijk->ij", np.cross(dv, du), N) < 0)[1:-1]
    q = np.clip(np.round((s + IN) / (OUT + IN) * 8191), 0, 8191).astype(np.uint16)
    word = (q << 3) | zn.astype(np.uint16)
    raw = word.astype("<u2").tobytes()
    print("grid", NC, "x", NR, "· guide arc %.1f cm · row step %.3f cm" % (arc, arc / (NR - 1)))
    print("offsets %.2f .. %.2f cm (clamped at the range ends: %d)" % (s.min(), s.max(), int(((s > OUT - 0.11) | (s < -IN + 0.11)).sum())), "· folded quads", int(fold.sum()))
    print("zones", {int(k): int((zn == k).sum()) for k in range(1, 8)})
    print("y %.1f .. %.1f, x %.1f .. %.1f, z %.1f .. %.1f" % (P[..., 1].min(), P[..., 1].max(), P[..., 0].min(), P[..., 0].max(), P[..., 2].min(), P[..., 2].max()))
    data = {"nc": NC, "nr": NR, "out": OUT, "in": IN, "nt": NT, "ycut": YCUT, "pivot": [0, 12.0, 0.0],
            "rows": [[round(float(v), 4) for v in r] for r in rows], "d": base64.b64encode(raw).decode()}
    js = ("/* r22: generated by scripts/louis_bust.py — a procedural 3D bust of Louis (signed-distance model sculpted to the approved\n"
          "   front reference's proportions; no image data). Grid rows = guide rings [y, centre z, half-width, half-depth, superellipse n] (cm),\n"
          "   one 16-bit word per vertex: offset along the guide normal (13 bits over -in .. +out cm) << 3 | zone\n"
          "   (1 skin · 2 hair · 3 knit · 4 rib · 5 brow · 6 lips · 7 eye). */\n"
          "window.LOUIS_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
    (ROOT / "louis-data.js").write_text(js)
    print("louis-data.js", len(js), "bytes")
    if "--debug" in sys.argv:
        from PIL import Image, ImageDraw
        im = Image.new("RGB", (1500, 900), "black"); dr = ImageDraw.Draw(im)
        for k, ci in enumerate([0, NC // 4, NC // 2]):
            ox = 250 + k * 500
            for arr, col in ((G, (90, 90, 90)), (P, (255, 255, 255))):
                pts = arr[:, ci]
                xy = [(ox + (pt[2] if k != 1 else pt[0]) * 12 * (1 if k != 2 else -1), 400 - pt[1] * 12) for pt in pts]
                dr.line(xy, fill=col, width=1)
                if arr is P:
                    for j in range(0, NR, 3): dr.ellipse([xy[j][0] - 1.2, xy[j][1] - 1.2, xy[j][0] + 1.2, xy[j][1] + 1.2], fill=col)
        im.save(ROOT / "shots/r22-bust-profiles.png")

if __name__ == "__main__":
    main()
