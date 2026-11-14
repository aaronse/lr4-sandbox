// The lacing tutorial's framing, from geometry (draft 7: in place of screenshot rounds for a camera note): for each t (or
// each scene's key times), where the live end, the action point and (in the finale) the U-turn land in the frame, and the
// cord's width at 720p. Reads docs/specs/lacing-tutorial.shots.json, so an edit there shows at once.
//   node tools/lacing_framing.js [t ...] [--scene done]       (no t: every scene's arrival, middle and work's end)
// margin = how far inside the nearest edge, a share of the half-frame (< 0: out of the frame); same camera as the page
// (LR4LacingTut.framing: frameAt's camera, up +Z, fov 35, 16:9).
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), H = require("../web/js/hose_route.js"), T = require("../web/js/lacing_tutorial.js");
const h = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8")).hose;
const shots = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.shots.json"), "utf8"));
const args = process.argv.slice(2), only = args.includes("--scene") ? args[args.indexOf("--scene") + 1] : null;
const P = T.referencePlan(H, h), tm = T.timing(), g = { fov: 35, aspect: 16 / 9, cordD: h.cord.d, px: 720, machine: { c: [600, 500, 300], r: 1500 } };
let ts = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--scene").map(Number);
if (!ts.length) for (const s of tm.scenes) if (!only || s.id === only) ts.push(s.start + T.TOKENS.slow + 0.05, s.start + s.dur / 2, s.end - T.SETTLE);
const t0 = Date.now();
for (const t of ts) {
  const f = T.framing(t, P, g, tm, shots);
  console.log(`${t.toFixed(2).padStart(7)} ${f.scene.padEnd(8)} cord ${f.cordPx.toFixed(1).padStart(5)} px  ` +
    f.pts.map((q) => `${q.name} ${(100 * q.margin).toFixed(0)}% (${q.x.toFixed(2)}, ${q.y.toFixed(2)})`).join("  "));
}
console.log(`${ts.length} times in ${Date.now() - t0} ms`);
