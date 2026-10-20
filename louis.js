/* Louis — r23: a real 3D model (raw WebGL 1). The approved Midjourney front image was turned into a white model by
   Hunyuan3D-2.1 (free Hugging Face Space); scripts/louis_glb.py keeps its largest piece, normalises it to cm, decimates it
   into two tiers (high ~12k faces, low ~3.5k at 30fps, the face given most of the budget) and packs them into louis-data.js
   (quantised vertices + varint indices). Here every mesh edge is drawn as a hairline, with hidden lines removed (a dark
   depth-writing surface pass), brightness from a wrapped view-space key light × cavity (sockets, lid creases and mouth
   corners sink, nose, brow and lips lift) × a darker albedo for the crop, the dihedral (feature) angle lifting the edges
   that carry the eyes, nostrils, lips and ear rims, a cool rim on the edges turned away, back-facing lines faded and depth
   fog, in the scene's cool white; the feature edges are drawn again as the heavier layer, a share of the vertices as points.
   It turns up to ±25° toward the cursor and breathes slowly; reduced motion → one static frame.
   r22's procedural signed-distance bust (louis_bust.py) is gone.
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

  // ---- r23: the bust — a real 3D model (Hunyuan3D-2.1 white model → scripts/louis_glb.py → louis-data.js) ----
  // Per tier: vertices quantised in the model's box (one 32-bit word: x 11 · y 11 · z 10 bits), faces as varints of
  // (vertices seen so far − index). Decoded here into positions (cm), area-weighted vertex normals, and the unique edges
  // with their dihedral angle (the feature value that lifts the eyes, lids, nostrils, lips and ear rims).
  const b64 = (s) => { const r = atob(s), u = new Uint8Array(r.length); for (let k = 0; k < r.length; k++) u[k] = r.charCodeAt(k); return u; };
  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const MESH = {};
  function mesh(tier) {
    if (MESH[tier]) return MESH[tier];
    const D = window.LOUIS_DATA, T = D[tier], nv = T.nv, nf = T.nf, lo = D.lo, hi = D.hi;
    const vb = b64(T.v), fb = b64(T.f), P = new Float32Array(nv * 3), F = new Uint16Array(nf * 3);
    const dv = new DataView(vb.buffer);
    for (let i = 0; i < nv; i++) {
      const w = dv.getUint32(i * 4, true);
      P[i * 3] = lo[0] + (w & 2047) / 2047 * (hi[0] - lo[0]);
      P[i * 3 + 1] = lo[1] + ((w >>> 11) & 2047) / 2047 * (hi[1] - lo[1]);
      P[i * 3 + 2] = lo[2] + (w >>> 22) / 1023 * (hi[2] - lo[2]);
    }
    for (let k = 0, o = 0, hw = 0; k < nf * 3; k++) {
      let d = 0, sh = 0, c;
      do { c = fb[o++]; d |= (c & 127) << sh; sh += 7; } while (c & 128);
      F[k] = hw - d; if (d === 0) hw++;
    }
    // face normals → vertex normals (area weighted); edges keyed by their vertex pair, with the two faces' normals
    const FN = new Float32Array(nf * 3), N = new Float32Array(nv * 3), E = new Map();
    for (let f = 0; f < nf; f++) {
      const a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, c = F[f * 3 + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.hypot(nx, ny, nz) || 1;
      FN[f * 3] = nx / l; FN[f * 3 + 1] = ny / l; FN[f * 3 + 2] = nz / l;
      for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
      for (let e = 0; e < 3; e++) {
        const i = F[f * 3 + e], j = F[f * 3 + (e + 1) % 3], key = i < j ? i * 65536 + j : j * 65536 + i, h = E.get(key);
        if (h) h.push(f); else E.set(key, [f]);
      }
    }
    for (let i = 0; i < nv; i++) { const l = Math.hypot(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]) || 1; N[i * 3] /= l; N[i * 3 + 1] /= l; N[i * 3 + 2] /= l; }
    // cavity: how far the ring of neighbours sits above (+, a hollow: eye sockets, lid creases, mouth corners, nostrils)
    // or below (−, a ridge: brow, nose, lips, ear rims) the vertex, along its normal, in units of the ring's edge length
    const S = new Float32Array(nv * 4), cav = new Float32Array(nv);
    E.forEach((fs, key) => {
      const i = Math.floor(key / 65536), j = key % 65536, l = Math.hypot(P[j * 3] - P[i * 3], P[j * 3 + 1] - P[i * 3 + 1], P[j * 3 + 2] - P[i * 3 + 2]);
      for (const [a, b] of [[i, j], [j, i]]) { for (let c = 0; c < 3; c++) S[a * 4 + c] += P[b * 3 + c]; S[a * 4 + 3] += l; }
    });
    const deg = new Uint16Array(nv);
    E.forEach((fs, key) => { deg[Math.floor(key / 65536)]++; deg[key % 65536]++; });
    for (let i = 0; i < nv; i++) {
      const d = deg[i] || 1, el = S[i * 4 + 3] / d || 1;
      cav[i] = ((S[i * 4] / d - P[i * 3]) * N[i * 3] + (S[i * 4 + 1] / d - P[i * 3 + 1]) * N[i * 3 + 1] + (S[i * 4 + 2] / d - P[i * 3 + 2]) * N[i * 3 + 2]) / el;
    }
    // vertex buffer (fill pass, points): position · normal · [feature, random, height, cavity]
    const V = new Float32Array(nv * 10), Pt = [];
    for (let i = 0; i < nv; i++) {
      V.set([P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2], 0, hash(i * 0.37 + 1.3), P[i * 3 + 1], cav[i]], i * 10);
      if (V[i * 10 + 7] > 0.8) Pt.push(i);
    }
    // line buffer: two vertices per edge, each with its vertex normal; feature = 1 − cos(dihedral), open edges count as 1.
    // Edges above the feature threshold are drawn again as the heavier layer (the scene's main members).
    const L = new Float32Array(E.size * 20), M = [];
    let k = 0;
    E.forEach((fs, key) => {
      const i = Math.floor(key / 65536), j = key % 65536;
      let feat = 1;
      if (fs.length === 2) { const p = fs[0] * 3, q = fs[1] * 3; feat = Math.min(1, Math.max(0, 1 - (FN[p] * FN[q] + FN[p + 1] * FN[q + 1] + FN[p + 2] * FN[q + 2]))); }
      feat = smooth(0.04, 0.36, feat);                // a soft knee: the generator's small lumps stay quiet
      const r = hash(key * 0.013 + 7.1);
      for (const v of [i, j]) { L.set([P[v * 3], P[v * 3 + 1], P[v * 3 + 2], N[v * 3], N[v * 3 + 1], N[v * 3 + 2], feat, r, P[v * 3 + 1], cav[v]], k * 10); k++; }
      if (feat > 0.55) M.push(k - 2, k - 1);
    });
    MESH[tier] = { V, F, L, M: new Uint16Array(M), P: new Uint16Array(Pt), ybot: D.ybot, pivot: D.pivot, nf, nv, ne: E.size };
    return MESH[tier];
  }

  // framing (cm): the portrait box spans x ±BW/2 and y Y0 .. Y0 + BH; the bust is bottom-aligned in the host
  const BW = 30, Y0 = -7.5, BH = 37.5, AY = BH / BW;
  // the hairline at the front, in cm above the base (the crop is 9 cm deeper at the back of the head, down to the nape)
  const HAIR = 28.4;
  const VS = [
    "attribute vec3 aP, aN; attribute vec4 aM;",
    "uniform mat4 uM, uP; uniform mat3 uR; uniform vec4 uW, uWP, uBox; uniform vec2 uWS; uniform float uWave, uPS, uPt, uT, uFill, uYc, uXf, uYb, uLn;",
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
    "  vec3 vd = normalize(-e.xyz); float nv = dot(n, vd);",
    "  float kd = dot(n, normalize(vec3(-0.5, 0.32, 0.8))), key = max(kd, 0.0), fill = max(dot(n, normalize(vec3(0.7, -0.1, 0.7))), 0.0);",
    "  float edge = 1.0 - abs(nv);",
    "  float rim = pow(edge, 2.2) * (0.45 + 0.55 * max(dot(n.xy, normalize(vec2(0.75, 0.45))), 0.0));",
    "  float lit = 0.02 + 1.25 * pow(0.5 + 0.5 * kd, 3.0) + 0.12 * fill;",   // wrapped key: the face front stays lit, the far cheek falls off,
    // features (eyes, lids, nostrils, lips, ear rims) read brighter, even in shadow
    "  float feat = uLn * aM.x;",
    // cavity shading: hollows (sockets, lid creases, mouth corners, nostrils) sink, ridges (brow, nose, lips, ear rims) lift
    "  float cav = clamp(1.0 - 3.4 * aM.w, 0.22, 1.6);",
    // albedo: the short crop (above the hairline, and the back of the head above the nape) reads darker than the skin
    "  float hair = smoothstep(-0.8, 0.8, aM.z - uYb - " + HAIR.toFixed(1) + " + 9.0 * smoothstep(1.0, -4.0, aP.z));",
    "  float alb = mix(1.0, 0.55, hair);",
    // depth fog: the far side of the head and the shoulders behind the face dim, like the scene's distance fog
    "  float fog = mix(1.0, 0.42, smoothstep(-6.0, 12.0, -(e.z - uYc)));",
    // back-facing lines (seen through at the silhouette) fade out
    "  float face = smoothstep(-0.25, 0.2, nv);",
    "  float sh = lit * cav * alb; float a = (pow(sh, 1.35) * (0.8 + 1.1 * feat) + 0.12 * feat + 0.9 * rim) * fog * face;",
    "  a *= 1.0 + w * 0.7;",
    // the bust ends in a fade at the base and toward the box's sides, never at a hard edge
    "  float base = smoothstep(uYb + 0.5, uYb + 8.0, aM.z);",
    "  float side = 1.0 - smoothstep(uXf * 0.8, uXf, abs(c.x / max(c.w, 1e-4)));",
    "  a *= base * side;",
    "  if (uPt > 0.5) a *= step(0.3, lit + rim) * (0.55 + 0.45 * sin(uT * (0.7 + aM.y * 1.4) + aM.y * 60.0));",
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
        this.setup(low ? "low" : "high");
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
      this.AY = AY; this.tier = step;
      const buf = (a) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; };
      this.vb = buf(M.V); this.eb = buf(M.L);
      this.loc = ["aP", "aN", "aM"].map((n) => { const l = gl.getAttribLocation(pr, n); gl.enableVertexAttribArray(l); return l; });
      const ib = (a) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, a, gl.STATIC_DRAW); return [b, a.length]; };
      this.tb = ib(M.F); this.mb = ib(M.M); this.pb = ib(M.P); this.ne = M.ne;
      this.pivot = M.pivot; this.ybot = M.ybot;
      this.count = { verts: M.nv, tris: M.nf, lines: M.ne, major: M.M.length / 2, points: M.P.length };
      this.U = {};
      ["uM", "uP", "uR", "uW", "uWP", "uBox", "uWS", "uWave", "uPS", "uPt", "uT", "uK", "uFill", "uYc", "uXf", "uYb", "uLn"].forEach((n) => { this.U[n] = gl.getUniformLocation(pr, n); });
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
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uPS, this.dpr); gl.uniform1f(U.uYb, this.ybot);
      const attrs = (b) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); this.loc.forEach((l, k) => gl.vertexAttribPointer(l, k < 2 ? 3 : 4, gl.FLOAT, false, 40, k * 12)); };
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // 1 · the surface as a dark body (hides the scene behind) and into the depth buffer, pushed back a little,
      //     so lines behind the nose, jaw, ear or the far side of the head are hidden
      attrs(this.vb);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 2); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(U.uPt, 0); gl.uniform1f(U.uFill, 1); gl.uniform1f(U.uLn, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tb[0]); gl.drawElements(gl.TRIANGLES, this.tb[1], gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1f(U.uFill, 0);
      // 2 · every mesh edge (feature angle lifts it), 2b · the feature edges again (the heavier layer, as the scene's
      // main members), 3 · a share of the vertices as small points
      const g = o.gain * (this.tier === "high" ? 0.55 : 0.5);
      attrs(this.eb); gl.uniform1f(U.uLn, 1); gl.uniform1f(U.uK, g);
      gl.drawArrays(gl.LINES, 0, this.ne * 2);
      gl.uniform1f(U.uK, g * 0.5);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mb[0]); gl.drawElements(gl.LINES, this.mb[1], gl.UNSIGNED_SHORT, 0);
      attrs(this.vb); gl.uniform1f(U.uLn, 0); gl.uniform1f(U.uPt, 1); gl.uniform1f(U.uK, o.gain * 0.9);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pb[0]); gl.drawElements(gl.POINTS, this.pb[1], gl.UNSIGNED_SHORT, 0);
      gl.depthMask(true);
    }
  }
  window.Louis = Louis;
})();
