"""r9: close-ups of the three Louis instances (hero, mini narrator face, wild-louis) + frame-time probe.
Usage: python3 scripts/louis_closeup.py [tag]   (server: python3 -m http.server 8801)"""
import sys
from playwright.sync_api import sync_playwright

TAG = sys.argv[1] if len(sys.argv) > 1 else "r9"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, vp, mob in [("desk", {"width": 1440, "height": 900}, False), ("mob", {"width": 390, "height": 844}, True)]:
        ctx = b.new_context(viewport=vp, device_scale_factor=2, is_mobile=mob, has_touch=mob)
        pg = ctx.new_page(); errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("http://localhost:8801/index.html?lang=zh"); pg.wait_for_timeout(1800)
        pg.locator("#louisHero").screenshot(path=f"shots/{TAG}-louis-{name}-hero.png")
        ms = pg.evaluate("""() => new Promise(r => { const ts = []; let n = 0; const f = (t) => { ts.push(t); if (++n < 120) requestAnimationFrame(f); else {
            const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); r([d[d.length >> 1], d[Math.floor(d.length * .95)]]); } }; requestAnimationFrame(f); })""")
        nf = pg.locator("#narFace")
        if nf.is_visible(): nf.screenshot(path=f"shots/{TAG}-louis-{name}-mini.png")
        pg.evaluate("document.getElementById('louisWild').scrollIntoView({block:'center'})"); pg.wait_for_timeout(1200)
        pg.locator("#louisWild").screenshot(path=f"shots/{TAG}-louis-{name}-wild.png")
        if nf.is_visible(): nf.screenshot(path=f"shots/{TAG}-louis-{name}-mini-wild.png")
        print(name, "frame ms median/p95:", ms, "errors:", errs, "mini visible:", nf.is_visible())
        ctx.close()
    b.close()
