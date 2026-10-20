/* ailiu.online preview v2 — r19 site background: one fixed wireframe scene behind every chapter (raw WebGL 1, no libraries,
   nothing loaded from other origins). An original building complex drawn as a fine line model: scanline-and-grid hills under
   the hero, a grand stair and gatehouse, a colonnade, a two-storey arcaded atrium, a domed hall, a barrel-vaulted gallery,
   a garden court with a pool and cypresses, a round temple and a high terrace. Main outlines bright, details dim, distance
   foggier; sparse stars overhead, small bright points on the model's vertices, a faint mirror image in the floor.
   Scrolling moves the camera along one spline through the complex (one node pair per chapter, PATH below); the mouse nudges it.
   Behind the reading blocks of the chapter on screen the lines are thinned and dimmed (rectangles measured every frame);
   behind the hero copy that falls off softly (an ellipse), so there is no visible block.
   Mode lands on <html data-fx>: "webgl-high" | "webgl-low" | "2d" (data-fx-why says why).
     ?fx=off → 2d · ?fx=low / ?fx=high → force a tier (WebGL still has to work).
     prefers-reduced-motion → 2d: one static frame of the same scene on a 2D canvas, no camera motion.
     No WebGL / shader failure / any throw / webglcontextlost → 2d (static frame, no errors).
     pointer: coarse, hardwareConcurrency ≤ 4, deviceMemory ≤ 4 or save-data → low (DPR ≤ 1, lighter scene, no mirror, 30 fps).
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
  var PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------- scene (shared by both renderers) */
  // one vertex = x y z · floor y (mirror plane), random (thinning / twinkle), 0 · brightness · kind
  // kind: 0 still · 1 terrain (rides the wave) · 2 star (no fog, twinkles) · 3 vertex point
  // returns { L: line vertices (pairs), P: point vertices }
  function build(lo) {
    var A = [], S = [], FL = 0, K = 0, seed = 11, i, j, k, a, x, z;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var sm = function (e0, e1, v) { var t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    var h2 = function (x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    var vn = function (x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
      var a0 = h2(ix, iy) + (h2(ix + 1, iy) - h2(ix, iy)) * fx, a1 = h2(ix, iy + 1) + (h2(ix + 1, iy + 1) - h2(ix, iy + 1)) * fx;
      return a0 + (a1 - a0) * fy;
    };
    var fbm = function (x, y) { var s = 0, w = 0.5; for (var j = 0; j < 4; j++) { s += w * vn(x, y); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; w *= 0.5; } return s; };
    function L(p, q2, b) { var r = rnd(); A.push(p[0], p[1], p[2], FL, r, 0, b, K, q2[0], q2[1], q2[2], FL, r, 0, b, K); }
    function pt(p, b) { S.push(p[0], p[1], p[2], FL, rnd(), 0, b, 3); }
    function line(P, b, closed) { for (var j = 0; j < P.length - 1; j++) L(P[j], P[j + 1], b); if (closed) L(P[P.length - 1], P[0], b); }
    // a long straight line in pieces of ≤ len, so the per-vertex fog falls off along it
    function seg(p, q2, b, len) {
      var n = Math.max(1, Math.ceil(Math.hypot(q2[0] - p[0], q2[1] - p[1], q2[2] - p[2]) / (len || 4))), j, f0, f1;
      for (j = 0; j < n; j++) {
        f0 = j / n; f1 = (j + 1) / n;
        L([p[0] + (q2[0] - p[0]) * f0, p[1] + (q2[1] - p[1]) * f0, p[2] + (q2[2] - p[2]) * f0], [p[0] + (q2[0] - p[0]) * f1, p[1] + (q2[1] - p[1]) * f1, p[2] + (q2[2] - p[2]) * f1], b);
      }
    }
    function ring(cx, y, cz, r, n, b) { var P = []; for (var j = 0; j < n; j++) { var t = j / n * TAU; P.push([cx + r * Math.cos(t), y, cz + r * Math.sin(t)]); } line(P, b, true); }
    function rect(x0, z0, x1, z1, y, b) { seg([x0, y, z0], [x1, y, z0], b); seg([x1, y, z0], [x1, y, z1], b); seg([x1, y, z1], [x0, y, z1], b); seg([x0, y, z1], [x0, y, z0], b); }
    function box(x0, y0, z0, x1, y1, z1, b, hl) {
      rect(x0, z0, x1, z1, y0, b * 0.8); rect(x0, z0, x1, z1, y1, b);
      [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(function (p) { seg([p[0], y0, p[1]], [p[0], y1, p[1]], b); if (hl) pt([p[0], y1, p[1]], hl); });
    }
    // a moulding: a stack of rectangles stepping out (or in) around a footprint; prof = [[dy, out, b], …]
    function mould(x0, z0, x1, z1, y, prof) {
      prof.forEach(function (m, j) {
        var o = m[1]; rect(x0 - o, z0 - o, x1 + o, z1 + o, y + m[0], m[2]);
        if (j) { var p = prof[j - 1], po = p[1]; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) {
          var X = s[0] < 0 ? x0 : x1, Z = s[1] < 0 ? z0 : z1;
          L([X + s[0] * po, y + p[0], Z + s[1] * po], [X + s[0] * o, y + m[0], Z + s[1] * o], m[2] * 0.7);
        }); }
      });
    }
    // points on a vertical arc: centre o, horizontal unit u in the arc's plane, radius r, angles a0 → a1
    function arc(o, u, r, a0, a1, n) {
      var P = []; for (var j = 0; j <= n; j++) { var t = a0 + (a1 - a0) * j / n; P.push([o[0] + u[0] * r * Math.cos(t), o[1] + r * Math.sin(t), o[2] + u[2] * r * Math.cos(t)]); }
      return P;
    }
    var add = function (p, v, s) { return [p[0] + v[0] * s, p[1] + v[1] * s, p[2] + v[2] * s]; };

    // column: plinth, base mouldings, a fluted shaft with entasis (arrises bright, grooves dim), echinus and abacus
    function column(x, z, y0, r, h, b) {
      var nf = lo ? 8 : 16, ns = lo ? 2 : 4, rs = lo ? 12 : 24, ys = y0 + r, yt = y0 + h - r, j, s, P, P2;
      box(x - 1.4 * r, y0, z - 1.4 * r, x + 1.4 * r, y0 + 0.28 * r, z + 1.4 * r, b * 0.7, lo ? 0 : 0.5);
      (lo ? [[0.5, 1.22], [0.86, 1.1]] : [[0.4, 1.28], [0.58, 1.18], [0.72, 1.06], [0.88, 1.12]]).forEach(function (m) { ring(x, y0 + m[0] * r, z, m[1] * r, rs, b * 0.55); });
      for (j = 0; j < nf; j++) {
        a = j / nf * TAU; P = []; P2 = [];
        for (s = 0; s <= ns; s++) {
          var f = s / ns, rad = r * (1 - 0.14 * f + 0.035 * Math.sin(f * PI));
          P.push([x + rad * Math.cos(a), ys + (yt - ys) * f, z + rad * Math.sin(a)]);
          if (!lo) P2.push([x + rad * 0.9 * Math.cos(a + PI / nf), ys + (yt - ys) * f, z + rad * 0.9 * Math.sin(a + PI / nf)]);
        }
        line(P, b); if (!lo) line(P2, b * 0.32);
      }
      ring(x, ys, z, r * 1.02, rs, b * 0.6); ring(x, yt - 0.12 * r, z, r * 0.95, rs, b * 0.6);
      if (!lo) for (s = 1; s < 4; s++) ring(x, ys + (yt - ys) * s / 4, z, r * (1 - 0.14 * s / 4 + 0.03), rs, b * 0.18);
      (lo ? [[0.05, 0.94], [0.45, 1.3]] : [[0.05, 0.94], [0.22, 1.06], [0.36, 1.2], [0.47, 1.32]]).forEach(function (m) { ring(x, yt + m[0] * r, z, m[1] * r, rs, b * 0.7); });
      box(x - 1.45 * r, yt + 0.5 * r, z - 1.45 * r, x + 1.45 * r, yt + r, z + 1.45 * r, b * 0.9, 0.9);
    }
    // entablature over a rectangular footprint: three fasciae, a frieze with triglyph marks, dentils, corona and sima
    var EP = [[0, 0, 0.8], [0.38, 0.04, 0.4], [0.76, 0.08, 0.4], [1.1, 0.12, 0.75], [1.22, 0.12, 0.35], [2.0, 0.14, 0.5],
      [2.16, 0.3, 0.45], [2.42, 0.56, 0.85], [2.6, 0.62, 0.45], [2.8, 0.78, 0.9]];
    function entab(x0, z0, x1, z1, y, b) {
      mould(x0, z0, x1, z1, y, EP.map(function (m) { return [m[0], m[1], m[2] * b]; }));
      if (lo) return;
      var sides = [[[x0, z0], [x1, z0], [0, -1]], [[x1, z0], [x1, z1], [1, 0]], [[x1, z1], [x0, z1], [0, 1]], [[x0, z1], [x0, z0], [-1, 0]]];
      sides.forEach(function (sd) {
        var p = sd[0], q2 = sd[1], nn = sd[2], len = Math.hypot(q2[0] - p[0], q2[1] - p[1]), j, n;
        n = Math.floor(len / 1.3);
        for (j = 1; j < n; j++) {                      // triglyph marks: two short verticals in the frieze
          var f = j / n, X = p[0] + (q2[0] - p[0]) * f + nn[0] * 0.13, Z = p[1] + (q2[1] - p[1]) * f + nn[1] * 0.13;
          L([X, y + 1.3, Z], [X, y + 1.92, Z], b * 0.3);
        }
        n = Math.floor(len / 0.42);
        for (j = 1; j < n; j++) {                      // dentils
          var g = j / n, X2 = p[0] + (q2[0] - p[0]) * g + nn[0] * 0.32, Z2 = p[1] + (q2[1] - p[1]) * g + nn[1] * 0.32;
          L([X2, y + 2.16, Z2], [X2, y + 2.36, Z2], b * 0.28);
        }
      });
      [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(function (p) { pt([p[0] + (p[0] === x0 ? -0.78 : 0.78), y + 2.8, p[1] + (p[1] === z0 ? -0.78 : 0.78)], 1); });
    }
    // pediment on the short (x) sides of a footprint: raking cornice (doubled), tympanum, ridge
    function pediment(x0, x1, za, zb, y, hg, b) {
      var cx = (x0 + x1) / 2;
      [za, zb].forEach(function (z, j) {
        var bb = j ? b * 0.6 : b;
        line([[x0 - 0.8, y, z], [cx, y + hg, z], [x1 + 0.8, y, z]], bb);
        line([[x0 - 0.4, y + 0.3, z], [cx, y + hg - 0.35, z], [x1 + 0.4, y + 0.3, z]], bb * 0.55);
        line([[x0 + 0.4, y + 0.55, z], [cx, y + hg - 0.75, z], [x1 - 0.4, y + 0.55, z]], bb * 0.3);
        pt([cx, y + hg, z], 1);
      });
      seg([cx, y + hg, za], [cx, y + hg, zb], b * 0.7);
      seg([x0 - 0.8, y, za], [x0 - 0.8, y, zb], b * 0.5); seg([x1 + 0.8, y, za], [x1 + 0.8, y, zb], b * 0.5);
      if (!lo) for (var zi = 1; zi < 8; zi++) { var zz = za + (zb - za) * zi / 8; line([[x0 - 0.8, y, zz], [cx, y + hg, zz], [x1 + 0.8, y, zz]], b * 0.16); }
    }
    // an arch on two faces (centre o at the springing, u along the face, n through the depth): voussoir joints, keystone, intrados
    function arch(o, u, n, r, R, D, nv, b) {
      var o2 = add(o, n, D), ni = lo ? nv : nv * 2;
      line(arc(o, u, r, 0, PI, ni), b); line(arc(o, u, R, 0, PI, ni), b * 0.8);
      line(arc(o2, u, r, 0, PI, ni), b * 0.5); line(arc(o2, u, R, 0, PI, ni), b * 0.4);
      for (var j = 0; j <= nv; j++) {
        var t = j / nv * PI, ci = Math.cos(t), si = Math.sin(t);
        var pi = [o[0] + u[0] * r * ci, o[1] + r * si, o[2] + u[2] * r * ci], po = [o[0] + u[0] * R * ci, o[1] + R * si, o[2] + u[2] * R * ci];
        if (j > 0 && j < nv) L(pi, po, b * (j * 2 === nv ? 0.9 : 0.42));
        if (!lo || j % 2 === 0) L(pi, add(pi, n, D), b * 0.3);
      }
      pt([o[0], o[1] + R, o[2]], 0.95); pt([o[0] + u[0] * R, o[1], o[2] + u[2] * R], 0.7); pt([o[0] - u[0] * R, o[1], o[2] - u[2] * R], 0.7);
    }
    // a stair going towards −z from (x0..x1, y0, z0): nosings bright, risers dim, stepped side profiles, stone joints
    function stair(x0, x1, z0, y0, n, rise, run, b) {
      for (var j = 0; j < n; j++) {
        var yb = y0 + j * rise, yt = yb + rise, zf = z0 - j * run, zb = zf - run;
        seg([x0, yt, zf], [x1, yt, zf], b, 3); seg([x0, yb, zf], [x1, yb, zf], b * 0.3, 3);
        [x0, x1].forEach(function (X) { L([X, yb, zf], [X, yt, zf], b * 0.7); L([X, yt, zf], [X, yt, zb], b * 0.7); });
        if (!lo) for (var X = x0 + 2.25; X < x1 - 0.5; X += 2.25) L([X + (j & 1) * 1.1, yb, zf], [X + (j & 1) * 1.1, yt, zf], b * 0.2);
        pt([x0, yt, zf], 0.8); pt([x1, yt, zf], 0.8);
      }
    }
    // a lat-long dome (hemisphere radius R on y0): ribs every fourth meridian brighter, coffers as doubled parallels
    function dome(cx, y0, cz, R, nl, nr, b) {
      var j, l, P;
      for (j = 0; j < nl; j++) {
        a = j / nl * TAU; P = [];
        for (l = 0; l <= nr; l++) { var f = l / nr * PI / 2 * 0.94; P.push([cx + R * Math.cos(f) * Math.cos(a), y0 + R * Math.sin(f), cz + R * Math.cos(f) * Math.sin(a)]); }
        line(P, j % 4 ? b * 0.55 : b);
      }
      for (l = 1; l <= nr; l++) {
        var g = l / nr * PI / 2 * 0.94, rr = R * Math.cos(g), yy = y0 + R * Math.sin(g);
        ring(cx, yy, cz, rr, nl, b * 0.6);
        if (!lo && l < nr) ring(cx, yy + R * 0.018, cz, rr * 0.998, nl, b * 0.25);
        if (l % 3 === 0) for (j = 0; j < nl; j += 4) { a = j / nl * TAU; pt([cx + rr * Math.cos(a), yy, cz + rr * Math.sin(a)], 0.8); }
      }
      ring(cx, y0, cz, R, nl * 2, b);
    }
    // a cypress: a spindle of meridians and parallels
    function cypress(x, y0, z, hg, r, b) {
      var nl = lo ? 6 : 10, nr = lo ? 4 : 8, j, l, P;
      var rad = function (f) { return r * Math.pow(Math.sin(PI * Math.pow(f, 0.8)), 0.9); };
      for (j = 0; j < nl; j++) { a = j / nl * TAU; P = []; for (l = 0; l <= nr; l++) { var f = l / nr; P.push([x + rad(f) * Math.cos(a), y0 + 0.6 + f * hg, z + rad(f) * Math.sin(a)]); } line(P, b); }
      for (l = 1; l < nr; l++) ring(x, y0 + 0.6 + l / nr * hg, z, rad(l / nr), nl, b * 0.7);
      L([x, y0, z], [x, y0 + 0.6, z], b); pt([x, y0 + 0.6 + hg, z], 0.8);
    }

    var Y0 = 4.8;   // the podium the complex stands on

    // 0 · hero: hills either side of a shallow valley, scanline rows plus cross lines (the portrait's language, as a mesh)
    K = 1;
    var NX = lo ? 64 : 150, DZ = lo ? 1.3 : 0.6, rows = [], row;
    for (z = 7; z >= -44; z -= DZ) {
      row = [];
      for (i = 0; i < NX; i++) {
        x = -46 + 92 * i / (NX - 1);
        var side = sm(5, 30, Math.abs(x - 1)), n = fbm(x * 0.09, z * 0.09), r = 1 - Math.abs(n * 2 - 1);
        row.push([x, ((n * 2.2 + r * r * 2.6) * (0.2 + 0.8 * side) + side * side * 4.2) * (1 - sm(-30, -43, z)), z]);
      }
      rows.push(row);
    }
    rows.forEach(function (row, ri) {
      for (i = 0; i < NX - 1; i++) L(row[i], row[i + 1], 0.55 * (1 - sm(0.75, 1, Math.abs(row[i][0]) / 46)));
      if (ri) for (i = 0; i < NX; i += lo ? 2 : 2) L(rows[ri - 1][i], row[i], 0.24 * (1 - sm(0.75, 1, Math.abs(row[i][0]) / 46)));
    });
    K = 0;
    // forecourt (y 0) and the open ground around the podium: a perspective grid, finer near the route
    var g0 = lo ? 4 : 2;
    for (x = -30; x <= 30; x += g0) seg([x, 0, -44], [x, 0, -58], 0.24);
    for (z = -44; z >= -58; z -= g0) seg([-30, 0, z], [30, 0, z], 0.24);
    var g1 = lo ? 16 : 8;
    for (x = -160; x <= 240; x += g1) seg([x, 0, -58], [x, 0, -420], 0.17, 8);
    for (z = -58; z >= -420; z -= g1) seg([-160, 0, z], [240, 0, z], 0.17, 8);

    // podium: front wall at z −58 with base and cornice mouldings, sides and back; a fine paving grid on top
    var PX0 = -40, PX1 = 124, PZ0 = -58, PZ1 = -292;
    mould(PX0, PZ1, PX1, PZ0, 0, [[0, 0.5, 0.45], [0.3, 0.35, 0.35], [0.5, 0, 0.5]]);
    mould(PX0, PZ1, PX1, PZ0, Y0 - 0.8, [[0, 0, 0.5], [0.3, 0.2, 0.4], [0.55, 0.42, 0.7], [0.8, 0.5, 0.8]]);
    [[PX0, PZ0], [PX1, PZ0], [PX1, PZ1], [PX0, PZ1]].forEach(function (p) { L([p[0], 0.5, p[1]], [p[0], Y0 - 0.8, p[1]], 0.6); });
    for (x = PX0 + 6; x < PX1; x += 6) if (Math.abs(x) > 10) L([x, 0.5, PZ0], [x, Y0 - 0.8, PZ0], 0.22);   // panel joints
    FL = Y0;
    var gp = lo ? 6 : 2;
    for (x = PX0; x <= PX1; x += gp) seg([x, Y0, PZ0], [x, Y0, PZ1], (x % 12 ? 0.13 : 0.24), 6);
    for (z = PZ0; z >= PZ1; z -= gp) seg([PX0, Y0, z], [PX1, Y0, z], (z % 12 ? 0.13 : 0.24), 6);

    // 1 · Aviso: the grand stair and the gatehouse (two rows of six columns, entablature, pediments front and back)
    FL = 0;
    stair(-9, 9, -44, 0, 16, Y0 / 16, 0.875, 0.85);
    [-1, 1].forEach(function (s) {                       // cheek walls with pedestals at the foot and the head
      var X0 = s * 9, X1 = s * 11;
      line([[X0, 0, -44], [X0, 1.2, -44], [X0, Y0 + 1.2, -58], [X0, 0, -58]], 0.6); line([[X1, 0, -44], [X1, 1.2, -44], [X1, Y0 + 1.2, -58]], 0.45);
      L([X0, 1.2, -44], [X1, 1.2, -44], 0.6); L([X0, Y0 + 1.2, -58], [X1, Y0 + 1.2, -58], 0.6);
      box(Math.min(X0, X1) - 0.3, 0, -45.6, Math.max(X0, X1) + 0.3, 2.4, -43.4, 0.75, 0.8);
      box(Math.min(X0, X1) - 0.6, 2.4, -45.9, Math.max(X0, X1) + 0.6, 2.7, -43.1, 0.6);
    });
    FL = Y0;
    for (k = 0; k < 6; k++) { column(-10 + k * 4, -62, Y0, 0.62, 9, 0.85); column(-10 + k * 4, -69, Y0, 0.62, 9, 0.55); }
    entab(-11.2, -70.2, 11.2, -60.8, Y0 + 9, 0.9);
    pediment(-11.2, 11.2, -60.8 - 0.78, -70.2 + 0.78, Y0 + 11.8, 3.6, 0.9);
    rect(-11.4, -70.4, 11.4, -60.6, Y0 + 0.01, 0.4); rect(-12, -71, 12, -60, Y0 - 0.3, 0.3);

    // 2 · PrintPlay: a long colonnade on the axis (two rows, coffered ceiling)
    var SZ0 = -76, SZ1 = -122;
    for (z = SZ0; z >= SZ1; z -= 4) { column(-6.5, z, Y0, 0.5, 7.5, 0.34); column(6.5, z, Y0, 0.5, 7.5, 0.34); }
    entab(-7.4, SZ1 - 0.9, 7.4, SZ0 + 0.9, Y0 + 7.5, 0.8);
    for (z = SZ0; z >= SZ1; z -= 4) { seg([-6.5, Y0 + 7.5 + 1.1, z], [6.5, Y0 + 7.5 + 1.1, z], 0.45, 3); }
    for (x = -6.5; x <= 6.5; x += lo ? 6.5 : 13 / 6) seg([x, Y0 + 7.5 + 1.1, SZ0], [x, Y0 + 7.5 + 1.1, SZ1], 0.25, 4);
    for (z = SZ0; z > SZ1; z -= 4) rect(-6.5, z - 4, 6.5, z, Y0 + 0.02, 0.22);

    // 3 · Design Work: the atrium, two-storey arcades on both long sides (piers and arches below, small columns above)
    var AZ0 = -128, AZ1 = -196, BAY = 6.8, NB = 10;
    [-1, 1].forEach(function (s) {
      var X = s * 24, Xb = s * 31, u = [0, 0, 1], nn = [s, 0, 0];
      for (k = 0; k <= NB; k++) {
        var zp = AZ0 - k * BAY;
        box(X - 0.7, Y0, zp - 0.7, X + 0.7, Y0 + 5, zp + 0.7, 0.75, 0.7);
        mould(X - 0.7, zp - 0.7, X + 0.7, zp + 0.7, Y0 + 5, [[0, 0, 0.5], [0.22, 0.14, 0.6]]);
        if (k < NB) arch([X, Y0 + 5.22, zp - BAY / 2], u, nn, BAY / 2 - 0.7, BAY / 2, s * 1.4, 9, 0.85);
        seg([Xb, Y0, zp], [Xb, Y0 + 14, zp], 0.2);                     // back wall pilasters
        if (k < NB) { arch([Xb, Y0 + 3.6, zp - BAY / 2], u, nn, 1.3, 1.5, 0.01, 6, 0.28); seg([Xb, Y0, zp - BAY / 2 - 1.3], [Xb, Y0 + 3.6, zp - BAY / 2 - 1.3], 0.28); seg([Xb, Y0, zp - BAY / 2 + 1.3], [Xb, Y0 + 3.6, zp - BAY / 2 + 1.3], 0.28); }
        // upper storey: a small column on every pier and in every bay
        column(X, zp, Y0 + 9.2, 0.32, 4.4, 0.6);
        if (k < NB) column(X, zp - BAY / 2, Y0 + 9.2, 0.32, 4.4, 0.5);
      }
      mould(Math.min(X, X + s * 0.9), AZ1 - 0.7, Math.max(X, X + s * 0.9), AZ0 + 0.7, Y0 + 8.5, [[0, 0, 0.6], [0.3, 0.1, 0.4], [0.7, 0.25, 0.75]]);
      mould(Math.min(X, X + s * 0.9), AZ1 - 0.7, Math.max(X, X + s * 0.9), AZ0 + 0.7, Y0 + 13.6, [[0, 0, 0.6], [0.4, 0.2, 0.5], [0.8, 0.5, 0.85], [1.0, 0.6, 0.5]]);
      seg([Xb, Y0 + 14, AZ0], [Xb, Y0 + 14, AZ1], 0.3); seg([Xb, Y0 + 9, AZ0], [Xb, Y0 + 9, AZ1], 0.22);
      for (k = 0; k <= NB; k++) seg([X, Y0 + 14.6, AZ0 - k * BAY], [Xb, Y0 + 14, AZ0 - k * BAY], 0.2);   // roof rafters
    });
    // the court floor: an inlaid ellipse and its rays
    for (k = 1; k <= 4; k++) { var P0 = []; for (i = 0; i < 64; i++) { a = i / 64 * TAU; P0.push([k * 4.2 * Math.cos(a), Y0 + 0.02, -162 + k * 7 * Math.sin(a)]); } line(P0, 0.38 - k * 0.04, true); }
    for (i = 0; i < 24; i++) { a = i / 24 * TAU; L([4.2 * Math.cos(a), Y0 + 0.02, -162 + 7 * Math.sin(a)], [16.8 * Math.cos(a), Y0 + 0.02, -162 + 28 * Math.sin(a)], 0.22); }

    // 4 · Steam: the domed hall (block with pilasters and arched doors, drum with windows, coffered dome, lantern)
    var DX = 0, DZ0 = -222, BX = 18, HB = 12;
    box(DX - BX, Y0, DZ0 - BX, DX + BX, Y0 + HB - 1.2, DZ0 + BX, 0.7, 0.8);
    mould(DX - BX, DZ0 - BX, DX + BX, DZ0 + BX, Y0 + HB - 1.2, [[0, 0, 0.6], [0.35, 0.2, 0.45], [0.75, 0.5, 0.85], [1.2, 0.65, 0.6]]);
    mould(DX - BX, DZ0 - BX, DX + BX, DZ0 + BX, Y0, [[0, 0.45, 0.5], [0.4, 0.25, 0.4], [0.7, 0, 0.5]]);
    for (x = -BX + 3; x <= BX - 3; x += 3) [DZ0 + BX, DZ0 - BX].forEach(function (zz) { if (Math.abs(x) > 4) { L([DX + x - 0.3, Y0 + 0.7, zz], [DX + x - 0.3, Y0 + HB - 1.2, zz], 0.3); L([DX + x + 0.3, Y0 + 0.7, zz], [DX + x + 0.3, Y0 + HB - 1.2, zz], 0.3); } });
    for (z = -BX + 3; z <= BX - 3; z += 3) [DX + BX, DX - BX].forEach(function (xx) { if (Math.abs(z) > 4) { L([xx, Y0 + 0.7, DZ0 + z - 0.3], [xx, Y0 + HB - 1.2, DZ0 + z - 0.3], 0.3); L([xx, Y0 + 0.7, DZ0 + z + 0.3], [xx, Y0 + HB - 1.2, DZ0 + z + 0.3], 0.3); } });
    arch([DX, Y0 + 5.5, DZ0 + BX], [1, 0, 0], [0, 0, -1], 3.4, 4.2, 1.6, 11, 0.9);
    arch([DX + BX, Y0 + 4.5, DZ0], [0, 0, 1], [-1, 0, 0], 2.8, 3.5, 1.6, 9, 0.85);
    [[DX - 3.4, DZ0 + BX], [DX + 3.4, DZ0 + BX]].forEach(function (p) { L([p[0], Y0, p[1]], [p[0], Y0 + 5.5, p[1]], 0.8); });
    [[DX + BX, DZ0 - 2.8], [DX + BX, DZ0 + 2.8]].forEach(function (p) { L([p[0], Y0, p[1]], [p[0], Y0 + 4.5, p[1]], 0.8); });
    var DR = 13, DY = Y0 + HB, NL = lo ? 24 : 64;
    ring(DX, DY, DZ0, DR, NL, 0.75); ring(DX, DY + 0.5, DZ0, DR + 0.3, NL, 0.5); ring(DX, DY + 5.4, DZ0, DR + 0.3, NL, 0.55); ring(DX, DY + 6, DZ0, DR, NL, 0.8);
    for (i = 0; i < 24; i++) {
      a = i / 24 * TAU; var ca = Math.cos(a), sa = Math.sin(a);
      L([DX + (DR + 0.3) * ca, DY + 0.5, DZ0 + (DR + 0.3) * sa], [DX + (DR + 0.3) * ca, DY + 5.4, DZ0 + (DR + 0.3) * sa], 0.55);
      if (!lo) { var am = a + PI / 24; arch([DX + DR * Math.cos(am), DY + 3.4, DZ0 + DR * Math.sin(am)], [-Math.sin(am), 0, Math.cos(am)], [0, 0, 0], 0.62, 0.62, 0, 4, 0.3);
        L([DX + DR * Math.cos(am) - Math.sin(am) * 0.62, DY + 1.4, DZ0 + DR * Math.sin(am) + Math.cos(am) * 0.62], [DX + DR * Math.cos(am) - Math.sin(am) * 0.62, DY + 3.4, DZ0 + DR * Math.sin(am) + Math.cos(am) * 0.62], 0.25);
        L([DX + DR * Math.cos(am) + Math.sin(am) * 0.62, DY + 1.4, DZ0 + DR * Math.sin(am) - Math.cos(am) * 0.62], [DX + DR * Math.cos(am) + Math.sin(am) * 0.62, DY + 3.4, DZ0 + DR * Math.sin(am) - Math.cos(am) * 0.62], 0.25); }
    }
    dome(DX, DY + 6, DZ0, DR, NL, lo ? 8 : 18, 0.8);
    var TY = DY + 6 + DR * Math.sin(PI / 2 * 0.94);
    ring(DX, TY, DZ0, 1.9, 24, 0.8); ring(DX, TY + 2.6, DZ0, 1.9, 24, 0.8);
    for (i = 0; i < 8; i++) { a = i / 8 * TAU; L([DX + 1.9 * Math.cos(a), TY, DZ0 + 1.9 * Math.sin(a)], [DX + 1.9 * Math.cos(a), TY + 2.6, DZ0 + 1.9 * Math.sin(a)], 0.7); }
    dome(DX, TY + 2.6, DZ0, 1.9, 16, lo ? 3 : 5, 0.7); pt([DX, TY + 4.6, DZ0], 1);
    for (k = 1; k <= 4; k++) ring(DX, Y0 + 0.02, DZ0, k * 3.2, 64, 0.3);                    // rotunda floor
    for (i = 0; i < 32; i++) { a = i / 32 * TAU; L([DX + 3.2 * Math.cos(a), Y0 + 0.02, DZ0 + 3.2 * Math.sin(a)], [DX + 12.8 * Math.cos(a), Y0 + 0.02, DZ0 + 12.8 * Math.sin(a)], 0.18); }

    // 5 · Suikou: a barrel-vaulted gallery leading east out of the hall, arcaded on both sides
    var GX0 = 18, GX1 = 66, GZ = DZ0, GW = 3.6, GS = Y0 + 4.6, GB = 4;
    for (x = GX0 + 2; x <= GX1; x += GB) {
      arch([x, GS, GZ], [0, 0, 1], [1, 0, 0], GW, GW + 0.45, 0.6, 8, 0.85);           // transverse ribs
      [-1, 1].forEach(function (s) { box(x - 0.3, Y0, GZ + s * GW - 0.3, x + 0.6, GS, GZ + s * GW + 0.3, 0.6); });
      if (x + GB <= GX1) [-1, 1].forEach(function (s) { arch([x + GB / 2 + 0.15, Y0 + 2.9, GZ + s * GW], [1, 0, 0], [0, 0, s * 0.5], 1.4, 1.75, 1, 6, 0.55); });
    }
    for (i = 1; i < (lo ? 6 : 14); i++) { a = i / (lo ? 6 : 14) * PI; seg([GX0 + 2, GS + (GW + 0.45) * Math.sin(a), GZ + (GW + 0.45) * Math.cos(a)], [GX1, GS + (GW + 0.45) * Math.sin(a), GZ + (GW + 0.45) * Math.cos(a)], 0.3, 4); }
    for (z = -GW; z <= GW; z += lo ? GW : 1.2) seg([GX0, Y0 + 0.02, GZ + z], [GX1, Y0 + 0.02, GZ + z], 0.2, 4);

    // 6 · TaoTao: the garden court — low wall, a pool with a rim, a fountain, cypresses, a small contour mound
    var CX = 94, CZ = -224;
    mould(CX - 24, CZ - 22, CX + 24, CZ + 22, Y0, [[0, 0, 0.5], [1.0, 0, 0.55], [1.2, 0.2, 0.7]]);
    [[CX - 24, CZ - 22], [CX + 24, CZ - 22], [CX + 24, CZ + 22], [CX - 24, CZ + 22]].forEach(function (p) { L([p[0], Y0, p[1]], [p[0], Y0 + 1.2, p[1]], 0.6); pt([p[0], Y0 + 1.2, p[1]], 0.8); });
    mould(CX - 12, CZ - 8, CX + 12, CZ + 8, Y0, [[0, 0.6, 0.55], [0.35, 0.6, 0.7], [0.35, 0, 0.45], [0.05, -0.4, 0.3]]);
    if (!lo) for (k = 1; k < 4; k++) rect(CX - 12 + k * 0.9, CZ - 8 + k * 0.9, CX + 12 - k * 0.9, CZ + 8 - k * 0.9, Y0 + 0.05, 0.12);
    [[3.2, 0.7], [3.4, 0.9]].forEach(function (m) { ring(CX, Y0 + m[1], CZ, m[0], 48, 0.6); });
    ring(CX, Y0 + 1.9, CZ, 1.8, 32, 0.7); ring(CX, Y0 + 1.6, CZ, 1.2, 24, 0.4); L([CX, Y0 + 0.9, CZ], [CX, Y0 + 2.9, CZ], 0.6); ring(CX, Y0 + 2.9, CZ, 0.9, 24, 0.7); pt([CX, Y0 + 3.6, CZ], 1);
    for (z = CZ - 18; z <= CZ + 18; z += 6) { cypress(CX - 20, Y0, z, 7 + 1.5 * h2(z, 1), 0.95, 0.5); cypress(CX + 20, Y0, z, 7 + 1.5 * h2(z, 2), 0.95, 0.5); }
    for (k = 0; k < (lo ? 6 : 10); k++) {
      var rk = 6.5 * Math.pow(1 - k / (lo ? 6 : 10), 0.8), CP = [], nc = lo ? 32 : 64;
      for (i = 0; i < nc; i++) { a = i / nc * TAU; var rad = rk * (1 + 0.22 * (fbm(Math.cos(a) * 1.4 + k * 0.17, Math.sin(a) * 1.4 + 3) - 0.5) * 2); CP.push([CX - 13 + rad * Math.cos(a), Y0 + k * (lo ? 0.6 : 0.36), CZ - 15 + rad * Math.sin(a)]); }
      line(CP, 0.6 - k * 0.02, true);
    }
    seg([CX, Y0 + 0.02, CZ + 8.6], [CX, Y0 + 0.02, CZ + 22], 0.3); seg([CX, Y0 + 0.02, CZ - 8.6], [CX, Y0 + 0.02, CZ - 22], 0.3);

    // 7 · Xiaoyi: a round temple past the court (stepped base, twelve fluted columns, ring entablature, dome)
    var RX = 94, RZ = -266, RR = 7;
    for (k = 0; k < 3; k++) { ring(RX, Y0 + k * 0.55, RZ, 9.4 - k * 0.6, 64, 0.5); ring(RX, Y0 + (k + 1) * 0.55, RZ, 9.4 - k * 0.6, 64, 0.6); }
    for (i = 0; i < 12; i++) { a = i / 12 * TAU; column(RX + RR * Math.cos(a), RZ + RR * Math.sin(a), Y0 + 1.65, 0.42, 6.4, 0.85); }
    var EY = Y0 + 1.65 + 6.4;
    EP.forEach(function (m) { ring(RX, EY + m[0] * 0.8, RZ, RR + 0.6 + m[1], 64, m[2] * 0.8); ring(RX, EY + m[0] * 0.8, RZ, RR - 0.6 - m[1] * 0.3, 64, m[2] * 0.4); });
    ring(RX, EY + 2.3, RZ, RR - 0.3, 64, 0.6); ring(RX, EY + 3.1, RZ, RR - 0.3, 64, 0.6);
    dome(RX, EY + 3.1, RZ, RR - 0.3, lo ? 16 : 40, lo ? 6 : 12, 0.75); pt([RX, EY + 3.1 + (RR - 0.3) * 0.99, RZ], 1);

    // 8 · Wild Louis: a stair up to the high terrace, a balustrade on its edges and a small belvedere
    var TX0 = 34, TX1 = 70, TZ0 = -248, TZ1 = -284, TYH = Y0 + 11;
    for (j = 0; j < 22; j++) {                                    // a stair climbing west from the temple
      var yb = Y0 + j * 0.5, xf = 82 - j * 0.55;
      seg([xf, yb + 0.5, -262], [xf, yb + 0.5, -270], 0.7, 3); L([xf, yb, -262], [xf, yb + 0.5, -262], 0.5); L([xf, yb, -270], [xf, yb + 0.5, -270], 0.5);
      L([xf, yb + 0.5, -262], [xf - 0.55, yb + 0.5, -262], 0.5); L([xf, yb + 0.5, -270], [xf - 0.55, yb + 0.5, -270], 0.5);
    }
    box(TX0, Y0, TZ1, TX1, TYH - 0.6, TZ0, 0.6, 0.8);
    mould(TX0, TZ1, TX1, TZ0, TYH - 0.6, [[0, 0, 0.5], [0.3, 0.2, 0.45], [0.6, 0.4, 0.8]]);
    for (x = TX0 + 4; x < TX1; x += 4) L([x, Y0, TZ0], [x, TYH - 0.6, TZ0], 0.2);
    FL = TYH;
    rect(TX0, TZ1, TX1, TZ0, TYH + 0.15, 0.5); rect(TX0, TZ1, TX1, TZ0, TYH + 1.1, 0.75);
    var BS = lo ? 2.4 : 0.6;
    for (x = TX0; x <= TX1; x += BS) { L([x, TYH + 0.15, TZ0], [x, TYH + 1.1, TZ0], 0.3); L([x, TYH + 0.15, TZ1], [x, TYH + 1.1, TZ1], 0.3); }
    for (z = TZ0; z >= TZ1; z -= BS) { L([TX0, TYH + 0.15, z], [TX0, TYH + 1.1, z], 0.3); if (z > -261 || z < -271) L([TX1, TYH + 0.15, z], [TX1, TYH + 1.1, z], 0.3); }
    for (x = TX0; x <= TX1; x += 3) seg([x, TYH, TZ0], [x, TYH, TZ1], 0.14, 6);
    for (z = TZ0; z >= TZ1; z -= 3) seg([TX0, TYH, z], [TX1, TYH, z], 0.14, 6);
    [[42, -256], [50, -256], [42, -264], [50, -264]].forEach(function (p) { column(p[0], p[1], TYH, 0.36, 4.6, 0.7); });
    entab(41.2, -264.8, 50.8, -255.2, TYH + 4.6, 0.6);
    line([[40.4, TYH + 7.4, -265.6], [46, TYH + 10.4, -260], [51.6, TYH + 7.4, -254.4]], 0.7); line([[51.6, TYH + 7.4, -265.6], [46, TYH + 10.4, -260], [40.4, TYH + 7.4, -254.4]], 0.7);
    pt([46, TYH + 10.4, -260], 1);
    FL = 0;

    // stars: a sparse dome of points far above the complex
    var NS = lo ? 420 : 1500;
    for (i = 0; i < NS; i++) {
      var az = rnd() * TAU, el = Math.asin(0.05 + 0.9 * Math.pow(rnd(), 1.4)), R2 = 520;
      S.push(40 + R2 * Math.cos(el) * Math.cos(az), R2 * Math.sin(el), -150 + R2 * Math.cos(el) * Math.sin(az), 0, rnd(), 0, 0.25 + 0.75 * Math.pow(rnd(), 3), 2);
    }
    // small bright points on a share of the model's vertices
    var share = lo ? 0.018 : 0.035;
    for (i = 0; i < A.length; i += 8) if (A[i + 7] === 0 && A[i + 6] >= 0.6 && rnd() < share) S.push(A[i], A[i + 1], A[i + 2], A[i + 3], rnd(), 0, A[i + 6] * 0.8, 3);
    return { L: new Float32Array(A), P: new Float32Array(S) };
  }

  /* ---------------------------------------------------------------- camera path: one spline through the complex */
  // [eye xyz, look xyz, fog] at the start (A) and end (B) of each section: hero, 01–08, footer (route table: DESIGN-NOTES §19)
  var PATH = {
    top: [[0, 2.4, 13, -1.6, 6.4, -40, 0.012], [0, 3.0, -2, -1, 7.4, -60, 0.013]],
    // phones: the portrait stands over the centre, so the hero view turns right and the gatehouse sits at the left edge
    topM: [[2, 2.6, 13, 12, 5.6, -40, 0.012], [1, 3.2, -2, 6, 7, -60, 0.013]],
    aviso: [[0, 2.2, -32, 0, 8.2, -66, 0.016], [0, 6.6, -55, 0, 10.6, -84, 0.016]],
    printplay: [[0.6, 7.4, -72, -0.5, 9.4, -104, 0.016], [-1.2, 7.6, -112, 1.5, 9.4, -146, 0.015]],
    work: [[0, 8.4, -126, -9, 10.5, -158, 0.014], [5, 9.2, -188, 0, 15, -222, 0.014]],
    steam: [[0, 8.2, -205, 0, 21, -222, 0.014], [4, 9, -218, 2, 26, -232, 0.013]],
    suikou: [[14, 8.6, -222, 50, 9.6, -222, 0.015], [56, 8.4, -222.5, 92, 8.4, -224, 0.015]],
    taotao: [[70, 10.5, -206, 98, 5, -230, 0.014], [104, 12, -204, 92, 5, -246, 0.014]],
    xiaoyi: [[108, 8.6, -248, 94, 10, -266, 0.014], [80, 9.6, -252, 94, 11, -266, 0.014]],
    "wild-louis": [[66, 19, -270, 30, 10, -210, 0.009], [56, 25, -276, 10, 8, -160, 0.008]],
    contact: [[44, 170, -110, 44, 0, -172, 0.004], [44, 170, -110, 44, 0, -172, 0.004]]
  };
  var IDS = ["top", "aviso", "printplay", "work", "steam", "suikou", "taotao", "xiaoyi", "wild-louis", "contact"];
  var keys = [];
  function measure() {
    var vh = innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh), last = -1, out = [];
    IDS.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      var t = el.getBoundingClientRect().top + scrollY, h = el.offsetHeight, P = PATH[id === "top" && innerWidth < 760 ? "topM" : id];
      // knots are scroll offsets; the hero starts at 0 and the footer's pose is reached at the bottom of the page
      if (id === "contact") { out.push([max, P[0]]); return; }
      var ya = id === "top" ? 0 : t - vh * 0.35 + h * 0.18, yb = id === "top" ? vh * 0.5 : t + h * 0.82 - vh * 0.65;
      ya = Math.max(last + 1, ya); yb = Math.max(ya + 1, yb);
      out.push([ya, P[0]], [yb, P[1]]); last = yb;
    });
    // knots must rise strictly; drop any that the end of the page squeezes out
    keys = out.filter(function (k, j) { return j === out.length - 1 || k[0] < out[out.length - 1][0] - 1; });
  }
  // a non-uniform Catmull–Rom spline over the knots (Barry–Goldman), so the camera never stops at a node or jumps
  function pose(y, out) {
    var n = keys.length, j = 0, d;
    if (!n) { for (d = 0; d < 7; d++) out[d] = PATH.top[0][d]; return out; }
    if (y <= keys[0][0] || n === 1) { for (d = 0; d < 7; d++) out[d] = keys[0][1][d]; return out; }
    if (y >= keys[n - 1][0]) { for (d = 0; d < 7; d++) out[d] = keys[n - 1][1][d]; return out; }
    while (j < n - 2 && keys[j + 1][0] <= y) j++;
    var k1 = keys[j], k2 = keys[j + 1];
    var k0 = j > 0 ? keys[j - 1] : [2 * k1[0] - k2[0], k1[1].map(function (v, i) { return 2 * v - k2[1][i]; })];
    var k3 = j + 2 < n ? keys[j + 2] : [2 * k2[0] - k1[0], k2[1].map(function (v, i) { return 2 * v - k1[1][i]; })];
    var t0 = k0[0], t1 = k1[0], t2 = k2[0], t3 = k3[0], t = y;
    for (d = 0; d < 7; d++) {
      var p0 = k0[1][d], p1 = k1[1][d], p2 = k2[1][d], p3 = k3[1][d];
      var a1 = ((t1 - t) * p0 + (t - t0) * p1) / (t1 - t0), a2 = ((t2 - t) * p1 + (t - t1) * p2) / (t2 - t1), a3 = ((t3 - t) * p2 + (t - t2) * p3) / (t3 - t2);
      var b1 = ((t2 - t) * a1 + (t - t0) * a2) / (t2 - t0), b2 = ((t3 - t) * a2 + (t - t1) * a3) / (t3 - t1);
      out[d] = ((t2 - t) * b1 + (t - t1) * b2) / (t2 - t1);
    }
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
  // reading blocks: the lines behind whichever of these are on screen are thinned and dimmed (up to four, largest first).
  // The hero copy is handled apart, as a soft ellipse.
  var READ = ".slots, .wk-side, .wcase-text, .st-block, .foot-grid, .made-copy, .made-log, .foot-meta";
  var readEls = [], heroCopy = null;
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
    var M = build(true), V = M.L, PT = M.P, drawn = 0;
    function paint() {
      var w = c2.clientWidth, h = c2.clientHeight; if (!w || !h) return;
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      c2.width = Math.round(w * dpr); c2.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var mob = w < 760, P = PATH[mob ? "topM" : "top"][0], Vm = look([P[0], P[1], P[2]], [P[3], P[4], P[5]]), t = 1 / Math.tan((mob ? 62 : 50) * Math.PI / 360);
      var bins = [[], [], [], [], [], []], K = mob ? 0.42 : 0.52, fog = P[6];
      var pr = function (A, o) {   // → view-space [x, y, z]
        var x = A[o], y = A[o + 1], z = A[o + 2];
        return [Vm[0] * x + Vm[4] * y + Vm[8] * z + Vm[12], Vm[1] * x + Vm[5] * y + Vm[9] * z + Vm[13], Vm[2] * x + Vm[6] * y + Vm[10] * z + Vm[14]];
      };
      var sx = function (p) { return w / 2 + p[0] / -p[2] * t * h / 2; }, sy = function (p) { return h / 2 - p[1] / -p[2] * t * h / 2; };
      for (var o = 0; o < V.length; o += 16) {
        var a = pr(V, o), b = pr(V, o + 8);
        if (a[2] > -0.5 && b[2] > -0.5) continue;
        if (a[2] > -0.5 || b[2] > -0.5) {   // clip to the near plane
          var s = (-0.5 - a[2]) / (b[2] - a[2]), m = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, -0.5];
          if (a[2] > -0.5) a = m; else b = m;
        }
        var d = Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), al = V[o + 6] * Math.exp(-d * fog) * K;
        if (V[o + 7] === 1) al *= 1 - Math.min(1, Math.max(0, (d - 30) / 34));
        if (al < 0.02) continue;
        bins[Math.min(5, al * 12 | 0)].push(sx(a), sy(a), sx(b), sy(b));
      }
      ctx.clearRect(0, 0, w, h); ctx.lineWidth = 1;
      bins.forEach(function (L, i) {
        if (!L.length) return;
        ctx.strokeStyle = "rgba(236,238,242," + ((i + 0.5) / 12).toFixed(3) + ")"; ctx.beginPath();
        for (var j = 0; j < L.length; j += 4) { ctx.moveTo(L[j], L[j + 1]); ctx.lineTo(L[j + 2], L[j + 3]); }
        ctx.stroke();
      });
      ctx.fillStyle = "rgb(240,242,246)";
      for (var p = 0; p < PT.length; p += 8) {
        var v = pr(PT, p); if (v[2] > -1) continue;
        var dd = Math.hypot(v[0], v[1], v[2]), star = PT[p + 7] === 2;
        ctx.globalAlpha = Math.min(1, PT[p + 6] * (star ? 0.7 : Math.exp(-dd * fog) * 0.9));
        if (ctx.globalAlpha < 0.03) continue;
        var X = sx(v), Y = sy(v), z2 = star ? 1 + PT[p + 4] : 1.6;
        ctx.fillRect(X - z2 / 2, Y - z2 / 2, z2, z2);
      }
      ctx.globalAlpha = 1;
      // fewer lines behind the hero copy here too: a soft elliptical erase where the copy sits in this (static) frame
      var hc = document.querySelector(".hero-copy"), cr = hc && hc.getBoundingClientRect();
      if (cr && cr.width && cr.bottom > 0) {
        var rx = cr.width / 2 + 70, ry = cr.height / 2 + 60;
        ctx.save(); ctx.translate(cr.left + cr.width / 2, cr.top + cr.height / 2); ctx.scale(1, ry / rx);
        var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, "rgba(0,0,0,0.85)"); gr.addColorStop(0.55, "rgba(0,0,0,0.8)"); gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = gr; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
        ctx.restore(); ctx.globalCompositeOperation = "source-over";
      }
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
      "attribute vec3 aP, aQ; attribute vec2 aM;",
      "uniform mat4 uV, uP; uniform float uT, uFog, uMir, uMin, uPS; uniform vec4 uW, uWP; uniform vec2 uWS, uOff;",
      "varying float vA, vR;",
      // FX_WAVE.at(x, u) — uW = freq, phase, bend, t · uWP = pointer x, u, k, aspect · uWS = scale × amp, scroll
      "float wave(vec2 p){ float s = 0.5 + 0.5 * sin(6.2832 * uW.x * p.y - uW.y + uW.z * sin(p.x * 5.0 + uW.w * 0.4));",
      "  vec2 d = vec2((p.x - uWP.x) * uWP.w, p.y - uWP.y); float b = uWP.z * exp(-dot(d, d) / 0.01);",
      "  return uWS.x * ((1.0 + 0.6 * uWS.y) * s * s * s + 0.7 * b); }",
      "void main(){",
      "  vec3 p = aP; float k = aM.y, br = aM.x, w = 0.0, h = p.y - aQ.x;",
      "  float terr = step(0.5, k) * step(k, 1.5), star = step(1.5, k) * step(k, 2.5);",
      "  if (uMir > 0.5) p.y = aQ.x - h;",          // the mirror image in the floor the vertex stands on
      "  vec4 v = uV * vec4(p, 1.0), c = uP * v;",
      "  if (c.w > 0.0) w = wave(vec2(0.5 + 0.5 * c.x / c.w, 0.5 - 0.5 * c.y / c.w));",
      "  v.y += terr * w * 0.55;",            // a lift along the view-space up axis, the same in every pose
      "  gl_Position = uP * v;",
      "  gl_Position.xy += uOff * gl_Position.w;",
      "  float d = length(v.xyz);",
      "  float a = br * mix(exp(-d * uFog) * smoothstep(0.8, 4.0, d) * (1.0 - terr * smoothstep(30.0, 64.0, d)), 1.0, star);",
      "  a *= 1.0 + w * mix(0.25, 0.9, terr);",
      "  a *= mix(1.0, 0.55 + 0.45 * sin(uT * (0.5 + aQ.y * 1.8) + aQ.y * 40.0), star);",
      "  a *= mix(1.0, 0.15 * exp(-h * 0.13) * step(0.02, h) * (1.0 - terr) * (1.0 - star), uMir);",
      "  vA = a * step(uMin, br); vR = aQ.y;",
      "  gl_PointSize = uPS * mix(clamp(42.0 / d, 1.0, 2.6), 0.8 + aQ.y * 1.3, star);",
      "}"
    ].join("\n");
    var FS = [
      "precision mediump float;",
      "uniform float uK, uDim, uPt; uniform vec4 uR[4], uHole, uHC; varying float vA, vR;",
      "void main(){",
      "  vec2 p = gl_FragCoord.xy; float m = 1.0;",
      "  for (int i = 0; i < 4; i++) { vec2 d = max(uR[i].xy - p, p - uR[i].zw); m = min(m, mix(uDim, 1.0, smoothstep(-16.0, 72.0, max(d.x, d.y)))); }",
      // the hero copy: a soft ellipse, no edge to see
      "  m = min(m, mix(0.1, 1.0, smoothstep(0.5, 1.3, length((p - uHC.xy) / uHC.zw))));",
      // fewer lines as well as fainter ones: a share of the lines (by their random) drops out where m is low
      "  if (vR < (1.0 - m) * 0.8) discard;",
      "  float hd = length((p - uHole.xy) / uHole.zw); m *= mix(0.2, 1.0, smoothstep(0.55, 1.05, hd));",
      "  float a = vA * uK * m;",
      "  if (uPt > 0.5) a *= smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5));",
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

    var M = build(!HI), NV = M.L.length / 8, NP = M.P.length / 8;
    var lb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, lb); gl.bufferData(gl.ARRAY_BUFFER, M.L, gl.STATIC_DRAW);
    var pb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pb); gl.bufferData(gl.ARRAY_BUFFER, M.P, gl.STATIC_DRAW);
    var loc = [["aP", 3, 0], ["aQ", 3, 12], ["aM", 2, 24]].map(function (s) { var l = gl.getAttribLocation(pr, s[0]); gl.enableVertexAttribArray(l); return [l, s[1], s[2]]; });
    function bind(buf) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); loc.forEach(function (s) { gl.vertexAttribPointer(s[0], s[1], gl.FLOAT, false, 32, s[2]); }); }
    root.setAttribute("data-fx-verts", String(NV + NP));
    M = null;
    var U = {}; ["uV", "uP", "uT", "uFog", "uMir", "uMin", "uPS", "uW", "uWP", "uWS", "uOff", "uK", "uDim", "uPt", "uR", "uHole", "uHC"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
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
      heroCopy = document.querySelector(".hero-copy");
      fig = document.querySelector(".louis-hero"); lh = document.getElementById("louisHero");
      measure();
    }

    var mx = 0, my = 0, dead = false, E = [0, 0, 0, 0, 0, 0, 0], lastMeasure = 0, hy = -1, hx = -1;
    // a slow GPU on the high tier: if frames keep taking > 45 ms for 8 s, drop the reflection and glow passes (not when forced)
    var lite = false, slowSince = 0, prevNow = 0, avgDt = 16;
    function frame(now) {
      if (dead) return;
      if (HI && !lite && !q && prevNow) {
        avgDt += (Math.min(500, now - prevNow) - avgDt) * 0.05;
        if (avgDt > 45) { if (!slowSince) slowSince = now; else if (now - slowSince > 8000) { lite = true; root.setAttribute("data-fx-lite", "1"); } }
        else slowSince = 0;
      }
      prevNow = now;
      try { draw(now || 0); } catch (e) { fail("error"); }
    }
    function draw(now) {
      if (c.width !== Math.round(c.clientWidth * dpr) || !w) resize();
      if (!w) return;
      if (now - lastMeasure > 1000) { lastMeasure = now; measure(); }   // folds open and close; the path follows
      var t = W.t, P = W.pointer, i;
      mx += ((P.x * 2 - 1) * P.k - mx) * 0.04; my += ((P.y * 2 - 1) * P.k - my) * 0.04;
      pose(scrollY, E);
      var e = [E[0] + mx * 1.1 + Math.sin(t * 0.07) * 0.4, E[1] - my * 0.5 + Math.sin(t * 0.05 + 1) * 0.2, E[2]];
      var o = [E[3] + mx * 0.6 + Math.sin(t * 0.06 + 2) * 0.6, E[4] - my * 0.4, E[5]];
      gl.uniformMatrix4fv(U.uV, false, look(e, o));
      gl.uniformMatrix4fv(U.uP, false, persp((mobile ? 62 : 50) * Math.PI / 180, w / h, 0.3, 900));
      gl.uniform1f(U.uT, t); gl.uniform1f(U.uFog, E[6]);
      gl.uniform4f(U.uW, W.freq, W.phase, W.bend, t); gl.uniform4f(U.uWP, P.x, P.y, P.k, W.aspect); gl.uniform2f(U.uWS, W.scale * W.amp, W.scroll);
      // reading blocks → device-pixel rectangles (GL y is up)
      var rs = rects(w, h, mobile ? 10 : 22);
      for (i = 0; i < 4; i++) {
        var r = rs[i];
        if (r) { R[i * 4] = r[0] * dpr; R[i * 4 + 1] = (h - r[3]) * dpr; R[i * 4 + 2] = r[2] * dpr; R[i * 4 + 3] = (h - r[1]) * dpr; }
        else { R[i * 4] = R[i * 4 + 1] = R[i * 4 + 2] = R[i * 4 + 3] = -1e4; }
      }
      gl.uniform4fv(U.uR, R); gl.uniform1f(U.uDim, mobile ? 0.06 : 0.1);
      var cr = heroCopy && heroCopy.getBoundingClientRect();
      if (cr && cr.bottom > 0 && cr.width) gl.uniform4f(U.uHC, (cr.left + cr.width / 2) * dpr, (h - (cr.top + cr.height / 2)) * dpr, (cr.width / 2 + 60) * dpr, (cr.height / 2 + 50) * dpr);
      else gl.uniform4f(U.uHC, -1e5, -1e5, 1, 1);
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
      var K = HI ? 0.5 : 0.6;
      gl.clear(gl.COLOR_BUFFER_BIT);
      bind(lb); gl.uniform1f(U.uPt, 0); gl.uniform1f(U.uMin, 0); gl.uniform2f(U.uOff, 0, 0);
      if (HI && !lite) { gl.uniform1f(U.uMir, 1); gl.uniform1f(U.uK, K); gl.drawArrays(gl.LINES, 0, NV); }   // reflection
      gl.uniform1f(U.uMir, 0); gl.uniform1f(U.uK, K); gl.drawArrays(gl.LINES, 0, NV);
      if (HI && !lite) {
        // restrained glow: only the main outlines, once more, a pixel and a bit off, faint
        gl.uniform1f(U.uMin, 0.72); gl.uniform1f(U.uK, K * 0.3);
        gl.uniform2f(U.uOff, 1.6 / c.width * dpr, -1.6 / c.height * dpr); gl.drawArrays(gl.LINES, 0, NV);
        gl.uniform1f(U.uMin, 0); gl.uniform2f(U.uOff, 0, 0);
      }
      bind(pb); gl.uniform1f(U.uPt, 1); gl.uniform1f(U.uPS, dpr); gl.uniform1f(U.uK, HI ? 0.9 : 1);
      gl.drawArrays(gl.POINTS, 0, NP);
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
