"""r26 items 7–8: Louis without the field's wave, and wide-screen layout. Checks, in chromium:
- Louis (hero and Wild Louis): with the mouse still (before any pointer event), the portrait canvas stops drawing (no wave, breath or sway); a mouse
  move draws it again (the turn toward the cursor is kept); reduced motion → no redraws at all.
- 1440 / 1920 / 2560 (zh / en): every chapter's text block and its showpiece sit inside the centred column
  (max(--pad-x, (W − 1440) / 2) from each edge); title, tagline and blurb are larger at 2560 than at 1440; the PrintPlay
  printer bar (the empty floating "PRINTPLAY" box) is gone; no page errors.
Shots: shots/r26-wide-{1440,1920,2560}.png (Aviso), shots/r26-wide-{1920,2560}-printplay.png; --copy sends them to deliverables.
Usage: python3 scripts/deliver_r26b.py [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
BASE = "http://localhost:8801/"
H = {1440: 900, 1920: 1080, 2560: 1440}
# count draws per portrait canvas (the hero's and Wild Louis's hosts)
COUNT = """(() => { window.__draws = {}; const f = WebGLRenderingContext.prototype.drawArrays;
  WebGLRenderingContext.prototype.drawArrays = function () { const p = this.canvas.parentElement, k = p && p.id;
    if (k) window.__draws[k] = (window.__draws[k] || 0) + 1; return f.apply(this, arguments); }; })()"""
# chapter: (text block, showpiece) — both must lie inside the column
PAIRS = {"aviso": (".av-slots", ".av-scene"), "printplay": (".pp-slots", "#ppStack .sh-cards"), "steam": (".st-left", ".st-gauge"),
         "suikou": (".sk-slots", ".sk-phone"), "taotao": (".tt-slots", ".tt-wall"), "xiaoyi": (".xy-slots", ".xy-book"),
         "wild-louis": (".wl-slots", ".wl-louis"), "work": (".wk-head .slots", ".wk-side"), "top": (".hero-copy", ".louis-hero")}
good = True
def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg); good &= bool(ok)
def goto(pg, i):
    pg.evaluate(f"(() => {{ const s = document.getElementById('{i}'); scrollTo(0, s.offsetTop + Math.max(0, s.offsetHeight - innerHeight) * 0.55); }})()")
    pg.wait_for_timeout(1500)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    # ---- 7 · Louis: draws only while the mouse turns it
    for reduced in (False, True):
        ctx = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce" if reduced else "no-preference")
        ctx.add_init_script(COUNT); pg = ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(BASE + "index.html?lang=zh&fx=high"); pg.wait_for_timeout(3000)
        tag = "reduced" if reduced else "motion"
        # still first, for both (the portraits share the pointer, so a move eases both); no pointer event yet → pose at rest
        # (a mouse turn eases out over ~2s at 60fps; swiftshader draws ~2fps)
        for host, where in (("louisHero", "top"), ("louisWild", "wild-louis")):
            if where == "top": pg.evaluate("scrollTo(0, 0)")
            else: goto(pg, where)
            pg.wait_for_timeout(1500)
            a = pg.evaluate(f"window.__draws['{host}'] || 0"); pg.wait_for_timeout(1500)
            still = pg.evaluate(f"window.__draws['{host}'] || 0") - a
            live = pg.evaluate(f"document.getElementById('{host}').classList.contains('is-live')")
            check(live and still == 0, f"{tag} {host}: live {live}, {still} draws in 1.5s with the mouse still")
        for host, where in (("louisWild", "wild-louis"), ("louisHero", "top")):
            if where == "top": pg.evaluate("scrollTo(0, 0)"); pg.wait_for_timeout(1500)
            a = pg.evaluate(f"window.__draws['{host}'] || 0")
            for x in range(10): pg.mouse.move(700 + 60 * x, 450 - 20 * x); pg.wait_for_timeout(40)
            pg.wait_for_timeout(300); moved = pg.evaluate(f"window.__draws['{host}'] || 0") - a
            check((moved == 0) if reduced else (moved > 0), f"{tag} {host}: {moved} draws while the mouse moves")
        check(not errs, f"louis errors {errs}"); ctx.close()
    # ---- 8 · wide layout
    size = {}
    for w in (1440, 1920, 2560):
        for lang in ("zh", "en"):
            pg = b.new_page(viewport={"width": w, "height": H[w]}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.goto(f"{BASE}index.html?lang={lang}"); pg.wait_for_timeout(2500)
            pg.add_style_tag(content="html{scroll-behavior:auto!important}")
            gut = max(min(64, max(20, w * 0.042)), (w - 1440) / 2)
            for ch, (t, s) in PAIRS.items():
                if ch == "top": pg.evaluate("scrollTo(0, 0)"); pg.wait_for_timeout(600)
                else: goto(pg, ch)
                r = pg.evaluate("""([t, s]) => [t, s].map((q) => { const e = document.querySelector(q), r = e.getBoundingClientRect(); return [r.left, r.right]; })""", [t, s])
                lo, hi = min(r[0][0], r[1][0]), max(r[0][1], r[1][1])
                # 3D-tilted mocks may lean a few px past their box; the portraits' boxes overhang by design (louis-hero −pad/2)
                slack = 48 if ch == "top" else 12
                check(lo >= gut - 41 - 1 and hi <= w - gut + slack, f"{w} {lang} {ch}: content {lo:.0f}–{hi:.0f} in column {gut:.0f}–{w - gut:.0f}")
                if ch == "aviso" and lang == "zh":
                    pg.screenshot(path=f"shots/r26-wide-{w}.png")
                    size[w] = pg.evaluate("""() => ['.slot-title', '.slot-tagline', '.slot-blurb'].map((q) => parseFloat(getComputedStyle(document.querySelector('#aviso ' + q)).fontSize))""")
                if ch == "printplay":
                    check(pg.locator(".pp-printer").count() == 0, f"{w} {lang}: no printer bar")
                    if lang == "zh" and w > 1440: pg.screenshot(path=f"shots/r26-wide-{w}-printplay.png")
            check(not errs, f"{w} {lang}: errors {errs}")
            pg.close()
    check(all(a < c for a, c in zip(size[1440], size[2560])), f"type 1440 {size[1440]} → 1920 {size[1920]} → 2560 {size[2560]}")
    b.close()
if "--copy" in sys.argv and good:
    for z in ("r26-wide-1440", "r26-wide-1920", "r26-wide-2560", "r26-wide-1920-printplay", "r26-wide-2560-printplay"):
        shutil.copy(f"shots/{z}.png", OUT + z + ".png"); print("copied", z)
sys.exit(0 if good else 1)
