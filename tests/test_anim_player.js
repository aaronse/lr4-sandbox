// web/js/page/anim_player.js's pure parts: the voice-over's plan on the tutorial's timeline (each scene's wav at its
// scene's start, as tools/lacing_voice.js mux places it), and the t stamp's cells
"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path");
const AP = require("../web/js/page/anim_player.js"), LT = require("../web/js/lacing_tutorial.js");

// the timeline: the page's (LR4LacingTut.timing of its storyboard copy) = the mux's (timing of the JSON)
const sb = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "specs", "lacing-tutorial.storyboard.json"), "utf8"));
const page = LT.timing(), mux = LT.timing(sb);
assert.deepStrictEqual(page.scenes.map((s) => s.start), mux.scenes.map((s) => s.start), "the page's scene starts = the mux's");
// (a scene without a measured audioS has new words, its TTS deferred: no line, the page loads no wav for it)
page.scenes.forEach((s, i) => assert.strictEqual(s.voiced, typeof sb.scenes[i].audioS === "number", `${s.id}: voiced`));
// every voiced line (draft 8: a scene's later lines, "more", in its hold): a scene's own line at its start + its leadS
// (draft 11: the music's intro before the hook), each later one
// its gapS after the line before ends; the mux places the same (lacing_voice.js mux uses voiceLines too)
const lines = LT.voiceLines(page).map((l) => ({ id: l.id, at: l.at, dur: l.dur }));
const own = page.scenes.filter((s) => s.voiced).map((s) => s.id);
assert.deepStrictEqual(lines.filter((l) => own.includes(l.id)).map((l) => [l.id, l.at]), page.scenes.filter((s) => s.voiced).map((s, i) => [s.id, s.start + (sb.scenes.find((q) => q.id === s.id).leadS || 0)]), "a scene's own line at its start + leadS");
for (const s of sb.scenes) {
  let prev = lines.find((l) => l.id === s.id);
  for (const m of s.more || []) {
    const l = lines.find((q) => q.id === m.id), sc = page.scenes.find((q) => q.id === s.id);
    assert.ok(l && Math.abs(l.at - (prev.at + prev.dur + (m.gapS || 0))) < 1e-9 && l.dur === m.audioS, `${m.id}: ${m.gapS} s after ${prev.id}`);
    assert.ok(l.at + l.dur <= sc.end + 1e-9, `${m.id}: ends in its scene (${(l.at + l.dur).toFixed(2)} <= ${sc.end.toFixed(2)})`);
    prev = l;
  }
}

// from 0: every line, each delayed by its scene's start, from its own beginning
const p0 = AP.voicePlan(lines, 0);
assert.deepStrictEqual(p0.map((p) => p.id), lines.map((s) => s.id));
p0.forEach((p) => { assert.strictEqual(p.delay, lines.find((l) => l.id === p.id).at, `${p.id}: starts at its place`); assert.strictEqual(p.offset, 0); });
// a seek into a line: the lines over are left out, the one playing picks up where t is, the rest wait their turn
const k = page.scenes.findIndex((s) => s.id === "tuck"), t = page.scenes[k].start + 1.5;
const p1 = AP.voicePlan(lines, t);
assert.strictEqual(p1[0].id, "tuck");
assert.ok(Math.abs(p1[0].offset - 1.5) < 1e-9 && p1[0].delay === 0, "into the line: offset 1.5 s, now");
p1.slice(1).forEach((p) => { const l = lines.find((q) => q.id === p.id); assert.ok(Math.abs(p.delay - (l.at - t)) < 1e-9 && p.offset === 0, p.id); });
// in a scene's hold (its line over): that line is left out
const h = page.scenes[k].start + sb.scenes[k].audioS + 0.1;
assert.ok(!AP.voicePlan(lines, h).some((p) => p.id === "tuck"), "in the hold: the line is over");
assert.deepStrictEqual(AP.voicePlan(lines, page.duration), [], "at the end: nothing");

// the stamp: head, 20 bits of ms, parity; round trip
for (const s of [0, 1.234, 64.36]) assert.strictEqual(AP.stampT(AP.stampCells(s)), s);
assert.strictEqual(AP.stampT([1, 0, 1]), null);
// the tweak panel's file layout (js/page/anim_tweak.js formatShots): the shots file is in it (a Save rewrites no more than
// it changed), and it reads back as the same data
const AT = require("../web/js/page/anim_tweak.js"), shotsText = fs.readFileSync(path.join(__dirname, "..", "docs", "specs", "lacing-tutorial.shots.json"), "utf8");
assert.strictEqual(AT.formatShots(JSON.parse(shotsText)), shotsText.replace(/\r\n/g, "\n"), "the shots file is in formatShots' layout");
assert.deepStrictEqual(JSON.parse(AT.formatShots(LT.SHOTS)), LT.SHOTS, "formatShots reads back as the same data");
assert.deepStrictEqual([AT.activeIndex([0, 0.4, 0.8], -1), AT.activeIndex([0, 0.4, 0.8], 0.4), AT.activeIndex([0, 0.4, 0.8], 0.79), AT.activeIndex([0, 0.4, 0.8], 9)], [0, 1, 1, 2]);
console.log("anim_player: all checks pass");
