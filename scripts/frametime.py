"""r19: desktop frame time in headless chromium (software GL unless the host has a GPU). Samples rAF intervals for 5 s at
the hero and mid-page, and times the work done inside the shared clock (scene draw + portrait) per frame.
Usage: python3 scripts/frametime.py [query]   (server: python3 -m http.server 8801)"""
import sys
from playwright.sync_api import sync_playwright
Q = sys.argv[1] if len(sys.argv) > 1 else ""
JS = """async (ms) => {
  const W = window.FX_WAVE, cost = [];
  const subs = [...W.subs]; subs.forEach(fn => W.unsub(fn));
  const t0 = performance.now(); let k = 0;
  const wrap = (now) => { const a = performance.now(); subs.forEach(fn => fn(now)); cost.push(performance.now() - a); };
  W.sub(wrap);
  const iv = []; let last = 0;
  await new Promise(res => { const f = (t) => { if (last) iv.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  W.unsub(wrap); subs.forEach(fn => W.sub(fn));
  const avg = a => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  return { frames: iv.length, interval: +avg(iv).toFixed(2), work: +avg(cost).toFixed(2), p95: +cost.sort((a, b) => a - b)[Math.floor(cost.length * 0.95)].toFixed(2) };
}"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--enable-gpu-rasterization", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.goto("http://localhost:8801/index.html?lang=zh" + Q); pg.wait_for_timeout(2500)
    print("renderer:", pg.evaluate("(() => { const g = document.createElement('canvas').getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; })()"))
    print("fx:", pg.evaluate("[document.documentElement.dataset.fx, document.documentElement.dataset.fxVerts]"))
    pg.mouse.move(1000, 400)
    print("hero:", pg.evaluate(JS, 5000))
    pg.evaluate("scrollTo(0, document.getElementById('work').offsetTop + 900)"); pg.wait_for_timeout(800)
    print("work:", pg.evaluate(JS, 5000))
    b.close()
