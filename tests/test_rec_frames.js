// Recorded frames: tools/record_demo.js's own helpers (screencast frames matched to the director's steps, the --timing
// statistics: its <frames> block, run here) and the page's t stamp (web/js/page/anim_player.js draws it) read back by
// the draft capture, media-anim capture/frames.ts (the private sibling; skipped with a note when it is absent,
// as on CI).
"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path"), vm = require("vm");
const AP = require("../web/js/page/anim_player.js");

// ---- record_demo.js's <frames> block ----
const src = fs.readFileSync(path.join(__dirname, "..", "tools", "record_demo.js"), "utf8");
const a = src.indexOf("// <frames>"), b = src.indexOf("// </frames>");
assert.ok(a >= 0 && b > a, "record_demo.js: no <frames> block");
const RD = vm.runInNewContext(src.slice(a, b) + "\n({ stepOf, stats })");
const asks = [10.0, 10.06, 10.12, 10.18];
assert.strictEqual(RD.stepOf(asks, 9.99), -1, "before the first step: no step's");
assert.strictEqual(RD.stepOf(asks, 10.0), 0, "at the ask: that step's");
assert.strictEqual(RD.stepOf(asks, 10.05), 0);
assert.strictEqual(RD.stepOf(asks, 10.061), 1);
assert.strictEqual(RD.stepOf(asks, 10.179), 2);
assert.strictEqual(RD.stepOf(asks, 11), 3, "after the last ask: the last step's");
assert.strictEqual(RD.stepOf([], 10), -1);
const xs = [500, 500, 500, 500, 500].concat(Array.from({ length: 100 }, (_, i) => i + 1));
assert.deepStrictEqual(Array.from(RD.stats(xs)), [50.5, 96], "stats: warm-up frames left out, mean and p95");
assert.deepStrictEqual(Array.from(RD.stats([1, 2])), [0, 0]);

// ---- the page's stamp, as media-anim's draft capture reads it ----
const FRAMES = path.join(process.env.MEDIA_ROOT || path.join(__dirname, "..", ".."), "media-anim", "capture", "frames.ts");
if (!fs.existsSync(FRAMES)) {
  console.log(`rec_frames: record_demo checks pass; stamp checks skipped (no media-anim at ${FRAMES})`);
} else {
  const F = require(FRAMES);
  assert.deepStrictEqual([AP.STAMP, AP.STAMP_CELLS], [F.STAMP, F.STAMP_CELLS], "the page's stamp codec = media-anim's (draft.ts reads the page's stamps)");
  // a gray strip with the page's cells painted, JPEG-like ringing on each cell's edge and noise inside
  const strip = (cells, noise) => {
    const c = AP.STAMP.cell, w = cells.length * c, g = new Uint8Array(w * c);
    for (let y = 0; y < c; y++) for (let x = 0; x < w; x++) {
      const v = cells[Math.floor(x / c)] ? 235 : 16, edge = x % c === 0 || y === 0;
      g[y * w + x] = Math.max(0, Math.min(255, v + (edge ? (v > 128 ? -120 : 120) : noise * Math.sin(x * 7 + y * 3))));
    }
    return [g, w];
  };
  for (const t of [0, 0.033, 12.345, 64.36, 1048.575]) {
    const [g, w] = strip(AP.stampCells(t), 40);
    assert.strictEqual(F.stampRead(g, w), t, `stamp ${t} s`);
    assert.strictEqual(F.stampRead(g, w, AP), t, `stamp ${t} s (the page's own stampT)`);
  }
  assert.strictEqual(AP.stampCells(2000).length, AP.STAMP_CELLS, "past 20 bits: clamped, still a stamp");
  { const cells = AP.stampCells(5); cells[10] ^= 1; const [g, w] = strip(cells, 0); assert.strictEqual(F.stampRead(g, w), null, "a flipped bit: parity fails"); }
  console.log("rec_frames: all checks pass");
}
