"""r20: shoot the Suikou English HTML prototype on a phone viewport and build the chapter images.

Source: /workspace/suikou-english-prototype/prototype/index.html (read only; screens switch with ?screen=).
All five screens are shot to shots/r20-proto-<screen>.png (390×844, DPR 2); the picked ones become
assets/suikou/<screen>.webp (720 px wide) and <screen>-sm.webp (400 px wide), each ≤ 80 KB.
The prototype holds mock content only (sample sentences, no names, accounts or keys); the toast is hidden.
Usage: python3 scripts/suikou_images.py   (prints the size table used in DESIGN-NOTES)
"""
import io, os
from PIL import Image
from playwright.sync_api import sync_playwright

SRC = "file:///workspace/suikou-english-prototype/prototype/index.html"
ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "assets", "suikou")
SHOTS = os.path.join(ROOT, "shots")
SCREENS = ["home", "scenes", "favorites", "card", "profile"]
PICK = ["home", "scenes", "card"]
CAP = 80_000


def encode(im, w):
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    for q in range(84, 30, -4):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= CAP:
            return im.size, buf.getvalue(), q
    raise SystemExit(f"cannot fit {w}px under {CAP} bytes")


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        for s in SCREENS:
            pg.goto(f"{SRC}?screen={s}")
            pg.add_style_tag(content=".toast{display:none!important}")
            pg.wait_for_timeout(500)
            pg.screenshot(path=os.path.join(SHOTS, f"r20-proto-{s}.png"))
        b.close()
    print("pageerrors:", errs)
    print("| file | size | bytes | q |")
    for s in PICK:
        im = Image.open(os.path.join(SHOTS, f"r20-proto-{s}.png")).convert("RGB")
        for suf, w in (("", 720), ("-sm", 400)):
            size, data, q = encode(im, w)
            with open(os.path.join(OUT, f"{s}{suf}.webp"), "wb") as f:
                f.write(data)
            print(f"| {s}{suf}.webp | {size[0]}×{size[1]} | {len(data)} | {q} |")


if __name__ == "__main__":
    main()
