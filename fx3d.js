/* ailiu.online preview v2 — r13 hero 3D field (raw WebGL 1, no libraries, nothing loaded from other origins).
   A scanline terrain: rows of points joined into lines, drifting toward the viewer. The rows echo the portrait's scanlines.
   It sits behind the hero copy and the portrait (Louis stays on its own canvas, on top, untouched).
   Mode lands on <html data-fx>: "webgl-high" | "webgl-low" | "2d" (data-fx-why says why). "2d" = the existing glyph rain.
     ?fx=off → 2d · ?fx=low / ?fx=high → force a tier (WebGL still has to work).
     prefers-reduced-motion → 2d. No WebGL / shader failure / any throw → 2d. webglcontextlost → 2d.
     hardwareConcurrency ≤ 4, deviceMemory ≤ 4, or a coarse pointer on a small screen → low (DPR ≤ 1, fewer points, 30 fps).
   Pauses while the tab is hidden or the hero is off screen. DPR ≤ 1.5 and a total pixel budget per tier. */
(function () {
  "use strict";
  var root = document.documentElement;
  function set(mode, why) { root.setAttribute("data-fx", mode); root.setAttribute("data-fx-why", why); }
  set("2d", "init");
  var c = document.getElementById("fx3d");
  try {
    var q = (/[?&]fx=(off|low|high)\b/.exec(location.search) || [])[1];
    var mm = function (s) { return !!(window.matchMedia && window.matchMedia(s).matches); };
    if (!c) return set("2d", "no-canvas");
    if (q === "off") return set("2d", "param");
    if (mm("(prefers-reduced-motion: reduce)")) return set("2d", "reduced-motion");
    var nav = navigator, small = Math.min(screen.width || 0, screen.height || 0) <= 820;
    var weak = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4) ||
      (mm("(pointer: coarse)") && small) || !!(nav.connection && nav.connection.saveData);
    var tier = q === "high" ? "high" : q === "low" ? "low" : weak ? "low" : "high";
    var gl = c.getContext("webgl", { alpha: true, antialias: tier === "high", depth: false, stencil: false, premultipliedAlpha: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: tier === "high" && !q });
    if (!gl && tier === "high" && !q) { tier = "low"; gl = c.getContext("webgl", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" }); }
    if (!gl) return set("2d", "no-webgl");
    start(gl, tier);
  } catch (e) { set("2d", "error"); }

  function start(gl, tier) {
    var HI = tier === "high";
    var NX = HI ? 200 : 120, NZ = HI ? 112 : 64, ND = HI ? 420 : 160;
    var DPR = HI ? 1.5 : 1, BUDGET = HI ? 2.4e6 : 0.8e6, STEP = HI ? 0 : 33;

    var VS = [
      "attribute vec3 a;",
      "uniform mat4 uV, uP; uniform float uT, uS, uAmp, uLvl, uPs, uLeft; uniform vec2 uM; uniform vec4 uHole;",
      "varying float vA; varying vec3 vC;",
      "float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
      "float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }",
      "float fbm(vec2 p){ float s = 0.0, k = 0.5; for (int i = 0; i < 4; i++) { s += k * vn(p); p = p * 2.03 + vec2(1.7, 9.2); k *= 0.5; } return s; }",
      "void main(){",
      "  vec3 A = vec3(0.17, 0.64, 0.9), B = vec3(0.73, 0.65, 1.0);", // --sig-a #96e8ff, --sig-b #b9a6ff
      "  float X, Y, Z, al, d;",
      "  if (a.z < 0.5) {",
      "    X = a.x * 11.0; Z = -a.y * 24.0; d = a.y;",
      "    float f = uT * 0.32 + uS * 5.0;",
      "    vec2 q = vec2(X * 0.26, (Z - f) * 0.26);",
      "    float n = fbm(q), r = 1.0 - abs(n * 2.0 - 1.0); r *= r;",
      "    float side = 0.32 + 0.68 * smoothstep(0.6, 5.5, abs(X - 1.4));",
      "    float cur = exp(-pow(length(vec2(X - uM.x * 7.0, Z + 6.0 - uM.y * 3.0)) * 0.42, 2.0));",
      "    Y = (n * 1.1 + r * 1.2) * side * uAmp - 1.2 + cur * (0.55 + uLvl * 0.6);",
      "    al = smoothstep(0.0, 0.07, d) * (1.0 - smoothstep(0.55, 1.0, d)) * (1.0 - smoothstep(0.82, 1.0, abs(a.x)));",
      "    al *= 0.35 + 0.65 * smoothstep(0.25, 0.85, n + r * 0.4) + cur * 0.5;",
      "    vC = mix(A, B, clamp(d * 1.3 + (n - 0.5) * 0.6, 0.0, 1.0));",
      "  } else {",
      "    float s = a.z - 1.0;",
      "    X = a.x * 9.0; Z = -2.0 - a.y * 16.0; Y = -0.6 + fract(s * 7.31 + uT * (0.012 + s * 0.02)) * 4.2;",
      "    X += sin(uT * 0.2 + s * 40.0) * 0.4; d = a.y;",
      "    al = 0.5 * sin(3.14159 * fract(s * 7.31 + uT * (0.012 + s * 0.02))) * (1.0 - d * 0.7);",
      "    vC = mix(A, B, s);",
      "  }",
      "  vec4 v = uV * vec4(X, Y, Z, 1.0);",
      "  gl_Position = uP * v;",
      "  vec2 sp = gl_Position.xy / gl_Position.w;",
      "  al *= mix(uLeft, 1.0, smoothstep(-0.6, 0.45, sp.x));",
      // keep the field thin behind the portrait: an elliptical hole around .louis-host (uHole = centre, radii in NDC)
      "  float hd = length((sp - uHole.xy) / uHole.zw);",
      "  al *= mix(uHole.x > 8.0 ? 1.0 : 0.16, 1.0, smoothstep(0.55, 1.05, hd));",
      "  gl_PointSize = clamp(uPs * 3.2 / -v.z, 1.0, 4.0 * uPs);",
      "  vA = al;",
      "}"
    ].join("\n");
    var FS = [
      "precision mediump float;",
      "uniform float uPt, uK; varying float vA; varying vec3 vC;",
      "void main(){",
      "  float m = 1.0;",
      "  if (uPt > 0.5) { vec2 p = gl_PointCoord - 0.5; m = smoothstep(0.5, 0.1, length(p)); }",
      "  float a = vA * m * uK;",
      "  gl_FragColor = vec4(vC * a, a);",
      "}"
    ].join("\n");

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("shader");
      return s;
    }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(pr);

    // terrain grid (NX × NZ) then dust; z = 0 terrain, 1 + seed for dust
    var nT = NX * NZ, V = new Float32Array((nT + ND) * 3), k = 0, i, j;
    for (j = 0; j < NZ; j++) for (i = 0; i < NX; i++) { V[k++] = i / (NX - 1) * 2 - 1; V[k++] = j / (NZ - 1); V[k++] = 0; }
    var seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (i = 0; i < ND; i++) { V[k++] = rnd() * 2 - 1; V[k++] = rnd(); V[k++] = 1 + rnd() * 0.999; }
    // scanline rows: consecutive points along x on every row
    var I = new Uint16Array(NZ * (NX - 1) * 2); k = 0;
    for (j = 0; j < NZ; j++) for (i = 0; i < NX - 1; i++) { I[k++] = j * NX + i; I[k++] = j * NX + i + 1; }
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    var U = {}; ["uV", "uP", "uT", "uS", "uAmp", "uLvl", "uPs", "uLeft", "uM", "uPt", "uK", "uHole"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    function persp(fy, asp, n, f) {
      var t = 1 / Math.tan(fy / 2), r = 1 / (n - f);
      return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (n + f) * r, -1, 0, 0, 2 * n * f * r, 0];
    }
    function look(e, o) {
      var z = [e[0] - o[0], e[1] - o[1], e[2] - o[2]], l = Math.hypot(z[0], z[1], z[2]); z = [z[0] / l, z[1] / l, z[2] / l];
      var x = [z[2], 0, -z[0]]; l = Math.hypot(x[0], x[2]); x = [x[0] / l, 0, x[2] / l];
      var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
      return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
        -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
    }

    var hero = c.parentElement, w = 0, h = 0, dpr = 1, mobile = false, hole = [9, 9, 1, 1];
    function resize() {
      // phones: the portrait sits above the copy, so the field is cut to the portrait's box and fades out above the text
      var fig = document.querySelector(".louis-hero");
      if (fig && window.innerWidth < 760) c.style.height = Math.round(fig.getBoundingClientRect().bottom - hero.getBoundingClientRect().top + 24) + "px";
      else c.style.height = "";
      w = c.clientWidth; h = c.clientHeight; if (!w || !h) return;
      dpr = Math.min(DPR, window.devicePixelRatio || 1);
      if (w * h * dpr * dpr > BUDGET) dpr = Math.sqrt(BUDGET / (w * h));
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      gl.viewport(0, 0, c.width, c.height);
      mobile = w < 760;
      var lh = document.getElementById("louisHero"), cr = c.getBoundingClientRect(), r = lh && lh.getBoundingClientRect();
      if (r && r.width) hole = [((r.left + r.width / 2 - cr.left) / w) * 2 - 1, 1 - ((r.top + r.height * 0.45 - cr.top) / h) * 2, r.width * 0.42 / w * 2, r.height * 0.5 / h * 2];
      else hole = [9, 9, 1, 1];
    }

    var mx = 0, my = 0, tx = 0, ty = 0, on = true, raf = 0, last = 0, dead = false, t0 = performance.now();
    window.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
    function frame(now) {
      raf = 0;
      if (dead || !on || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (STEP && now - last < STEP) return;
      last = now;
      if (c.width !== Math.round(c.clientWidth * dpr) || !w) resize();
      if (!w) return;
      var t = (now - t0) / 1000, hh = hero.offsetHeight || h, s = Math.min(1, Math.max(0, window.scrollY / hh));
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      var lvl = parseFloat(root.style.getPropertyValue("--louis-level")) || 0;
      var e = [mx * 1.4, (mobile ? 2.2 : 1.7) - s * 0.6 - my * 0.3, 3.2 - s * 1.5], o = [mx * 0.5 + (mobile ? 0 : 0.6), 0.9 - s * 0.9, -12];
      gl.uniformMatrix4fv(U.uV, false, look(e, o));
      gl.uniformMatrix4fv(U.uP, false, persp((mobile ? 64 : 48) * Math.PI / 180, w / h, 0.1, 60));
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uS, s); gl.uniform1f(U.uAmp, 1 + s * 0.7); gl.uniform1f(U.uLvl, lvl);
      gl.uniform1f(U.uPs, dpr); gl.uniform1f(U.uLeft, mobile ? 0.5 : 0.2); gl.uniform2f(U.uM, mx, my); gl.uniform4f(U.uHole, hole[0], hole[1], hole[2], hole[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uPt, 0); gl.uniform1f(U.uK, HI ? 0.34 : 0.42);
      gl.drawElements(gl.LINES, I.length, gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(U.uPt, 1); gl.uniform1f(U.uK, 0.9);
      gl.drawArrays(gl.POINTS, 0, nT + ND);
    }
    function go() { if (!raf && !dead && on && !document.hidden) raf = requestAnimationFrame(frame); }
    function fail(why) {
      dead = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      set("2d", why); window.dispatchEvent(new Event("fx:2d"));
    }
    c.addEventListener("webglcontextlost", function (e) { fail("context-lost"); });
    document.addEventListener("visibilitychange", go);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { on = en[0].isIntersecting; go(); }).observe(c);
    window.addEventListener("resize", resize);
    set("webgl-" + tier, q || (tier === "low" ? "low-end" : "default"));
    resize();
    // one synchronous draw so a broken driver fails here (→ 2d) instead of leaving an empty layer
    frame(performance.now());
    if (gl.getError() !== gl.NO_ERROR) fail("gl-error");
  }
})();
