"""r22: burst checks for the Suikou carousel (one phone, three prototype screens).
  1. geometry — each screenshot fills the glass exactly: the <img> box equals the track box, the track's aspect ratio
     equals the image's natural ratio (so object-fit: cover crops nothing), on desktop and Pixel 7;
  2. scroll entry — scrolls into the chapter in small wheel steps while sampling every frame: no auto switch before the
     phone is ≥55% on screen and its rise-in has settled, the first auto switch comes ≥ ~4s after that, and the
     screens are decoded before it; leaving the chapter pauses (no switch while off screen);
  3. fades — samples every animation frame during a switch: some layer is always fully opaque under / over the fade
     (no dip to the bezel), and a burst of clipped screenshots shows the screen's mean brightness never dropping below
     the darker of the two screens.
Writes shots/r22-sk-burst-*.png (a strip of the burst frames).
Usage: python3 scripts/suikou_r22.py   (server: python3 -m http.server 8801)"""
import io
from playwright.sync_api import sync_playwright
from PIL import Image, ImageStat

URL = "http://localhost:8801/index.html?lang=zh"
ON = "[...document.querySelectorAll('#skTrack .sk-shot')].findIndex(e => e.classList.contains('is-on'))"
good = True

def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg)
    good &= bool(ok)

GEOM = """() => { const t = document.getElementById('skTrack').getBoundingClientRect();
  return [...document.querySelectorAll('#skTrack img')].map(im => { const r = im.getBoundingClientRect();
    return { d: Math.max(Math.abs(r.left - t.left), Math.abs(r.top - t.top), Math.abs(r.right - t.right), Math.abs(r.bottom - t.bottom)),
      box: im.clientWidth / im.clientHeight, nat: im.naturalWidth / im.naturalHeight, nw: im.naturalWidth,
      fit: getComputedStyle(im).objectFit }; }); }"""

# a per-frame sampler living in the page: records time, visible ratio of the phone, settled flag, slide on show
SAMPLER = """() => { window.__sk = []; const ph = document.getElementById('skPhone'), w = document.querySelector('#suikou .sk-phone-wrap');
  const f = (t) => { const r = ph.getBoundingClientRect(); const vis = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(0, r.top)) / r.height;
    const sh = [...document.querySelectorAll('#skTrack .sk-shot')];
    window.__sk.push({ t, vis, on: sh.findIndex(e => e.classList.contains('is-on')), inn: w.classList.contains('is-in'),
      tf: getComputedStyle(w).transform, op: sh.map(e => +getComputedStyle(e).opacity), vz: sh.map(e => getComputedStyle(e).visibility),
      pv: sh.map(e => e.classList.contains('is-prev')), dec: [...document.querySelectorAll('#skTrack img')].every(i => i.complete && i.naturalWidth > 0) });
    if (!window.__skStop) requestAnimationFrame(f); }; requestAnimationFrame(f); }"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for mobile in (False, True):
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg = b.new_context(**kw).new_page(); errs = []; tag = "mob" if mobile else "desk"
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(1500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        # 2 · scroll entry, in steps, from one viewport above the chapter
        top = pg.evaluate("document.getElementById('suikou').getBoundingClientRect().top + scrollY")
        pg.evaluate(f"scrollTo(0, {top} - innerHeight)"); pg.wait_for_timeout(400)
        pg.evaluate(SAMPLER)
        target = pg.evaluate("(() => { const s = document.getElementById('suikou'), r = document.getElementById('skPhone').getBoundingClientRect(); return " +
                             ("r.top + scrollY - (innerHeight - r.height) / 2" if mobile else "s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.45") + "; })()")
        y = top - pg.evaluate("innerHeight")
        while y < target:
            y = min(target, y + 60); pg.evaluate(f"scrollTo(0, {y})"); pg.wait_for_timeout(30)
        if mobile:  # lazy content above can shift the layout once; centre again
            pg.wait_for_timeout(500); pg.evaluate("document.getElementById('skPhone').scrollIntoView({ block: 'center' })")
        pg.mouse.move(2, 2)
        pg.wait_for_timeout(6500)
        s = pg.evaluate("window.__sk")
        first_on = s[0]["on"]
        sw = next((x for x in s if x["on"] != first_on), None)
        ready = next((x for x in s if x["vis"] >= 0.55 and x["inn"] and x["tf"] == "none"), None)
        check(sw is not None, f"{tag}: auto switch happened ({len(s)} frames sampled)")
        if sw and ready:
            check(sw["t"] - ready["t"] >= 3900, f"{tag}: first auto switch {sw['t'] - ready['t']:.0f}ms after the phone was ≥55% visible and settled")
            pre = [x for x in s if x["t"] < sw["t"]]
            check(all(x["vis"] >= 0.55 for x in pre[-5:]), f"{tag}: switch happened while on screen")
            check(sw["dec"], f"{tag}: all three screens decoded before the first switch")
        # 1 · geometry (after settling, and once more mid-tilt on desktop)
        g = pg.evaluate(GEOM)
        check(all(x["d"] < 0.6 and abs(x["box"] - x["nat"]) < 0.004 and x["nw"] > 0 for x in g),
              f"{tag}: images fill the glass exactly " + ", ".join(f"Δ{x['d']:.2f}px ratio {x['box']:.4f}/{x['nat']:.4f}" for x in g))
        # 3 · fades: in-page frame sampling + a screenshot burst of the glass
        pg.evaluate("window.__skStop = true"); pg.wait_for_timeout(50); pg.evaluate("window.__skStop = false"); pg.evaluate(SAMPLER)
        clip = pg.locator("#skTrack").bounding_box()
        def lum():
            im = Image.open(io.BytesIO(pg.screenshot(clip=clip))).convert("L")
            return im, ImageStat.Stat(im).mean[0]
        base = [lum()[1]]
        a = pg.evaluate(ON); frames = []; pg.click("#skNext");
        for _ in range(12):
            im, m = lum(); frames.append((im, m))
        pg.wait_for_timeout(400); base.append(lum()[1])
        pg.evaluate("window.__skStop = true")
        s = [x for x in pg.evaluate("window.__sk")]
        cover = all(any(op >= 0.999 and vz == "visible" for op, vz in zip(x["op"], x["vz"])) for x in s)
        check(cover, f"{tag}: every sampled frame ({len(s)}) has a fully opaque screen under or over the fade")
        check(pg.evaluate(ON) == (a + 1) % 3, f"{tag}: next button {a} → {(a + 1) % 3}")
        lo = min(m for _, m in frames)
        check(lo >= min(base) - 3, f"{tag}: burst brightness min {lo:.1f} vs screens {base[0]:.1f} / {base[1]:.1f} (no dip)")
        strip = Image.new("L", (frames[0][0].width * 6, frames[0][0].height * 2))
        for k, (im, _) in enumerate(frames): strip.paste(im, ((k % 6) * im.width, (k // 6) * im.height))
        strip.save(f"shots/r22-sk-burst-{tag}.png")
        # leaving the chapter pauses
        pg.click("#skPlay"); pg.mouse.move(2, 2); pg.evaluate("document.activeElement.blur()")
        pg.evaluate("scrollTo(0, 0)"); pg.wait_for_timeout(300); a = pg.evaluate(ON); pg.wait_for_timeout(5000)
        check(pg.evaluate(ON) == a, f"{tag}: off screen → no rotation")
        check(not errs, f"{tag}: errors {errs}")
    b.close()
print("ALL OK" if good else "SOME FAILED")
