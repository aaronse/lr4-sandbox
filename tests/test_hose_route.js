// hose_route.js against its Python twins (freecad/lacing.py: hose_route / cord_route / lacing; lr4.catmull_rom) on the reference hose
// (web/data/lr4_config.json) at a few poses, and the lacing's own rules (NASA-STD-8739.4 Table 9-1 spacing, a stitch
// either side of the sleeve's breakout, the tape on the bundle's outline).
//   node tests/test_hose_route.js      (needs python on PATH; set PYTHON to use another)
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const H = require("../web/js/hose_route.js");

const ROOT = path.join(__dirname, "..");
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL " + msg); } };
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8"));
const POSES = [[0, 0], [-250, 0], [-500, -40]];   // (dx, dz) from the build pose: parked, mid-travel, far -X + down

function sweep(h, dx, dz) {                       // = the page's updateHose at dy 0 (the Python: lr4_sweep below)
  const pts = H.hoseRoute(h, dx, dz).map((p) => p.slice(0, 3)), curve = H.catmullRom(pts, 12);
  const c = h.cord, s = h.sleeve, sh = (p) => [p[0] + dx, p[1], p[2] + dz];
  const cp = H.cordRoute(curve, h, c, sh(c.tip), sh(c.tip2), dx), sp = H.cordRoute(curve, h, s, null, null, dx, [0, 0, dz]);
  const lace = H.lacing(curve, h, [{ to: "breakout", x: s.exit.x, cables: [{ pts: cp, d: c.d }, { pts: sp, d: s.d }] },
    { to: "exit", cables: [{ pts: cp, d: c.d }] }], dx);
  return { pts, curve, cp, sp, lace };
}
const PY = `
import json, sys
sys.path.insert(0, sys.argv[1])
import lacing as lr4   # the tutorial's twins (lr4's own hose code is upstream's)
h = json.load(open(sys.argv[2]))["hose"]
out = []
for dx, dz in json.loads(sys.argv[3]):
    pts = [p[:3] for p in lr4.hose_route(h, dx, dz)]
    curve = lr4.catmull_rom(lr4.hose_route(h, dx, dz), 12)
    c, s = h["cord"], h["sleeve"]
    sh = lambda p: [p[0] + dx, p[1], p[2] + dz]
    cp = lr4.cord_route(curve, h, c, sh(c["tip"]), sh(c["tip2"]), dx)
    sp = lr4.cord_route(curve, h, s, None, None, dx, (0.0, 0.0, dz))
    lace = lr4.lacing(curve, h, [dict(to="breakout", x=s["exit"]["x"], cables=[dict(pts=cp, d=c["d"]), dict(pts=sp, d=s["d"])]),
                                 dict(to="exit", cables=[dict(pts=cp, d=c["d"])])], dx)
    out.append(dict(pts=pts, curve=curve, cp=cp, sp=sp, lace=lace))
print(json.dumps(dict(poses=out, LACING=lr4.LACING)))
`;
const pyOut = JSON.parse(execFileSync(process.env.PYTHON || "python", ["-c", PY, path.join(ROOT, "freecad"),
  path.join(ROOT, "web", "data", "lr4_config.json"), JSON.stringify(POSES)], { encoding: "utf8", maxBuffer: 1 << 28 }));
const py = pyOut.poses;
ok(JSON.stringify(pyOut.LACING) === JSON.stringify(H.LACING), `LACING: ${JSON.stringify(H.LACING)} vs lacing.LACING ${JSON.stringify(pyOut.LACING)}`);

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
function cmpPts(msg, a, b) {
  ok(a.length === b.length, `${msg}: ${a.length} points vs ${b.length} (Python)`);
  let worst = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(a[i][k] - b[i][k]));
  ok(worst < 1e-6, `${msg}: off by ${worst} mm`);
}
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const segDist = (p, a, b) => {                    // p to the segment a-b
  const ab = [0, 1, 2].map((k) => b[k] - a[k]), l2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
  const f = Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / l2));
  return dist(p, [0, 1, 2].map((k) => a[k] + ab[k] * f));
};

POSES.forEach(([dx, dz], n) => {
  const js = sweep(cfg.hose, dx, dz), p = py[n], tag = `pose ${dx},${dz}`;
  cmpPts(`${tag} hose route`, js.pts, p.pts);
  cmpPts(`${tag} hose curve`, js.curve, p.curve);
  cmpPts(`${tag} cord`, js.cp, p.cp);
  cmpPts(`${tag} sleeve`, js.sp, p.sp);
  ok(js.lace.stitches === p.lace.stitches, `${tag} stitches ${js.lace.stitches} vs ${p.lace.stitches}`);
  ok(near(js.lace.length, p.lace.length), `${tag} tape ${js.lace.length} vs ${p.lace.length}`);
  ok(js.lace.runs.length === p.lace.runs.length, `${tag} runs`);
  js.lace.runs.forEach((r, i) => {
    const q = p.lace.runs[i];
    ok(r.s.length === q.s.length && r.s.every((s, k) => near(s, q.s[k])), `${tag} run ${i} stitch places`);
    cmpPts(`${tag} run ${i} tape`, r.pts, q.pts);
  });

  // the rules: two runs (the sleeve's breakout), stitches <= 76.2 apart (Table 9-1, harness over 25.4 mm) and
  // evenly spaced but for the last; the breakout between the runs, a stitch within 15 mm either side of it
  const L = js.lace, [r1, r2] = L.runs;
  ok(L.runs.length === 2, `${tag}: two runs, got ${L.runs.length}`);
  for (const r of L.runs) for (let k = 1; k < r.s.length; k++) {
    const g = r.s[k] - r.s[k - 1];
    ok(g <= 76.2 + 1e-9 && g > 0, `${tag}: stitch gap ${g.toFixed(1)} mm`);
    if (k < r.s.length - 1) ok(near(g, H.LACING.pitch), `${tag}: even pitch ${g}`);
  }
  const arc = [0];
  for (let i = 1; i < js.curve.length; i++) arc.push(arc[i - 1] + dist(js.curve[i], js.curve[i - 1]));
  let iTurn = 0;
  js.curve.forEach((q, i) => { if (q[0] > js.curve[iTurn][0]) iTurn = i; });
  const iB = js.curve.findIndex((q, i) => i >= iTurn && q[0] < cfg.hose.sleeve.exit.x), sB = arc[iB];
  ok(r1.s[r1.s.length - 1] < sB && sB - r1.s[r1.s.length - 1] <= 15, `${tag}: closing stitch next to the breakout`);
  ok(r2.s[0] > sB && r2.s[0] - sB <= 15, `${tag}: starting stitch next to the breakout`);
  // the tape lies on the bundle: never inside its own stretch of hose, within a few mm of its outline (hose + cables),
  // and where the runs rest on each other (the cord in the pocket between them) no more than a tape into the other run
  let inside = 0, far = 0, other = 0;
  const R = cfg.hose.od / 2, T = H.LACING.tape;
  for (const r of L.runs) {
    let sq = r.s[0];                              // its own section: followed along the hose from the first stitch
    for (const q of r.pts) {
      let own = Infinity, any = Infinity, si = sq;
      for (let i = 0; i < js.curve.length; i++) {
        const d = dist(q, js.curve[i]);
        any = Math.min(any, d);
        if (Math.abs(arc[i] - sq) < 40 && d < own) { own = d; si = arc[i]; }
      }
      sq = si;
      if (own < R + T / 2 - 0.05) inside++;
      // (the sleeve crosses over the cord; where it lifts off the hose, cordRoute's lift, the tape goes over it)
      if (own > R + cfg.hose.cord.d + cfg.hose.sleeve.d + 4 && !(js.sp.some((p, i) => i > 0 && segDist(q, js.sp[i - 1], p) < cfg.hose.sleeve.d / 2 + T + 3))) far++;
      if (any < R - T / 2) other++;
    }
  }
  ok(inside === 0, `${tag}: ${inside} tape points inside the hose`);
  ok(far === 0, `${tag}: ${far} tape points off the bundle`);
  ok(other === 0, `${tag}: ${other} tape points more than a tape into the other run`);
  // tape to buy: more than the path's turns (each at least the hose's circumference), and a tail per knot
  ok(L.length > L.stitches * Math.PI * cfg.hose.od + 4 * H.LACING.tail, `${tag}: tape ${L.length.toFixed(0)} mm`);
  if (n === 0) console.log(`parked: ${L.stitches} stitches, ${(L.length / 1000).toFixed(2)} m of tape`);
});

// continuity (draft 3 of the lacing tutorial: the lacing jittered while the core moved): the same pose gives the same
// lacing; a small move of the core moves no tape point more than the hose under it can (the upper run rides the core,
// the U-turn rolls at half its speed), and the lacing on the lower run past the breakout, where the hose lies still,
// stays put. (Before the fix: 4-7 mm a 2 mm step on the still run, 17-27 mm where the sleeve lifts off the hose.) The
// one step left: the U-turn's first point drops out when the core comes within 30 mm of it (g < 30, dx ~292 here), a
// ~0.5 mm twitch of the hose; the tutorial's core stops short of it.
{
  const a = sweep(cfg.hose, 120, 0).lace, b = sweep(cfg.hose, 120, 0).lace;
  ok(JSON.stringify(a) === JSON.stringify(b), "the same pose, the same lacing");
  const hdAll = (P, Q) => {                       // the farthest point of P from the polyline Q: every point, every segment
    let m = 0;
    for (const p of P) { let d = Infinity; for (let j = 1; j < Q.length; j++) d = Math.min(d, segDist(p, Q[j - 1], Q[j])); m = Math.max(m, d); }
    return m;
  };
  // the same number, the same bits (R12, 2026-11-10: hdAll was 6.2 s of the file's 7): the nearest segment walked to from
  // the last point's; a point whose walk ends no farther than the farthest so far cannot raise it (skipped); else every
  // segment but those whose box is over 1e-6 mm farther than the nearest so far (rounding is ~1e-12 here), so its min is
  // hdAll's. Points or segments not all finite (NaN: min / max order matters), or no segment: hdAll.
  const hd = (P, Q) => {
    const n = Q.length - 1;
    if (n < 1 || !P.every((p) => p.every(Number.isFinite)) || !Q.every((p) => p.every(Number.isFinite))) return hdAll(P, Q);
    const lo = new Float64Array(3 * n), hi = new Float64Array(3 * n);
    for (let j = 0; j < n; j++) for (let k = 0; k < 3; k++) { lo[3 * j + k] = Math.min(Q[j][k], Q[j + 1][k]); hi[3 * j + k] = Math.max(Q[j][k], Q[j + 1][k]); }
    const sd = (p, j) => segDist(p, Q[j], Q[j + 1]);   // (segment j = hdAll's j + 1)
    let m = 0, j0 = 0;
    for (const p of P) {
      let d = sd(p, j0);
      for (let step = 1; ;) {                     // downhill from the last point's nearest
        const j1 = j0 + step;
        if (j1 >= 0 && j1 < n) { const d1 = sd(p, j1); if (d1 < d) { d = d1; j0 = j1; continue; } }
        if (step === 1) { step = -1; continue; }
        break;
      }
      if (d <= m) continue;
      for (let j = 0; j < n && d > m; j++) {
        let b = 0;
        for (let k = 0; k < 3; k++) { const v = p[k], e = v < lo[3 * j + k] ? lo[3 * j + k] - v : v > hi[3 * j + k] ? v - hi[3 * j + k] : 0; b += e * e; }
        if (Math.sqrt(b) > d + 1e-6) continue;
        const dj = sd(p, j);
        if (dj < d) { d = dj; j0 = j; }
      }
      m = Math.max(m, d);
    }
    return m;
  };
  const xb = cfg.hose.sleeve.exit.x;
  let prev = sweep(cfg.hose, 230, 0).lace, worst = 0, still = 0;
  for (let dx = 231; dx <= 285; dx += 1) {
    const now = sweep(cfg.hose, dx, 0).lace;
    for (let r = 0; r < now.runs.length; r++) worst = Math.max(worst, hd(now.runs[r].pts, prev.runs[r].pts));
    still = Math.max(still, hd(now.runs[1].pts.filter((p) => p[0] < xb - 40), prev.runs[1].pts));
    prev = now;
  }
  ok(worst < 1.6, `a 1 mm move of the core moves the lacing up to ${worst.toFixed(2)} mm (want < 1.6: the U-turn's outside rolls ~1.5 x)`);
  ok(still < 0.3, `the lacing on the still lower run moves ${still.toFixed(2)} mm a 1 mm step (want < 0.3)`);
  console.log(`continuity: 1 mm steps at dx 230-285: the lacing moves <= ${worst.toFixed(2)} mm, ${still.toFixed(2)} mm on the still run`);
}

console.log(`${checks - fails}/${checks} checks passed`);
if (fails) process.exit(1);
