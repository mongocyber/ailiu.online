"""r20: Suikou chapter (real prototype screens) mid-chapter on desktop and Pixel 7, plus the no-canvas portrait fallback
→ shots/r20-*.png; r20-desktop-suikou.png, r20-mobile-suikou.png, r20-fallback-portrait.png and the picked prototype
shots (r20-proto-1..3.png, from scripts/suikou_images.py) are copied to the deliverables folder.
Usage: python3 scripts/deliver_r20.py [lang] [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

LANG = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "zh"
URL = f"http://localhost:8801/index.html?lang={LANG}"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
MID = """() => { const s = document.getElementById('suikou'); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.45); }"""
# r19 hero.py "no canvas" case: getContext returns null for every canvas, so the portrait shows louis-fallback.png
NOCANVAS = "HTMLCanvasElement.prototype.getContext = function () { return null; };"

with sync_playwright() as pw:
    for mobile in (False, True):
        b = pw.chromium.launch()
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg = b.new_context(**kw).new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL); pg.wait_for_timeout(2500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        tag = "mob" if mobile else "desk"
        for n, f in enumerate((0.15, 0.45, 0.8)):
            pg.evaluate(MID.replace("0.45", str(f))); pg.wait_for_timeout(1400)
            if mobile:
                pg.evaluate("document.querySelector('#suikou .sk-phones').scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(1200)
            pg.screenshot(path=f"shots/r20-{tag}-{LANG}-suikou-{n}.png")
            if mobile: break
        if mobile:  # swipe to the last phone
            pg.evaluate("const r = document.querySelector('#suikou .sk-phones'); r.scrollLeft = r.scrollWidth"); pg.wait_for_timeout(900)
            pg.screenshot(path=f"shots/r20-{tag}-{LANG}-suikou-swiped.png")
        print(tag, pg.evaluate("document.documentElement.dataset.fx"), "errors:", errs); b.close()
    b = pw.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    ctx.add_init_script(NOCANVAS)
    pg = ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"shots/r20-fallback-{LANG}.png")
    print("no-canvas", pg.evaluate("document.documentElement.dataset.fx"),
          pg.evaluate("!!document.querySelector('.is-fallback')"), "errors:", errs); b.close()
if "--copy" in sys.argv:
    shutil.copy(f"shots/r20-desk-{LANG}-suikou-1.png", OUT + "r20-desktop-suikou.png")
    shutil.copy(f"shots/r20-mob-{LANG}-suikou-0.png", OUT + "r20-mobile-suikou.png")
    shutil.copy(f"shots/r20-fallback-{LANG}.png", OUT + "r20-fallback-portrait.png")
    for i, s in enumerate(["home", "scenes", "card"], 1):
        shutil.copy(f"shots/r20-proto-{s}.png", OUT + f"r20-proto-{i}.png")
    print("copied")
