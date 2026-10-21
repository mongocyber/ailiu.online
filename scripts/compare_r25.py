"""r25: the likeness comparison for the deliverables — the two references (chosen-front.png, 01_front.png), then the hero
close-ups of r23 (triangle edges), r24 (uniform grid) and r25 (denser face grid, mid-scale cavity, silhouette, fade),
full and as face crops, labelled → r25-compare.png.
Usage: python3 scripts/compare_r25.py   (after scripts/deliver_r25.py zh --copy)"""
from PIL import Image, ImageDraw
D = "/workspace/deliverables/"
S = D + "ailiu-preview-v2-shots/"
REFS = [(D + "louis-mj-test/chosen-front.png", "ref · chosen-front"), (D + "louis-refs/github/01_front.png", "ref · 01_front")]
VERS = [(S + "r23-louis-closeup.png", "r23 · triangle edges"), (S + "r24-louis-closeup.png", "r24 · uniform grid"),
        (S + "r25-louis-closeup.png", "r25 · dense face grid + cavity + silhouette")]
H, CROP = 900, (330, 330, 1010, 1100)          # the face in the 1338 × 1548 hero close-ups
rows = []
for full in (True, False):
    ims = []
    for p, label in REFS + VERS:
        im = Image.open(p).convert("RGB")
        if not full: im = im.crop(CROP if "closeup" in p else ((70, 50, 185, 180) if "chosen" in p else (230, 230, 860, 1000)))
        im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
        ImageDraw.Draw(im).text((14, 12), label, fill=(235, 235, 235))
        ims.append(im)
    row = Image.new("RGB", (sum(i.width for i in ims) + 12 * (len(ims) - 1), H), (24, 24, 26)); x = 0
    for i in ims: row.paste(i, (x, 0)); x += i.width + 12
    rows.append(row)
W = max(r.width for r in rows)
out = Image.new("RGB", (W, H * 2 + 12), (24, 24, 26))
out.paste(rows[0], (0, 0)); out.paste(rows[1], (0, H + 12))
out.save(S + "r25-compare.png"); print(S + "r25-compare.png", out.size)
