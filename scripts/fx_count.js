// r20B: count the background scene per node (fx3d.js build()): line segments, line vertices, points; high and low tier.
// Usage: node scripts/fx_count.js [fx3d.js]
const fs = require("fs");
const src = fs.readFileSync(process.argv[2] || __dirname + "/../fx3d.js", "utf8");
const i = src.indexOf("  function build(lo) {"), j = src.indexOf("\n  }\n", src.indexOf("return { L: new Float32Array(A)", i)) + 4;
let body = src.slice(i, j).split("\n").map((l) => {
  const m = /^    \/\/ (\d) · ([^:,(]+)/.exec(l) || (/^    \/\/ stars/.test(l) && [0, "S", "stars + vertex points"]);
  return m ? `    __mark(${JSON.stringify(m[1] + " " + m[2].trim())}, A.length, S.length);\n` + l : l;
}).join("\n");
const PI = Math.PI, TAU = 2 * PI;
for (const lo of [false, true]) {
  const marks = [];
  const __mark = (n, a, s) => marks.push([n, a, s]);
  const build = eval("(" + body.trim() + ")");
  const r = build(lo);
  marks.push(["end", r.L.length, r.P.length]);
  console.log(lo ? "\nLOW" : "HIGH");
  console.log("node".padEnd(34), "segments".padStart(9), "line verts".padStart(11), "points".padStart(8));
  for (let k = 0; k < marks.length - 1; k++) {
    const [n, a, s] = marks[k], [, a2, s2] = marks[k + 1];
    console.log(n.slice(0, 33).padEnd(34), String((a2 - a) / 16).padStart(9), String((a2 - a) / 8).padStart(11), String((s2 - s) / 8).padStart(8));
  }
  console.log("total".padEnd(34), String(r.L.length / 16).padStart(9), String(r.L.length / 8).padStart(11), String(r.P.length / 8).padStart(8));
}
