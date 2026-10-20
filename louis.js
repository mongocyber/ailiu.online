/* Louis — r20C: a 3D wireframe bust (raw WebGL 1). A height field fitted to the approved front reference (scripts/louis_mesh.py →
   louis-data.js) is meshed as a regular quad grid (high 168×225, low 90×121) and drawn as hairlines plus a share of the vertices
   as points, with hidden lines removed (depth-only surface pass), brightness from a key light × albedo, a glowing back-lit rim
   and depth fog, in the scene's cool white. It turns ±6° toward the cursor and breathes slowly. r11–r19 drew a scanline
   portrait on a 2D canvas; that path is gone. WebGL missing / failing / context lost → .is-fallback (louis-fallback.png).
   History: r11 scanline portrait (INSTRUCTIONS §4.2 option A).
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

  // ---- r20C: the bust — a height field (louis-data.js, scripts/louis_mesh.py) decoded once, meshed per tier ----
  // zone 0 background · 1 skin · 2 hair · 3 sweater · 4 collar rib; albedo 0..1; depth in portrait-width units
  let FIELD = null;
  function field() {
    if (FIELD) return FIELD;
    const D = window.LOUIS_DATA;
    const C = D.cols, R = D.rows, n = C * R, raw = atob(D.d);
    const dep = new Float32Array(n), alb = new Float32Array(n), zone = new Uint8Array(n);
    for (let k = 0; k < n; k++) {
      const a = raw.charCodeAt(k * 2), b = raw.charCodeAt(k * 2 + 1);
      dep[k] = a / 255 * D.zmax; zone[k] = b >> 5; alb[k] = (b & 31) / 31;
    }
    FIELD = { C, R, dep, alb, zone, aspect: D.aspect, zmax: D.zmax };
    return FIELD;
  }
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  // a regular quad grid of NC × NR vertices over the portrait: position (x right, y up, z toward the viewer, width
  // units, origin at the picture centre), normal from the height field, and albedo / zone / random / row per vertex.
  // Index lists: triangles (depth only, for hidden lines), the grid lines, and a share of the vertices as points.
  function mesh(NC, NR) {
    const fd = field(), AY = 1 / fd.aspect, n = NC * NR;
    if (!fd.fig) { fd.fig = new Float32Array(fd.C * fd.R); for (let k = 0; k < fd.fig.length; k++) fd.fig[k] = fd.zone[k] > 0 ? 1 : 0; }
    const V = new Float32Array(n * 11), Z = new Float32Array(n), ok = new Uint8Array(n);
    const at = (arr, x, y) => {                         // bilinear over the field, x / y in 0..1
      const fx = Math.min(fd.C - 1.001, Math.max(0, x * fd.C - 0.5)), fy = Math.min(fd.R - 1.001, Math.max(0, y * fd.R - 0.5));
      const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0, a = y0 * fd.C + x0, b = a + fd.C;
      return (arr[a] * (1 - tx) + arr[a + 1] * tx) * (1 - ty) + (arr[b] * (1 - tx) + arr[b + 1] * tx) * ty;
    };
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const k = j * NC + i, u = i / (NC - 1), v = j / (NR - 1);
      const zc = fd.zone[Math.min(fd.R - 1, v * fd.R | 0) * fd.C + Math.min(fd.C - 1, u * fd.C | 0)];
      const f = at(fd.fig, u, v);                      // smooth figure mask: the outline fades instead of stepping cell by cell
      Z[k] = at(fd.dep, u, v); ok[k] = f > 0.02 ? 1 : 0;
      V.set([u - 0.5, (0.5 - v) * AY, Z[k], 0, 0, 1, at(fd.alb, u, v), zc, hash(k * 0.37 + 1.3), v, f], k * 11);
    }
    const dx = 1 / (NC - 1), dy = AY / (NR - 1);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const k = j * NC + i;
      const gx = (Z[j * NC + Math.min(NC - 1, i + 1)] - Z[j * NC + Math.max(0, i - 1)]) / (2 * dx);
      const gy = (Z[Math.max(0, j - 1) * NC + i] - Z[Math.min(NR - 1, j + 1) * NC + i]) / (2 * dy);
      const l = Math.hypot(gx, gy, 1);
      V[k * 11 + 3] = -gx / l; V[k * 11 + 4] = -gy / l; V[k * 11 + 5] = 1 / l;
    }
    const T = [], Ln = [], Pt = [];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const k = j * NC + i;
      if (!ok[k]) continue;
      if (i < NC - 1) Ln.push(k, k + 1);
      if (j < NR - 1) Ln.push(k, k + NC);
      if (i < NC - 1 && j < NR - 1) T.push(k, k + 1, k + NC, k + 1, k + NC + 1, k + NC);
      if (V[k * 11 + 8] > 0.84 && V[k * 11 + 10] > 0.5) Pt.push(k);
    }
    return { V, T: new Uint16Array(T), L: new Uint16Array(Ln), P: new Uint16Array(Pt), AY };
  }

  const VS = [
    "attribute vec3 aP, aN; attribute vec4 aM; attribute float aK;",
    "uniform mat4 uM, uP; uniform mat3 uR; uniform vec4 uW, uWP, uBox; uniform vec2 uWS; uniform float uZ, uWave, uFade, uPS, uPt, uT, uFill;",
    "varying float vA, vP;",
    // FX_WAVE.at(x, u), as in fx3d.js — uW = freq, phase, bend, t · uWP = pointer x, u, k, aspect · uWS = scale × amp, scroll
    "float wave(vec2 p){ float s = 0.5 + 0.5 * sin(6.2832 * uW.x * p.y - uW.y + uW.z * sin(p.x * 5.0 + uW.w * 0.4));",
    "  vec2 d = vec2((p.x - uWP.x) * uWP.w, p.y - uWP.y); float b = uWP.z * exp(-dot(d, d) / 0.01);",
    "  return uWS.x * ((1.0 + 0.6 * uWS.y) * s * s * s + 0.7 * b); }",
    "void main(){",
    "  vec3 n = normalize(uR * aN);",
    "  vec4 c = uP * (uM * vec4(aP, 1.0)); float w = 0.0;",
    "  if (uWave > 0.5 && c.w > 0.0) { vec2 s = vec2(0.5 + 0.5 * c.x / c.w, 0.5 - 0.5 * c.y / c.w); w = wave(vec2(uBox.x + s.x * uBox.y, uBox.z + s.y * uBox.w)); }",
    "  gl_Position = uP * (uM * vec4(aP + aN * w * 0.012, 1.0));",
    // light: a key from the upper left front, a cool back light that makes the turned-away edges glow, fog by depth
    "  float key = max(dot(n, normalize(vec3(-0.5, 0.55, 0.68))), 0.0);",
    "  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 1.7) * (0.5 + 0.5 * max(dot(n.xy, normalize(vec2(0.6, 0.5))), 0.0));",
    "  float z = aM.y, al = aM.x;",
    "  float skin = step(0.5, z) * step(z, 1.5), hair = step(1.5, z) * step(z, 2.5), knit = step(2.5, z) * step(z, 3.5), rib = step(3.5, z);",
    "  float alb = skin * mix(0.1, 1.0, al * al) + hair * (0.34 + 0.3 * al) + knit * (0.44 + 0.2 * al) + rib * 0.66;",
    "  float fog = mix(0.42, 1.0, smoothstep(0.0, uZ, aP.z));",
    "  float a = ((0.06 + 1.15 * pow(key, 1.5)) * alb + 1.1 * rim + 1.6 * aK * (1.0 - aK)) * fog * smoothstep(0.2, 0.7, aK);",   // + a glow along the outline
    "  a *= 1.0 + w * 0.7;",
    "  a *= mix(1.0 - smoothstep(0.74, 1.0, aM.w), 1.0 - smoothstep(0.66, 1.0, aM.w), uFade);",
    "  if (uPt > 0.5) a *= step(0.45, key * alb + rim) * (0.6 + 0.4 * sin(uT * (0.7 + aM.z * 1.4) + aM.z * 60.0));",
    // pass 1 (uFill): the surface as a near-black body (alpha only), so the scene behind is hidden as by a solid
    "  if (uFill > 0.5) a = 0.94 * smoothstep(0.35, 0.7, aK) * mix(1.0 - smoothstep(0.74, 1.0, aM.w), 1.0 - smoothstep(0.66, 1.0, aM.w), uFade);",
    "  vA = a; vP = uPt + 2.0 * uFill;",
    "  gl_PointSize = uPS * (1.0 + 1.3 * key);",
    "}"
  ].join("\n");
  const FS = [
    "precision mediump float;",
    "uniform float uK; varying float vA, vP;",      // vP, not uPt: a uniform in both stages must match precision
    "void main(){",
    "  if (vP > 1.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, vA); return; }",
    "  float a = vA * uK;",
    "  if (vP > 0.5) a *= smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5));",
    "  gl_FragColor = vec4(vec3(0.93, 0.94, 0.96) * a, a);",    // the scene's cool white (fx3d.js)
    "}"
  ].join("\n");

  // the same weak-device test as fx3d.js (low tier there → coarse mesh here)
  const nav = navigator, mm = (s) => !!(window.matchMedia && window.matchMedia(s).matches);
  const weak = () => /[?&]fx=low\b/.test(location.search) || document.documentElement.getAttribute("data-fx") === "webgl-low" ||
    (!/[?&]fx=high\b/.test(location.search) && (mm("(pointer: coarse)") || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory && nav.deviceMemory <= 4) || !!(nav.connection && nav.connection.saveData)));

  class Louis {
    constructor(opts = {}) {
      this.o = Object.assign({ fill: 0.98, interactive: true, wave: false, low: null, keep: false, gain: 1 }, opts);
      this.mouse = { x: 0, y: 0, px: 0, py: 0 };
      this.running = false; this.last = 0;
      this.reduced = mm("(prefers-reduced-motion: reduce)");
      this.failed = false; this.live = false;
    }
    mount(el) {
      this.el = el;
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      const low = this.o.low == null ? weak() : this.o.low;
      this.fps = low ? 30 : 60; this.maxDpr = this.o.dpr || 1.5;
      try {
        this.c = document.createElement("canvas");
        this.c.setAttribute("aria-hidden", "true");
        el.appendChild(this.c);
        const gl = this.gl = this.c.getContext("webgl", { alpha: true, antialias: !low, depth: true, stencil: false, premultipliedAlpha: true,
          preserveDrawingBuffer: !!this.o.keep, powerPreference: "low-power" });
        if (!gl) throw new Error("no webgl");
        this.setup(low ? 90 : 168, low ? 121 : 225);
      } catch (e) { this.fail(); return this; }
      this.c.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.fail(); });
      if (window.ResizeObserver) { this.ro = new ResizeObserver(this.resize); this.ro.observe(el); }
      else window.addEventListener("resize", this.resize);
      if (this.o.interactive && !this.reduced) {
        this.onMove = (e) => {
          if (e.pointerType !== "mouse") return;
          const r = this.c.getBoundingClientRect();
          this.mouse.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
          this.mouse.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
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
    setup(NC, NR) {
      const gl = this.gl;
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader");
        return s;
      };
      const pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
      gl.useProgram(pr);
      const M = mesh(NC, NR);
      this.AY = M.AY; this.grid = [NC, NR];
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, M.V, gl.STATIC_DRAW);
      [["aP", 3, 0], ["aN", 3, 12], ["aM", 4, 24], ["aK", 1, 40]].forEach(([n, k, off]) => {
        const l = gl.getAttribLocation(pr, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, k, gl.FLOAT, false, 44, off);
      });
      const ib = (a) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, a, gl.STATIC_DRAW); return [b, a.length]; };
      this.tb = ib(M.T); this.lb = ib(M.L); this.pb = ib(M.P);
      this.count = { verts: M.V.length / 11, lines: M.L.length / 2, tris: M.T.length / 3, points: M.P.length };
      this.U = {};
      ["uM", "uP", "uR", "uW", "uWP", "uBox", "uWS", "uZ", "uWave", "uFade", "uPS", "uPt", "uT", "uK", "uFill"].forEach((n) => { this.U[n] = gl.getUniformLocation(pr, n); });
      gl.uniform1f(this.U.uZ, field().zmax * 0.8);
      gl.uniform1f(this.U.uFade, this.o.wave ? 1 : 0);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      gl.clearColor(0, 0, 0, 0);
      if (gl.getError() !== gl.NO_ERROR) throw new Error("gl");
    }
    resize() {
      if (this.failed) return;
      try {
        const r = this.el.getBoundingClientRect();
        this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
        let dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1);
        if (this.w * this.h * dpr * dpr > 2.4e6) dpr = Math.max(1, Math.sqrt(2.4e6 / (this.w * this.h)));
        this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
        this.c.style.width = this.w + "px"; this.c.style.height = this.h + "px";
        this.gl.viewport(0, 0, this.c.width, this.c.height);
        this.dpr = dpr; this.live = false;          // re-verify after a resize (the store was reallocated)
      } catch (e) { this.fail(); return; }
      if (this.reduced || !this.running) this.paint(performance.now());
    }
    // guarded draw: an exception, a GL error or a frame that leaves the face empty switches to the static portrait
    paint(now) {
      if (this.failed) return;
      try {
        this.draw(now);
        if (!this.live && this.w > 8 && this.h > 8) this.verify();
      } catch (e) { this.fail(); }
    }
    verify() {
      const gl = this.gl, d = this.dpr, ph = Math.min(this.h * this.o.fill, this.w * this.AY);
      const s = Math.max(4, Math.round(ph * 0.12 * d));
      const x = Math.round((this.w / 2 - ph * 0.06) * d), y = Math.round((ph * 0.55) * d);   // GL y is up: the face, about mid-height
      const px = new Uint8Array(s * s * 4);
      gl.readPixels(Math.max(0, x), Math.max(0, y), s, s, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let hit = 0;
      for (let k = 3; k < px.length; k += 4) if (px[k] > 8 && ++hit > 4) break;
      if (hit > 4 && gl.getError() === gl.NO_ERROR) { this.live = true; this.el.classList.add("is-live"); this.el.classList.remove("is-fallback"); }
      else this.fail();
    }
    fail() {
      this.failed = true; this.stop();
      if (this.el) { this.el.classList.remove("is-live"); this.el.classList.add("is-fallback"); }
      if (this.c) { this.c.width = this.c.height = 0; }  // hand the memory back
    }
    setState() {}
    dock(on) { this.el.classList.toggle("is-docked", !!on); }
    start() { if (this.failed) return; if (this.running || this.reduced) { this.paint(performance.now()); return; } this.running = true; W.sub(this.tick); }
    stop() { this.running = false; W.unsub(this.tick); }
    destroy() { this.stop(); this.ro && this.ro.disconnect(); this.io && this.io.disconnect(); window.removeEventListener("pointermove", this.onMove); window.removeEventListener("resize", this.resize); this.c && this.c.remove(); }
    tick(now) {
      if (!this.running || this.failed) return;
      if (now - this.last >= 1000 / Math.min(this.fps, W.fps) - 2) { this.last = now; this.paint(now); }
    }
    draw(now) {
      const { gl, w, h, o, U } = this, AY = this.AY;
      const t = this.reduced ? 0 : o.wave ? W.t : now / 1000;
      // pose: a slight turn toward the hero copy, a slow breath, ±6° / ±4° toward the cursor, a nod as the hero scrolls away
      const m = this.mouse;
      m.px += (m.x - m.px) * 0.05; m.py += (m.y - m.py) * 0.05;
      const yaw = -0.08 + (this.reduced ? 0 : 0.105 * m.px + 0.012 * Math.sin(t * 0.25));
      const pitch = 0.03 + (this.reduced ? 0 : 0.07 * m.py + 0.008 * Math.sin(t * 0.31 + 1) + (o.wave ? 0.06 * W.scroll : 0));
      const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      // R = Ry(yaw) · Rx(pitch), column-major
      const R = [cy_, 0, -sy_, sy_ * sp, cp, cy_ * sp, sy_ * cp, -sp, cy_ * cp];
      const pv = [-0.038, 0.134, 0.2], DIST = 4.2;           // pivot: the middle of the head; camera DIST in front
      const tr = [0, 1, 2].map((r) => pv[r] - (R[r] * pv[0] + R[3 + r] * pv[1] + R[6 + r] * pv[2]) + (r === 2 ? -DIST : 0));
      gl.uniformMatrix4fv(U.uM, false, [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, tr[0], tr[1], tr[2], 1]);
      gl.uniformMatrix3fv(U.uR, false, R);
      // projection: the picture plane at z = 0.2 maps onto the portrait box (reference aspect, fit to the host, bottom-aligned)
      const ph = Math.min(h * o.fill, w * AY), f = ph / AY * (DIST - 0.2);
      const cx = w / 2, cy = h - ph / 2, N = 1, F = 10;
      gl.uniformMatrix4fv(U.uP, false, [2 * f / w, 0, 0, 0, 0, 2 * f / h, 0, 0, 1 - 2 * cx / w, -(1 - 2 * cy / h), -(F + N) / (F - N), -1, 0, 0, -2 * F * N / (F - N), 0]);
      // r17: the shared wave, at this canvas's place inside the field's frame (hero portrait only)
      const waving = o.wave && W.on && !this.reduced && W.box && W.box.width > 0;
      gl.uniform1f(U.uWave, waving ? 1 : 0);
      if (waving) {
        const hr = this.el.getBoundingClientRect(), B = W.box;
        gl.uniform4f(U.uBox, (hr.left - B.left) / B.width, hr.width / B.width, (hr.top - B.top) / B.height, hr.height / B.height);
        gl.uniform4f(U.uW, W.freq, W.phase, W.bend, W.t); gl.uniform4f(U.uWP, W.pointer.x, W.pointer.y, W.pointer.k, W.aspect);
        gl.uniform2f(U.uWS, W.scale * W.amp, W.scroll);
      }
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uPS, this.dpr);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // 1 · the surface as a dark body (hides the scene behind) and into the depth buffer, pushed back a little,
      //     so lines behind the nose, jaw or ear are hidden
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 2); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(U.uPt, 0); gl.uniform1f(U.uFill, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tb[0]); gl.drawElements(gl.TRIANGLES, this.tb[1], gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1f(U.uFill, 0);
      // 2 · the grid lines, 3 · a share of the vertices as small points
      const g = o.gain * (this.grid[0] > 120 ? 0.56 : 0.7);
      gl.uniform1f(U.uK, g);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lb[0]); gl.drawElements(gl.LINES, this.lb[1], gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(U.uPt, 1); gl.uniform1f(U.uK, o.gain * 0.9);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pb[0]); gl.drawElements(gl.POINTS, this.pb[1], gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
    }
  }
  window.Louis = Louis;
})();
