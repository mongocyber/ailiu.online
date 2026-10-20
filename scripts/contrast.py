"""r19: hero copy contrast against the live background. Hides the hero text (colour transparent), takes 5 frames, and
for the boxes of the title lines and the intro takes the 99th-percentile background luminance; reports the contrast of
the secondary ink (#a9a8a2, the dimmer of the two hero inks) against it. Pass = ≥ 4.5:1 everywhere.
Usage: python3 scripts/contrast.py   (server: python3 -m http.server 8801)"""
import io, sys
from playwright.sync_api import sync_playwright
from PIL import Image

def lum(v):
    v = v / 255
    return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
INK2 = 0.2126 * lum(0xa9) + 0.7152 * lum(0xa8) + 0.0722 * lum(0xa2)
BOX = """() => [...document.querySelectorAll('.hero-h span, .hero-note')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); })"""
worst = 99
with sync_playwright() as pw:
    for name, dev, reduced in (("desktop", None, False), ("pixel7", "Pixel 7", False), ("reduced", None, True)):
        b = pw.chromium.launch()
        kw = dict(pw.devices[dev]) if dev else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        if reduced: kw["reduced_motion"] = "reduce"
        pg = b.new_context(**kw).new_page()
        pg.goto("http://localhost:8801/index.html?lang=zh"); pg.wait_for_timeout(2500)
        pg.add_style_tag(content=".hero-copy, .hero-copy * { color: transparent !important; text-shadow: none !important; } .hero-copy .live-dot { opacity: 0 }")
        boxes = pg.evaluate(BOX); dpr = pg.evaluate("devicePixelRatio"); res = []
        for f in range(5):
            pg.wait_for_timeout(450)
            im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
            for x0, y0, x1, y1 in boxes:
                px = sorted(0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(bb) for r, g, bb in im.crop((int(x0 * dpr), int(y0 * dpr), int(x1 * dpr), int(y1 * dpr))).getdata())
                p99 = px[int(len(px) * 0.99)]
                res.append((INK2 + 0.05) / (p99 + 0.05))
        print(f"{name:8} fx={pg.evaluate('document.documentElement.dataset.fx')} min contrast {min(res):.2f}:1 (ink-2 on p99 background)")
        worst = min(worst, min(res)); b.close()
sys.exit(0 if worst >= 4.5 else 1)
