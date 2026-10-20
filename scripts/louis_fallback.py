"""r12 one-off: render the static fallback portrait from louis-data.js with the real renderer (louis.js),
then quantize it to a small PNG (louis-fallback.png, < 40KB). r18: rendered with the grey defaults. r19: the hairline mesh style.
r20: the background scanlines ended in a hard rectangle (most visible at the top); alpha is now feathered on all four sides. Stylized scanlines only; not the reference photo.
Usage: python3 scripts/louis_fallback.py   (no server needed)"""
import base64, io, pathlib
from playwright.sync_api import sync_playwright
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 300, 340   # css px of the host; rendered at DPR 2 and then quantized
HTML = f"""<!doctype html><body style="margin:0;background:#060607">
<div id="h" style="position:relative;width:{W}px;height:{H}px"></div>
<script>{(ROOT / 'louis-data.js').read_text()}</script><script>{(ROOT / 'louis.js').read_text()}</script>
<script>window.L = new Louis({{ lines: 110, samples: 180, interactive: false, glitch: false }}).mount(document.getElementById('h'));</script>"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": W, "height": H}, device_scale_factor=2, reduced_motion="reduce")
    pg.set_content(HTML)
    pg.wait_for_timeout(300)
    url = pg.evaluate("document.querySelector('#h canvas').toDataURL('image/png')")
    b.close()

im = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGBA")
g, a = im.convert("L"), im.getchannel("A")   # r18: strictly grey (no tint survives quantizing)
im = Image.merge("RGBA", (g, g, g, a))
# r20: feather the alpha so the scanline field has no visible rectangle. An ellipse around the head and shoulders
# (centre 50% / 56%, radii 52% / 59%) keeps the face at full strength and fades out from 0.7 to 1.0 of its radius;
# a 6% smoothstep ramp on every side guarantees zero at the edges; alpha below 8 is dropped so quantizing leaves no faint seam.
def ss(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)
h, w = im.height, im.width
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
r = np.hypot((xx - .5 * w) / (.52 * w), (yy - .56 * h) / (.59 * h))
edge = np.outer(ss(yy[:, 0] / (.06 * h)) * ss((h - 1 - yy[:, 0]) / (.06 * h)), ss(xx[0] / (.06 * w)) * ss((w - 1 - xx[0]) / (.06 * w)))
av = np.asarray(a, dtype=np.float32) * (1 - ss((r - .7) / .3)) * edge
av[av < 8] = 0
im.putalpha(Image.fromarray(av.round().astype(np.uint8)))
q = im.quantize(colors=24, method=Image.FASTOCTREE)
out = ROOT / "louis-fallback.png"
q.save(out, optimize=True)
print(out.name, out.stat().st_size, "bytes", im.size)
