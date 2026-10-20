"""r12 one-off: render the static fallback portrait from louis-data.js with the real renderer (louis.js),
then quantize it to a small PNG (louis-fallback.png, < 40KB). r18: rendered with the grey defaults. r19: the hairline mesh style.
r20: the background scanlines ended in a hard rectangle (most visible at the top); alpha is now feathered on all four sides.
r20C: rendered from the 3D wireframe bust (WebGL, software GL in headless chromium) on a transparent background; the bust's
own outline and bottom fade give the shape, so only the safety edge ramp is kept. Not the reference photo.
r22: rendered from the procedural 3D bust; the box follows its 40 × 50 framing.
r23: rendered from the Hunyuan3D-2.1 model (scripts/louis_glb.py); the box follows its 30 × 37.5 framing (same aspect).
Usage: python3 scripts/louis_fallback.py   (no server needed)"""
import base64, io, pathlib
from playwright.sync_api import sync_playwright
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 300, 375   # css px of the host; rendered at DPR 2 and then quantized
HTML = f"""<!doctype html><body style="margin:0;background:#060607">
<div id="h" style="position:relative;width:{W}px;height:{H}px"></div>
<script>{(ROOT / 'louis-data.js').read_text()}</script><script>{(ROOT / 'louis.js').read_text()}</script>
<script>window.L = new Louis({{ interactive: false, keep: true, low: false, dpr: 2 }}).mount(document.getElementById('h'));</script>"""

with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2, reduced_motion="reduce")
    pg.set_content(HTML)
    pg.wait_for_timeout(600)
    assert pg.evaluate("L.live"), "the WebGL bust did not draw"
    url = pg.evaluate("document.querySelector('#h canvas').toDataURL('image/png')")
    b.close()

im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGBA")
g, a = im.convert("L"), im.getchannel("A")   # r18: strictly grey (no tint survives quantizing)
im = Image.merge("RGBA", (g, g, g, a))
# r20C: the background is transparent; a 6% smoothstep ramp on every side still guarantees zero at the edges, and alpha
# below 8 is dropped so quantizing leaves no faint seam.
def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
h, w = im.height, im.width
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
edge = np.outer(ss(yy[:, 0] / (.06 * h)) * ss((h - 1 - yy[:, 0]) / (.06 * h)), ss(xx[0] / (.06 * w)) * ss((w - 1 - xx[0]) / (.06 * w)))
av = np.asarray(a, dtype=np.float32) * edge
av[av < 8] = 0
im.putalpha(Image.fromarray(av.round().astype(np.uint8)))
q = im.quantize(colors=20, method=Image.FASTOCTREE)   # r23: 20 (the triangle mesh compresses worse than r22's grid)
out = ROOT / "louis-fallback.png"
q.save(out, optimize=True)
print(out.name, out.stat().st_size, "bytes", im.size)
