"""r27: one scale for wide screens (--u / --frame / --gut in styles.css). Checks, in chromium:
- 1440 × 900, 1920 × 1080, 2560 × 1440, 3440 × 1440 (zh / en): each chapter's text block starts on --gut and its showpiece
  ends near the opposite gutter (no centred column, no wide empty side); the type, Louis, the phone and the book grow with
  --u (= min(W / 1440, H / 900)); no text runs past the window; no page errors.
- ≤1440 and phones are unchanged: at 1440 × 900, 1280 × 800 and 390 × 844 every measured box equals the pre-r26 build
  (served from a checkout of 36ac4d8 on :8802), within 1px (the removed printer bar aside).
Shots: shots/r27-<W>-<hero|aviso|printplay|steam|contact>.png; --copy sends them to deliverables.
Usage: python3 scripts/deliver_r27.py [--copy]   (servers: python3 -m http.server 8801 here, 8802 in the 36ac4d8 checkout)"""
import shutil, sys
from playwright.sync_api import sync_playwright

OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
NEW, OLD = "http://localhost:8801/", "http://localhost:8802/"
SIZES = [(1440, 900), (1920, 1080), (2560, 1440), (3440, 1440)]
# chapter: (text block, showpiece)
PAIRS = {"top": (".hero-copy", ".louis-hero"), "aviso": (".av-slots", ".av-scene"), "printplay": (".pp-slots", "#ppStack .sheet:nth-child(2)"),
         "steam": (".st-left", ".st-gauge"), "suikou": (".sk-phone", ".sk-slots"), "xiaoyi": (".xy-slots", ".xy-book"),
         "taotao": (".tt-slots", ".tt-wall"), "wild-louis": (".wl-slots", ".wl-louis"), "contact": (".foot-h", ".foot-links")}
SHOTS = {"top": "hero", "aviso": "aviso", "printplay": "printplay", "steam": "steam", "contact": "contact"}
SIZE_Q = {"title": "#aviso .slot-title", "blurb": "#aviso .slot-blurb", "hero": ".hero-h", "louis": ".louis-hero", "phone": ".sk-phone", "book": ".xy-book"}
BOXES = [".hero-h", ".hero-note", ".louis-hero", ".topbar", ".chapnav", "#aviso .slot-title", ".av-slots", ".av-scene", ".pp-slots", ".sheet",
         ".st-left", ".st-gauge", ".st-block", ".sk-phone", ".sk-slots", ".xy-slots", ".xy-book", ".tt-wall", ".wl-slots", ".wl-louis",
         ".wk-head", ".wcase", ".foot-h", ".foot-links", ".foot-meta"]
good = True
def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg); good &= bool(ok)
def goto(pg, i):
    if i == "top": pg.evaluate("scrollTo(0, 0)")
    elif i == "contact": pg.evaluate("scrollTo(0, document.body.scrollHeight)")
    else: pg.evaluate(f"(() => {{ const s = document.getElementById('{i}'); scrollTo(0, s.offsetTop + Math.max(0, s.offsetHeight - innerHeight) * 0.55); }})()")
    pg.wait_for_timeout(1400)
def unit(w, h): return 1 if w <= 1440 else max(1, min(w / 1440, h / 900))

with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    size = {}
    for w, h in SIZES:
        u = unit(w, h); frame = min(w, 1440 * 1.4 * u); pad = max(20, min(0.042 * frame, 64 * u)); gut = (w - frame) / 2 + pad
        for lang in ("zh", "en"):
            pg = b.new_page(viewport={"width": w, "height": h}); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.goto(f"{NEW}index.html?lang={lang}"); pg.wait_for_timeout(2500)
            pg.add_style_tag(content="html{scroll-behavior:auto!important}")
            for ch, (t, s) in PAIRS.items():
                goto(pg, ch)
                r = pg.evaluate("""([t, s]) => [t, s].map((q) => { const e = document.querySelector(q), r = e.getBoundingClientRect(); return [r.left, r.right]; })""", [t, s])
                lo, hi = min(r[0][0], r[1][0]), max(r[0][1], r[1][1])
                # the composition spans the frame: starts on the gutter, ends within a few gutters of the far one
                # (Suikou's phone sits at a third of the frame by design; the hero portrait overhangs by half a gutter)
                far = {"suikou": 0.33 * frame}.get(ch, 2.2 * pad)
                check(lo >= gut - 41 * u - 2 and hi <= w - gut + pad * 0.6 + 12 and hi >= w - gut - far,
                      f"{w} {lang} {ch}: content {lo:.0f}–{hi:.0f}, frame edges {gut:.0f}–{w - gut:.0f}")
                over = pg.evaluate("""() => [...document.querySelectorAll('.slots *, .hero-copy *, .footer *')].filter((e) => { const r = e.getBoundingClientRect();
                  return r.width && r.bottom > 0 && r.top < innerHeight && (r.right > innerWidth + 1 || r.left < -1); }).length""")
                check(over == 0, f"{w} {lang} {ch}: {over} text boxes past the window")
                if lang == "zh" and ch in SHOTS: pg.screenshot(path=f"shots/r27-{w}-{SHOTS[ch]}.png")
            if lang == "zh":
                goto(pg, "top")
                size[w] = pg.evaluate("""(q) => Object.fromEntries(Object.entries(q).map(([k, s]) => { const e = document.querySelector(s);
                  return [k, ['title', 'blurb', 'hero'].includes(k) ? parseFloat(getComputedStyle(e).fontSize) : e.getBoundingClientRect().height]; }))""", SIZE_Q)
            check(not errs, f"{w} {lang}: errors {errs}")
            pg.close()
    for w, h in SIZES[1:]:
        u = unit(w, h); k = {q: size[w][q] / size[1440][q] for q in SIZE_Q}
        # 1440 itself is partly width-bound (vw terms), so a size grows by between u and frame / 1440 (+8% slack)
        check(all(u * 0.97 <= v <= max(u, min(w, 1440 * 1.4 * u) / 1440) * 1.08 for v in k.values()), f"{w}: growth vs 1440 " + ", ".join(f"{q} ×{v:.2f}" for q, v in k.items()) + f" (u {u:.2f})")
    # ≤1440 and phone: same boxes as before r26
    JS = """(qs) => qs.map((q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)]; })"""
    for w, h in ((1440, 900), (1280, 800), (390, 844)):
        res = {}
        for base in (NEW, OLD):
            pg = b.new_page(viewport={"width": w, "height": h}, reduced_motion="reduce")
            pg.goto(f"{base}index.html?lang=zh"); pg.wait_for_timeout(2500)
            res[base] = pg.evaluate(JS, BOXES); pg.close()
        diff = [(q, a, c) for q, a, c in zip(BOXES, res[NEW], res[OLD]) if a != c and (not a or not c or max(abs(x - y) for x, y in zip(a, c)) > 1)]
        check(not diff, f"{w}×{h}: boxes as before r26 {diff}")
    b.close()
if "--copy" in sys.argv and good:
    for w, _ in SIZES:
        for n in SHOTS.values():
            shutil.copy(f"shots/r27-{w}-{n}.png", f"{OUT}r27-{w}-{n}.png")
    print("copied", len(SIZES) * len(SHOTS), "shots")
sys.exit(0 if good else 1)
