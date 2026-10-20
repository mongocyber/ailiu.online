/* Louis — r22: a real 3D bust (raw WebGL 1). scripts/louis_bust.py sculpts a procedural signed-distance model (skull, brow,
   eyes, nose, cheekbones, jaw, lips, ears, short crop with a blunt fringe, neck, crew-neck knit, shoulders) to the approved
   front reference's proportions and meshes it as a latitude / longitude grid (louis-data.js: guide rings + one 16-bit
   offset / zone word per vertex). Here the grid is rebuilt (high 176×216, low every second row / column at 30fps) and drawn
   as hairlines plus a share of the vertices as points, with hidden lines removed (depth-only surface pass), brightness
   from a view-space key light × zone albedo, a cool rim on the edges turned away and depth fog, in the scene's cool white;
   every 6th line is drawn again as the heavier layer. It turns up to ±25° toward the cursor and breathes slowly; reduced
   motion → one static frame. r20C's height-field relief (it gave itself away beyond ±6°) is gone.
   WebGL missing / failing / context lost → .is-fallback (louis-fallback.png, rendered from this model).
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

  // ---- r22: the bust — a procedural 3D model (scripts/louis_bust.py → louis-data.js), rebuilt here as a lat / long grid ----
  // Each data row is one superellipse ring of a smooth guide surface [y, centre z, half-width, half-depth, n] (cm); its
  // columns sit at equal arc length around the ring (the same 1024-step table as the script). A vertex lies on the guide
  // normal at the stored offset (13 bits) and carries a zone (3 bits): 1 skin · 2 hair · 3 knit · 4 rib · 5 brow · 6 lips · 7 eye.
  // The grid is always rebuilt at full resolution (normals and offsets are defined on it); the low tier keeps every second
  // row and column.
  let GRID = null;
  function grid() {
    if (GRID) return GRID;
    const D = window.LOUIS_DATA, NC = D.nc, NR = D.nr, NT = D.nt, raw = atob(D.d), n = NC * NR;
    const G = new Float32Array(n * 3), P = new Float32Array(n * 3), zone = new Uint8Array(n), off = new Float32Array(n);
    for (let k = 0; k < n; k++) { const w = raw.charCodeAt(k * 2) | (raw.charCodeAt(k * 2 + 1) << 8); zone[k] = w & 7; off[k] = (w >> 3) / 8191 * (D.out + D.in) - D.in; }
    const ring = (r, t, o) => { const s = Math.sin(t), c = Math.cos(t), e = 2 / r[4];
      o[0] = r[2] * Math.sign(s) * Math.pow(Math.abs(s), e); o[1] = r[0]; o[2] = r[1] + r[3] * Math.sign(c) * Math.pow(Math.abs(c), e); };
    const L = new Float64Array(NT + 1), T = new Float64Array(NT + 1), a = [0, 0, 0], b = [0, 0, 0];
    for (let j = 0; j < NR; j++) {
      const r = D.rows[j];
      ring(r, 0, a); L[0] = 0; T[0] = 0;
      for (let k = 1; k <= NT; k++) { T[k] = k * 2 * Math.PI / NT; ring(r, T[k], b); L[k] = L[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); a[0] = b[0]; a[1] = b[1]; a[2] = b[2]; }
      let k = 0;
      for (let i = 0; i < NC; i++) {
        let t = i * 2 * Math.PI / NC;
        if (L[NT] > 1e-6) { const want = i * L[NT] / NC; while (k < NT - 1 && L[k + 1] < want) k++; const f = (want - L[k]) / Math.max(1e-12, L[k + 1] - L[k]); t = T[k] + (T[k + 1] - T[k]) * Math.min(1, Math.max(0, f)); }
        ring(r, t, b); G.set(b, (j * NC + i) * 3);
      }
    }
    const g = (j, i, c) => G[(j * NC + ((i + NC) % NC)) * 3 + c];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const k = j * NC + i;
      let nx = 0, ny = 1, nz = 0;
      if (j > 0) {
        const j0 = Math.max(0, j - 1), j1 = Math.min(NR - 1, j + 1);
        const tx = g(j, i + 1, 0) - g(j, i - 1, 0), ty = g(j, i + 1, 1) - g(j, i - 1, 1), tz = g(j, i + 1, 2) - g(j, i - 1, 2);
        const vx = g(j1, i, 0) - g(j0, i, 0), vy = g(j1, i, 1) - g(j0, i, 1), vz = g(j1, i, 2) - g(j0, i, 2);
        nx = vy * tz - vz * ty; ny = vz * tx - vx * tz; nz = vx * ty - vy * tx;
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      }
      P[k * 3] = G[k * 3] + nx * off[k]; P[k * 3 + 1] = G[k * 3 + 1] + ny * off[k]; P[k * 3 + 2] = G[k * 3 + 2] + nz * off[k];
    }
    GRID = { NC, NR, P, zone, ycut: D.ycut, pivot: D.pivot };
    return GRID;
  }
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  // the tier's grid (every step-th row / column): position (cm), normal from the grid itself, zone / random / height.
  // Index lists: triangles (depth only, for hidden lines), the grid lines, every 6th line again (the heavier layer),
  // and a share of the vertices as points.
  function mesh(step) {
    const gd = grid(), C = gd.NC / step | 0, rows = [];
    for (let j = 0; j < gd.NR; j += step) rows.push(j);
    if (rows[rows.length - 1] !== gd.NR - 1) rows.push(gd.NR - 1);
    const R = rows.length, n = C * R, V = new Float32Array(n * 9);
    const pos = (j, i) => (rows[j] * gd.NC + ((i + C) % C) * step) * 3;
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const k = j * C + i, p = pos(j, i), P = gd.P;
      const a = pos(j, i + 1), b = pos(j, i - 1), c = pos(Math.min(R - 1, j + 1), i), d = pos(Math.max(0, j - 1), i);
      const tx = P[a] - P[b], ty = P[a + 1] - P[b + 1], tz = P[a + 2] - P[b + 2];
      const vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
      let nx = vy * tz - vz * ty, ny = vz * tx - vx * tz, nz = vx * ty - vy * tx;
      const l = Math.hypot(nx, ny, nz);
      if (j === 0 || l < 1e-9) { nx = 0; ny = 1; nz = 0; } else { nx /= l; ny /= l; nz /= l; }
      V.set([P[p], P[p + 1], P[p + 2], nx, ny, nz, gd.zone[p / 3], hash(k * 0.37 + 1.3), P[p + 1]], k * 9);
    }
    const T = [], Ln = [], Mj = [], Pt = [], every = 6 / step | 0 || 1;
    for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
      const k = j * C + i, i1 = j * C + (i + 1) % C;
      Ln.push(k, i1); if (j % every === 0) Mj.push(k, i1);
      if (j < R - 1) { Ln.push(k, k + C); if (i % every === 0) Mj.push(k, k + C); T.push(k, i1, k + C, i1, i1 + C, k + C); }
      if (V[k * 9 + 7] > 0.86 && j > 0) Pt.push(k);
    }
    return { V, T: new Uint16Array(T), L: new Uint16Array(Ln), M: new Uint16Array(Mj), P: new Uint16Array(Pt), ycut: gd.ycut, pivot: gd.pivot, grid: [C, R] };
  }

  // framing (cm): the portrait box spans x ±BW/2 and y Y0 .. Y0 + BH; the bust is bottom-aligned in the host
  const BW = 40, Y0 = -20, BH = 50, AY = BH / BW;
  const VS = [
    "attribute vec3 aP, aN; attribute vec3 aM;",
    "uniform mat4 uM, uP; uniform mat3 uR; uniform vec4 uW, uWP, uBox; uniform vec2 uWS; uniform float uWave, uPS, uPt, uT, uFill, uYc, uXf;",
    "varying float vA, vP;",
    // FX_WAVE.at(x, u), as in fx3d.js — uW = freq, phase, bend, t · uWP = pointer x, u, k, aspect · uWS = scale × amp, scroll
    "float wave(vec2 p){ float s = 0.5 + 0.5 * sin(6.2832 * uW.x * p.y - uW.y + uW.z * sin(p.x * 5.0 + uW.w * 0.4));",
    "  vec2 d = vec2((p.x - uWP.x) * uWP.w, p.y - uWP.y); float b = uWP.z * exp(-dot(d, d) / 0.01);",
    "  return uWS.x * ((1.0 + 0.6 * uWS.y) * s * s * s + 0.7 * b); }",
    "void main(){",
    "  vec3 n = normalize(uR * aN);",
    "  vec4 e = uM * vec4(aP, 1.0); vec4 c = uP * e; float w = 0.0;",
    "  if (uWave > 0.5 && c.w > 0.0) { vec2 s = vec2(0.5 + 0.5 * c.x / c.w, 0.5 - 0.5 * c.y / c.w); w = wave(vec2(uBox.x + s.x * uBox.y, uBox.z + s.y * uBox.w)); }",
    "  gl_Position = uP * (uM * vec4(aP + aN * w * 0.22, 1.0));",
    // light in view space: a key from the upper left front, a soft fill, and a cool rim on the edges turned away
    "  vec3 vd = normalize(-e.xyz);",
    "  float key = max(dot(n, normalize(vec3(-0.72, 0.5, 0.48))), 0.0), fill = max(dot(n, normalize(vec3(0.7, -0.1, 0.7))), 0.0);",
    "  float edge = 1.0 - abs(dot(n, vd));",
    "  float rim = pow(edge, 2.2) * (0.45 + 0.55 * max(dot(n.xy, normalize(vec2(0.75, 0.45))), 0.0));",
    "  float z = aM.x;",
    // albedo per zone: skin · hair (dark, denser texture reads as a crop) · knit · rib · brow · lips · eye
    "  float alb = z < 1.5 ? 1.0 : z < 2.5 ? 0.5 : z < 3.5 ? 0.5 : z < 4.5 ? 0.85 : z < 5.5 ? 0.18 : z < 6.5 ? 0.8 : 0.12;",
    "  float lit = 0.04 + 1.3 * pow(key, 1.6) + 0.14 * fill;",
    // depth fog: the far side of the head and the shoulders behind the face dim, like the scene's distance fog
    "  float fog = mix(1.0, 0.45, smoothstep(-6.0, 12.0, -(e.z - uYc)));",
    "  float a = (lit * alb + 1.15 * rim) * fog;",
    "  a *= 1.0 + w * 0.7;",
    // the bust ends in a fade below the chest and toward the box's sides (shoulders), never at a hard edge
    "  float base = smoothstep(" + "-22.0, -11.0, aM.z);",
    "  float side = 1.0 - smoothstep(uXf * 0.72, uXf, abs(c.x / max(c.w, 1e-4)));",
    "  a *= base * side;",
    "  if (uPt > 0.5) a *= step(0.5, lit * alb + rim) * (0.55 + 0.45 * sin(uT * (0.7 + aM.y * 1.4) + aM.y * 60.0));",
    // pass 1 (uFill): the surface as a near-black body (alpha only), so the scene behind is hidden as by a solid
    "  if (uFill > 0.5) a = 0.94 * base * side;",
    "  vA = a; vP = uPt + 2.0 * uFill;",
    "  gl_PointSize = uPS * (1.0 + 1.4 * key);",
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
        this.setup(low ? 2 : 1);
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
    setup(step) {
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
      const M = mesh(step);
      this.AY = AY; this.grid = M.grid;
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, M.V, gl.STATIC_DRAW);
      [["aP", 3, 0], ["aN", 3, 12], ["aM", 3, 24]].forEach(([n, k, off]) => {
        const l = gl.getAttribLocation(pr, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, k, gl.FLOAT, false, 36, off);
      });
      const ib = (a) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, a, gl.STATIC_DRAW); return [b, a.length]; };
      this.tb = ib(M.T); this.lb = ib(M.L); this.mb = ib(M.M); this.pb = ib(M.P);
      this.pivot = M.pivot;
      this.count = { verts: M.V.length / 9, lines: M.L.length / 2, major: M.M.length / 2, tris: M.T.length / 3, points: M.P.length };
      this.U = {};
      ["uM", "uP", "uR", "uW", "uWP", "uBox", "uWS", "uWave", "uPS", "uPt", "uT", "uK", "uFill", "uYc", "uXf"].forEach((n) => { this.U[n] = gl.getUniformLocation(pr, n); });
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
      const { gl, w, h, o, U } = this;
      const t = this.reduced ? 0 : o.wave ? W.t : now / 1000;
      // pose: a slight turn toward the hero copy, a slow breath, up to ±25° / ±8° toward the cursor (the model is a full
      // head, so it holds up from the side), a nod as the hero scrolls away
      const m = this.mouse;
      m.px += (m.x - m.px) * 0.05; m.py += (m.y - m.py) * 0.05;
      let yaw = Math.max(-0.436, Math.min(0.436, -0.06 + (this.reduced ? 0 : 0.38 * m.px + 0.02 * Math.sin(t * 0.25))));
      let pitch = 0.04 + (this.reduced ? 0 : 0.1 * m.py + 0.01 * Math.sin(t * 0.31 + 1) + (o.wave ? 0.06 * W.scroll : 0));
      if (o.pose) { yaw = o.pose[0]; pitch = o.pose[1]; }              // fixed pose (fallback render, checks)
      const breath = this.reduced ? 0 : 0.12 * Math.sin(t * 0.9);       // cm: the chest rises a little, the head follows
      const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      // R = Ry(yaw) · Rx(pitch), column-major
      const R = [cy_, 0, -sy_, sy_ * sp, cp, cy_ * sp, sy_ * cp, -sp, cy_ * cp];
      const pv = this.pivot, DIST = 190, YC = Y0 + BH / 2;           // camera DIST cm in front of the head's centre
      const tr = [0, 1, 2].map((r) => pv[r] - (R[r] * pv[0] + R[3 + r] * pv[1] + R[6 + r] * pv[2]) + (r === 1 ? breath - YC : r === 2 ? -DIST : 0));
      gl.uniformMatrix4fv(U.uM, false, [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, tr[0], tr[1], tr[2], 1]);
      gl.uniformMatrix3fv(U.uR, false, R);
      gl.uniform1f(U.uYc, -DIST);
      // projection: the plane z = 0 maps onto the portrait box (fit to the host, bottom-aligned)
      const ph = Math.min(h * o.fill, w * AY), f = ph / BH * DIST;
      const cx = w / 2, cy = h - ph / 2, N = DIST - 40, F = DIST + 40;
      gl.uniformMatrix4fv(U.uP, false, [2 * f / w, 0, 0, 0, 0, 2 * f / h, 0, 0, 1 - 2 * cx / w, -(1 - 2 * cy / h), -(F + N) / (F - N), -1, 0, 0, -2 * F * N / (F - N), 0]);
      gl.uniform1f(U.uXf, Math.min(1, ph / AY / w));                  // the box's half-width in clip x: shoulders fade before it
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
      //     so lines behind the nose, jaw, ear or the far side of the head are hidden
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 2); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(U.uPt, 0); gl.uniform1f(U.uFill, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tb[0]); gl.drawElements(gl.TRIANGLES, this.tb[1], gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1f(U.uFill, 0);
      // 2 · the grid lines, 2b · every 6th row / column again (the heavier layer, as the scene's main members),
      // 3 · a share of the vertices as small points
      const g = o.gain * (this.grid[0] > 120 ? 0.5 : 0.62);
      gl.uniform1f(U.uK, g);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lb[0]); gl.drawElements(gl.LINES, this.lb[1], gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(U.uK, g * 0.45);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mb[0]); gl.drawElements(gl.LINES, this.mb[1], gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(U.uPt, 1); gl.uniform1f(U.uK, o.gain * 0.9);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pb[0]); gl.drawElements(gl.POINTS, this.pb[1], gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
    }
  }
  window.Louis = Louis;
})();
