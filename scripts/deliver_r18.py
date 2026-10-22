"""r18: the named review frames (hero desktop / Pixel 7 / reduced motion, Design Work and Steam mid-chapter on desktop and
phone, Design Work sub-nav stuck under the top bar) → shots/r18-*.png, plus data-fx and stuck-state checks.
Usage: python3 scripts/deliver_r18.py   (server: python3 -m http.server 8801)"""
from playwright.sync_api import sync_playwright

URL = "http://localhost:8801/index.html?lang=zh"
MID = """k => { const s = document.getElementById(k); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * (k === 'work' ? 0.3 : 0.45)); }"""

def page(pw, mobile=False, reduced=False):
    b = pw.chromium.launch()
    kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    if reduced: kw["reduced_motion"] = "reduce"
    pg = b.new_context(**kw).new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(2200)
    pg.add_style_tag(content="html{scroll-behavior:auto!important}")
    return b, pg, errs

with sync_playwright() as pw:
    for mobile in (False, True):
        tag = "mobile" if mobile else "desktop"
        b, pg, errs = page(pw, mobile)
        pg.screenshot(path=f"shots/r18-{tag}-hero.png")
        for k, name in (("work", "work"), ("steam", "steam")):
            pg.evaluate(MID, k); pg.wait_for_timeout(1400)
            pg.screenshot(path=f"shots/r18-{tag}-mid-{name}.png")
        if not mobile:
            # first case's lead screen passing under the stuck case index
            y = pg.evaluate("document.getElementById('case-agent').getBoundingClientRect().top + scrollY - 64 - document.getElementById('workIndex').offsetHeight + 120")
            pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(1200)
            st = pg.evaluate("""() => ({ bar: Math.round(document.querySelector('.topbar').getBoundingClientRect().bottom),
              idx: Math.round(document.getElementById('workIndex').getBoundingClientRect().top),
              stuck: document.getElementById('workIndex').classList.contains('is-stuck') })""")
            pg.screenshot(path="shots/r18-subnav-desktop.png", clip={"x": 0, "y": 0, "width": 1440, "height": 300})
            print("subnav", st)
        print(tag, pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxWhy]"), "errors:", errs)
        b.close()
    b, pg, errs = page(pw, reduced=True)
    pg.screenshot(path="shots/r18-reduced-motion-hero.png")
    print("reduced", pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxWhy]"), "errors:", errs)
    b.close()
