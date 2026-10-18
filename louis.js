/* Louis — procedural outline avatar (INSTRUCTIONS §4.2 option A). r9: redrawn to the character sheet (see face()).
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

  // r9: Louis's character sheet as a heightfield — square crew-cut head with a flat
  // top and straight hairline, heavy straight brows (the screen-right one split by a
  // diagonal scar), narrow calm eyes, straight nose, high cheekbones, an angular jaw
  // with stubble, a thick neck and a dark-green crew-neck chunky-knit sweater.
  // face() writes into F: h = height, ink = contour emphasis (0..1),
  // zone = 0 skin/background · 1 sweater · 2 collar rib · 3 hair.
  const F = { h: 0, ink: 0, zone: 0 };
  const W = 0.66, VT = -0.8, VC = -0.3, HAIR = -0.45, BROW = -0.27, EYE = -0.13;
  function halfWidth(v) {
    if (v < VT) return 0;
    if (v < VC) { const k = (VC - v) / (VC - VT), w = W * Math.pow(Math.max(0, 1 - Math.pow(k, 6)), 1 / 6); return w < 0.3 ? 0 : w; } // flat, squarish crown (cut flat: no spike at the tip)
    if (v < 0.2) return W - 0.035 * (v - VC);                                   // straight cheeks
    const w2 = W - 0.035 * (0.2 - VC);
    if (v < 0.44) return w2 + (0.27 - w2) * ((v - 0.2) / 0.24);                  // angular jaw, straight cut
    if (v < 0.52) { const k = (v - 0.44) / 0.08; return 0.27 * Math.sqrt(Math.max(0, 1 - k * k)); } // squared chin
    return 0;
  }
  // collar curve of the crew neck (a U between the neck sides), shoulder line outside it
  const collarV = (au) => au < 0.44 ? 0.6 + 0.17 * Math.sqrt(Math.max(0, 1 - (au / 0.44) * (au / 0.44))) : 0.6;
  const shoulderV = (au) => 0.6 + 0.16 * smooth(0.4, 1.15, au) + 0.2 * smooth(1.05, 1.4, au);

  function face(u, v, mouth, t, s, i) {
    const au = Math.abs(u);
    const hw = halfWidth(v);
    const e = hw - au;                                                         // distance inside the head outline
    let h = 0, ink = 0, zone = 0;
    if (e > -0.06 && hw > 0) {
      const q = Math.min(1, au / Math.max(hw, 1e-3));
      const prof = Math.pow(Math.max(0, 1 - q * q * q * q), 0.32);              // flat plateau, steep sides = square head
      const mask = smooth(-0.06, 0.02, e);
      h = 0.34 * prof * (1 - 0.3 * smooth(0.34, 0.54, v));                       // chin settles toward the neck
      if (v < HAIR || (v < -0.1 && e < 0.08)) {                                 // crew cut + temples
        h += 0.06 + (hash(Math.floor((u + 2) * 90) + i * 31) - 0.5) * 0.012;   // bristle
        if (v > HAIR - 0.05 && v < HAIR) ink = Math.max(ink, 0.8 * smooth(0.06, 0.12, e)); // straight hairline
        zone = 3;
      }
      // straight heavy brows; screen-right brow carries a diagonal scar notch
      const bv = Math.exp(-Math.pow((v - BROW) / 0.042, 2)) * smooth(0.06, 0.11, au) * smooth(0.45, 0.37, au);
      const cut = u > 0 ? smooth(0.012, 0.03, Math.abs((u - 0.27) + 0.62 * (v - BROW))) : 1;
      h += 0.075 * bv * cut; ink = Math.max(ink, bv * cut * 1.2);
      h -= 0.07 * (1 - cut) * Math.exp(-Math.pow((v - BROW) / 0.07, 2));       // the scar dips into the skin
      // narrow, level eyes: shallow sockets + a short lid line
      const ex = au - 0.21;
      h -= 0.07 * g(ex, v, 0, EYE, 0.1, 0.045);
      const lid = Math.exp(-Math.pow((v - EYE) / 0.018, 2)) * smooth(0.085, 0.05, Math.abs(ex));
      ink = Math.max(ink, lid * 0.8);
      h += 0.24 * g(u, v, 0, -0.04, 0.04, 0.16);                                // straight nose bridge
      h += 0.11 * g(u, v, 0, 0.13, 0.07, 0.045);                                // tip + wings
      h += 0.07 * (g(u, v, -0.37, -0.02, 0.1, 0.07) + g(u, v, 0.37, -0.02, 0.1, 0.07)); // high cheekbones
      h -= 0.03 * (g(u, v, -0.33, 0.18, 0.08, 0.1) + g(u, v, 0.33, 0.18, 0.08, 0.1)); // hollow under them
      h += 0.05 * g(u, v, 0, 0.47, 0.14, 0.05);                                 // chin
      // thin lips → voice bar (§4.2: hide the mouth, show the signal)
      const band = g(u, v, 0, 0.32, 0.16, 0.022);
      h += band * (0.018 + mouth * 0.16 * (0.55 + 0.45 * Math.sin(u * 46 + t * 18)) * (0.6 + 0.4 * Math.sin(u * 13 - t * 7)));
      ink = Math.max(ink, band * smooth(0.02, 0.2, mouth) * 0.9);
      // stubble on the jaw: dense fine jitter, flickering slowly
      const stub = smooth(0.16, 0.28, v) * smooth(0.0, 0.04, e) * (1 - band);
      h += stub * (hash(s * 3.7 + i * 19 + Math.floor(t * 6)) - 0.5) * 0.034;
      h *= mask;
    }
    // thick neck, then the sweater: crew-neck rib on a U curve, chunky knit below
    const cv = collarV(au), sv = shoulderV(au);
    const neck = v < cv + 0.005 ? smooth(0.34, 0.28, au) * smooth(0.36, 0.48, v) * 0.25 : 0;
    let body = 0, bz = 1;
    const st = au < 0.44 ? cv : sv;
    if (v > st) {
      const base = 0.45 * smooth(0.6, 0.4, au);                                 // inside the U the knit starts partway up: a step down from the neck, no notch
      body = 0.22 * (base + (1 - base) * smooth(st, st + 0.09, v)) * smooth(1.45, 1.2, au) + 0.012 * Math.abs(Math.sin(u * 24 + (i % 2) * 1.6)); // chunky knit
      const rib = au < 0.5 ? smooth(0.0, 0.015, v - cv) * smooth(0.085, 0.06, v - cv) * smooth(0.5, 0.4, au) : 0;
      body += 0.06 * rib;
      if (rib > 0.5) bz = 2;
    }
    if (body > 0 && body >= h && body >= neck) { h = body; zone = bz; ink = bz === 2 ? 1 : 0; }
    else if (neck > h) { h = neck; zone = 0; ink = 0; }
    F.h = h; F.ink = ink; F.zone = zone;
    return F;
  }

  class Louis {
    constructor(opts = {}) {
      this.o = Object.assign({
        lines: 54, samples: 150, bg: "#060607", fps: 60,
        colorA: [150, 232, 255], colorB: [185, 166, 255], sweater: [92, 178, 128], zoom: 1.14, lift: 0.1,
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

      const [sr, sg_, sb] = o.sweater;
      const inkCol = `rgba(${(ar + 255 * 2) / 3 | 0},${(ag + 255 * 2) / 3 | 0},${(ab + 255 * 2) / 3 | 0},`;
      // keep the head's proportions on tall hosts (wild-louis): rows spread over 0.86h, columns over size
      const kv = Math.max(1, (0.43 * h) / (0.4 * size * 1.17));
      const mouthLvl = Math.max(lvl, this.state === "talk" ? 0.15 : 0);
      if (!this.px || this.px.length !== (S + 1) * 2) { this.px = new Float32Array((S + 1) * 2); this.pi = new Float32Array(S + 1); this.pz = new Uint8Array(S + 1); }
      const P = this.px, I = this.pi, Z = this.pz;
      // stroke the runs of samples that pass `keep` (each run starts one sample early so runs join up)
      const runs = (keep) => {
        ctx.beginPath(); let on = false;
        for (let s = 0; s <= S; s++) {
          if (keep(s)) { if (!on) { const p = Math.max(0, s - 1); ctx.moveTo(P[p * 2], P[p * 2 + 1]); on = true; } ctx.lineTo(P[s * 2], P[s * 2 + 1]); }
          else if (on) { ctx.lineTo(P[s * 2], P[s * 2 + 1]); on = false; }
        }
      };
      const passes = glitching ? [[-1, "rgba(255,70,110,"], [1, "rgba(80,200,255,"], [0, null]] : [[0, null]];
      for (const [shift, tint] of passes) {
        for (let i = 0; i < N; i++) {
          const v = -1 + (2 * i) / (N - 1);
          const y0 = top + i * gap;
          let dx = 0;
          if (glitching && this.slice && (i / N) > this.slice.a && (i / N) < this.slice.a + this.slice.b) dx = this.slice.dx * size;
          dx += shift * (2 + lvl * 4);
          let maxH = 0, hasSweater = false, hasInk = false;
          for (let s = 0; s <= S; s++) {
            const u = -1.25 + (2.5 * s) / S;
            const f = face(u * o.zoom, (v * o.zoom + o.lift) * kv, mouthLvl, t, s, i);
            let hv = f.h;
            // signal grain + cursor jitter near the outline
            hv += (noise1(s * 0.35 + i * 7.3 + t * 2.2) - 0.5) * (0.012 + lvl * 0.03) * (hv > 0.05 ? 1 : 0.4);
            if (m.k > 0.01) hv += 0.05 * m.k * g(u, v, m.x * 1.25, m.y, 0.16, 0.08) * Math.sin(t * 9 + s * 0.6);
            if (hv > maxH) maxH = hv;
            P[s * 2] = ox + ((u + 1.25) / 2.5) * size + dx;
            P[s * 2 + 1] = y0 - hv * amp;
            I[s] = f.ink; Z[s] = f.zone;
            if (f.zone === 1 || f.zone === 2) hasSweater = true;
            if (f.ink > 0.5) hasInk = true;
          }
          if (shift === 0) {
            // occlude: erase whatever earlier lines drew below this one (keeps the canvas transparent)
            ctx.beginPath(); ctx.moveTo(P[0], P[1]);
            for (let s = 1; s <= S; s++) ctx.lineTo(P[s * 2], P[s * 2 + 1]);
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
            const lw = o.mini ? 1 : 1.15 + lvl * 0.5;
            // the bottom rows fade out so the sweater doesn't fight the meta row under the portrait
            const fade = o.mini ? 1 : 1 - 0.75 * smooth(0.78, 1, i / (N - 1));
            ctx.globalAlpha = fade;
            ctx.strokeStyle = grad; ctx.lineWidth = lw;
            runs((s) => Z[s] === 0); ctx.stroke();
            // hair: dark crew cut = the same line at lower intensity, so the bright hairline and brows carry the face
            if (Z.includes(3)) { ctx.globalAlpha = 0.5 * fade; runs((s) => Z[s] === 3); ctx.stroke(); ctx.globalAlpha = fade; }
            if (hasSweater) {
              // sweater: green, and only every other knit row is drawn (sparser ribbing); the collar rib always
              const sparse = !o.mini && i % 2 === 1;
              ctx.strokeStyle = `rgba(${sr},${sg_},${sb},${o.mini ? 0.85 : 0.7})`; ctx.lineWidth = lw;
              runs((s) => Z[s] === 2 || (Z[s] === 1 && !sparse)); ctx.stroke();
            }
            if (hasInk) {
              // contour emphasis: hairline-to-chin features (brows, lids, jaw, collar) in a brighter, heavier line
              ctx.strokeStyle = inkCol + (o.mini ? 0.75 : 0.85) + ")"; ctx.lineWidth = o.mini ? 1.3 : 1.9 + lvl * 0.4;
              runs((s) => I[s] > 0.5); ctx.stroke();
            }
            ctx.globalAlpha = 1;
          } else {
            ctx.beginPath(); ctx.moveTo(P[0], P[1]);
            for (let s = 1; s <= S; s++) ctx.lineTo(P[s * 2], P[s * 2 + 1]);
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
