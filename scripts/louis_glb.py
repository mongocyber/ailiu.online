"""r23: Louis from a real 3D model. The source is a white (untextured) bust generated from the approved Midjourney front
image by Hunyuan3D-2.1 (the free Hugging Face Space): /workspace/deliverables/louis-mj-test/hunyuan21-front.glb, ~640k faces.
This script
  · keeps the largest connected component (the Space leaves a few floating specks),
  · drops the flat underside of the base (never seen; it only costs faces),
  · normalises it: y up, face toward +z, the head's centre column on x = 0, scaled to cm (crown → chin 23 cm),
  · lightly Taubin-smooths it (the generator's horizontal banding on the chest; features survive),
  · decimates it twice with quadric edge collapse (fast-simplification): high ~10k faces, low ~3.5k,
  · and writes louis-data.js: per tier, the vertices quantised to 11 / 11 / 10 bits in the model's box (one 32-bit word),
    faces in a spatially coherent order with vertices numbered by first use, each index stored as a varint of
    (vertices seen so far − index) — 0 means "the next new vertex", recent ones are small.
louis.js decodes it, recomputes normals, edges and their dihedral (feature) angles, and draws the wireframe.
Usage: /workspace/.venv-g/bin/python scripts/louis_glb.py [--high=10000] [--low=3500]"""
import base64, json, pathlib, sys
import numpy as np
import trimesh
import fast_simplification

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = "/workspace/deliverables/louis-mj-test/hunyuan21-front.glb"
ARGS = dict(a[2:].split("=") for a in sys.argv[1:] if a.startswith("--") and "=" in a)
HIGH, LOW = int(ARGS.get("high", 12000)), int(ARGS.get("low", 3500))
CROWN = 28.0                     # cm: top of the head in the portrait frame (louis.js frames y -12 .. 32)

m = trimesh.load(SRC).to_geometry()
parts = m.split(only_watertight=False)
m = max(parts, key=lambda c: len(c.faces))
print("source", sum(len(p.faces) for p in parts), "faces in", len(parts), "components → kept", len(m.faces))

v = m.vertices.copy()
# the source is y up with the face toward +z; the head sits off the x origin, so centre it on its own column
band = v[(v[:, 1] > 0.15) & (v[:, 1] < 0.55)]
xc = (band[:, 0].min() + band[:, 0].max()) / 2
zc = (band[:, 2].min() + band[:, 2].max()) / 2
# scale: chin → crown = 23 cm. The chin is the lowest point of the face's front (high z) above the neck.
front = v[(np.abs(v[:, 0] - xc) < 0.05) & (v[:, 2] > zc + 0.25)]
neck_y = v[:, 1].min() + 0.55 * (v[:, 1].max() - v[:, 1].min()) - 0.4   # roughly below the chin
chin = front[front[:, 1] > neck_y][:, 1].min()
crown = v[:, 1].max()
S = 23.0 / (crown - chin)
v = np.c_[(v[:, 0] - xc) * S, (v[:, 1] - crown) * S + CROWN, (v[:, 2] - zc) * S]
print("chin %.3f crown %.3f → scale %.2f cm/unit · box" % (chin, crown, S), v.min(0).round(1), v.max(0).round(1))

f = m.faces
ybot = v[:, 1].min()
# the underside of the base: faces near the bottom looking down
fn = trimesh.Trimesh(v, f, process=False).face_normals
under = (v[f][:, :, 1].max(1) < ybot + 1.5) & (fn[:, 1] < -0.6)
f = f[~under]
mesh = trimesh.Trimesh(v, f, process=True)
mesh.remove_unreferenced_vertices()
trimesh.smoothing.filter_taubin(mesh, lamb=0.5, nu=-0.53, iterations=6)
print("cleaned", len(mesh.faces), "faces (base underside removed:", int(under.sum()), ")")


# The face gets the budget: before decimating, space is magnified radially around the face (×KF at its centre, back to
# ×1 a few cm out; monotonic), so quadric errors there weigh KF times more and the eyes, lids, nostrils, lips and ears
# keep their edges; the result is mapped back exactly (bisection on the radial profile).
FC, FR, KF = np.array([0.0, CROWN - 12.0, 4.0]), 8.5, float(ARGS.get("face", 3.0))
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


def decimate(target):
    pts, fc = fast_simplification.simplify(warp(mesh.vertices).astype(np.float32), mesh.faces.astype(np.int32),
                                           target_reduction=1 - target / len(mesh.faces), agg=7)
    t = trimesh.Trimesh(unwarp(np.asarray(pts, np.float64)), fc, process=True)
    t.remove_unreferenced_vertices()
    t = max(t.split(only_watertight=False), key=lambda c: len(c.faces))   # collapse can strand a sliver
    return np.asarray(t.vertices), np.asarray(t.faces)


def morton(p):
    q = ((p - p.min(0)) / (np.ptp(p, 0) + 1e-9) * 1023).astype(np.int64)
    def spread(x):
        x = (x | (x << 16)) & 0x030000FF; x = (x | (x << 8)) & 0x0300F00F
        x = (x | (x << 4)) & 0x030C30C3; x = (x | (x << 2)) & 0x09249249
        return x
    return spread(q[:, 0]) | (spread(q[:, 1]) << 1) | (spread(q[:, 2]) << 2)


def varint(n, out):
    while n >= 128:
        out.append((n & 127) | 128); n >>= 7
    out.append(n)


def encode(V, F, lo, hi):
    F = F[np.argsort(morton(V[F].mean(1)), kind="stable")]
    remap, order = -np.ones(len(V), np.int64), []
    for i in F.ravel():
        if remap[i] < 0: remap[i] = len(order); order.append(i)
    V, F = V[order], remap[F]
    q = np.clip(np.round((V - lo) / (hi - lo) * [2047, 2047, 1023]), 0, [2047, 2047, 1023]).astype(np.uint32)
    words = (q[:, 0] | (q[:, 1] << 11) | (q[:, 2] << 22)).astype("<u4")
    out, hw = bytearray(), 0
    for i in F.ravel():
        varint(hw - i, out)
        if i == hw: hw += 1
    vb, fb = words.tobytes(), bytes(out)
    print("  %d vertices · %d faces · vertices %d B · indices %d B (%.2f B/index)" % (len(V), len(F), len(vb), len(fb), len(fb) / F.size))
    return {"nv": len(V), "nf": len(F), "v": base64.b64encode(vb).decode(), "f": base64.b64encode(fb).decode()}


# the box spans both tiers (collapsed vertices can sit a little outside the source's bounds)
dec = {name: decimate(target) for name, target in (("high", HIGH), ("low", LOW))}
allv = np.vstack([V for V, F in dec.values()])
lo, hi = allv.min(0) - 0.01, allv.max(0) + 0.01
tiers = {}
for name, (V, F) in dec.items():
    print(name)
    tiers[name] = encode(V, F, lo, hi)
hv = dec["high"][0]

# pivot: the head's centre (it turns about it), at ear height
head = hv[hv[:, 1] > CROWN - 14]
pivot = [0.0, round(float(CROWN - 12.5), 2), round(float((head[:, 2].min() + head[:, 2].max()) / 2), 2)]
data = {"lo": [round(float(x), 4) for x in lo], "hi": [round(float(x), 4) for x in hi], "ybot": round(float(mesh.vertices[:, 1].min()), 2),
        "pivot": pivot, "high": tiers["high"], "low": tiers["low"]}
src = ("/* r23: generated by scripts/louis_glb.py — Louis as a real 3D model: Midjourney front image → Hunyuan3D-2.1 (free Space)\n"
       "   white model, largest component, normalised to cm, quadric-decimated into two tiers. Per tier: v = base64 of one\n"
       "   little-endian 32-bit word per vertex (x 11 · y 11 · z 10 bits over lo .. hi), f = base64 of varints, one per corner,\n"
       "   (vertices seen so far − index). */\nwindow.LOUIS_DATA = " + json.dumps(data, separators=(",", ":")) + ";\n")
out = ROOT / "louis-data.js"
out.write_text(src)
print(out.name, out.stat().st_size, "bytes · pivot", pivot, "· ybot", data["ybot"])
