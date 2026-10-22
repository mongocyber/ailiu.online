"""r26: hero self-introduction rewrite + Aviso live. Shoots the desktop hero, the Pixel 7 hero and the Aviso chapter (zh), and
in zh / en on desktop and phone checks: the hero reads "I'm Louis, a UX designer"; no page text holds AI / 分身 / 虚拟形象 /
avatar outside product descriptions (Aviso, Design Work, TaoTao's disclosure); the self-introduction appears once; Aviso shows
Live, links the website and the zip (download attribute, zip served 200) and lists the install steps; no page errors.
With --copy, the three shots go to the deliverables as r26-desktop-hero.png, r26-mobile-hero.png, r26-aviso.png.
Usage: python3 scripts/deliver_r26.py [--copy]   (server: python3 -m http.server 8801)"""
import re, shutil, sys, urllib.request
from playwright.sync_api import sync_playwright

OUT = "/workspace/deliverables/ailiu-preview-v2-shots/"
GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
BASE = "http://localhost:8801/"
# AI is allowed only where it describes a product's own function: Aviso, the Design Work cases, TaoTao's content disclosure
ALLOWED = ("aviso", "work", "taotao")
BANNED = ["分身", "虚拟形象", "avatar", "内部测试", "开发中 · 精简版", "v0.3", "AI 工具", "AI tools"]
INTRO = {"zh": "我是路易斯", "en": "I'm Louis"}
good = True
def check(ok, msg):
    global good
    print(("ok   " if ok else "FAIL ") + msg); good &= bool(ok)

check(urllib.request.urlopen(BASE + "downloads/aviso-lite.zip").status == 200, "zip served 200")
with sync_playwright() as pw:
    b = pw.chromium.launch(args=GL)
    for lang in ("zh", "en"):
        for mobile in (False, True):
            kw = dict(pw.devices["Pixel 7"]) if mobile else dict(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
            pg = b.new_context(**kw).new_page(); errs = []; tag = "mob" if mobile else "desk"
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            pg.goto(f"{BASE}index.html?lang={lang}"); pg.wait_for_timeout(3000)
            pg.add_style_tag(content="html{scroll-behavior:auto!important}")
            pg.screenshot(path=f"shots/r26-{tag}-{lang}-hero.png")
            h1 = pg.inner_text("#hero-h").replace("\n", "")
            check(INTRO[lang] in h1 and "UX" in h1, f"{tag} {lang}: hero '{h1}'")
            title = pg.title(); desc = pg.get_attribute('meta[name="description"]', "content")
            check("Louis" in title and INTRO[lang] in desc and "AI" not in title + desc, f"{tag} {lang}: meta '{title}' / '{desc}'")
            # text outside the chapters where AI describes a product
            other = pg.evaluate("""(allowed) => { const c = document.body.cloneNode(true);
                c.querySelectorAll('script, style').forEach((s) => s.remove());
                allowed.forEach((k) => { const s = c.querySelector('#' + k); if (s) s.remove(); });
                return c.textContent + ' ' + document.title + ' ' + [...c.querySelectorAll('img')].map(i => i.alt).join(' '); }""", list(ALLOWED))
            check(not re.search(r"\bAI\b", other), f"{tag} {lang}: no 'AI' outside product chapters")
            text = pg.evaluate("document.body.innerText")
            hits = [w for w in BANNED if w.lower() in text.lower()]
            check(not hits, f"{tag} {lang}: banned {hits}")
            n = pg.evaluate("(s) => document.body.innerText.split(s).length - 1", INTRO[lang])
            m2 = pg.evaluate("() => (document.body.innerText.match(/我是一名设计师|I'm a designer|I’m a designer/g) || []).length")
            check(n == 1 and m2 == 0, f"{tag} {lang}: self-introduction appears {n}x, other intros {m2}")
            pg.evaluate("document.getElementById('aviso').scrollIntoView({ block: 'start' })"); pg.wait_for_timeout(500)
            pg.evaluate("(() => { const s = document.getElementById('aviso'); scrollTo(0, s.offsetTop + Math.max(0, s.offsetHeight - innerHeight) * 0.55); })()")
            pg.wait_for_timeout(2000)
            pg.screenshot(path=f"shots/r26-{tag}-{lang}-aviso.png")
            av = pg.evaluate("""() => { const s = document.getElementById('aviso');
                return { status: s.querySelector('[data-slot=status]').textContent,
                  links: [...s.querySelectorAll('.slots a')].map(a => [a.getAttribute('href'), a.hasAttribute('download'), a.textContent]),
                  steps: [...s.querySelectorAll('.dr-steps li')].map(l => l.textContent), text: s.innerText }; }""")
            check(av["status"] in ("已上线", "Live"), f"{tag} {lang}: aviso status {av['status']}")
            hrefs = {h: d for h, d, _ in av["links"]}
            check(hrefs.get("https://aviso-nine.vercel.app/") is False and hrefs.get("downloads/aviso-lite.zip") is True, f"{tag} {lang}: aviso links {av['links']}")
            check(len(av["steps"]) == 5 and any("chrome://extensions" in x for x in av["steps"]) and any("aviso-lite-0.1.0" in x for x in av["steps"]), f"{tag} {lang}: {len(av['steps'])} install steps")
            check(not re.search(r"开发中|In development|内部测试|v0\.3", av["text"]), f"{tag} {lang}: no dev wording in Aviso")
            check(not errs, f"{tag} {lang}: errors {errs}")
            pg.close()
    b.close()
if "--copy" in sys.argv and good:
    for a, z in (("desk-zh-hero", "r26-desktop-hero"), ("mob-zh-hero", "r26-mobile-hero"), ("desk-zh-aviso", "r26-aviso")):
        shutil.copy(f"shots/r26-{a}.png", OUT + z + ".png"); print("copied", z)
sys.exit(0 if good else 1)
