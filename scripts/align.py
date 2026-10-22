"""r8 alignment check (r10: Design Work is chapter 03, its slots join the chapter groups; r11: console groups work-left / case; r13: case-study groups work-side / case-<id> / media-<id>; r14B: folded and one-open states; r17: hero note row removed; r21: footer notes / log removed): every heading / subtitle / paragraph / status row inside one text block must share a left edge (±1px).
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
  const BOX = /wk-caps|wk-method|case-pmr|wfig|foot-meta|foot-links|slot-row|draft-row/;
  const add = (g, sel, root = document) => root.querySelectorAll(sel).forEach((el) => { if (vis(el)) (groups[g] = groups[g] || []).push([sel + (el.id ? "#" + el.id : ""), BOX.test(sel) ? C(el) : L(el)]); });
  add("hero", ".hero-copy .kicker"); add("hero", ".hero-h > span"); add("hero", "#heroNote");
  document.querySelectorAll(".chapter").forEach((sec) => {
    const g = sec.id, h = sec.querySelector("header.slots");
    ["slot-index", "slot-title", "slot-tagline", "slot-blurb", "slot-row", "draft-row"].forEach((c) => add(g, ":scope > ." + c, h));
  });
  // r13: Design Work — the head's right column (capabilities, method, note) shares one edge; each case's text block shares
  // one edge, and its lead screen and smaller screens share another (desktop: two columns; phone: the row scrolls, so lead only)
  add("work-side", ".wk-caps-box > .wk-sec"); add("work-side", ".wk-caps"); add("work-side", ".wk-method-box > .wk-sec"); add("work-side", ".wk-method"); add("work-side", ".wk-note");
  document.querySelectorAll(".wcase").forEach((c) => {
    ["case-tag", "case-h", "case-sum", "case-pmr"].forEach((k) => add("case-" + c.id, ":scope ." + k, c));
    add("case-" + c.id, ":scope .case-more", c);
    add("media-" + c.id, ":scope .wfig-lead", c); add("media-" + c.id, ":scope .wfig-cap", c);
    if (innerWidth > 760) add("media-" + c.id, ":scope .wfig-row > .wfig:first-child", c);
  });
  add("footer", ".foot-h > span:first-child"); add("footer", ".foot-meta");
  // r20B: the footer grid — the row label shares the heading's left edge. r21: notes and log are gone, so the contact
  // handles are the only thing in column 4 and the "foot-col" group is dropped
  add("footer", ".foot-row > .foot-k");
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
                # r14B: Design Work cases start folded; check that state, then again with one case open (the second)
                for state in ["folded", "open-1"]:
                    if state == "open-1":
                        pg.evaluate("document.querySelector('#case-annotation .case-btn').click()"); pg.wait_for_timeout(1200)
                    groups = pg.evaluate(JS)
                    ov = pg.evaluate("document.documentElement.scrollWidth - innerWidth")
                    fails = []
                    for g, items in groups.items():
                        xs = [x for _, x in items]
                        if max(xs) - min(xs) > 1: fails.append((g, [(s, round(x, 1)) for s, x in items]))
                    if fails: bad += 1
                    print(f"{bn:8} {vn} {lang} {state:6}: groups={len(groups)} misaligned={len(fails)} overflow={ov} errors={errs}")
                    for f in fails: print("   ", f)
                pg.screenshot(path=f"shots/{TAG}-align-{bn}-{vn}-{lang}.png")
                ctx.close()
        b.close()
sys.exit(1 if bad else 0)
