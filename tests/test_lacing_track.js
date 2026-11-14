// The lacing tutorial's tip track (node tools/lacing_track.js, MA-11 C1): the sample times (the render frames, then
// 120 Hz inside each change of end; sorted, unique, inside the video), the jumps rebuilt from frame.js jumpsOf's rule
// (frameBase slides the tip just after each, not just before), a cut per change of close-up, and a few samples' shape
// (unit basis and tangent, px per mm > 0). The whole run (~8 s) is the tool's own check: it stops if any sample's
// tipSlide disagrees with the jumps.
//   node tests/test_lacing_track.js
"use strict";
const fs = require("fs"), path = require("path");
const T = require("../web/js/lacing_tutorial.js"), H = require("../web/js/hose_route.js");
const K = require("../tools/lacing_track.js");
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL " + msg); } };
const isUnit = (v) => Array.isArray(v) && v.length === 3 && Math.abs(Math.hypot(...v) - 1) < 1e-3;

// ---- sample times ----
{
  const ts = K.sampleTimes(2, 30, [[0.5, 0.7], [1.9, 2.1]], 120);
  ok(ts.every((t, i) => i === 0 || t > ts[i - 1]), "sampleTimes: not sorted and unique");
  ok(ts[0] === 0 && ts[ts.length - 1] < 2, `sampleTimes: not inside [0, 2): ${ts[0]} .. ${ts[ts.length - 1]}`);
  for (let i = 0; i < 60; i++) ok(ts.some((t) => Math.abs(t - i / 30) < 1e-9), `sampleTimes: frame ${i} missing`);
  const inSpan = ts.filter((t) => t >= 0.5 - 1e-9 && t <= 0.7 + 1e-9);
  ok(inSpan.length >= 25, `sampleTimes: ${inSpan.length} samples in a 0.2 s span at 120 Hz (want 25 or more)`);
  ok(inSpan.every((t, i) => i === 0 || t - inSpan[i - 1] <= 1 / 120 + 1e-9), "sampleTimes: a gap over 1 / 120 s inside the dense span");
}

// ---- the jumps: frameBase slides the tip from each, not before it ----
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "web", "data", "lr4_config.json"), "utf8"));
const tm = T.timing(), P = T.referencePlan(H, cfg.hose), g = { fov: 35, aspect: 16 / 9 }, J = K.jumpsOf(tm, T.SHOTS);
ok(J.length > 0, "jumpsOf: none");
for (const j of J) {
  ok(T.frameBase(j - 0.01, P, g, tm).tipSlide === null, `jump ${j.toFixed(3)}: the tip slides before it`);
  ok(T.frameBase(j + 0.01, P, g, tm).tipSlide !== null, `jump ${j.toFixed(3)}: no slide just after it`);
}

// ---- the shots: one id a run of scenes with no cut, a new one at each change of close-up ----
const S = K.shotsOf(tm);
ok(S.length === tm.scenes.length && S[0] === tm.scenes[0].id, "shotsOf: not one id a scene, the first scene's first");
tm.scenes.forEach((s, i) => { if (i > 0) ok((S[i] !== S[i - 1]) === ((T.DETAIL_OF[s.id] || "") !== (T.DETAIL_OF[tm.scenes[i - 1].id] || "")), `shotsOf: ${s.id}'s cut`); });

// ---- a sample's shape, in a main-tape step, a close-up and a slide ----
for (const t of [40, 72, J[0] + 0.1]) {
  const F = T.frameBase(t, P, g, tm), B = K.basisOf(F.cam), tan = K.tangentOf(F, P);
  ok(isUnit(B.right) && isUnit(B.up) && isUnit(B.fwd), `t ${t}: camera basis not unit`);
  ok(Math.abs(B.right[0] * B.fwd[0] + B.right[1] * B.fwd[1] + B.right[2] * B.fwd[2]) < 1e-9, `t ${t}: right not across fwd`);
  ok(F.tipAt && isUnit(tan), `t ${t}: no tip or no unit tangent`);
}

console.log(`test_lacing_track: ${checks - fails} of ${checks} checks passed`);
process.exit(fails ? 1 : 0);
