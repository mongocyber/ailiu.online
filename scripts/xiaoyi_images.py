"""r25b: build the Xiaoyi (Aunt's Home) chapter images from the old site's production files.

Source: /workspace/xiaoyi-src/*.png (read only, ~2 MB each). Picked: the shop front, menus and printed
materials, takeaway packaging. Each becomes assets/xiaoyi/<name>.webp (1000 px wide) and <name>-sm.webp
(560 px wide), each ≤ 90 KB.
Usage: python3 scripts/xiaoyi_images.py   (prints the size table used in DESIGN-NOTES)
"""
import io, os
from PIL import Image

SRC = "/workspace/xiaoyi-src"
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "xiaoyi")
PICK = {"shop": "xiaoyi-cover.png", "menu": "xiaoyi-menu-materials.png", "pack": "xiaoyi-packaging.png"}
CAP = 90_000


def encode(im, w):
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    for q in range(82, 30, -4):
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= CAP:
            return im.size, buf.getvalue(), q
    raise SystemExit(f"cannot fit {w}px under {CAP} bytes")


def main():
    os.makedirs(OUT, exist_ok=True)
    print("| file | source | size | bytes | q |")
    for name, src in PICK.items():
        im = Image.open(os.path.join(SRC, src)).convert("RGB")
        for suf, w in (("", 1000), ("-sm", 560)):
            size, data, q = encode(im, w)
            with open(os.path.join(OUT, f"{name}{suf}.webp"), "wb") as f:
                f.write(data)
            print(f"| {name}{suf}.webp | {src} | {size[0]}×{size[1]} | {len(data)} | {q} |")


if __name__ == "__main__":
    main()
