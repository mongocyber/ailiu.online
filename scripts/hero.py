"""r17 hero check: first-screen shots (desktop zh/en, Pixel 7, iPhone 13 webkit, reduced motion), a pair of desktop
frames ~0.6 s apart (portrait and field rise together), and the fallback matrix (data-fx / data-portrait, pageerrors).
Usage: python3 scripts/hero.py [tag]   (server: python3 -m http.server 8801). Shots go to shots/<tag>-hero-*.png."""
import sys
from playwright.sync_api import sync_playwright

TAG = sys.argv[1] if len(sys.argv) > 1 else "r17"
URL = "http://localhost:8801/index.html"
NO_WEBGL = "HTMLCanvasElement.prototype.getContext = (function (g) { return function (t, o) { return /webgl/.test(t) ? null : g.call(this, t, o); }; })(HTMLCanvasElement.prototype.getContext);"
NO_CANVAS = "HTMLCanvasElement.prototype.getContext = function () { return null; };"
STATE = """() => ({ fx: document.documentElement.dataset.fx, why: document.documentElement.dataset.fxWhy,
  portrait: document.getElementById('louisHero').className, wave: !!(window.FX_WAVE && FX_WAVE.on),
  fps: window.FX_WAVE && FX_WAVE.fps, scale: window.FX_WAVE && FX_WAVE.scale,
  heroH: document.querySelector('.hero-inner').getBoundingClientRect().height, vh: innerHeight,
  fig: (r => [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)])(document.querySelector('.louis-hero').getBoundingClientRect()),
  copy: (r => [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)])(document.querySelector('.hero-copy').getBoundingClientRect()),
  index: Math.round(document.getElementById('heroIndex').getBoundingClientRect().top),
  overflow: document.documentElement.scrollWidth - innerWidth })"""
bad = 0

def shot(pw, name, browser="chromium", device=None, vp=None, lang="zh", reduced=False, init=None, query="", wait=2200, pair=False):
    global bad
    b = getattr(pw, browser).launch()
    kw = dict(pw.devices[device]) if device else dict(viewport=vp or {"width": 1440, "height": 900}, device_scale_factor=1)
    if device and browser == "firefox": kw.pop("is_mobile", None)
    if reduced: kw["reduced_motion"] = "reduce"
    ctx = b.new_context(**kw); pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    if init: pg.add_init_script(init)
    pg.goto(f"{URL}?lang={lang}{query}"); pg.wait_for_timeout(wait)
    if not device: pg.mouse.move(1080, 420); pg.wait_for_timeout(400)
    st = pg.evaluate(STATE)
    if pair:
        pg.screenshot(path=f"shots/{TAG}-hero-{name}-a.png"); pg.wait_for_timeout(600)
        pg.screenshot(path=f"shots/{TAG}-hero-{name}-b.png")
    elif name:
        pg.screenshot(path=f"shots/{TAG}-hero-{name}.png")
    if errs: bad += 1
    print(f"{name or '-':22} {browser:8} {device or vp} {st} errors={errs}")
    b.close()

with sync_playwright() as pw:
    shot(pw, "desktop-zh")
    shot(pw, "desktop-en", lang="en")
    shot(pw, "sync", pair=True)
    shot(pw, "pixel7", device="Pixel 7")
    shot(pw, "iphone", browser="webkit", device="iPhone 13")
    shot(pw, "reduced", reduced=True)
    shot(pw, "webkit-desktop", browser="webkit")
    shot(pw, "firefox-desktop", browser="firefox")
    # fallbacks
    shot(pw, "", device="Pixel 7", reduced=True)
    shot(pw, "", browser="webkit", device="iPhone 13", reduced=True)
    shot(pw, "fx-off", query="&fx=off")
    shot(pw, "no-webgl", init=NO_WEBGL)
    shot(pw, "", browser="webkit", device="iPhone 13", init=NO_WEBGL)
    shot(pw, "no-canvas", init=NO_CANVAS)
    shot(pw, "no-canvas-iphone", browser="webkit", device="iPhone 13", init=NO_CANVAS)
sys.exit(1 if bad else 0)
