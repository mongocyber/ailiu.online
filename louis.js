/* Louis — r24: a regular line grid on a real 3D model (raw WebGL 1). The approved Midjourney front image was turned into a
   white model by Hunyuan3D-2.1 (free Hugging Face Space); scripts/louis_contours.py slices it into horizontal contours and
   meridians about the head's vertical axis (with in-between meridians on the shoulders), smooths and packs them, with a
   normal and a cavity value per point, plus a decimated, slightly shrunk body for hidden-line removal (louis-data.js).
   Here the body is drawn first as a dark depth-writing surface, then every line segment as a screen-facing quad: what
   stands out toward the camera, faces the key light or is a ridge (nose, brow, lips, cheekbones, the near shoulder) is
   brighter and wider; hollows (sockets, lid creases, mouth corners), the far side and the back fade darker and finer.
   No triangle edges and no vertex points any more (r23). The low tier draws every second contour and meridian at 30fps.
   It turns up to ±25° toward the cursor and breathes slowly; reduced motion → one static frame.
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

  // ---- r24: the bust as a line grid (Hunyuan3D-2.1 model → scripts/louis_contours.py → louis-data.js) ----
  // Lines: horizontal contours and meridians about the head's vertical axis, each stored in its plane's 2D frame
  // (zigzag-varint deltas in units of q) with one byte of normal angle and one of cavity per point. Rebuilt here into
  // points (cm), normals (n = cos φ · B + sin φ · Pn, B = Pn × tangent) and cavity (cm, + a hollow, − a ridge), then into
  // one screen-facing quad (two triangles) per segment, so a line's width can follow its light. The body (a decimated,
  // slightly shrunk copy of the model) is drawn first as a dark depth-writing surface, so the lines behind it are hidden.
  const b64 = (s) => { const r = atob(s), u = new Uint8Array(r.length); for (let k = 0; k < r.length; k++) u[k] = r.charCodeAt(k); return u; };
  const MESH = {};
  function mesh(tier) {
    if (MESH[tier]) return MESH[tier];
    const D = window.LOUIS_DATA, B = D.body, lo = B.lo, hi = B.hi, low = tier === "low";
    // the body: quantised vertices + varint indices
    const vb = b64(B.v), fb = b64(B.f), BP = new Float32Array(B.nv * 3), BF = new Uint16Array(B.nf * 3), dv = new DataView(vb.buffer);
    for (let i = 0; i < B.nv; i++) {
      const w = dv.getUint32(i * 4, true);
      BP[i * 3] = lo[0] + (w & 2047) / 2047 * (hi[0] - lo[0]);
      BP[i * 3 + 1] = lo[1] + ((w >>> 11) & 2047) / 2047 * (hi[1] - lo[1]);
      BP[i * 3 + 2] = lo[2] + (w >>> 22) / 1023 * (hi[2] - lo[2]);
    }
    for (let k = 0, o = 0, hw = 0; k < B.nf * 3; k++) {
      let d = 0, sh = 0, c;
      do { c = fb[o++]; d |= (c & 127) << sh; sh += 7; } while (c & 128);
      BF[k] = hw - d; if (d === 0) hw++;
    }
    // the lines
    const lb = b64(D.lines), q = D.q;
    let o = 0;
    const vi = () => { let d = 0, sh = 0, c; do { c = lb[o++]; d += (c & 127) * Math.pow(2, sh); sh += 7; } while (c & 128); return d; };
    const zz = (n) => (n % 2 ? -(n + 1) / 2 : n / 2);
    const segs = [];   // per segment: [ax ay az anx any anz acav, bx … bcav]
    let nl = 0, np = 0;
    while (o < lb.length) {
      const fl = vi(), par = vi(), n = vi(), mer = fl & 1, closed = !!(fl & 4), mine = !low || (fl & 2);
      const P = new Float32Array(n * 3);
      const th = Math.PI * par / D.mer, s = Math.sin(th), c = Math.cos(th), y = D.y0 + par * q;
      for (let i = 0, u = 0, v = 0; i < n; i++) {
        u += zz(vi()); v += zz(vi());
        if (mer) { P[i * 3] = u * q * s; P[i * 3 + 1] = v * q; P[i * 3 + 2] = D.axz + u * q * c; }
        else { P[i * 3] = u * q; P[i * 3 + 1] = y; P[i * 3 + 2] = v * q; }
      }
      const phi = lb.subarray(o, o + n), cav = lb.subarray(o + n, o + 2 * n); o += 2 * n;
      if (!mine) continue;
      nl++; np += n;
      // normals: tangent from the neighbours, Pn the plane's normal, B = Pn × T (as the packer)
      const pn = mer ? [c, 0, -s] : [0, 1, 0], N = new Float32Array(n * 3), C = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = closed ? (i + n - 1) % n : Math.max(0, i - 1), b = closed ? (i + 1) % n : Math.min(n - 1, i + 1);
        let tx = P[b * 3] - P[a * 3], ty = P[b * 3 + 1] - P[a * 3 + 1], tz = P[b * 3 + 2] - P[a * 3 + 2];
        const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        let bx = pn[1] * tz - pn[2] * ty, by = pn[2] * tx - pn[0] * tz, bz = pn[0] * ty - pn[1] * tx;
        const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
        const f = phi[i] / 256 * 6.2832, cf = Math.cos(f), sf = Math.sin(f);
        N[i * 3] = cf * bx + sf * pn[0]; N[i * 3 + 1] = cf * by + sf * pn[1]; N[i * 3 + 2] = cf * bz + sf * pn[2];
        C[i] = (cav[i] - 128) / 127 * 0.4;
      }
      const pt = (i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2], C[i]];
      for (let i = 0; i < n - 1; i++) segs.push(pt(i).concat(pt(i + 1)));
      if (closed) segs.push(pt(n - 1).concat(pt(0)));
    }
    // six vertices per segment: own point · other point · own normal · [side, cavity, height, end]. The far end (end −1)
    // measures its side from the reversed direction, so its stored side is the mirror of its place across the line
    const L = new Float32Array(segs.length * 6 * 13);
    let k = 0;
    const put = (A, Bq, g, end) => { L.set([A[0], A[1], A[2], Bq[0], Bq[1], Bq[2], A[3], A[4], A[5], g * end, A[6], A[1], end], k); k += 13; };
    for (const sg of segs) {
      const A = sg.slice(0, 7), Bq = sg.slice(7);
      // the quad a− a+ b+ b− as two triangles (a−, a+, b+) and (a−, b+, b−); g = the side across the line
      put(A, Bq, -1, 1); put(A, Bq, 1, 1); put(Bq, A, 1, -1);
      put(A, Bq, -1, 1); put(Bq, A, 1, -1); put(Bq, A, -1, -1);
    }
    MESH[tier] = { BP, BF, L, nl, np, ns: segs.length, ybot: D.ybot, pivot: D.pivot };
    return MESH[tier];
  }

  // framing (cm): the portrait box spans x ±BW/2 and y Y0 .. Y0 + BH; the bust is bottom-aligned in the host
  const BW = 30, Y0 = -7.5, BH = 37.5, AY = BH / BW;
  // the hairline at the front, in cm above the base (the crop is 9 cm deeper at the back of the head, down to the nape)
  const HAIR = 28.4;
  const WAVE = [
    // FX_WAVE.at(x, u), as in fx3d.js — uW = freq, phase, bend, t · uWP = pointer x, u, k, aspect · uWS = scale × amp, scroll
    "float wave(vec2 p){ float s = 0.5 + 0.5 * sin(6.2832 * uW.x * p.y - uW.y + uW.z * sin(p.x * 5.0 + uW.w * 0.4));",
    "  vec2 d = vec2((p.x - uWP.x) * uWP.w, p.y - uWP.y); float b = uWP.z * exp(-dot(d, d) / 0.01);",
    "  return uWS.x * ((1.0 + 0.6 * uWS.y) * s * s * s + 0.7 * b); }"
  ];
  // the body: a near-black surface (alpha only) that writes depth and hides the scene behind, as a solid would
  const BVS = [
    "attribute vec3 aP; uniform mat4 uM, uP; uniform float uYb, uXf; varying float vA;",
    "void main(){ vec4 c = uP * (uM * vec4(aP, 1.0)); gl_Position = c;",
    "  vA = 0.94 * smoothstep(uYb + 0.5, uYb + 8.0, aP.y) * (1.0 - smoothstep(uXf * 0.8, uXf, abs(c.x / max(c.w, 1e-4)))); }"
  ].join("\n");
  const BFS = "precision mediump float; varying float vA; void main(){ gl_FragColor = vec4(0.0, 0.0, 0.0, vA); }";
  const VS = [
    "attribute vec3 aP, aO, aN; attribute vec4 aM;",
    "uniform mat4 uM, uP; uniform mat3 uR; uniform vec4 uW, uWP, uBox; uniform vec2 uWS, uPx; uniform float uWave, uYc, uXf, uYb, uDpr;",
    "varying float vA, vS, vW;"
  ].concat(WAVE, [
    "vec2 scr(vec4 c){ return c.xy / c.w * uPx; }",
    "void main(){",
    "  vec3 n = normalize(uR * aN);",
    "  vec4 e = uM * vec4(aP, 1.0), c = uP * e; float w = 0.0;",
    "  if (uWave > 0.5 && c.w > 0.0) { vec2 s = vec2(0.5 + 0.5 * c.x / c.w, 0.5 - 0.5 * c.y / c.w); w = wave(vec2(uBox.x + s.x * uBox.y, uBox.z + s.y * uBox.w)); }",
    "  vec4 p = uP * (uM * vec4(aP + aN * w * 0.22, 1.0)), q = uP * (uM * vec4(aO + aN * w * 0.22, 1.0));",
    // light in view space: a wrapped key from the upper left front, a soft fill, a cool rim on the parts turned away
    "  vec3 vd = normalize(-e.xyz); float nv = dot(n, vd);",
    "  float kd = dot(n, normalize(vec3(-0.5, 0.32, 0.8))), fill = max(dot(n, normalize(vec3(0.7, -0.1, 0.7))), 0.0);",
    "  float lit = 0.04 + 1.15 * pow(0.5 + 0.5 * kd, 2.4) + 0.1 * fill;",
    "  float rim = pow(1.0 - abs(nv), 2.4) * (0.4 + 0.6 * max(dot(n.xy, normalize(vec2(0.75, 0.45))), 0.0));",
    // depth: what stands out toward the camera (nose, brow, lips, cheekbones, the near shoulder) is brighter and wider,
    // what lies back (the far cheek, the ears, the back of the head, the shoulders behind the neck) darker and finer
    "  float near = smoothstep(-9.0, 9.0, e.z - uYc);",
    // cavity: hollows (sockets, lid creases, under the nose and lip, mouth corners, nostrils) sink, ridges lift
    "  float cv = clamp(1.0 - 2.4 * aM.y, 0.3, 1.45), ridge = clamp(-aM.y / 0.25, 0.0, 1.0), hollow = clamp(aM.y / 0.25, 0.0, 1.0);",
    // albedo: the short crop (above the hairline, and the back of the head above the nape) reads darker than the skin
    "  float hair = smoothstep(-0.8, 0.8, aM.z - uYb - " + HAIR.toFixed(1) + " + 9.0 * smoothstep(1.0, -4.0, aP.z));",
    "  float alb = mix(1.0, 0.6, hair);",
    "  float face = smoothstep(-0.2, 0.25, nv);",       // lines seen through at the silhouette fade out
    "  float a = (pow(lit * cv * alb, 1.25) * mix(0.42, 1.12, near) + 0.85 * rim * mix(0.6, 1.0, near)) * face;",
    "  a *= 1.0 + w * 0.7;",
    "  float base = smoothstep(uYb + 0.5, uYb + 8.0, aM.z);",
    "  float side = 1.0 - smoothstep(uXf * 0.8, uXf, abs(c.x / max(c.w, 1e-4)));",
    "  vA = a * base * side;",
    // width (css px): from depth, light and ridge, finer in hollows and toward the silhouette
    "  float wd = mix(0.45, 1.5, clamp(0.55 * near + 0.35 * max(kd, 0.0) + 0.35 * ridge - 0.45 * hollow, 0.0, 1.0)) * mix(0.75, 1.0, face);",
    "  wd *= uDpr; vW = wd;",
    "  float gw = max(wd, 1.0) + 2.0;",                 // the quad: the line plus a pixel of antialiasing on each side
    "  vec2 d = scr(q) - scr(p); d = length(d) > 1e-4 ? normalize(d) : vec2(1.0, 0.0);",
    "  vec2 off = vec2(-d.y, d.x) * aM.x * gw * 0.5;",
    "  vS = aM.x * aM.w;",                                // the side across the line, the same at both ends
    "  gl_Position = p; gl_Position.xy += off / uPx * p.w;",
    "}"
  ]).join("\n");
  const FS = [
    "precision mediump float;",
    "uniform float uK; varying float vA, vS, vW;",
    "void main(){",
    // coverage: the line's width box-filtered over 1.5 px (a softer edge than a pixel: thin, nearly level lines step less)
    "  float ww = max(vW, 1.0), gw = ww + 2.0, dist = abs(vS) * gw * 0.5;",
    "  float a = vA * uK * clamp((ww * 0.5 + 0.75 - dist) / 1.5, 0.0, 1.0) * min(vW, 1.0);",
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
      const prog = (vs, fs, attrs, unis) => {
        const pr = gl.createProgram();
        gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(pr);
        if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
        const U = {}; unis.forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
        return { pr, U, loc: attrs.map((n) => gl.getAttribLocation(pr, n)) };
      };
      this.body = prog(BVS, BFS, ["aP"], ["uM", "uP", "uYb", "uXf"]);
      this.line = prog(VS, FS, ["aP", "aO", "aN", "aM"],
        ["uM", "uP", "uR", "uW", "uWP", "uBox", "uWS", "uPx", "uWave", "uYc", "uXf", "uYb", "uDpr", "uK"]);
      const M = mesh(step);
      this.AY = AY; this.tier = step;
      const buf = (a) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; };
      this.vb = buf(M.BP); this.eb = buf(M.L); this.nq = M.ns * 6;
      this.tb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, M.BF, gl.STATIC_DRAW);
      this.nt = M.BF.length;
      this.pivot = M.pivot; this.ybot = M.ybot;
      this.count = { verts: M.np, lines: M.nl, segments: M.ns, body: M.BF.length / 3 };
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
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
      const { gl, w, h, o } = this;
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
      const MV = [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, tr[0], tr[1], tr[2], 1];
      // projection: the plane z = 0 maps onto the portrait box (fit to the host, bottom-aligned)
      const ph = Math.min(h * o.fill, w * AY), f = ph / BH * DIST;
      const cx = w / 2, cy = h - ph / 2, N = DIST - 40, F = DIST + 40;
      const PM = [2 * f / w, 0, 0, 0, 0, 2 * f / h, 0, 0, 1 - 2 * cx / w, -(1 - 2 * cy / h), -(F + N) / (F - N), -1, 0, 0, -2 * F * N / (F - N), 0];
      const xf = Math.min(1, ph / AY / w);                             // the box's half-width in clip x: shoulders fade before it
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // 1 · the body, dark, into the depth buffer, pushed back a little, so the lines behind the nose, jaw, ear or the far
      //     side of the head are hidden
      let P = this.body, U = P.U;
      gl.useProgram(P.pr);
      gl.uniformMatrix4fv(U.uM, false, MV); gl.uniformMatrix4fv(U.uP, false, PM); gl.uniform1f(U.uXf, xf); gl.uniform1f(U.uYb, this.ybot);
      for (let l = 1; l < 4; l++) if (this.line.loc[l] >= 0) gl.disableVertexAttribArray(this.line.loc[l]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vb); gl.enableVertexAttribArray(P.loc[0]); gl.vertexAttribPointer(P.loc[0], 3, gl.FLOAT, false, 12, 0);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 2); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tb); gl.drawElements(gl.TRIANGLES, this.nt, gl.UNSIGNED_SHORT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      // 2 · the contours and meridians, each segment a quad as wide as its light (no vertex points any more)
      P = this.line; U = P.U;
      gl.useProgram(P.pr);
      gl.uniformMatrix4fv(U.uM, false, MV); gl.uniformMatrix4fv(U.uP, false, PM); gl.uniformMatrix3fv(U.uR, false, R);
      gl.uniform1f(U.uYc, -DIST); gl.uniform1f(U.uXf, xf); gl.uniform1f(U.uYb, this.ybot);
      gl.uniform2f(U.uPx, this.c.width / 2, this.c.height / 2); gl.uniform1f(U.uDpr, this.dpr);
      // r17: the shared wave, at this canvas's place inside the field's frame (hero portrait only)
      const waving = o.wave && W.on && !this.reduced && W.box && W.box.width > 0;
      gl.uniform1f(U.uWave, waving ? 1 : 0);
      if (waving) {
        const hr = this.el.getBoundingClientRect(), B = W.box;
        gl.uniform4f(U.uBox, (hr.left - B.left) / B.width, hr.width / B.width, (hr.top - B.top) / B.height, hr.height / B.height);
        gl.uniform4f(U.uW, W.freq, W.phase, W.bend, W.t); gl.uniform4f(U.uWP, W.pointer.x, W.pointer.y, W.pointer.k, W.aspect);
        gl.uniform2f(U.uWS, W.scale * W.amp, W.scroll);
      }
      gl.uniform1f(U.uK, o.gain * (this.tier === "high" ? 0.5 : 0.5));
      gl.bindBuffer(gl.ARRAY_BUFFER, this.eb);
      P.loc.forEach((l, k) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, k < 3 ? 3 : 4, gl.FLOAT, false, 52, k * 12); });
      gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE);
      gl.drawArrays(gl.TRIANGLES, 0, this.nq);
      gl.depthMask(true);
    }
  }
  window.Louis = Louis;
})();
