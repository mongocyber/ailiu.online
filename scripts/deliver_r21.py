"""r21: Suikou chapter back to one phone with the three prototype screens rotating inside; footer without the notes / log. Checks the carousel (auto-advance
~4s, hover / focus pause, arrows / dots / keys, reduced motion stays put), shoots the chapter and the footer on desktop
and Pixel 7 → shots/r21-*.png; with --copy, r21-desktop-suikou.png, r21-mobile-suikou.png and r21-footer.png go to the
deliverables folder.
Usage: python3 scripts/deliver_r21.py [lang] [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

LANG = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "zh"
URL = f"http://localhost:8801/index.html?lang={LANG}"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
MID = """() => { const s = document.getElementById('suikou'); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.45); }"""
ON = "[...document.querySelectorAll('#skTrack .sk-shot')].findIndex(e => e.classList.contains('is-on'))"

def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    return ok

with sync_playwright() as pw:
    good = True
    for mobile in (False, True):
        b = pw.chromium.launch()
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg = b.new_context(**kw).new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL); pg.wait_for_timeout(2500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        tag = "mob" if mobile else "desk"
        pg.evaluate(MID)
        if mobile:  # the reveal / lazy images shift the layout after the first jump, so centre it again once settled
            for _ in range(2): pg.evaluate("document.querySelector('#skCar').scrollIntoView({ block: 'center' })"); pg.wait_for_timeout(900)
        pg.mouse.move(2, 2); pg.wait_for_timeout(1500)
        pg.screenshot(path=f"shots/r21-{tag}-{LANG}-suikou.png")
        if not mobile:
            a = pg.evaluate(ON); pg.wait_for_timeout(4300); b2 = pg.evaluate(ON)
            good &= check(b2 == (a + 1) % 3, f"auto-advance {a} → {b2}")
            pg.hover("#skPhone"); a = pg.evaluate(ON); pg.wait_for_timeout(4600)
            good &= check(pg.evaluate(ON) == a, "hover pauses")
            pg.mouse.move(2, 2); pg.wait_for_timeout(4300)
            good &= check(pg.evaluate(ON) != a, "resumes after hover")
            pg.focus("#skNext"); a = pg.evaluate(ON); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
            good &= check(pg.evaluate(ON) == (a + 1) % 3, "next button")
            pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(300)
            good &= check(pg.evaluate(ON) == a, "arrow key")
            pg.click("#skCar .sk-dot:nth-child(3)"); pg.wait_for_timeout(300)
            good &= check(pg.evaluate(ON) == 2 and pg.get_attribute("#skCar .sk-dot:nth-child(3)", "aria-current") == "true", "dot 3 + aria-current")
            pg.mouse.move(2, 2); pg.evaluate("document.activeElement.blur()"); pg.wait_for_timeout(4500)
            good &= check(pg.evaluate(ON) == 2, "manual pick stops rotation")
            good &= check(pg.get_attribute("#skShot0", "aria-hidden") == "true" and pg.get_attribute("#skCaps", "aria-live") == "polite", "aria-hidden / aria-live")
            pg.click("#skPlay"); pg.mouse.move(2, 2); pg.wait_for_timeout(4300)
            good &= check(pg.evaluate(ON) != 2 and "暂停" in pg.get_attribute("#skPlay", "aria-label") if LANG == "zh" else pg.evaluate(ON) != 2, "play restarts")
            cap = pg.evaluate("document.querySelector('#skCaps .is-on').textContent")
            good &= check(bool(cap.strip()), f"caption: {cap}")
        good &= check(pg.evaluate("!document.querySelector('#madeLog, .made-p')"), "footer: notes / log gone")
        pg.evaluate("scrollTo(0, document.documentElement.scrollHeight)"); pg.wait_for_timeout(1800)
        pg.screenshot(path=f"shots/r21-{tag}-{LANG}-footer.png")
        print(tag, "errors:", errs); good &= not errs; b.close()
    b = pw.chromium.launch()
    pg = b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce").new_page()
    pg.goto(URL); pg.wait_for_timeout(1500); pg.evaluate(MID); pg.wait_for_timeout(5000)
    good &= check(pg.evaluate(ON) == 0, "reduced motion: no auto-rotation")
    pg.click("#skNext"); pg.wait_for_timeout(200)
    good &= check(pg.evaluate(ON) == 1, "reduced motion: manual still works")
    b.close()
    print("ALL OK" if good else "SOME FAILED")
if "--copy" in sys.argv:
    shutil.copy(f"shots/r21-desk-{LANG}-suikou.png", OUT + "r21-desktop-suikou.png")
    shutil.copy(f"shots/r21-mob-{LANG}-suikou.png", OUT + "r21-mobile-suikou.png")
    shutil.copy(f"shots/r21-desk-{LANG}-footer.png", OUT + "r21-footer.png")
    print("copied")
