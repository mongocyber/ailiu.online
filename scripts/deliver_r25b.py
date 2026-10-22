"""r25b: the Xiaoyi chapter with the old site's real photos, told as a venture. Shoots the chapter on desktop at four scroll
points (one per spread) in zh and en, and on a Pixel 7; checks the three photos load (lazy, natural size > 0), no page errors,
and that the chapter's text holds none of the banned words. With --copy, shots/r25b-desk-zh-xiaoyi-2.png goes to the
deliverables as r25-xiaoyijia.png.
Usage: python3 scripts/deliver_r25b.py [--copy]   (server: python3 -m http.server 8801)"""
import shutil, sys
from playwright.sync_api import sync_playwright

OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
BANNED = ["AI", "分身", "虚拟", "创意", "品牌交付", "品牌系统", "avatar", "virtual", "creative", "brand system", "deliverable"]
GO = """(f) => { const s = document.getElementById('xiaoyi'); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * f); }"""
good = True
def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg); good &= bool(ok)

with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    for lang in ("zh", "en"):
        for mobile in (False, True):
            kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
            pg = b.new_context(**kw).new_page(); errs = []; tag = "mob" if mobile else "desk"
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.goto(f"http://localhost:8801/index.html?lang={lang}"); pg.wait_for_timeout(2500)
            pg.add_style_tag(content="html{scroll-behavior:auto!important}")
            if mobile:
                pg.evaluate("document.getElementById('xyBook').scrollIntoView({ block: 'start' })"); pg.wait_for_timeout(1800)
                pg.screenshot(path=f"shots/r25b-{tag}-{lang}-xiaoyi.png", full_page=False)
                pg.evaluate("document.querySelectorAll('.xy-shot img').forEach(i => i.scrollIntoView())"); pg.wait_for_timeout(1500)
            else:
                for i, f in enumerate((0.05, 0.38, 0.62, 0.95)):
                    pg.evaluate(GO, f); pg.wait_for_timeout(1800)
                    pg.screenshot(path=f"shots/r25b-{tag}-{lang}-xiaoyi-{i}.png")
            nat = pg.evaluate("[...document.querySelectorAll('.xy-shot img')].map(i => [i.currentSrc.split('/').pop(), i.naturalWidth])")
            check(len(nat) == 3 and all(w > 0 for _, w in nat), f"{tag} {lang}: photos loaded {nat}")
            text = pg.evaluate("document.getElementById('xiaoyi').innerText + [...document.querySelectorAll('#xiaoyi img')].map(i => i.alt).join(' ')")
            hits = [w for w in BANNED if (w in text if w == "AI" else w.lower() in text.lower())]
            check(not hits, f"{tag} {lang}: banned words {hits}")
            check(not errs, f"{tag} {lang}: errors {errs}")
            pg.close()
    b.close()
if "--copy" in sys.argv and good:
    shutil.copy("shots/r25b-desk-zh-xiaoyi-2.png", OUT + "r25-xiaoyijia.png"); print("copied r25-xiaoyijia.png")
sys.exit(0 if good else 1)
