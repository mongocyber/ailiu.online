"""r8 alignment check (r10: Design Work is chapter 03, its slots join the chapter groups): every heading / subtitle / paragraph / status row inside one text block must share a left edge (±1px).
Usage: python3 scripts/align.py [tag]   (server: python3 -m http.server 8801). Runs chromium, webkit, firefox × desktop/mobile × en/zh."""
import sys, json
from playwright.sync_api import sync_playwright

TAG = sys.argv[1] if len(sys.argv) > 1 else "r8"
JS = r"""() => {
  const L = (el) => {
    // left edge of the first rendered line of text (catches indents inside an element as well as offsets of the box)
    const r = document.createRange(); r.selectNodeContents(el);
    const rs = Array.from(r.getClientRects()).filter((x) => x.width > 0.5);
    const box = el.getBoundingClientRect();
    const cs = getComputedStyle(el), content = box.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
    return rs.length ? Math.min(content, ...rs.map((x) => x.left)) : content;
  };
  const vis = (el) => el && el.getClientRects().length && getComputedStyle(el).display !== "none";
  const groups = {};
  // text blocks: first rendered glyph; containers (grids / boxes holding SVG): content-box edge
  const C = (el) => { const b = el.getBoundingClientRect(), cs = getComputedStyle(el); return b.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth); };
  const BOX = /work-caps|work-cases|bg-grid|also-list|foot-meta|slot-row|draft-row|hero-note-sub/;
  const add = (g, sel, root = document) => root.querySelectorAll(sel).forEach((el) => { if (vis(el)) (groups[g] = groups[g] || []).push([sel + (el.id ? "#" + el.id : ""), BOX.test(sel) ? C(el) : L(el)]); });
  add("hero", ".hero-copy .kicker"); add("hero", ".hero-h > span"); add("hero", "#heroNote"); add("hero", ".hero-note-sub");
  document.querySelectorAll(".chapter").forEach((sec) => {
    const g = sec.id, h = sec.querySelector("header.slots");
    ["slot-index", "slot-title", "slot-tagline", "slot-blurb", "slot-row", "draft-row"].forEach((c) => add(g, ":scope > ." + c, h));
  });
  // r10: Design Work is a chapter (its header.slots is checked above as group "work"); its body is a separate block
  add("work-body", ".work-sec"); add("work-body", ".work-caps"); add("work-body", ".work-cases"); add("work-body", ".bg-grid");
  add("also", "#also .kicker"); add("also", ".also-list");
  add("about", ".about-h > span:first-child");
  add("about-col", ".about-p > p");
  add("footer", ".foot-h > span:first-child"); add("footer", ".foot-meta");
  document.querySelectorAll(".case-body").forEach((b, i) => ["case-tag", "case-sub", "case-sum"].forEach((c) => add("case" + i, ":scope > ." + c, b)) || add("case" + i, ":scope > h4", b) || add("case" + i, ":scope > details", b));
  return groups;
}"""
bad = 0
with sync_playwright() as pw:
    for bn in ["chromium", "webkit", "firefox"]:
        b = getattr(pw, bn).launch()
        for vn, vp, mob in [("desk", {"width": 1440, "height": 900}, False), ("mob", {"width": 390, "height": 844}, True)]:
            for lang in ["en", "zh"]:
                kw = dict(viewport=vp, device_scale_factor=1)
                if mob and bn != "firefox": kw.update(is_mobile=True, has_touch=True)
                ctx = b.new_context(**kw); pg = ctx.new_page()
                errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
                pg.goto(f"http://localhost:8801/index.html?lang={lang}"); pg.wait_for_timeout(1200)
                pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(300)
                pg.evaluate("document.querySelectorAll('[data-preset]').forEach(e => e.classList.add('is-in'))")
                pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(1400)  # reveal-up transitions settle
                groups = pg.evaluate(JS)
                ov = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
                fails = []
                for g, items in groups.items():
                    xs = [x for _, x in items]
                    if max(xs) - min(xs) > 1: fails.append((g, [(s, round(x, 1)) for s, x in items]))
                if fails: bad += 1
                pg.screenshot(path=f"shots/{TAG}-align-{bn}-{vn}-{lang}.png")
                print(f"{bn:8} {vn} {lang}: groups={len(groups)} misaligned={len(fails)} overflow={ov} errors={errs}")
                for f in fails: print("   ", f)
                ctx.close()
        b.close()
sys.exit(1 if bad else 0)
