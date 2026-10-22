"""r19C: the five chapters whose product mocks got a muted colour back (Aviso, PrintPlay, Suikou, TaoTao, Xiaoyi), mid-chapter
on desktop and Pixel 7 → shots/r19c-*.png for review; r19-desktop-mid-color.png (PrintPlay) is copied to the deliverables folder.
Usage: python3 scripts/deliver_r19c.py   (server: python3 -m http.server 8801)"""
import shutil
from playwright.sync_api import sync_playwright

URL = "http://localhost:8801/index.html?lang=zh"
OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
MID = """k => { const s = document.getElementById(k); scrollTo(0, s.getBoundingClientRect().top + scrollY + Math.max(0, s.offsetHeight - innerHeight) * 0.45); }"""
CH = ["aviso", "printplay", "suikou", "taotao", "xiaoyi"]

with sync_playwright() as pw:
    for mobile in (False, True):
        b = pw.chromium.launch()
        kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg = b.new_context(**kw).new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.goto(URL); pg.wait_for_timeout(2500)
        pg.add_style_tag(content="html{scroll-behavior:auto!important}")
        tag = "mob" if mobile else "desk"
        for k in CH:
            pg.evaluate(MID, k); pg.wait_for_timeout(1400)
            if mobile:  # the mock sits below the copy on phones: bring it into view
                pg.evaluate("""k => { const m = document.querySelector('#' + k + ' .av-scene, #' + k + ' .pp-stack, #' + k + ' .sk-phone-wrap, #' + k + ' .tt-wall, #' + k + ' .xy-book-wrap'); if (m) m.scrollIntoView({ block: 'center' }); }""", k)
                pg.wait_for_timeout(1000)
            pg.screenshot(path=f"shots/r19c-{tag}-{k}.png")
        print(tag, pg.evaluate("document.documentElement.dataset.fx"), "errors:", errs); b.close()
shutil.copy("shots/r19c-desk-printplay.png", OUT + "r19-desktop-mid-color.png")
print("copied r19-desktop-mid-color.png")
