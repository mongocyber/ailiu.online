"""r11: side-by-side check — reference (left) vs the Hero render (right), same height.
Usage: python3 scripts/louis_compare.py <hero.png> <out.png>   (hero.png from louis_closeup.py)"""
import sys
from PIL import Image
REF = "/workspace/deliverables/louis-refs/github/01_front.png"
H = 900
ref = Image.open(REF).convert("RGB"); hero = Image.open(sys.argv[1]).convert("RGB")
ref = ref.resize((round(ref.width * H / ref.height), H), Image.LANCZOS)
hero = hero.resize((round(hero.width * H / hero.height), H), Image.LANCZOS)
out = Image.new("RGB", (ref.width + hero.width + 24, H), (6, 6, 7))
out.paste(ref, (0, 0)); out.paste(hero, (ref.width + 24, 0))
out.save(sys.argv[2]); print(sys.argv[2], out.size)
