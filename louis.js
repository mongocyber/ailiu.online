/* Louis — procedural outline avatar (INSTRUCTIONS §4.2 option A).
   2D canvas only: a frontal face expressed as a heightfield, drawn as stacked
   occluding scanlines ("ridgeline portrait"). No WebGL, no 3D models.
   The mouth is replaced by a voice bar driven by --louis-level (setLevel).
   Fixed interface: mount / setState / setLevel / dock / destroy. */
(function () {
  const TAU = Math.PI * 2;
  const g = (u, v, cx, cy, sx, sy) => {
    const dx = (u - cx) / sx, dy = (v - cy) / sy;
    return Math.exp(-0.5 * (dx * dx + dy * dy));
  };
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // cheap deterministic value noise for "signal" grain on the lines
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i; const a = hash(i), b = hash(i + 1); return a + (b - a) * f * f * (3 - 2 * f); };

  function face(u, v, mouth, t) {
    // u: -1..1 (left/right), v: -1..1 (top/bottom)
    const hx = u / 0.54, hy = (v + 0.12) / 0.7;
    const r = Math.sqrt(hx * hx + hy * hy);
    const head = smooth(1.02, 0.78, r);
    const dome = Math.sqrt(Math.max(0, 1 - Math.min(1, r * r))) * 0.42;
    let h = dome;
    h += 0.12 * g(u, v, 0, -0.27, 0.34, 0.06);                                // brow
    h -= 0.16 * (g(u, v, -0.18, -0.14, 0.085, 0.05) + g(u, v, 0.18, -0.14, 0.085, 0.05)); // eye sockets
    h += 0.26 * g(u, v, 0, 0.0, 0.045, 0.15);                               // nose bridge
    h += 0.14 * g(u, v, 0, 0.16, 0.085, 0.05);                               // nose tip
    h += 0.07 * (g(u, v, -0.3, 0.08, 0.1, 0.12) + g(u, v, 0.3, 0.08, 0.1, 0.12)); // cheekbones
    h += 0.1 * g(u, v, 0, 0.5, 0.15, 0.07);                                  // chin
    // voice bar instead of lips (§4.2: hide the mouth, show the signal)
    const band = g(u, v, 0, 0.33, 0.17, 0.028);
    h += band * (0.025 + mouth * 0.16 * (0.55 + 0.45 * Math.sin(u * 46 + t * 18)) * (0.6 + 0.4 * Math.sin(u * 13 - t * 7)));
    h *= head;
    // neck + shoulders
    const neck = smooth(0.26, 0.1, Math.abs(u)) * smooth(0.45, 0.66, v) * 0.16;
    const sh = smooth(0.7, 1.05, v) * smooth(1.05, 0.2, Math.abs(u)) * 0.2;
    const m = Math.max(neck, sh);
    return h + m * (1 - smooth(0.0, 0.25, h));
  }

  class Louis {
    constructor(opts = {}) {
      this.o = Object.assign({
        lines: 54, samples: 150, bg: "#060607", fps: 60,
        colorA: [150, 232, 255], colorB: [185, 166, 255],
        amp: 0.3, interactive: true, glitch: true, mini: false
      }, opts);
      this.level = 0; this.lvl = 0; this.state = "idle";
      this.mouse = { x: -9, y: -9, k: 0 };
      this.glitchUntil = 0; this.nextGlitch = performance.now() + 2600;
      this.slice = null; this.running = false; this.last = 0;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    mount(el) {
      this.el = el;
      this.c = document.createElement("canvas");
      this.c.setAttribute("aria-hidden", "true");
      el.appendChild(this.c);
      this.ctx = this.c.getContext("2d");
      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.ro = new ResizeObserver(this.resize); this.ro.observe(el);
      if (this.o.interactive) {
        this.onMove = (e) => {
          const r = this.c.getBoundingClientRect();
          this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          this.mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        };
        window.addEventListener("pointermove", this.onMove, { passive: true });
      }
      this.io = new IntersectionObserver(([en]) => { en.isIntersecting ? this.start() : this.stop(); });
      this.io.observe(el);
      this.resize();
      return this;
    }
    resize() {
      const r = this.el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
      this.c.style.width = this.w + "px"; this.c.style.height = this.h + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.reduced || !this.running) this.draw(performance.now());
    }
    setState(s) { this.state = s; if (s === "react") this.glitchUntil = performance.now() + 140; }
    setLevel(x) { this.level = Math.max(0, Math.min(1, x)); }
    dock(on) { this.el.classList.toggle("is-docked", !!on); }
    start() { if (this.running || this.reduced) { this.draw(performance.now()); return; } this.running = true; requestAnimationFrame(this.frame); }
    stop() { this.running = false; }
    destroy() { this.stop(); this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); window.removeEventListener("pointermove", this.onMove); this.c.remove(); }
    frame(now) {
      if (!this.running) return;
      if (document.hidden) { requestAnimationFrame(this.frame); return; }
      const minDt = 1000 / this.o.fps;
      if (now - this.last >= minDt - 1) { this.last = now; this.draw(now); }
      requestAnimationFrame(this.frame);
    }
    draw(now) {
      const { ctx, w, h, o } = this;
      const t = now / 1000;
      // attack 40ms / release 180ms smoothing (§4.3)
      const target = this.level;
      const k = target > this.lvl ? 0.55 : 0.12;
      this.lvl += (target - this.lvl) * k;
      const lvl = this.lvl;
      document.documentElement.style.setProperty("--louis-level", lvl.toFixed(3));
      // glitch scheduler: one cut <=160ms, never faster than 3Hz
      if (o.glitch && !this.reduced && now > this.nextGlitch) {
        this.glitchUntil = now + 90 + Math.random() * 60;
        this.slice = { a: Math.random() * 0.8, b: 0.06 + Math.random() * 0.12, dx: (Math.random() - 0.5) * 0.09 };
        this.nextGlitch = now + 2200 + Math.random() * 3800 - lvl * 1200;
      }
      const glitching = now < this.glitchUntil;
      // cursor proximity (eased)
      const m = this.mouse;
      const near = Math.max(0, 1 - Math.hypot(m.x, m.y * 0.8) / 1.4);
      m.k += (near - m.k) * 0.08;

      ctx.clearRect(0, 0, w, h);
      const N = o.lines, S = o.samples;
      const size = Math.min(w, h * 0.92);
      const ox = (w - size) / 2, top = h * 0.12, gap = (h * 0.86) / N;
      const amp = size * o.amp * (1 + lvl * 0.06);
      const [ar, ag, ab] = o.colorA, [br, bg_, bb] = o.colorB;

      const passes = glitching ? [[-1, "rgba(255,70,110,"], [1, "rgba(80,200,255,"], [0, null]] : [[0, null]];
      for (const [shift, tint] of passes) {
        for (let i = 0; i < N; i++) {
          const v = -1 + (2 * i) / (N - 1);
          const y0 = top + i * gap;
          let dx = 0;
          if (glitching && this.slice && (i / N) > this.slice.a && (i / N) < this.slice.a + this.slice.b) dx = this.slice.dx * size;
          dx += shift * (2 + lvl * 4);
          ctx.beginPath();
          let maxH = 0;
          for (let s = 0; s <= S; s++) {
            const u = -1.25 + (2.5 * s) / S;
            let hv = face(u, v, Math.max(lvl, this.state === "talk" ? 0.15 : 0), t);
            // signal grain + cursor jitter near the outline
            hv += (noise1(s * 0.35 + i * 7.3 + t * 2.2) - 0.5) * (0.012 + lvl * 0.03) * (hv > 0.05 ? 1 : 0.4);
            if (m.k > 0.01) hv += 0.05 * m.k * g(u, v, m.x * 1.25, m.y, 0.16, 0.08) * Math.sin(t * 9 + s * 0.6);
            if (hv > maxH) maxH = hv;
            const x = ox + ((u + 1.25) / 2.5) * size + dx;
            const y = y0 - hv * amp;
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          if (shift === 0) {
            // occlude everything behind this line
            // occlude: erase whatever earlier lines drew below this one (keeps the canvas transparent)
            ctx.lineTo(ox + size + dx, h + 2); ctx.lineTo(ox + dx, h + 2); ctx.closePath();
            ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "#000"; ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            const grad = ctx.createLinearGradient(ox, 0, ox + size, 0);
            const a = 0.22 + Math.min(0.78, maxH * 1.4);
            grad.addColorStop(0, `rgba(${ar},${ag},${ab},0)`);
            grad.addColorStop(0.18, `rgba(${ar},${ag},${ab},${a * 0.5})`);
            grad.addColorStop(0.5, `rgba(${(ar + br) >> 1},${(ag + bg_) >> 1},${(ab + bb) >> 1},${a})`);
            grad.addColorStop(0.82, `rgba(${br},${bg_},${bb},${a * 0.5})`);
            grad.addColorStop(1, `rgba(${br},${bg_},${bb},0)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = o.mini ? 1 : 1.15 + lvl * 0.5;
            ctx.stroke();
          } else {
            ctx.strokeStyle = tint + "0.55)"; ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
      // scanline sweep tied to level (hacker overlay)
      if (!o.mini) {
        const sy = (t * 0.18 % 1) * h;
        const sg = ctx.createRadialGradient(w / 2, sy, 0, w / 2, sy, w * 0.5);
        sg.addColorStop(0, `rgba(150,232,255,${0.035 + lvl * 0.08})`);
        sg.addColorStop(1, "rgba(150,232,255,0)");
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = sg;
        ctx.fillRect(0, sy - 1, w, 2); ctx.restore();
      }
    }
  }
  window.Louis = Louis;
})();
