"""Self-check: scroll through every chapter at desktop + mobile and save screenshots to shots/.
Usage: python3 scripts/shoot.py [tag] [lang]   (server: python3 -m http.server 8801)"""
import sys, json
from playwright.sync_api import sync_playwright

TAG = sys.argv[1] if len(sys.argv) > 1 else "r1"
LANG = sys.argv[2] if len(sys.argv) > 2 else "en"
BASE = f"http://localhost:8801/index.html?lang={LANG}"
KEYS = ["aviso", "printplay", "work", "steam", "suikou", "taotao", "xiaoyi", "wild-louis"]  # r10: Design Work = 03; r14B: Xiaoyi 07, Wild Louis 08
OUT = "shots"

def run(pw, name, vp, mobile):
    b = pw.chromium.launch()
    ctx = b.new_context(viewport=vp, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE); pg.wait_for_timeout(1500)
    pg.add_style_tag(content="html{scroll-behavior:auto!important}")  # r11: instant scroll for stable frames
    pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-00-hero.png")
    for i, k in enumerate(KEYS, 1):
        info = pg.evaluate("""k => { const s = document.getElementById(k); const r = s.getBoundingClientRect();
            return {top: r.top + scrollY, h: r.height, vh: innerHeight}; }""", k)
        if k == "work":
            # r13: case studies scroll as a page — one frame every 0.85 screens, desktop and phone
            n = max(1, int(-(-info["h"] // (info["vh"] * 0.85))))
            for j in range(n):
                pg.evaluate(f"window.scrollTo(0,{info['top'] + j * info['vh'] * 0.85})"); pg.wait_for_timeout(900)
                pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-{i:02d}-{k}-{j:02d}.png")
            # r14B: cases are folded; one more pair of frames with the first case open (top, then its screens)
            pg.evaluate("document.querySelector('#case-agent .case-btn').click()"); pg.wait_for_timeout(900)
            y = pg.evaluate("document.getElementById('case-agent').getBoundingClientRect().top + scrollY - 110")
            for j, dy in enumerate([0, info["vh"] * 0.8]):
                pg.evaluate(f"window.scrollTo(0,{y + dy})"); pg.wait_for_timeout(900)
                pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-{i:02d}-{k}-open-{j}.png")
            pg.evaluate("document.querySelector('#case-agent .case-btn').click()"); pg.wait_for_timeout(700)
        elif mobile:
            n = max(1, int(-(-info["h"] // (info["vh"] * 0.85))))
            for j in range(n):
                y = info["top"] + j * info["vh"] * 0.85
                pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(900)
                pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-{i:02d}-{k}-{j}.png")
        else:
            for j, f in enumerate([0.12, 0.45, 0.85]):
                y = info["top"] + f * (info["h"] - info["vh"])
                pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(900)
                pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-{i:02d}-{k}-{j}.png")
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight - innerHeight*2.2)"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-09-about.png")
    pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(800)
    pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-10-footer.png")
    # r14: footer with the build log unfolded ("How this site is made")
    pg.evaluate("document.getElementById('madeLog').open = true"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('.foot-made').scrollIntoView({block: 'start'}); scrollBy(0, -80)"); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{OUT}/{TAG}-{name}-{LANG}-11-footer-log.png")
    overflow = pg.evaluate("[document.documentElement.scrollWidth - innerWidth, innerWidth]")
    print(name, LANG, "errors:", errs, "h-overflow:", overflow)
    b.close()

with sync_playwright() as pw:
    run(pw, "desk", {"width": 1440, "height": 900}, False)
    run(pw, "mob", {"width": 390, "height": 844}, True)
