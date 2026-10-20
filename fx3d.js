/* ailiu.online preview v2 — r18 site background: one fixed wireframe scene behind every chapter (raw WebGL 1, no libraries,
   nothing loaded from other origins). White / grey hairlines on black with a faint glow and depth fog: a scanline terrain
   under the hero, a run of arches, stacked slabs, an arcade, a grid dome on a drum, slowly turning polyhedra, a contour
   hill and a ring of columns. Scrolling moves the camera along a path, one viewpoint per chapter; the mouse nudges it.
   Behind the reading blocks of the chapter on screen the lines are dimmed (rectangles measured every frame).
   Mode lands on <html data-fx>: "webgl-high" | "webgl-low" | "2d" (data-fx-why says why).
     ?fx=off → 2d · ?fx=low / ?fx=high → force a tier (WebGL still has to work).
     prefers-reduced-motion → 2d: one static frame of the same scene on a 2D canvas, no camera motion.
     No WebGL / shader failure / any throw / webglcontextlost → 2d (static frame, no errors).
     pointer: coarse, hardwareConcurrency ≤ 4, deviceMemory ≤ 4 or save-data → low (DPR ≤ 1, lighter scene, 30 fps).
   No rAF of its own: it draws from the shared clock in louis.js (window.FX_WAVE), which stops while the tab is hidden.
   wave() below mirrors FX_WAVE.at in the same screen frame (the viewport), so a crest lifts the terrain and the hero
   portrait together. */
(function () {
  "use strict";
  var root = document.documentElement;
  function set(mode, why) { root.setAttribute("data-fx", mode); root.setAttribute("data-fx-why", why); }
  set("2d", "init");
  var c = document.getElementById("fx3d"), c2 = document.getElementById("fx2d");
  var mm = function (s) { return !!(window.matchMedia && window.matchMedia(s).matches); };
  var q = (/[?&]fx=(off|low|high)\b/.exec(location.search) || [])[1];
  var nav = navigator;
  var weak = mm("(pointer: coarse)") || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) ||
    (nav.deviceMemory && nav.deviceMemory <= 4) || !!(nav.connection && nav.connection.saveData);

  /* ---------------------------------------------------------------- scene (shared by both renderers) */
  // one vertex = x y z · pivot x y z · brightness · kind (0 still, 1 terrain: rides the wave, ≥ 2 turns at kind − 2 rad/s)
  function build(lo) {
    var A = [], px = 0, py = 0, pz = 0, K = 0, i, k, a;
    var sm = function (e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    var h2 = function (x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    var vn = function (x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var a0 = h2(ix, iy) + (h2(ix + 1, iy) - h2(ix, iy)) * fx, a1 = h2(ix, iy + 1) + (h2(ix + 1, iy + 1) - h2(ix, iy + 1)) * fx;
      return a0 + (a1 - a0) * fy;
    };
    var fbm = function (x, y) { var s = 0, w = 0.5; for (var j = 0; j < 4; j++) { s += w * vn(x, y); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; w *= 0.5; } return s; };
    function L(p, q2, b) { A.push(p[0], p[1], p[2], px, py, pz, b, K, q2[0], q2[1], q2[2], px, py, pz, b, K); }
    function line(P, b, closed) { for (var j = 0; j < P.length - 1; j++) L(P[j], P[j + 1], b); if (closed) L(P[P.length - 1], P[0], b); }
    function ring(cx, y, cz, r, n, b) { var P = []; for (var j = 0; j < n; j++) { var t = j / n * 6.2832; P.push([cx + r * Math.cos(t), y, cz + r * Math.sin(t)]); } line(P, b, true); }
    function boxR(cx, cy, cz, sx, sy, sz, ang, b) {
      var co = Math.cos(ang), si = Math.sin(ang), v = [];
      for (var j = 0; j < 8; j++) {
        var x = (j & 1 ? sx : -sx), y = (j & 2 ? sy : -sy), z = (j & 4 ? sz : -sz);
        v.push([cx + co * x + si * z, cy + y, cz - si * x + co * z]);
      }
      [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { L(v[e[0]], v[e[1]], b); });
    }
    function box(x0, y0, z0, x1, y1, z1, b) { boxR((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, 0, b); }
    function column(x, z, r, h, b) {
      var n = lo ? 6 : 10, j;
      box(x - r * 1.45, 0, z - r * 1.45, x + r * 1.45, 0.45, z + r * 1.45, b * 0.8);
      box(x - r * 1.5, h - 0.55, z - r * 1.5, x + r * 1.5, h, z + r * 1.5, b * 0.8);
      for (j = 0; j < n; j++) { var t = j / n * 6.2832; L([x + r * Math.cos(t), 0.45, z + r * Math.sin(t)], [x + r * 0.86 * Math.cos(t), h - 0.55, z + r * 0.86 * Math.sin(t)], b); }
      ring(x, 0.45, z, r, n * 2, b * 0.7); ring(x, h - 0.55, z, r * 0.86, n * 2, b * 0.7);
    }
    function poly(V, E, b) { E.forEach(function (e) { L(V[e[0]], V[e[1]], b); }); }
    // edges = every pair of vertices at the shortest distance (works for the regular solids used here)
    function solid(V, cx, cy, cz, s, b) {
      var d = 1e9, E = [], j, l;
      for (j = 0; j < V.length; j++) for (l = j + 1; l < V.length; l++) d = Math.min(d, Math.hypot(V[j][0] - V[l][0], V[j][1] - V[l][1], V[j][2] - V[l][2]));
      for (j = 0; j < V.length; j++) for (l = j + 1; l < V.length; l++) if (Math.hypot(V[j][0] - V[l][0], V[j][1] - V[l][1], V[j][2] - V[l][2]) < d * 1.01) E.push([j, l]);
      poly(V.map(function (v) { return [cx + v[0] * s, cy + v[1] * s, cz + v[2] * s]; }), E, b);
    }
    var G = 1.618, ICO = [], OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], TET = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    [-1, 1].forEach(function (s1) { [-G, G].forEach(function (s2) { ICO.push([0, s1, s2], [s1, s2, 0], [s2, 0, s1]); }); });

    // 1 · hero: scanline terrain, a shallow valley along the camera path with hills either side (rows only, like the portrait)
    K = 1;
    var NX = lo ? 70 : 140, DZ = lo ? 0.95 : 0.5, z, x, row;
    for (z = 8; z >= -66; z -= DZ) {
      row = [];
      for (i = 0; i < NX; i++) {
        x = -40 + 80 * i / (NX - 1);
        var side = sm(3, 26, Math.abs(x - 1.5)), n = fbm(x * 0.1, z * 0.1), r = 1 - Math.abs(n * 2 - 1);
        row.push([x, ((n * 2.2 + r * r * 2.4) * (0.25 + 0.75 * side) + side * side * 3.6) * (1 - sm(-36, -62, z)), z]);
      }
      for (i = 0; i < NX - 1; i++) L(row[i], row[i + 1], 0.62 * (1 - sm(0.7, 1, Math.abs(row[i][0]) / 40)));
    }
    K = 0;
    // ground grid beyond the terrain, broken into 6-unit pieces so the fog falls off along each line
    for (x = -84; x <= 84; x += 6) for (z = -60; z > -342; z -= 6) L([x, 0, z], [x, 0, z - 6], 0.26);
    for (z = -60; z >= -342; z -= 6) for (x = -84; x < 84; x += 6) L([x, 0, z], [x + 6, 0, z], 0.26);

    // 2 · Aviso: a run of six arches the camera passes through
    var NA = lo ? 10 : 18;
    for (k = 0; k < 6; k++) {
      var az = -72 - k * 11, R = 7.2, rr = 5.8, H = 6.5, D = 1.4, O = [];
      O.push([-R, 0], [-R, H]);
      for (i = 1; i < NA; i++) { a = Math.PI - Math.PI * i / NA; O.push([R * Math.cos(a), H + R * Math.sin(a)]); }
      O.push([R, H], [R, 0], [rr, 0], [rr, H]);
      for (i = 1; i < NA; i++) { a = Math.PI * i / NA; O.push([rr * Math.cos(a), H + rr * Math.sin(a)]); }
      O.push([-rr, H], [-rr, 0]);
      var Fr = O.map(function (p) { return [p[0], p[1], az]; }), Bk = O.map(function (p) { return [p[0], p[1], az - D]; });
      line(Fr, 0.95, true); line(Bk, 0.6, true);
      for (i = 0; i < O.length; i++) if (i % 3 === 0 || O[i][1] === 0 || O[i][1] === H) L(Fr[i], Bk[i], 0.45);
    }

    // 3 · PrintPlay: a loose stack of thin slabs, a cube and a tetrahedron turning over it
    for (k = 0; k < 7; k++) boxR(-26, 0.3 + k * 0.85, -134, 7 - k * 0.55, 0.2, 5 - k * 0.4, k * 0.13 - 0.3, 0.8);
    px = -26; py = 10.5; pz = -134; K = 2.18; boxR(-26, 10.5, -134, 1.8, 1.8, 1.8, 0, 0.9);
    px = -19; py = 8; pz = -129; K = 2.3; solid(TET, -19, 8, -129, 1.5, 0.85);
    K = 0; px = py = pz = 0;

    // 4 · Design Work: an arcade (stylobate, two rows of columns, entablature) the camera tracks along
    for (k = 0; k < 3; k++) box(-47 + k, k * 0.5, -153.5 + k * 0.5 - 6, 47 - k, (k + 1) * 0.5, -146 - k * 0.5, 0.55);
    for (x = -42; x <= 42; x += 7) { column(x, -149, 0.75, 10.5, 0.85); column(x, -156, 0.75, 10.5, 0.5); }
    box(-44, 11.5, -157.5, 44, 12.9, -147.6, 0.75); box(-44.5, 12.9, -158, 44.5, 13.3, -147.1, 0.55);

    // 5 · Steam: a grid dome on a drum, on a stepped round base
    var DX = 30, DZZ = -196, DR = 12, NL = lo ? 16 : 28;
    for (k = 0; k < 3; k++) { ring(DX, k * 0.6, DZZ, DR + 2.6 - k * 0.9, 48, 0.5); ring(DX, k * 0.6 + 0.6, DZZ, DR + 2.6 - k * 0.9, 48, 0.5); }
    for (i = 0; i < NL; i++) { a = i / NL * 6.2832; L([DX + DR * Math.cos(a), 1.8, DZZ + DR * Math.sin(a)], [DX + DR * Math.cos(a), 8, DZZ + DR * Math.sin(a)], 0.7); }
    ring(DX, 1.8, DZZ, DR, 56, 0.7); ring(DX, 5, DZZ, DR, 56, 0.5); ring(DX, 8, DZZ, DR, 56, 0.8);
    for (k = 1; k < 9; k++) { var f = k / 9 * Math.PI / 2; ring(DX, 8 + DR * Math.sin(f), DZZ, DR * Math.cos(f), 56, 0.75); }
    for (i = 0; i < NL; i++) {
      a = i / NL * 6.2832; var P = [];
      for (k = 0; k <= 9; k++) { var ff = k / 9 * Math.PI / 2 * 0.93; P.push([DX + DR * Math.cos(ff) * Math.cos(a), 8 + DR * Math.sin(ff), DZZ + DR * Math.cos(ff) * Math.sin(a)]); }
      line(P, 0.75);
    }
    ring(DX, 19.9, DZZ, 1.5, 16, 0.8); ring(DX, 22, DZZ, 1.5, 16, 0.8);
    for (i = 0; i < 8; i++) { a = i / 8 * 6.2832; L([DX + 1.5 * Math.cos(a), 19.9, DZZ + 1.5 * Math.sin(a)], [DX + 1.5 * Math.cos(a), 22, DZZ + 1.5 * Math.sin(a)], 0.7); }

    // 6 · Suikou: polyhedra hanging in the air, each turning slowly about its own centre
    [[ICO, -22, 9, -228, 3.2, 2.12], [OCT, -31, 13, -236, 3.4, 2.2], [ICO, -13, 14, -238, 1.6, 2.32], [TET, -27, 5.5, -219, 1.6, 2.26],
      [OCT, -15, 6, -220, 1.5, 2.36], [ICO, -34, 6.5, -224, 1.1, 2.4]].forEach(function (s) {
      px = s[1]; py = s[2]; pz = s[3]; K = s[5]; solid(s[0], s[1], s[2], s[3], s[4], 0.85);
    });
    K = 0; px = py = pz = 0;

    // 7 · TaoTao: a contour hill, one irregular ring per level
    for (k = 0; k < 14; k++) {
      var rk = 24 * Math.pow(1 - k / 14, 0.8), CP = [], nc = lo ? 48 : 96;
      for (i = 0; i < nc; i++) { a = i / nc * 6.2832; var rad = rk * (1 + 0.22 * (fbm(Math.cos(a) * 1.4 + k * 0.17, Math.sin(a) * 1.4 + 3) - 0.5) * 2); CP.push([2 + rad * Math.cos(a), k * 1.15, -268 + rad * Math.sin(a)]); }
      line(CP, 0.7 - k * 0.015, true);
    }

    // 8 · Xiaoyi: a ring of columns on a round stepped base, with a ring beam
    var RX = 34, RZ = -302;
    for (k = 0; k < 3; k++) { ring(RX, k * 0.55, RZ, 12 - k * 0.8, 48, 0.5); ring(RX, (k + 1) * 0.55, RZ, 12 - k * 0.8, 48, 0.5); }
    for (i = 0; i < 12; i++) { a = i / 12 * 6.2832; (function (cx, cz) { var save = A.length; column(cx, cz, 0.55, 9.2, 0.85); for (var j = save; j < A.length; j += 8) A[j + 1] += 1.65; })(RX + 9 * Math.cos(a), RZ + 9 * Math.sin(a)); }
    ring(RX, 10.85, RZ, 10, 48, 0.75); ring(RX, 12, RZ, 10, 48, 0.75); ring(RX, 10.85, RZ, 8, 48, 0.55); ring(RX, 12, RZ, 8, 48, 0.55);
    for (i = 0; i < 24; i++) { a = i / 24 * 6.2832; L([RX + 8 * Math.cos(a), 12, RZ + 8 * Math.sin(a)], [RX + 10 * Math.cos(a), 12, RZ + 10 * Math.sin(a)], 0.45); }
    return new Float32Array(A);
  }

  /* ---------------------------------------------------------------- camera path */
  // [eye, look] at the start (A) and end (B) of each section: hero, 01–08, footer
  var PATH = {
    top: [[0, 2.6, 9, 1.5, 6.4, -30], [0, 3.6, -4, 1, 6, -44]],
    aviso: [[0, 4.2, -56, 0, 6.6, -124], [0, 4.8, -86, 0, 7, -146]],
    printplay: [[-9, 7.5, -110, -25, 5, -134], [-13, 10, -115, -25, 4, -136]],
    work: [[-34, 5.5, -130, -30, 6, -152], [30, 5.5, -130, 34, 6, -152]],
    steam: [[15, 2.5, -170, 30, 12, -196], [44, 3.6, -174, 30, 12, -196]],
    suikou: [[-6, 10, -206, -22, 9, -229], [-8, 15, -248, -22, 9, -229]],
    taotao: [[-14, 22, -240, 2, 4, -268], [16, 27, -244, 2, 4, -268]],
    xiaoyi: [[16, 6, -284, 34, 6, -302], [27, 4.5, -285, 34, 7, -302]],
    "wild-louis": [[0, 30, -150, 0, 0, -232], [0, 40, -130, 0, 0, -232]],
    contact: [[0, 70, -196, 0, 0, -214], [0, 70, -196, 0, 0, -214]]
  };
  var IDS = ["top", "aviso", "printplay", "work", "steam", "suikou", "taotao", "xiaoyi", "wild-louis", "contact"];
  var keys = [];
  function measure() {
    keys = [];
    var vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh), last = -1;
    IDS.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var t = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight, P = PATH[id];
      // positions are scroll offsets; the hero starts at 0 and the footer's pose is reached at the bottom of the page
      var ya = id === "top" ? 0 : id === "contact" ? max : t - vh * 0.35 + h * 0.18, yb = id === "top" ? vh * 0.5 : id === "contact" ? max : t + h * 0.82 - vh * 0.65;
      ya = Math.min(max, Math.max(last + 1, ya)); yb = Math.min(max, Math.max(ya, yb));
      keys.push([ya, P[0]], [yb, P[1]]); last = yb;
    });
  }
  function pose(y, out) {
    var j = 0;
    if (!keys.length) { for (j = 0; j < 6; j++) out[j] = PATH.top[0][j]; return out; }
    while (j < keys.length - 1 && keys[j + 1][0] <= y) j++;
    var a = keys[j], b = keys[Math.min(keys.length - 1, j + 1)], f = b[0] > a[0] ? Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0]))) : 0;
    f = f * f * (3 - 2 * f);
    for (var k = 0; k < 6; k++) out[k] = a[1][k] + (b[1][k] - a[1][k]) * f;
    return out;
  }
  function persp(fy, asp, n, f) {
    var t = 1 / Math.tan(fy / 2), r = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (n + f) * r, -1, 0, 0, 2 * n * f * r, 0];
  }
  function look(e, o) {
    var z = [e[0] - o[0], e[1] - o[1], e[2] - o[2]], l = Math.hypot(z[0], z[1], z[2]); z = [z[0] / l, z[1] / l, z[2] / l];
    var x = [z[2], 0, -z[0]]; l = Math.hypot(x[0], x[2]) || 1; x = [x[0] / l, 0, x[2] / l];
    var y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  }
  // reading blocks: the lines behind whichever of these are on screen are dimmed (up to four, largest first)
  var READ = ".hero-copy, .slots, .wk-side, .wcase-text, .st-block, .foot-grid, .made-copy, .made-log, .foot-meta";
  var readEls = [];
  function rects(vw, vh, pad) {
    var out = [];
    for (var i = 0; i < readEls.length; i++) {
      var r = readEls[i].getBoundingClientRect();
      if (r.width < 2 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      out.push([r.left - pad, r.top - pad, r.right + pad, r.bottom + pad, r.width * Math.min(r.bottom, vh) - r.width * Math.max(r.top, 0)]);
    }
    return out.sort(function (a, b) { return b[4] - a[4]; }).slice(0, 4);
  }

  /* ---------------------------------------------------------------- 2D fallback: one static frame of the hero view */
  function flat() {
    if (!c2) return;
    if (c) c.style.display = "none";
    var ctx = c2.getContext("2d"); if (!ctx) return;
    var V = build(true), drawn = 0;
    function paint() {
      var w = c2.clientWidth, h = c2.clientHeight; if (!w || !h) return;
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      c2.width = Math.round(w * dpr); c2.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var mob = w < 760, P = PATH.top[0], Vm = look([P[0], P[1], P[2]], [P[3], P[4], P[5]]), t = 1 / Math.tan((mob ? 62 : 50) * Math.PI / 360);
      var bins = [[], [], [], [], [], []], K = mob ? 0.4 : 0.5;
      var pr = function (o, i) {   // → [screen x, screen y, view depth]
        var x = V[o], y = V[o + 1], z = V[o + 2];
        var vx = Vm[0] * x + Vm[4] * y + Vm[8] * z + Vm[12], vy = Vm[1] * x + Vm[5] * y + Vm[9] * z + Vm[13], vz = Vm[2] * x + Vm[6] * y + Vm[10] * z + Vm[14];
        return [vx, vy, vz];
      };
      for (var o = 0; o < V.length; o += 16) {
        var a = pr(o), b = pr(o + 8);
        if (a[2] > -0.5 && b[2] > -0.5) continue;
        if (a[2] > -0.5 || b[2] > -0.5) {   // clip to the near plane
          var s = (-0.5 - a[2]) / (b[2] - a[2]), m = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, -0.5];
          if (a[2] > -0.5) a = m; else b = m;
        }
        var d = -(a[2] + b[2]) / 2, al = V[o + 6] * Math.exp(-d * 0.02) * K;
        if (al < 0.02) continue;
        var bi = Math.min(5, al * 12 | 0);
        bins[bi].push(w / 2 + a[0] / -a[2] * t * h / 2, h / 2 - a[1] / -a[2] * t * h / 2, w / 2 + b[0] / -b[2] * t * h / 2, h / 2 - b[1] / -b[2] * t * h / 2);
      }
      ctx.clearRect(0, 0, w, h); ctx.lineWidth = 1;
      bins.forEach(function (L, i) {
        if (!L.length) return;
        ctx.strokeStyle = "rgba(236,238,242," + ((i + 0.5) / 12).toFixed(3) + ")"; ctx.beginPath();
        for (var j = 0; j < L.length; j += 4) { ctx.moveTo(L[j], L[j + 1]); ctx.lineTo(L[j + 2], L[j + 3]); }
        ctx.stroke();
      });
      drawn = w;
    }
    c2.style.display = "block";
    paint();
    window.addEventListener("resize", function () { if (c2.clientWidth !== drawn) paint(); });
  }

  /* ---------------------------------------------------------------- WebGL */
  function start(gl, tier) {
    var HI = tier === "high";
    var DPR = HI ? 1.5 : 1, BUDGET = HI ? 3.2e6 : 1.1e6;
    var W = window.FX_WAVE;
    if (!W) throw new Error("no clock");

    var VS = [
      "attribute vec3 aP, aC; attribute vec2 aM;",
      "uniform mat4 uV, uP; uniform float uT, uFog; uniform vec4 uW, uWP; uniform vec2 uWS, uOff;",
      "varying float vA;",
      // FX_WAVE.at(x, u) — uW = freq, phase, bend, t · uWP = pointer x, u, k, aspect · uWS = scale × amp, scroll
      "float wave(vec2 p){ float s = 0.5 + 0.5 * sin(6.2832 * uW.x * p.y - uW.y + uW.z * sin(p.x * 5.0 + uW.w * 0.4));",
      "  vec2 d = vec2((p.x - uWP.x) * uWP.w, p.y - uWP.y); float b = uWP.z * exp(-dot(d, d) / 0.01);",
      "  return uWS.x * ((1.0 + 0.6 * uWS.y) * s * s * s + 0.7 * b); }",
      "void main(){",
      "  vec3 p = aP; float k = aM.y, w = 0.0;",
      "  if (k > 1.5) {",
      "    vec3 q = p - aC; float a = uT * (k - 2.0), c = cos(a), s = sin(a), t = 0.35 + fract(aC.x * 0.37) * 0.5, ct = cos(t), st = sin(t);",
      "    q = vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z);",
      "    q = vec3(q.x, ct * q.y - st * q.z, st * q.y + ct * q.z);",
      "    p = aC + q + vec3(0.0, 0.35 * sin(uT * 0.4 + aC.x), 0.0);",
      "  }",
      "  vec4 v = uV * vec4(p, 1.0), b = uP * v;",
      "  float terr = step(0.5, k) * step(k, 1.5);",
      "  if (b.w > 0.0) w = wave(vec2(0.5 + 0.5 * b.x / b.w, 0.5 - 0.5 * b.y / b.w));",
      "  v.y += terr * w * 0.55;",            // a lift along the view-space up axis, the same in every pose
      "  gl_Position = uP * v;",
      "  gl_Position.xy += uOff * gl_Position.w;",
      "  float d = -v.z;",
      "  vA = aM.x * exp(-d * uFog) * smoothstep(0.8, 4.0, d) * (1.0 - terr * smoothstep(26.0, 70.0, d)) * (1.0 + w * mix(0.25, 0.9, terr));",
      "}"
    ].join("\n");
    var FS = [
      "precision mediump float;",
      "uniform float uK, uDim; uniform vec4 uR[4]; uniform vec4 uHole; varying float vA;",
      "void main(){",
      "  vec2 p = gl_FragCoord.xy; float m = 1.0;",
      "  for (int i = 0; i < 4; i++) { vec2 d = max(uR[i].xy - p, p - uR[i].zw); m = min(m, mix(uDim, 1.0, smoothstep(-12.0, 48.0, max(d.x, d.y)))); }",
      "  float hd = length((p - uHole.xy) / uHole.zw); m *= mix(0.2, 1.0, smoothstep(0.55, 1.05, hd));",
      "  float a = vA * uK * m;",
      "  gl_FragColor = vec4(vec3(0.93, 0.94, 0.96) * a, a);",
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

    var V = build(!HI), NV = V.length / 8;
    var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);
    [["aP", 3, 0], ["aC", 3, 12], ["aM", 2, 24]].forEach(function (s) {
      var l = gl.getAttribLocation(pr, s[0]); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s[1], gl.FLOAT, false, 32, s[2]);
    });
    var U = {}; ["uV", "uP", "uT", "uFog", "uW", "uWP", "uWS", "uOff", "uK", "uDim", "uR", "uHole"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    var w = 0, h = 0, dpr = 1, mobile = false, fig = null, lh = null, R = new Float32Array(16);
    function resize() {
      w = c.clientWidth; h = c.clientHeight; if (!w || !h) return;
      dpr = Math.min(DPR, window.devicePixelRatio || 1);
      if (w * h * dpr * dpr > BUDGET) dpr = Math.sqrt(BUDGET / (w * h));
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      gl.viewport(0, 0, c.width, c.height);
      mobile = w < 760;
      readEls = Array.prototype.slice.call(document.querySelectorAll(READ));
      fig = document.querySelector(".louis-hero"); lh = document.getElementById("louisHero");
      measure();
    }

    var mx = 0, my = 0, dead = false, E = [0, 0, 0, 0, 0, 0], lastMeasure = 0, hy = -1, hx = -1;
    function frame(now) {
      if (dead) return;
      try { draw(now || 0); } catch (e) { fail("error"); }
    }
    function draw(now) {
      if (c.width !== Math.round(c.clientWidth * dpr) || !w) resize();
      if (!w) return;
      if (now - lastMeasure > 1000) { lastMeasure = now; measure(); }   // folds open and close; the path follows
      var t = W.t, P = W.pointer, i;
      mx += ((P.x * 2 - 1) * P.k - mx) * 0.04; my += ((P.y * 2 - 1) * P.k - my) * 0.04;
      pose(scrollY, E);
      var e = [E[0] + mx * 1.3 + Math.sin(t * 0.07) * 0.6, E[1] - my * 0.6 + Math.sin(t * 0.05 + 1) * 0.3, E[2]];
      var o = [E[3] + mx * 0.6 + Math.sin(t * 0.06 + 2) * 0.8, E[4] - my * 0.4, E[5]];
      gl.uniformMatrix4fv(U.uV, false, look(e, o));
      gl.uniformMatrix4fv(U.uP, false, persp((mobile ? 62 : 50) * Math.PI / 180, w / h, 0.3, 400));
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uFog, 0.019);
      gl.uniform4f(U.uW, W.freq, W.phase, W.bend, t); gl.uniform4f(U.uWP, P.x, P.y, P.k, W.aspect); gl.uniform2f(U.uWS, W.scale * W.amp, W.scroll);
      // reading blocks → device-pixel rectangles (GL y is up)
      var rs = rects(w, h, mobile ? 10 : 22);
      for (i = 0; i < 4; i++) {
        var r = rs[i];
        if (r) { R[i * 4] = r[0] * dpr; R[i * 4 + 1] = (h - r[3]) * dpr; R[i * 4 + 2] = r[2] * dpr; R[i * 4 + 3] = (h - r[1]) * dpr; }
        else { R[i * 4] = R[i * 4 + 1] = R[i * 4 + 2] = R[i * 4 + 3] = -1e4; }
      }
      gl.uniform4fv(U.uR, R); gl.uniform1f(U.uDim, mobile ? 0.12 : 0.18);
      // the hero portrait's head: the lines thin out behind it; its shoulders sit on the terrain
      var hr = lh && lh.getBoundingClientRect();
      if (hr && hr.width && hr.bottom > 0) {
        var ph = Math.min(hr.height * 0.98, hr.width / 0.747);
        gl.uniform4f(U.uHole, (hr.left + hr.width / 2) * dpr, (h - (hr.bottom - ph * 0.6)) * dpr, ph * 0.34 * dpr, ph * 0.42 * dpr);
      } else gl.uniform4f(U.uHole, -1e5, -1e5, 1, 1);
      // the portrait drifts a little against the camera (pointer) and lags the scroll, so it sits in the scene
      if (fig) {
        var nx = Math.round(-mx * 10), ny = Math.round(Math.min(scrollY, h) * 0.12);
        if (nx !== hx || ny !== hy) { hx = nx; hy = ny; fig.style.translate = nx + "px " + ny + "px"; }
      }
      var K = (HI ? 0.5 : 0.62) * (mobile ? 0.8 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uOff, 0, 0); gl.uniform1f(U.uK, K);
      gl.drawArrays(gl.LINES, 0, NV);
      if (HI) {
        // glow: the same lines twice more, a pixel and a bit off either way, faint
        gl.uniform1f(U.uK, K * 0.28);
        gl.uniform2f(U.uOff, 2.6 / c.width * dpr, 1.2 / c.height * dpr); gl.drawArrays(gl.LINES, 0, NV);
        gl.uniform2f(U.uOff, -1.2 / c.width * dpr, -2.6 / c.height * dpr); gl.drawArrays(gl.LINES, 0, NV);
      }
    }
    var subbed = false;
    function go() { var want = !dead; if (want !== subbed) { subbed = want; want ? W.sub(frame) : W.unsub(frame); } }
    function fail(why) {
      dead = true; go(); W.on = false;
      if (fig) fig.style.translate = "";
      set("2d", why);
      try { flat(); } catch (e) {}
      window.dispatchEvent(new Event("fx:2d"));
    }
    c.addEventListener("webglcontextlost", function () { fail("context-lost"); });
    window.addEventListener("resize", resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener("load", measure);
    set("webgl-" + tier, q || (tier === "low" ? "low-end" : "default"));
    // the low tier slows the shared clock and softens the wave for the portrait too
    W.scale = HI ? 1 : 0.6; W.fps = HI ? 60 : 30;
    resize();
    // one synchronous draw so a broken driver fails here (→ 2d) instead of leaving an empty layer
    draw(0);
    if (gl.getError() !== gl.NO_ERROR) return fail("gl-error");
    W.on = true;
    go();
  }

  // boot last: the scene, the path and the renderers above are all defined by now
  try {
    if (!c) { flat(); return set("2d", "no-canvas"); }
    if (q === "off") { flat(); return set("2d", "param"); }
    if (mm("(prefers-reduced-motion: reduce)")) { flat(); return set("2d", "reduced-motion"); }
    var tier = q === "high" ? "high" : q === "low" ? "low" : weak ? "low" : "high";
    var gl = c.getContext("webgl", { alpha: true, antialias: tier === "high", depth: false, stencil: false, premultipliedAlpha: true, powerPreference: "low-power", failIfMajorPerformanceCaveat: tier === "high" && !q });
    if (!gl && tier === "high" && !q) { tier = "low"; gl = c.getContext("webgl", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" }); }
    if (!gl) { flat(); return set("2d", "no-webgl"); }
    start(gl, tier);
  } catch (e) { try { flat(); } catch (_) {} set("2d", "error"); }
})();
