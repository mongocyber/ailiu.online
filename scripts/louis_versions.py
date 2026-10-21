"""r25: renders Louis from several (louis.js, louis-data.js) versions at the same poses, side by side over the scene's
black, so the likeness can be judged against the references (left: chosen-front.png and 01_front.png).
Usage: python3 scripts/louis_versions.py out.png label=dir [label=dir …] [--yaws=0,-18] [--size=520x650] [--low] [--norefs]
  (label=dir|js runs js before mounting; dir holds louis.js + louis-data.js; "." is the working tree)"""
import pathlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = sys.argv[1]
VERS = [a.split("=", 1) for a in sys.argv[2:] if not a.startswith("-")]
W, H, YAWS, LOW = 520, 650, [0.0], "--low" in sys.argv
for a in sys.argv[2:]:
    if a.startswith("--yaws="): YAWS = [float(v) for v in a[7:].split(",")]
    if a.startswith("--size="): W, H = [int(v) for v in a[7:].split("x")]
REFS = [] if "--norefs" in sys.argv else ["/workspace/deliverables/louis-mj-test/chosen-front.png", "/workspace/deliverables/louis-refs/github/01_front.png"]
tiles = []
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    for label, d in VERS:
        d, pre = (d.split("|", 1) + [""])[:2]   # label=dir|js: a snippet run before mounting (e.g. LOUIS_TUNE(…))
        d = (ROOT / d) if not d.startswith("/") else pathlib.Path(d)
        cells = "".join(f'<div id="h{k}" style="position:relative;width:{W}px;height:{H}px;display:inline-block"></div>' for k in range(len(YAWS)))
        mounts = "".join(f"window.L{k} = new Louis({{ interactive: false, keep: true, low: {str(LOW).lower()}, dpr: 1.5, pose: [{y} * Math.PI / 180, 0.07] }}).mount(document.getElementById('h{k}'));" for k, y in enumerate(YAWS))
        html = f"""<!doctype html><body style="margin:0;background:#060607;white-space:nowrap">{cells}
<script>{(d / 'louis-data.js').read_text()}</script><script>{(d / 'louis.js').read_text()}</script><script>{pre}</script><script>{mounts}</script>"""
        pg = b.new_page(viewport={"width": W * len(YAWS), "height": H}, device_scale_factor=1.5, reduced_motion="reduce")
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.set_content(html); pg.wait_for_timeout(1200)
        print(label, "live:", pg.evaluate(f"[{','.join(f'L{k}.live' for k in range(len(YAWS)))}]"), pg.evaluate("L0.count"), errs)
        p = f"/tmp/louis_versions_{label}.png"; pg.screenshot(path=p); pg.close()
        im = Image.open(p).convert("RGB"); ImageDraw.Draw(im).text((12, 10), label, fill=(200, 200, 200))
        tiles.append(im)
    b.close()
Ht = tiles[0].height
refs = []
for r in REFS:
    im = Image.open(r).convert("RGB"); refs.append(im.resize((round(im.width * Ht / im.height), Ht), Image.LANCZOS))
all_ = refs + tiles
out = Image.new("RGB", (sum(t.width for t in all_) + 12 * (len(all_) - 1), Ht), (20, 20, 22))
x = 0
for t in all_: out.paste(t, (x, 0)); x += t.width + 12
out.save(OUT); print(OUT, out.size)
