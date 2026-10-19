/* Louis — scanline portrait (INSTRUCTIONS §4.2 option A). r11: drawn from a low-res light/zone field
   extracted offline from the approved front reference (scripts/louis_extract.py → louis-data.js).
   2D canvas only: each scanline is a ribbon whose thickness carries the light (engraving style), lifted
   slightly by a soft relief and occluding the rows behind it. No WebGL, no 3D models, no photo pixels.
   r17: the old voice-level motion (mouth bar, level sweep) is gone. The hero portrait now moves in the same wave
   as the WebGL field (fx3d.js): one shared clock and wave (window.FX_WAVE, below) drive both from a single rAF,
   and a crest is computed from the same screen position, so it passes through the face and the field together.
   Interface: mount / setState / dock / destroy.
   r12: hardened for real phones — the backing store is capped (DPR ≤ 2 and a total pixel budget, well under
   iOS's canvas memory limits), every draw is guarded, and the host only drops its static fallback portrait
   (CSS, louis-fallback.png) once a frame has really drawn pixels (.is-live). Any failure → .is-fallback. */
(function () {
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  // cheap deterministic value noise for "signal" grain on the lines
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const noise1 = (x) => { const i = Math.floor(x), f = x - i; const a = hash(i), b = hash(i + 1); return a + (b - a) * f * f * (3 - 2 * f); };

  // ---- r17: shared wave clock (hero portrait + WebGL field) ----
  // One rAF advances t / phase / pointer / scroll and calls every subscriber (fx3d's draw, each running portrait).
  // The wave is measured in the frame of the field canvas (#fx3d): x 0..1 across it, u 0..1 down it. A crest band
  // travels down the screen; the pointer raises a local swell; scrolling the hero away speeds it up and lifts it.
  // fx3d.js mirrors at() in GLSL, so both draw the same crest at the same place. `on` is true only while the WebGL
  // field runs (fx=2d / reduced motion → no wave); `scale` and `fps` drop on the low tier.
  const W = window.FX_WAVE = {
    t: 0, freq: 1.6, amp: 1, speed: 0.2, phase: 0, bend: 0.35,
    pointer: { x: 0.5, y: 0.5, k: 0 }, scroll: 0,
    on: false, scale: 1, fps: 60, aspect: 1.6, box: null,
    subs: new Set(),
    at(x, u) {
      const s = 0.5 + 0.5 * Math.sin(6.2832 * this.freq * u - this.phase + this.bend * Math.sin(x * 5 + this.t * 0.4));
      const p = this.pointer; let b = 0;
      if (p.k > 0.01) { const dx = (x - p.x) * this.aspect, du = u - p.y; b = p.k * Math.exp(-(dx * dx + du * du) / 0.01); }
      return this.scale * this.amp * ((1 + 0.6 * this.scroll) * s * s * s + 0.7 * b);
    },
    sub(fn) { this.subs.add(fn); kick(); },
    unsub(fn) { this.subs.delete(fn); }
  };
  let raf = 0, last = 0, prev = 0, cx = -1e4, cy = -1e4, inside = false;
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { cx = e.clientX; cy = e.clientY; inside = true; } }, { passive: true });
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) inside = false; });
  document.addEventListener("visibilitychange", () => { prev = 0; kick(); });
  function kick() { if (!raf && W.subs.size && !document.hidden) raf = requestAnimationFrame(loop); }
  function loop(now) {
    raf = 0;
    if (!W.subs.size || document.hidden) { prev = 0; return; }
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / W.fps - 2) return;
    const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0;
    prev = last = now;
    const el = document.getElementById("fx3d") || document.getElementById("top");
    const r = el ? el.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    W.box = r; W.aspect = r.width / Math.max(1, r.height);
    const hero = document.getElementById("top"), hh = (hero && hero.offsetHeight) || innerHeight;
    W.scroll = Math.min(1, Math.max(0, scrollY / hh));
    const p = W.pointer, px = (cx - r.left) / Math.max(1, r.width), py = (cy - r.top) / Math.max(1, r.height);
    const inBox = inside && px >= 0 && px <= 1 && py >= 0 && py <= 1;
    if (inBox) { p.x += (px - p.x) * 0.08; p.y += (py - p.y) * 0.08; }
    p.k += ((inBox ? 1 : 0) - p.k) * 0.05;
    W.t += dt;
    W.phase = (W.phase + 6.2832 * W.speed * (1 + W.scroll) * dt) % 6.2832;
    W.subs.forEach((fn) => { try { fn(now); } catch (e) { W.subs.delete(fn); } });
  }

  // ---- field: decode once, shared by every instance ----
  // zone 0 background · 1 skin · 2 hair · 3 sweater · 4 collar rib; lev 0..1 light; rel 0..1 soft relief
  let FIELD = null;
  function field() {
    if (FIELD) return FIELD;
    const D = window.LOUIS_DATA;
    const C = D.cols, R = D.rows, n = C * R, raw = atob(D.d);
    const zone = new Uint8Array(n), lev = new Float32Array(n), rel = new Float32Array(n);
    for (let k = 0; k < n; k++) { const b = raw.charCodeAt(k); zone[k] = b >> 4; lev[k] = (b & 15) / 15; }
    // relief = blurred figure mask (a soft dome) + a little blurred light, so the lines bow over the head
    const depth = [0, 1, 0.85, 0.45, 0.6];
    for (let k = 0; k < n; k++) rel[k] = depth[zone[k]] * (0.75 + 0.25 * lev[k]);
    const tmp = new Float32Array(n);
    for (let pass = 0; pass < 4; pass++) {
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        let s = 0, c = 0;
        for (let d = -2; d <= 2; d++) { const xx = x + d; if (xx >= 0 && xx < C) { s += rel[y * C + xx]; c++; } }
        tmp[y * C + x] = s / c;
      }
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        let s = 0, c = 0;
        for (let d = -2; d <= 2; d++) { const yy = y + d; if (yy >= 0 && yy < R) { s += tmp[yy * C + x]; c++; } }
        rel[y * C + x] = s / c;
      }
    }
    FIELD = { C, R, zone, lev, rel, aspect: D.aspect, A: D.anchors };
    return FIELD;
  }
  const F = { lev: 0, rel: 0, zone: 0 };
  function sample(fd, x, y) {                       // x, y in 0..1 over the portrait; bilinear light/relief, nearest zone
    const { C, R } = fd;
    if (x < 0 || x > 1 || y < 0 || y > 1) { F.lev = 0; F.rel = 0; F.zone = 0; return F; }
    const fx = x * (C - 1), fy = y * (R - 1), x0 = fx | 0, y0 = fy | 0, x1 = Math.min(C - 1, x0 + 1), y1 = Math.min(R - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const a = y0 * C, b = y1 * C;
    const bl = (arr) => (arr[a + x0] * (1 - tx) + arr[a + x1] * tx) * (1 - ty) + (arr[b + x0] * (1 - tx) + arr[b + x1] * tx) * ty;
    F.lev = bl(fd.lev); F.rel = bl(fd.rel);
    F.zone = fd.zone[(fy + 0.5 | 0) * C + (fx + 0.5 | 0)];
    return F;
  }

  class Louis {
    constructor(opts = {}) {
      this.o = Object.assign({
        lines: 96, samples: 200, bg: "#060607", fps: 60,
        colorA: [150, 232, 255], colorB: [185, 166, 255], sweater: [92, 178, 128],
        relief: 1.4, fill: 0.98, interactive: true, glitch: true, mini: false, wave: false
      }, opts);
      this.state = "idle";
      this.mouse = { x: 0, y: 0, k: 0, px: 0, py: 0 };
      this.glitchUntil = 0; this.nextGlitch = performance.now() + 5000;
      this.slice = null; this.running = false; this.last = 0;
      this.reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      this.failed = false; this.live = false;
    }
    mount(el) {
      this.el = el;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      try {
        this.fd = field();
        this.c = document.createElement("canvas");
        this.c.setAttribute("aria-hidden", "true");
        el.appendChild(this.c);
        this.ctx = this.c.getContext("2d");
        if (!this.ctx) throw new Error("no 2d context");
      } catch (e) { this.fail(); return this; }
      if (window.ResizeObserver) { this.ro = new ResizeObserver(this.resize); this.ro.observe(el); }
      else window.addEventListener("resize", this.resize);
      if (this.o.interactive) {
        this.onMove = (e) => {
          const r = this.c.getBoundingClientRect();
          this.mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          this.mouse.y = ((e.clientY - r.top) / r.height) * 2 - 1;
        };
        window.addEventListener("pointermove", this.onMove, { passive: true });
      }
      if (window.IntersectionObserver) {
        this.io = new IntersectionObserver((ens) => { ens[0].isIntersecting ? this.start() : this.stop(); });
        this.io.observe(el);
      } else this.start();
      this.resize();
      return this;
    }
    resize() {
      if (this.failed) return;
      try {
        const r = this.el.getBoundingClientRect();
        this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
        // backing store: DPR ≤ 2, and ≤ ~2.4M device pixels per canvas (phones at DPR 3 used to ask for far more)
        let dpr = Math.min(2, window.devicePixelRatio || 1);
        const budget = this.o.mini ? 0.2e6 : 2.4e6;
        if (this.w * this.h * dpr * dpr > budget) dpr = Math.max(1, Math.sqrt(budget / (this.w * this.h)));
        this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
        this.c.style.width = this.w + "px"; this.c.style.height = this.h + "px";
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.dpr = dpr; this.live = false;          // re-verify after a resize (the store was reallocated)
      } catch (e) { this.fail(); return; }
      if (this.reduced || !this.running) this.paint(performance.now());
    }
    // guarded draw: an exception, or a frame that leaves the canvas empty, switches to the static portrait
    paint(now) {
      if (this.failed) return;
      try {
        this.draw(now);
        if (!this.live && this.w > 8 && this.h > 8) this.verify();
      } catch (e) { this.fail(); }
    }
    verify() {
      // read back a small patch over the face; an all-transparent patch means the store was refused or cleared
      const d = this.dpr || 1, ph = Math.min(this.h * this.o.fill, this.w / this.fd.aspect);
      const x = Math.max(0, Math.round((this.w / 2 - ph * 0.15) * d)), y = Math.max(0, Math.round((this.h - ph * 0.62) * d));
      const sw = Math.max(1, Math.round(ph * 0.3 * d)), sh = Math.max(1, Math.round(ph * 0.3 * d));
      const px = this.ctx.getImageData(x, y, Math.min(sw, this.c.width - x), Math.min(sh, this.c.height - y)).data;
      let hit = 0;
      for (let k = 3; k < px.length; k += 16) if (px[k] > 8 && ++hit > 4) break;
      if (hit > 4) { this.live = true; this.el.classList.add("is-live"); this.el.classList.remove("is-fallback"); }
      else this.fail();
    }
    fail() {
      this.failed = true; this.running = false;
      if (this.el) { this.el.classList.remove("is-live"); this.el.classList.add("is-fallback"); }
      if (this.c) { this.c.width = this.c.height = 0; }  // hand the memory back
    }
    setState(s) { this.state = s; if (s === "react") this.glitchUntil = performance.now() + 140; }
    dock(on) { this.el.classList.toggle("is-docked", !!on); }
    // r17: no rAF of its own; a running portrait subscribes to the shared clock (paused off screen / tab hidden)
    start() { if (this.failed) return; if (this.running || this.reduced) { this.paint(performance.now()); return; } this.running = true; W.sub(this.tick); }
    stop() { this.running = false; W.unsub(this.tick); }
    destroy() { this.stop(); this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); window.removeEventListener("pointermove", this.onMove); window.removeEventListener("resize", this.resize); this.c && this.c.remove(); }
    tick(now) {
      if (!this.running || this.failed) return;
      if (now - this.last >= 1000 / this.o.fps - 2) { this.last = now; this.paint(now); }
    }
    draw(now) {
      const { ctx, w, h, o, fd } = this;
      const t = this.o.wave ? W.t : now / 1000;
      // glitch scheduler, kept quiet: one short cut every 5–11 s, small offset
      if (o.glitch && !this.reduced && now > this.nextGlitch) {
        this.glitchUntil = now + 70 + Math.random() * 50;
        this.slice = { a: Math.random() * 0.8, b: 0.04 + Math.random() * 0.08, dx: (Math.random() - 0.5) * 0.035 };
        this.nextGlitch = now + 5000 + Math.random() * 6000;
      }
      const glitching = now < this.glitchUntil;
      // cursor: proximity (jitter) + eased parallax (2.5D: near layers shift more than the sweater)
      const m = this.mouse;
      const near = Math.max(0, 1 - Math.hypot(m.x, m.y * 0.8) / 1.4);
      m.k += (near - m.k) * 0.08;
      const tx = this.reduced ? 0 : Math.max(-1, Math.min(1, m.x)), ty = this.reduced ? 0 : Math.max(-1, Math.min(1, m.y));
      m.px += (tx - m.px) * 0.06; m.py += (ty - m.py) * 0.06;
      if (o.interactive && this.el.parentElement) { const st = this.el.parentElement.style; st.setProperty("--lx", m.px.toFixed(3)); st.setProperty("--ly", m.py.toFixed(3)); }

      ctx.clearRect(0, 0, w, h);
      // portrait box: keep the reference aspect, fit the host height (or width on narrow hosts)
      const ph = Math.min(h * o.fill, w / fd.aspect), pw = ph * fd.aspect;
      const px0 = (w - pw) / 2, py0 = h - ph;
      const N = o.lines, S = o.samples, gap = ph / N;
      const amp = gap * o.relief;
      const [ar, ag, ab] = o.colorA, [br, bg_, bb] = o.colorB, [sr, sg_, sb] = o.sweater;
      const A = fd.A;
      // r17: the shared wave, sampled at this canvas's position inside the field's frame (hero portrait only)
      const waving = o.wave && W.on && !this.reduced && W.box && W.box.width > 0;
      let wx0 = 0, wxs = 0, wu0 = 0, wus = 0;
      if (waving) {
        const hr = this.el.getBoundingClientRect(), B = W.box;
        wx0 = (hr.left - B.left) / B.width; wxs = 1 / B.width; wu0 = (hr.top - B.top) / B.height; wus = 1 / B.height;
      }
      const lift = gap * 1.4;
      // ribbon thickness from light: a hairline for shadow, up to ~0.8 of the row gap for highlights
      const thin = o.mini ? 0.35 : 0.45, thick = gap * (o.mini ? 0.95 : 0.78);
      if (!this.buf || this.buf.length !== (S + 1) * 4) { this.buf = new Float32Array((S + 1) * 4); this.pz = new Uint8Array(S + 1); }
      const P = this.buf, Z = this.pz;   // per sample: x, centre y, half thickness, light
      // fill the ribbon over runs of samples whose zone passes `keep`
      const ribbon = (keep, minHalf) => {
        ctx.beginPath();
        let s = 0;
        while (s <= S) {
          if (!keep(Z[s])) { s++; continue; }
          const a = Math.max(0, s - 1); let e = s;
          while (e < S && keep(Z[e + 1])) e++;
          const b = Math.min(S, e + 1);
          ctx.moveTo(P[a * 4], P[a * 4 + 1] - Math.max(minHalf, P[a * 4 + 2]));
          for (let q = a + 1; q <= b; q++) ctx.lineTo(P[q * 4], P[q * 4 + 1] - Math.max(minHalf, P[q * 4 + 2]));
          for (let q = b; q >= a; q--) ctx.lineTo(P[q * 4], P[q * 4 + 1] + Math.max(minHalf, P[q * 4 + 2]));
          ctx.closePath();
          s = b + 1;
        }
      };
      const grad = ctx.createLinearGradient(px0, 0, px0 + pw, 0);
      grad.addColorStop(0, `rgb(${ar},${ag},${ab})`);
      grad.addColorStop(0.5, `rgb(${(ar * 2 + br) / 3 | 0},${(ag * 2 + bg_) / 3 | 0},${(ab * 2 + bb) / 3 | 0})`);
      grad.addColorStop(1, `rgb(${br},${bg_},${bb})`);
      const bgGrad = ctx.createLinearGradient(0, 0, w, 0);
      bgGrad.addColorStop(0, `rgba(${ar},${ag},${ab},0)`);
      bgGrad.addColorStop(0.5, `rgba(${(ar + br) >> 1},${(ag + bg_) >> 1},${(ab + bb) >> 1},0.16)`);
      bgGrad.addColorStop(1, `rgba(${br},${bg_},${bb},0)`);

      const passes = glitching ? [[-1, "rgba(255,70,110,0.5)"], [1, "rgba(80,200,255,0.5)"], [0, null]] : [[0, null]];
      for (const [shift, tint] of passes) {
        for (let i = 0; i < N; i++) {
          const fy = (i + 0.5) / N;
          const y0 = py0 + fy * ph;
          let dx = 0;
          if (glitching && this.slice && fy > this.slice.a && fy < this.slice.a + this.slice.b) dx = this.slice.dx * pw;
          dx += shift * 2;
          const wu = wu0 + y0 * wus;
          let any = false, hasHair = false, hasSweater = false, wsum = 0;
          for (let s = 0; s <= S; s++) {
            const xs = -0.4 + (1.8 * s) / S;                   // samples run past the portrait so the background rows stay continuous
            const f = sample(fd, xs, fy);
            const z = f.zone;
            // 2.5D: the head sits nearer than the sweater → shifts more with the cursor
            const par = (z === 1 || z === 2 ? 1 : z ? 0.45 : 0.15);
            let hv = f.rel;
            hv += (noise1(s * 0.35 + i * 7.3 + t * 2.2) - 0.5) * 0.04 * (z ? 1 : 0.5);
            if (z === 2) hv += (hash(s * 1.7 + i * 31) - 0.5) * 0.12;                       // crew-cut bristle
            if (m.k > 0.01 && z) hv += 0.25 * m.k * Math.exp(-(((xs * 2 - 1) - m.x) ** 2) / 0.02 - ((fy * 2 - 1 - m.y) ** 2) / 0.006) * Math.sin(t * 9 + s * 0.6);
            let li = f.lev;
            P[s * 4] = px0 + xs * pw + dx + (m.px * par * gap * 1.6);
            P[s * 4 + 1] = y0 - hv * amp + m.py * par * gap * 0.8;
            if (waving) {
              const wv = W.at(wx0 + P[s * 4] * wxs, wu);
              P[s * 4 + 1] -= wv * lift; wsum += wv;
              if (z === 1) li = Math.min(1, li + wv * 0.12);
            }
            P[s * 4 + 2] = z === 2 ? (0.5 + li * thick * 0.35 * hash(s * 3.1 + i * 17)) / 2                          // hair: thin, ragged
              : z === 3 ? (thin + (0.2 + 0.6 * li) * thick * (0.55 + 0.45 * Math.abs(Math.sin(xs * 70 + (i & 1) * 1.57)))) / 2  // knit: a chain of stitches
              : z === 4 ? (thin + thick * (0.25 + 0.45 * Math.abs(Math.sin(xs * 150)))) / 2                                     // collar rib
              : z ? (thin + Math.pow(li, 1.6) * (thick - thin)) / 2 : 0.3;
            P[s * 4 + 3] = li;
            Z[s] = z;
            if (z) any = true;
            if (z === 2) hasHair = true;
            if (z >= 3) hasSweater = true;
          }
          if (shift !== 0) {
            if (!any) continue;
            ctx.fillStyle = tint; ribbon((z) => z !== 0, 0.4); ctx.fill();
            continue;
          }
          // occlude: erase whatever earlier rows drew below this one (keeps the canvas transparent)
          ctx.beginPath(); ctx.moveTo(P[0], P[1] - P[2]);
          for (let s = 1; s <= S; s++) ctx.lineTo(P[s * 4], P[s * 4 + 1] - P[s * 4 + 2]);
          ctx.lineTo(P[S * 4], h + 2); ctx.lineTo(P[0], h + 2); ctx.closePath();
          ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "#000"; ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          // the bottom rows fade out; on the hero (r17) they dissolve fully into the WebGL field below
          const fade = o.mini ? 1 : o.wave ? 1 - smooth(0.68, 1, fy) : 1 - 0.7 * smooth(0.86, 1, fy);
          // background: one faint hairline per row, the scanline field the figure rises out of (brighter in a crest)
          if (!o.mini) {
            ctx.globalAlpha = Math.min(1, fade * (0.8 + 0.9 * wsum / (S + 1)));
            ctx.beginPath(); ctx.moveTo(P[0], P[1]);
            for (let s = 1; s <= S; s++) ctx.lineTo(P[s * 4], P[s * 4 + 1]);
            ctx.strokeStyle = bgGrad; ctx.lineWidth = 0.8; ctx.stroke();
          }
          if (!any) { ctx.globalAlpha = 1; continue; }
          // skin: site cyan → violet; thickness = light, and three intensity tiers so shadows also go dim
          ctx.fillStyle = grad;
          for (let tier = 0; tier < 3; tier++) {
            const lo = tier === 0 ? -1 : tier === 1 ? 0.33 : 0.66, hi = tier === 0 ? 0.33 : tier === 1 ? 0.66 : 2;
            for (let s = 0; s <= S; s++) if (Z[s] === 1 || Z[s] === 9) Z[s] = P[s * 4 + 3] >= lo && P[s * 4 + 3] < hi ? 9 : 1;
            ctx.globalAlpha = fade * (tier === 0 ? 0.55 : tier === 1 ? 0.82 : 1);
            ribbon((z) => z === 9, 0.25); ctx.fill();
          }
          for (let s = 0; s <= S; s++) if (Z[s] === 9) Z[s] = 1;
          // hair: dark crew cut = a thin, dim, bristly line so the head keeps its square silhouette
          if (hasHair) {
            // hair: black crew cut = a darker slate line with bristle, so the straight hairline reads against the bright forehead
            ctx.globalAlpha = fade; ctx.fillStyle = `rgba(${(ar + br) * 0.27 | 0},${(ag + bg_) * 0.28 | 0},${(ab + bb) * 0.32 | 0},${o.mini ? 0.95 : 0.9})`;
            ribbon((z) => z === 2, 0.4); ctx.fill();
            // bristles: short strokes standing up out of the hair rows (spiky crew-cut texture and top edge)
            if (!o.mini) {
              ctx.beginPath();
              for (let s = 1; s < S; s++) if (Z[s] === 2 && hash(s * 7.7 + i * 13.1) > 0.84) {
                const lean = (hash(s * 2.3 + i) - 0.5) * gap * 0.9;
                ctx.moveTo(P[s * 4], P[s * 4 + 1]); ctx.lineTo(P[s * 4] + lean, P[s * 4 + 1] - gap * (0.8 + hash(s + i * 5.3) * 0.9));
              }
              ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8; ctx.globalAlpha = fade * 0.8; ctx.stroke(); ctx.globalAlpha = fade;
            }
            ctx.fillStyle = grad;
          }
          if (hasSweater) {
            // sweater: dark green knit; the collar rib a touch brighter
            ctx.globalAlpha = fade;
            const sw = ctx.createLinearGradient(px0, 0, px0 + pw, 0), sa = o.mini ? 0.9 : 0.6;
            sw.addColorStop(0, `rgba(${sr},${sg_},${sb},0)`); sw.addColorStop(0.16, `rgba(${sr},${sg_},${sb},${sa})`);
            sw.addColorStop(0.84, `rgba(${sr},${sg_},${sb},${sa})`); sw.addColorStop(1, `rgba(${sr},${sg_},${sb},0)`);
            ctx.fillStyle = sw; ribbon((z) => z === 3, 0.4); ctx.fill();
            ctx.fillStyle = `rgba(${(sr * 4 + 255) / 5 | 0},${(sg_ * 4 + 255) / 5 | 0},${(sb * 4 + 255) / 5 | 0},${o.mini ? 0.9 : 0.7})`; ribbon((z) => z === 4, 0.5); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
      if (!o.mini) {
        // marks from the reference, placed on the relief: the small dark points (lower cheek, neck) as holes in the ribbons.
        // r14B: no scar stroke and no forehead point by the left brow (screen right): the brows are just what the
        // scanlines draw from the light field, soft and unbroken
        const at = (x, y) => {
          const X = px0 + x * pw + m.px * gap * 1.6, Y = py0 + y * ph;
          return [X, Y - sample(fd, x, y).rel * amp + m.py * gap * 0.8 - (waving ? W.at(wx0 + X * wxs, wu0 + Y * wus) * lift : 0)];
        };
        ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "#000";
        for (const d of A.dots) { if (d[1] < 0.4) continue; const q = at(d[0], d[1]); ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(1.2, gap * 0.42), 0, Math.PI * 2); ctx.fill(); }
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }
  window.Louis = Louis;
})();
