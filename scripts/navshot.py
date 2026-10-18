"""r11: English top-bar check at the widths where the chapter nav is tightest.
Usage: python3 scripts/navshot.py [tag] [outdir]   (server: python3 -m http.server 8801)"""
import sys
from playwright.sync_api import sync_playwright
TAG = sys.argv[1] if len(sys.argv) > 1 else "r11"
OUT = sys.argv[2] if len(sys.argv) > 2 else "shots"
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w in [1180, 1181, 1240, 1360, 1460, 1560, 1640, 1701, 1800, 1920]:
        pg = b.new_page(viewport={"width": w, "height": 800})
        pg.goto("http://localhost:8801/index.html?lang=en"); pg.wait_for_timeout(700)
        m = pg.evaluate("""() => { const R = (s) => document.querySelector(s).getBoundingClientRect();
          const brandR = Math.max(...[...document.querySelectorAll('.brand > span')].map((e) => e.getBoundingClientRect().right));
          const n = R('.chapnav ol'), as = [...document.querySelectorAll('.chapnav a')];
          return { brandR: Math.round(brandR), navL: Math.round(n.left), navR: Math.round(n.right), h: Math.round(n.height),
            ctlL: Math.round(R('#langBtn').left), ctlR: Math.round(R('#soundBtn').right), vw: innerWidth,
            wrap: as.some((a) => a.getBoundingClientRect().height > 34), over: document.documentElement.scrollWidth > innerWidth }; }""")
        ok = not m["wrap"] and not m["over"] and m["navL"] - m["brandR"] >= 12 and m["ctlL"] - m["navR"] >= 12 and m["ctlR"] <= m["vw"]
        print(w, m, "OK" if ok else "CROWDED")
        if w in (1180, 1360, 1560): pg.screenshot(path=f"{OUT}/{TAG}-nav-en-{w}.png", clip={"x": 0, "y": 0, "width": w, "height": 70})
        pg.close()
    b.close()
