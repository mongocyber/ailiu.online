"""r20C / r20B: the 3D wireframe bust (hero desktop + Pixel 7, a close-up), the footer (desktop with the build log open,
phone), the ending and a mid chapter without text panels → shots/r20c-*.png, copied to the deliverables folder as
r20-desktop-hero.png, r20-mobile-hero.png, r20-louis-closeup.png, r20-footer.png, r20-desktop-footer.png,
r20-mobile-footer.png, r20-desktop-ending.png, r20-desktop-mid.png.
Usage: python3 scripts/deliver_r20c.py [lang] [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

LANG = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "zh"
URL = f"http://localhost:8801/index.html?lang={LANG}"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
# headless chromium has no GPU here: SwiftShader keeps WebGL on, so the bust and the scene draw as on a real machine
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
MID = """(k) => { const s = document.getElementById(k); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.5); }"""
shots = {}
with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    for mobile in (False, True):
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        pg = b.new_context(**kw).new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL + ("" if mobile else "&fx=high")); pg.wait_for_timeout(3000)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        tag = "mob" if mobile else "desk"
        state = pg.evaluate("[document.documentElement.dataset.fx, document.getElementById('louisHero').className]")
        shots[f"{tag}-hero"] = f"shots/r20c-{tag}-{LANG}-hero.png"; pg.screenshot(path=shots[f"{tag}-hero"])
        if not mobile:
            shots["closeup"] = f"shots/r20c-{tag}-{LANG}-louis.png"; pg.locator("#louisHero").screenshot(path=shots["closeup"])
            pg.evaluate(MID, "steam"); pg.wait_for_timeout(2200)
            shots["mid"] = f"shots/r20c-{tag}-{LANG}-mid.png"; pg.screenshot(path=shots["mid"])
            pg.evaluate("scrollTo(0, document.getElementById('contact').getBoundingClientRect().top + scrollY - innerHeight * 0.55)"); pg.wait_for_timeout(2200)
            shots["ending"] = f"shots/r20c-{tag}-{LANG}-ending.png"; pg.screenshot(path=shots["ending"])
        pg.evaluate("scrollTo(0, document.getElementById('contact').getBoundingClientRect().top + scrollY)"); pg.wait_for_timeout(1800)
        shots[f"{tag}-footer"] = f"shots/r20c-{tag}-{LANG}-footer.png"; pg.screenshot(path=shots[f"{tag}-footer"])
        if not mobile:
            pg.evaluate("document.getElementById('madeLog').open = true; scrollTo(0, document.documentElement.scrollHeight)"); pg.wait_for_timeout(1800)
            shots["footer-open"] = f"shots/r20c-{tag}-{LANG}-footer-open.png"; pg.screenshot(path=shots["footer-open"], full_page=False)
        print(tag, state, "errors:", errs)
    b.close()
if "--copy" in sys.argv:
    for k, name in {"desk-hero": "r20-desktop-hero", "mob-hero": "r20-mobile-hero", "closeup": "r20-louis-closeup",
                    "footer-open": "r20-footer", "desk-footer": "r20-desktop-footer", "mob-footer": "r20-mobile-footer",
                    "ending": "r20-desktop-ending", "mid": "r20-desktop-mid"}.items():
        shutil.copy(shots[k], OUT + name + ".png")
    print("copied to", OUT)
