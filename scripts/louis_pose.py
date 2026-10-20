"""r22 (r23: r23- names): renders the bust alone (louis.js + louis-data.js, WebGL via SwiftShader) at fixed poses, side by side, over the
scene's black → shots/r23-louis-poses[-tag].png. Default poses: yaw -25°, -12°, 0°, +12°, +25° (pitch 4°).
Usage: python3 scripts/louis_pose.py [tag] [--low]   (no server needed)"""
import pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
TAG = next((a for a in sys.argv[1:] if not a.startswith("-")), "")
W, H = 420, 520
LOW = "--low" in sys.argv
YAWS = [-25, -12, 0, 12, 25]
for a in sys.argv[1:]:
    if a.startswith("--yaws="): YAWS = [float(v) for v in a[7:].split(",")]
    if a.startswith("--size="): W, H = [int(v) for v in a[7:].split("x")]
cells = "".join(f'<div id="h{k}" style="position:relative;width:{W}px;height:{H}px;display:inline-block"></div>' for k in range(len(YAWS)))
mounts = "".join(f"window.L{k} = new Louis({{ interactive: false, keep: true, low: {str(LOW).lower()}, dpr: 1.5, pose: [{y} * Math.PI / 180, 0.07] }}).mount(document.getElementById('h{k}'));" for k, y in enumerate(YAWS))
HTML = f"""<!doctype html><body style="margin:0;background:#060607;white-space:nowrap">{cells}
<script>{(ROOT / 'louis-data.js').read_text()}</script><script>{(ROOT / 'louis.js').read_text()}</script><script>{mounts}</script>"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    pg = b.new_page(viewport={"width": W * len(YAWS), "height": H}, device_scale_factor=1.5, reduced_motion="reduce")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.set_content(HTML); pg.wait_for_timeout(1500)
    print("live:", pg.evaluate(f"[{','.join(f'L{k}.live' for k in range(len(YAWS)))}]"), "count:", pg.evaluate("L0.count"), "errors:", errs)
    out = ROOT / f"shots/r23-louis-poses{'-' + TAG if TAG else ''}{'-low' if LOW else ''}.png"
    pg.screenshot(path=str(out)); print(out)
    b.close()
