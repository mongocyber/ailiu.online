"""r23: the Louis bust from the Hunyuan3D-2.1 model (scripts/louis_glb.py) in the page (from deliver_r22.py).
Checks: hero / wild portraits are live WebGL (desktop high tier, Pixel 7 low tier at 30fps with the ~3.5k-face mesh);
the hero moves with FX_WAVE (two frames differ); reduced motion draws one static frame (two frames identical);
no WebGL → .is-fallback with the re-rendered transparent fallback image. Shoots shots/r23-*.png; with --copy,
r23-desktop-hero.png and r23-louis-closeup.png go to the deliverables.
Usage: python3 scripts/deliver_r23.py [lang] [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

LANG = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "zh"
URL = f"http://localhost:8801/index.html?lang={LANG}"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
SK = """() => { const s = document.getElementById('suikou'); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.45); }"""
good = True
def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg); good &= bool(ok)

def canvas_png(pg):
    return pg.locator("#louisHero").screenshot()

shots = {}
with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    for mobile in (False, True):
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        pg = b.new_context(**kw).new_page(); errs = []; tag = "mob" if mobile else "desk"
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL + ("" if mobile else "&fx=high")); pg.wait_for_timeout(3500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        cls = pg.get_attribute("#louisHero", "class")
        check("is-live" in cls, f"{tag}: hero portrait live ({cls}, fx={pg.evaluate('document.documentElement.dataset.fx')})")
        a = canvas_png(pg); pg.wait_for_timeout(700); c = canvas_png(pg)
        check(a != c, f"{tag}: hero portrait moves (wave / breath)")
        shots[f"{tag}-hero"] = f"shots/r23-{tag}-{LANG}-hero.png"; pg.screenshot(path=shots[f"{tag}-hero"])
        if not mobile:
            shots["closeup"] = f"shots/r23-{tag}-{LANG}-louis.png"; pg.locator("#louisHero").screenshot(path=shots["closeup"])
            pg.mouse.move(1430, 300); pg.wait_for_timeout(2500)
            pg.locator("#louisHero").screenshot(path=f"shots/r23-{tag}-{LANG}-louis-turned.png")
            pg.mouse.move(2, 2)
            pg.evaluate(SK); pg.wait_for_timeout(2600)
            shots["suikou"] = f"shots/r23-{tag}-{LANG}-suikou.png"; pg.screenshot(path=shots["suikou"])
        pg.evaluate("document.getElementById('louisWild').scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(2200)
        check("is-live" in pg.get_attribute("#louisWild", "class"), f"{tag}: wild portrait live")
        pg.locator("#louisWild").screenshot(path=f"shots/r23-{tag}-{LANG}-wild.png")
        check(not errs, f"{tag}: errors {errs}")
        pg.close()
    # the tiers themselves (low: coarse grid, 30fps)
    pg = b.new_context(**pw.devices["Pixel 7"]).new_page(); pg.goto(URL); pg.wait_for_timeout(2500)
    tiers = pg.evaluate("""() => { const L = new Louis({}); const el = document.createElement('div'); el.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:240px';
        document.body.appendChild(el); L.mount(el); const r = [L.fps, L.count && L.count.verts]; L.destroy(); el.remove(); return r; }""")
    check(tiers[0] == 30 and tiers[1] < 2500, f"phone tier: {tiers[0]}fps, {tiers[1]} vertices")
    pg.close()
    # reduced motion: one static frame
    pg = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce").new_page(); pg.goto(URL); pg.wait_for_timeout(2500)
    pg.mouse.move(1300, 200); a = canvas_png(pg); pg.mouse.move(200, 600); pg.wait_for_timeout(1200); c = canvas_png(pg)
    check("is-live" in pg.get_attribute("#louisHero", "class") and a == c, "reduced motion: live and static")
    pg.close()
    # no WebGL → fallback image
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    ctx.add_init_script("HTMLCanvasElement.prototype.getContext = function () { return null; };")
    pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(2000)
    st = pg.evaluate("[document.getElementById('louisHero').className, getComputedStyle(document.getElementById('louisHero')).backgroundImage]")
    check("is-fallback" in st[0] and "louis-fallback.png" in st[1], f"no WebGL: {st[0]} · {st[1][-40:]}")
    pg.locator("#louisHero").screenshot(path=f"shots/r23-desk-{LANG}-fallback.png")
    b.close()
print("ALL OK" if good else "SOME FAILED")
if "--copy" in sys.argv:
    for k, name in {"desk-hero": "r23-desktop-hero", "closeup": "r23-louis-closeup"}.items():
        shutil.copy(shots[k], OUT + name + ".png")
    print("copied to", OUT)
