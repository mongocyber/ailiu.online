"""r24: Louis as a regular line grid — iso-parameter lines on the Hunyuan3D-2.1 model instead of r23's triangle edges.
The source is the same white bust (/workspace/deliverables/louis-mj-test/hunyuan21-front.glb, ~640k faces). This script
  · cleans and normalises it as r23 did (largest component, base underside dropped, y up, face toward +z, the head's
    centre column on x = 0, crown → chin 23 cm, crown at y = 28, light Taubin smoothing),
  · slices it into polylines: horizontal contours (planes y = const) and meridians (planes through the vertical axis of
    the head, every 360/MER degrees; on the shoulders, where meridians spread apart, a second set halfway between them
    starts at SHR cm from the axis), each point with the surface normal and a cavity value (hollow +, ridge −,
    in cm, measured against a heavily smoothed copy) interpolated from the mesh,
  · smooths each polyline along itself, drops fragments, simplifies it (Douglas–Peucker, TOL cm) and stores it in the
    plane's own 2D coordinates: points quantised to Q cm as zigzag-varint deltas, the normal as one byte (its angle
    around the local tangent: louis.js rebuilds the tangent from the points), the cavity as one byte,
  · decimates the model to ~FILL faces (face weighted, as r23) and shrinks it SHRINK cm inward: louis.js draws it as the
    dark depth-writing body that hides the lines behind the head (shrunk, so it never covers lines in a hollow),
  · and writes louis-data.js (≤ 200 KB). Every second contour and meridian is marked as the low tier's.
Usage: /workspace/.venv-g/bin/python scripts/louis_contours.py [--con=110] [--mer=96] [--tol=0.012] [--preview]"""
import base64, json, math, pathlib, sys
import numpy as np
import trimesh
import fast_simplification

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = "/workspace/deliverables/louis-mj-test/hunyuan21-front.glb"
ARGS = dict((a[2:].split("=") + ["1"])[:2] for a in sys.argv[1:] if a.startswith("--"))
CON, MER = int(ARGS.get("con", 110)), int(ARGS.get("mer", 96))     # horizontal contours · meridians (half-planes)
TOL, Q = float(ARGS.get("tol", 0.008)), 0.01                       # cm: simplification tolerance · quantum
SHR = float(ARGS.get("shr", 9.0))                                  # cm from the axis: the shoulders' extra meridians
FILL, SHRINK = int(ARGS.get("fill", 6000)), 0.3
CROWN = 28.0

# ---------------------------------------------------------------- load + normalise (as r23's louis_glb.py)
m = trimesh.load(SRC).to_geometry()
m = max(m.split(only_watertight=False), key=lambda c: len(c.faces))
v = m.vertices.copy()
band = v[(v[:, 1] > 0.15) & (v[:, 1] < 0.55)]
xc = (band[:, 0].min() + band[:, 0].max()) / 2
zc = (band[:, 2].min() + band[:, 2].max()) / 2
front = v[(np.abs(v[:, 0] - xc) < 0.05) & (v[:, 2] > zc + 0.25)]
neck_y = v[:, 1].min() + 0.55 * (v[:, 1].max() - v[:, 1].min()) - 0.4
chin = front[front[:, 1] > neck_y][:, 1].min()
crown = v[:, 1].max()
S = 23.0 / (crown - chin)
v = np.c_[(v[:, 0] - xc) * S, (v[:, 1] - crown) * S + CROWN, (v[:, 2] - zc) * S]
f = m.faces
ybot = v[:, 1].min()
fn = trimesh.Trimesh(v, f, process=False).face_normals
f = f[~((v[f][:, :, 1].max(1) < ybot + 1.5) & (fn[:, 1] < -0.6))]
mesh = trimesh.Trimesh(v, f, process=True)
mesh.remove_unreferenced_vertices()
trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=24)
V, F = np.asarray(mesh.vertices), np.asarray(mesh.faces)
print("mesh", len(F), "faces ·", len(V), "vertices · box", V.min(0).round(1), V.max(0).round(1))
# the smoothed copies are slow (seconds per hundred iterations at this size): cached by the mesh they came from
CACHE = pathlib.Path("/tmp/louis_contours_cache.npz")
key = np.array([len(V), len(F), float(V.sum())])
if CACHE.exists() and np.allclose(np.load(CACHE)["key"], key):
    z = np.load(CACHE); N, CAV = z["N"], z["CAV"]
else:
    # normals from a further smoothed copy (Taubin keeps the volume): the generator's fine ripples would flicker the light
    sn = mesh.copy(); trimesh.smoothing.filter_taubin(sn, lamb=0.5, nu=-0.53, iterations=80)
    N = np.asarray(sn.vertex_normals)
    # cavity: how far a heavily smoothed copy sits above (+, a hollow) or below (−, a ridge) the surface, along the normal
    sm = mesh.copy(); trimesh.smoothing.filter_laplacian(sm, lamb=0.6, iterations=300)
    CAV = np.einsum("ij,ij->i", np.asarray(sm.vertices) - V, N)
    np.savez(CACHE, key=key, N=N, CAV=CAV)
print("cavity cm: p2 %.2f p50 %.2f p98 %.2f" % tuple(np.percentile(CAV, [2, 50, 98])))

E = np.sort(np.c_[F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]].reshape(-1, 2), axis=1)   # face edges, 3 per face


def section(origin, normal):
    """Polylines of the mesh ∩ plane: list of (points, normals, cavity, closed)."""
    d = (V - origin) @ normal
    d[d == 0] = 1e-9
    s = d[F] > 0
    hit = np.where(s.any(1) & ~s.all(1))[0]
    if not len(hit): return []
    fe = E.reshape(-1, 3, 2)[hit]                                   # (h, 3, 2) the face's edges
    cross = (d[fe[:, :, 0]] > 0) != (d[fe[:, :, 1]] > 0)            # exactly two per face
    pairs = fe[cross].reshape(-1, 2, 2)                             # (h, 2 edges, 2 vertices)
    keys = pairs[:, :, 0].astype(np.int64) * len(V) + pairs[:, :, 1]
    uk, inv = np.unique(keys.ravel(), return_inverse=True)
    inv = inv.reshape(-1, 2)
    a, b = uk // len(V), uk % len(V)
    t = (d[a] / (d[a] - d[b]))[:, None]
    P = V[a] + t * (V[b] - V[a])
    Nn = N[a] + t * (N[b] - N[a]); Nn /= np.linalg.norm(Nn, axis=1, keepdims=True) + 1e-12
    C = CAV[a] + t[:, 0] * (CAV[b] - CAV[a])
    nb = -np.ones((len(uk), 2), np.int64)                           # each edge node: ≤ 2 neighbours (manifold)
    for x, y in inv:
        nb[x, 0 if nb[x, 0] < 0 else 1] = y
        nb[y, 0 if nb[y, 0] < 0 else 1] = x
    seen = np.zeros(len(uk), bool); out = []
    ends = [i for i in range(len(uk)) if nb[i, 1] < 0]
    for start in ends + list(range(len(uk))):
        if seen[start]: continue
        chain, prev, cur = [start], -1, start; seen[start] = True
        while True:
            nx = nb[cur, 0] if nb[cur, 0] != prev else nb[cur, 1]
            if nx < 0 or seen[nx]:
                closed = nx >= 0 and nx == start and len(chain) > 2
                break
            chain.append(nx); seen[nx] = True; prev, cur = cur, nx
        out.append((P[chain], Nn[chain], C[chain], closed))
    return out


def resample(P, Nn, C, closed, step=0.06):
    """even spacing along the line (cm), so the smoothing below has a fixed reach"""
    if closed: P, Nn, C = np.vstack([P, P[:1]]), np.vstack([Nn, Nn[:1]]), np.r_[C, C[:1]]
    s = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    n = max(4, int(s[-1] / step) + 1)
    t = np.linspace(0, s[-1], n, endpoint=not closed) if not closed else np.linspace(0, s[-1], n, endpoint=False)
    f = lambda A: np.stack([np.interp(t, s, A[:, k]) for k in range(A.shape[1])], 1)
    Nr = f(Nn); Nr /= np.linalg.norm(Nr, axis=1, keepdims=True) + 1e-12
    return f(P), Nr, np.interp(t, s, C)


def smooth(A, closed, sigma):
    """Gaussian along the line; sigma (in samples) may vary per sample. Open ends keep their reach by reflection."""
    n = len(A); r = int(np.ceil(3 * sigma.max())) if len(sigma) else 0
    if r < 1: return A
    idx = np.arange(-r, r + 1)
    J = np.arange(n)[:, None] + idx
    if closed: J %= n
    else:
        J = np.abs(J); J = np.where(J >= n, 2 * n - 2 - J, J); J = np.clip(J, 0, n - 1)
    Wt = np.exp(-0.5 * (idx[None, :] / np.maximum(sigma, 1e-3)[:, None]) ** 2); Wt /= Wt.sum(1, keepdims=True)
    return np.einsum("ij,ijk->ik", Wt, A[J])


SIG_HEAD, SIG_BODY = 0.3, 0.8   # cm: the head keeps its features; the generator's banding on the chest is smoothed away
def sigma_at(P):
    return (SIG_BODY + (SIG_HEAD - SIG_BODY) * np.clip((P[:, 1] - 4.0) / 6.0, 0, 1)) / 0.06


def dp(p, tol):
    """Douglas–Peucker keep-mask (iterative)."""
    keep = np.zeros(len(p), bool); keep[0] = keep[-1] = True
    st = [(0, len(p) - 1)]
    while st:
        i, j = st.pop()
        if j <= i + 1: continue
        a, b = p[i], p[j]; ab = b - a; L = ab @ ab
        q = p[i + 1:j] - a
        dist = np.linalg.norm(q - np.outer(np.clip(q @ ab / L, 0, 1) if L > 0 else 0, ab), axis=1)
        k = int(np.argmax(dist))
        if dist[k] > tol: keep[i + 1 + k] = True; st += [(i, i + 1 + k), (i + 1 + k, j)]
    return keep


MINLEN = 1.2   # cm: shorter pieces are slicing crumbs (ear folds, specks)
lines = []     # dict(kind, low, param, closed, P, N, C)


def add(kind, low, param, polys, origin, normal, axis2=None, rmin=0.0):
    for P, Nn, C, closed in polys:
        if rmin > 0:          # shoulder meridians: only the part far from the axis (splits the chain)
            r = np.hypot(P[:, 0], P[:, 2] - origin[2])
            runs, cur = [], []
            for i in range(len(P)):
                if r[i] >= rmin: cur.append(i)
                elif cur: runs.append(cur); cur = []
            if cur: runs.append(cur)
            if closed and len(runs) > 1 and runs[0][0] == 0 and runs[-1][-1] == len(P) - 1:
                runs[0] = runs.pop() + runs[0]
            elif closed and len(runs) == 1 and len(runs[0]) == len(P): runs = [list(range(len(P)))]
            else: closed = False
            pieces = [(P[ix], Nn[ix], C[ix], closed and len(ix) == len(P)) for ix in runs]
        else: pieces = [(P, Nn, C, closed)]
        for P2, N2, C2, cl in pieces:
            if len(P2) < 4: continue
            seg = np.linalg.norm(np.diff(P2, axis=0), axis=1).sum()
            if seg < MINLEN: continue
            P2, N2, C2 = resample(P2, N2, C2, cl)
            sg = sigma_at(P2)
            Ps = smooth(P2, cl, sg); N2 = smooth(N2, cl, sg); C2 = smooth(C2[:, None], cl, sg)[:, 0]
            N2 /= np.linalg.norm(N2, axis=1, keepdims=True) + 1e-12
            if cl: Ps = np.vstack([Ps, Ps[:1]]); N2 = np.vstack([N2, N2[:1]]); C2 = np.r_[C2, C2[:1]]
            k = dp(Ps, TOL)
            if cl: k[-1] = False
            lines.append(dict(kind=kind, low=low, param=param, closed=cl, P=Ps[k], N=N2[k], C=C2[k]))


# pivot / axis: the head's centre column
head = V[V[:, 1] > CROWN - 14]
AXZ = round(float((head[:, 2].min() + head[:, 2].max()) / 2), 2)
pivot = [0.0, round(CROWN - 12.5, 2), AXZ]
y0, y1 = ybot + 0.25, V[:, 1].max() - 0.06
for i in range(CON):
    y = y0 + (y1 - y0) * i / (CON - 1)
    add(0, i % 2 == 0, y, section(np.array([0, y, 0]), np.array([0.0, 1, 0])), np.array([0, y, 0]), None)
NPL = MER // 2      # planes through the axis; each one gives two meridians (θ and θ + 180°)
for i in range(NPL * 2):
    th = math.pi * i / (NPL * 2)
    nrm = np.array([math.cos(th), 0.0, -math.sin(th)]); org = np.array([0.0, 0.0, AXZ])
    if i % 2 == 0: add(1, (i // 2) % 2 == 0, i, section(org, nrm), org, nrm)
    else: add(1, False, i, section(org, nrm), org, nrm, rmin=SHR)    # the shoulders' in-between set
print("lines", len(lines), "· points", sum(len(l["P"]) for l in lines), "· low", sum(len(l["P"]) for l in lines if l["low"]))


# ---------------------------------------------------------------- pack the lines
def zz(n): return (n << 1) ^ (n >> 63) if n < 0 else n << 1
def varint(n, out):
    while n >= 128: out.append((n & 127) | 128); n >>= 7
    out.append(n)


def plane2d(l):
    """the line's points in its plane's 2D frame: contour (x, z), meridian (s, y) with s along (sin θ, 0, cos θ)."""
    P = l["P"]
    if l["kind"] == 0: return np.c_[P[:, 0], P[:, 2]]
    th = math.pi * l["param"] / MER
    return np.c_[P[:, 0] * math.sin(th) + (P[:, 2] - AXZ) * math.cos(th), P[:, 1]]


def from2d(l, uv):     # as louis.js rebuilds them
    if l["kind"] == 0: return np.c_[uv[:, 0], np.full(len(uv), l["y"]), uv[:, 1]]
    th = math.pi * l["param"] / MER
    return np.c_[uv[:, 0] * math.sin(th), uv[:, 1], AXZ + uv[:, 0] * math.cos(th)]


def frame(l, P):        # tangent from neighbours (as louis.js), plane normal, B = Pn × T
    if l["closed"]: T = np.roll(P, -1, 0) - np.roll(P, 1, 0)
    else: T = np.r_[[P[1] - P[0]], P[2:] - P[:-2], [P[-1] - P[-2]]]
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-12
    th = math.pi * l["param"] / MER
    Pn = np.array([0.0, 1, 0]) if l["kind"] == 0 else np.array([math.cos(th), 0, -math.sin(th)])
    B = np.cross(Pn, T); B /= np.linalg.norm(B, axis=1, keepdims=True) + 1e-12
    return Pn, B


out = bytearray(); npts = 0
lo_y = math.floor(y0)
for l in lines:
    uv = np.round(plane2d(l) / Q).astype(np.int64)
    if l["kind"] == 0: l["y"] = lo_y + round((l["param"] - lo_y) / Q) * Q
    # drop points that quantise onto their predecessor
    keep = np.r_[True, np.any(np.diff(uv, axis=0) != 0, axis=1)]
    uv, Nn, C = uv[keep], l["N"][keep], l["C"][keep]
    if len(uv) < 3: continue
    P = from2d(l, uv * Q)
    Pn, B = frame(l, P)
    phi = np.arctan2(Nn @ Pn, np.einsum("ij,ij->i", Nn, B))
    pb = np.round(phi / (2 * math.pi) * 256).astype(np.int64) & 255
    cb = np.clip(np.round(C / 0.4 * 127 + 128), 0, 255).astype(np.int64)
    param = round((l["param"] - lo_y) / Q) if l["kind"] == 0 else l["param"]
    varint(l["kind"] | (2 if l["low"] else 0) | (4 if l["closed"] else 0), out)
    varint(param, out); varint(len(uv), out)
    prev = (0, 0)
    for x, y in uv:
        varint(zz(int(x - prev[0])), out); varint(zz(int(y - prev[1])), out); prev = (x, y)
    out += bytes(pb.astype(np.uint8)) + bytes(cb.astype(np.uint8))
    npts += len(uv)
print("packed", npts, "points ·", len(out), "bytes (%.2f B/point)" % (len(out) / npts))

# ---------------------------------------------------------------- the dark body (depth only), face weighted, shrunk
FC, FR, KF = np.array([0.0, CROWN - 12.0, 4.0]), 8.5, 3.0
def gain(r): return 1 + (KF - 1) * np.exp(-(r / FR) ** 2)
def warp(p):
    d = p - FC; r = np.linalg.norm(d, axis=1, keepdims=True)
    return FC + d * gain(r)
def unwarp(q):
    d = q - FC; rq = np.linalg.norm(d, axis=1); lo_, hi_ = np.zeros_like(rq), rq.copy()
    for _ in range(50):
        mid = (lo_ + hi_) / 2; big = mid * gain(mid) > rq
        hi_ = np.where(big, mid, hi_); lo_ = np.where(big, lo_, mid)
    r = (lo_ + hi_) / 2
    return FC + d * (r / np.maximum(rq, 1e-9))[:, None]
pts, fc = fast_simplification.simplify(warp(V).astype(np.float32), F.astype(np.int32), target_reduction=1 - FILL / len(F), agg=7)
body = trimesh.Trimesh(unwarp(np.asarray(pts, np.float64)), fc, process=True)
body = max(body.split(only_watertight=False), key=lambda c: len(c.faces))
BV = np.asarray(body.vertices) - SHRINK * np.asarray(body.vertex_normals)
BF = np.asarray(body.faces)
lo = BV.min(0) - 0.01; hi = BV.max(0) + 0.01


def morton(p):
    q = ((p - p.min(0)) / (np.ptp(p, 0) + 1e-9) * 1023).astype(np.int64)
    def spread(x):
        x = (x | (x << 16)) & 0x030000FF; x = (x | (x << 8)) & 0x0300F00F
        x = (x | (x << 4)) & 0x030C30C3; x = (x | (x << 2)) & 0x09249249
        return x
    return spread(q[:, 0]) | (spread(q[:, 1]) << 1) | (spread(q[:, 2]) << 2)


BF = BF[np.argsort(morton(BV[BF].mean(1)), kind="stable")]
remap, order = -np.ones(len(BV), np.int64), []
for i in BF.ravel():
    if remap[i] < 0: remap[i] = len(order); order.append(i)
BV, BF = BV[order], remap[BF]
qv = np.clip(np.round((BV - lo) / (hi - lo) * [2047, 2047, 1023]), 0, [2047, 2047, 1023]).astype(np.uint32)
words = (qv[:, 0] | (qv[:, 1] << 11) | (qv[:, 2] << 22)).astype("<u4")
fb, hw = bytearray(), 0
for i in BF.ravel():
    varint(int(hw - i), fb)
    if i == hw: hw += 1
print("body", len(BV), "vertices ·", len(BF), "faces ·", len(words) * 4 + len(fb), "bytes")

data = {"q": Q, "mer": MER, "axz": AXZ, "y0": lo_y, "ybot": round(float(ybot), 2), "pivot": pivot,
        "lines": base64.b64encode(bytes(out)).decode(),
        "body": {"lo": [round(float(x), 4) for x in lo], "hi": [round(float(x), 4) for x in hi], "nv": len(BV), "nf": len(BF),
                 "v": base64.b64encode(words.tobytes()).decode(), "f": base64.b64encode(bytes(fb)).decode()}}
src = ("/* r24: generated by scripts/louis_contours.py — Louis as iso-parameter lines on the Hunyuan3D-2.1 model (from the\n"
       "   Midjourney front image): horizontal contours + meridians about the head's vertical axis. lines = base64 of varints per\n"
       "   line: flags (1 meridian · 2 low tier · 4 closed), param (contour: (y − y0) / q · meridian: i, the plane at θ = π·i/mer),\n"
       "   count, then zigzag deltas of the plane's 2D coordinates in units of q, then one normal-angle byte and one cavity byte (±0.4 cm)\n"
       "   per point. body = the shrunk dark body (one 32-bit word per vertex: x 11 · y 11 · z 10 bits over lo .. hi; faces as\n"
       "   varints of vertices seen so far − index). */\nwindow.LOUIS_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
dst = ROOT / "louis-data.js"
dst.write_text(src)
print(dst.name, dst.stat().st_size, "bytes")
