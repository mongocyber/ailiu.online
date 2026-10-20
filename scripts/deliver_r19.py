"""r19: the named review frames → shots/r19-*.png (hero desktop / Pixel 7 / reduced motion, Design Work mid-chapter on
desktop and phone, Steam mid-chapter on desktop), with data-fx and error checks, then copies them to the deliverables folder.
Usage: python3 scripts/deliver_r19.py   (server: python3 -m http.server 8801)"""
import shutil
from playwright.sync_api import sync_playwright

URL = "http://localhost:8801/index.html?lang=zh"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
MID = """k => { const s = document.getElementById(k); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * (k === 'work' ? 0.3 : 0.45)); }"""
names = []

def page(pw, mobile=False, reduced=False):
    b = pw.chromium.launch()
    kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    if reduced: kw["reduced_motion"] = "reduce"
    pg = b.new_context(**kw).new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(2500)
    pg.add_style_tag(content="html{scroll-behavior:auto!important}")
    return b, pg, errs

def snap(pg, name):
    pg.screenshot(path=f"shots/{name}.png"); names.append(name)

with sync_playwright() as pw:
    b, pg, errs = page(pw)
    if pg.evaluate("matchMedia('(pointer: fine)').matches"): pg.mouse.move(1080, 420); pg.wait_for_timeout(400)
    snap(pg, "r19-desktop-hero")
    pg.evaluate(MID, "work"); pg.wait_for_timeout(1400); snap(pg, "r19-desktop-mid-1")
    pg.evaluate(MID, "steam"); pg.wait_for_timeout(1400); snap(pg, "r19-desktop-mid-2")
    print("desktop", pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxWhy]"), "errors:", errs); b.close()
    b, pg, errs = page(pw, mobile=True)
    snap(pg, "r19-mobile-hero")
    pg.evaluate(MID, "work"); pg.wait_for_timeout(1400); snap(pg, "r19-mobile-mid-1")
    print("mobile", pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxWhy]"), "errors:", errs); b.close()
    b, pg, errs = page(pw, reduced=True)
    snap(pg, "r19-reduced-motion-hero")
    print("reduced", pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxWhy]"), "errors:", errs); b.close()
for n in names: shutil.copy(f"shots/{n}.png", OUT + n + ".png")
print("copied", names)
