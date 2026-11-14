// The tutorial's live preview (index.html?anim=lacing&play=1, js/page/anim_player.js) in headless Chrome (SwiftShader):
// it loads with its bar, each voice line sits at its scene's start (the wavs in exports/lacing_voice/, from
// tools/lacing_voice.js tts; without them the voice checks are skipped), a seek shows that t's frame and scene, a click
// on play runs the clock and schedules the lines still to come, pause stops it.
//   node tests/test_page_anim_play.js   (not in npm test: needs Chrome + Python)
"use strict";
const fs = require("fs"), path = require("path");
const { CHROME, ROOT, sleep, server, chromePage } = require("./test_page_fluidnc.js");
const LT = require("../web/js/lacing_tutorial.js");

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; console.log((cond ? "  ok   " : "  FAIL ") + msg); if (!cond) fails++; };

(async () => {
  if (!CHROME) { console.log("Chrome not found (set CHROME)"); process.exit(1); }
  const port = 8690 + Math.floor(Math.random() * 100), srv = server("headers", port);
  const page = await chromePage(9500 + Math.floor(Math.random() * 100));
  const tm = LT.timing(), sb = LT.STORYBOARD;
  // the voiced lines (LR4LacingTut.voiceLines: a scene's own at its start, a later one - the finale's tip - in its hold;
  // a line without audioS has new words, its TTS deferred: silent, captions only)
  const vs = LT.voiceLines(tm), audioOf = (id) => vs.find((q) => q.id === id).dur;
  const wavs = vs.length > 0 && vs.every((s) => fs.existsSync(path.join(ROOT, "exports", "lacing_voice", `${s.id}.wav`)));
  try {
    await sleep(800);
    await page.send("Page.navigate", { url: `http://127.0.0.1:${port}/web/index.html?anim=lacing&play=1` });
    let up = false;
    for (let i = 0; i < 360 && !up; i++) {
      await sleep(500);
      try { up = await page.val("!!(window.__player && __player.ready())"); } catch (e) { /* loading */ }
    }
    ok(up, "the player is up");
    if (!up) return;
    const a = await page.val(`({ bar: !!document.getElementById("anim-bar"), seek: +document.getElementById("anim-seek").max,
      st: __player.state(), voice: __player.voice(), scenes: __anim.scenes })`);
    ok(a.bar && Math.abs(a.seek - tm.duration) < 0.01, `the bar, its scrubber over the whole ${tm.duration.toFixed(2)} s`);
    ok(!a.st.playing && a.st.t === 0, "no autoplay: it waits at t = 0");
    if (!wavs) console.log("  (no wavs in exports/lacing_voice/: voice checks skipped)");
    else {
      ok(a.voice.length === vs.length, `${a.voice.length} voice lines loaded, ${vs.length} voiced lines in ${tm.scenes.length} scenes (${a.st.note})`);
      ok(a.voice.every((v, i) => v.id === vs[i].id && Math.abs(v.at - vs[i].at) < 1e-9),
        "each line at its place: its scene's start, a later one in the hold (= tools/lacing_voice.js mux's offsets)");
      const tip = a.voice.find((v) => v.id === "done_tip"), done = tm.scenes[tm.scenes.length - 1];
      ok(tip && tip.at > done.start + done.voice && tip.at + tip.dur <= done.end, `the finale's tip at ${tip && tip.at.toFixed(2)} s, in the finale's hold`);
      ok(a.voice.every((v) => Math.abs(v.dur - audioOf(v.id)) < 0.02), "each wav's length = the storyboard's measured audioS");
    }
    // a seek: that t's frame, scene and cue
    const s = await page.val(`(() => { __player.seek(30); const r = document.querySelector("main.stage");
      return { t: r.dataset.t, scene: r.dataset.scene, label: document.getElementById("anim-scene").textContent, cue: document.querySelector("[data-part=cue]").textContent }; })()`);
    const want = tm.scenes.filter((q) => q.start <= 30).pop();
    ok(s.t === "30.00" && s.scene === want.id && s.label === want.id, `seek 30: data-t ${s.t}, scene ${s.scene} (${want.id}), the bar says ${s.label}`);
    ok(s.cue === want.cue, `the cue: "${s.cue}"`);
    // the scrubber: an input event seeks
    const r = await page.val(`(() => { const e = document.getElementById("anim-seek"); e.value = "10"; e.dispatchEvent(new Event("input"));
      return document.querySelector("main.stage").dataset.t; })()`);
    ok(r === "10.00", `the scrubber to 10: data-t ${r}`);
    await page.val("__player.seek(30)");
    // play by a click (a user gesture: Web Audio may start)
    const b = await page.val(`(() => { const r = document.getElementById("anim-play").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
    for (const type of ["mousePressed", "mouseReleased"])
      await page.send("Input.dispatchMouseEvent", { type, x: b[0], y: b[1], button: "left", buttons: type === "mousePressed" ? 1 : 0, clickCount: 1 });
    await sleep(300);
    const p = await page.val("({ st: __player.state(), sched: __player.scheduled(), sfx: __player.sfx(), cues: __anim.sfx })");
    ok(p.st.playing, `a click on play: playing (audio ${p.st.audio})`);
    if (wavs) {
      const future = vs.filter((q) => q.at >= 30);
      ok(future.every((q) => p.sched.some((x) => x.id === q.id && Math.abs(x.delay - (q.at - 30)) < 1e-9 && x.offset === 0)),
        `from 30 s: the lines to come wait their scenes' starts (${p.sched.map((x) => `${x.id}+${x.delay.toFixed(2)}`).join(", ")})`);
      // the trim's swipes (draft 6) on the same timeline: each wav at its cut less its lead; those to come wait for it
      // (draft 9: two - the square knot's short end, the closing sequence's one tie-off end)
      const fut = p.cues.filter((c) => c.at >= 30);
      ok(p.cues.length === 2 && p.sfx.length === 2 && fut.length && fut.every((c) => p.sched.some((x) => x.id === "sfx:" + c.id && Math.abs(x.delay - (c.at - 30)) < 1e-9)),
        `the swipes: ${p.sfx.length} loaded, ${fut.length} to come at ${fut.map((c) => c.at.toFixed(2)).join(", ")} s`);
    }
    await sleep(2000);
    const t1 = await page.val("__player.state().t");
    ok(t1 > 31 && t1 < 34, `the clock runs: t ${t1.toFixed(2)} after ~2.3 s`);
    await page.val("__player.pause()");
    const t2 = await page.val("__player.state().t");
    await sleep(800);
    const t3 = await page.val("__player.state().t"), d = await page.val('document.querySelector("main.stage").dataset.t');
    ok(t3 === t2 && d === t2.toFixed(2), `paused: t holds at ${t3.toFixed(2)}`);
    // the callouts (draft 10): at each one's middle the card is drawn as frameAt laid it out - its text fits the card
    // (the layout's line count is an upper bound) and the card sits inside the stage, clear of the cue
    const cos = LT.calloutsOf(tm), cs = [];
    for (const co of cos) {
      cs.push(await page.val(`(() => { __player.seek(${Math.min(co.tOut, Math.max((co.tIn + co.tOut) / 2, co.tIn + LT.CO_IN)).toFixed(3)}); const st = document.querySelector("main.stage").getBoundingClientRect();
        const card = document.querySelector("[data-callout-part=card]"), r = card.getBoundingClientRect(), cue = document.querySelector("[data-part=cue]").getBoundingClientRect();
        const parts = [...card.children].filter((e) => e.dataset.calloutPart).map((e) => e.getBoundingClientRect());
        return { term: card.querySelector("[data-callout-part=term]").textContent, op: +card.style.opacity, fits: card.scrollHeight <= card.clientHeight + 1 && card.scrollWidth <= card.clientWidth + 1, over: card.scrollHeight - card.clientHeight,
          bottom: Math.max(...parts.map((p) => p.bottom)), r: [r.left - st.left, r.top - st.top, r.right - st.left, r.bottom - st.top], w: st.width, h: st.height, cueTop: cue.top - st.top }; })()`));
    }
    // (a callout held under its pop-in - CO_IN - never shows fully: the unit test notes it)
    ok(cs.every((c, i) => c.term === cos[i].title && (c.op > 0.99 || cos[i].tOut - cos[i].tIn < LT.CO_IN)), `callouts on screen at their middles: ${cs.map((c) => `${c.term} ${c.op.toFixed(2)}`).join(", ")}`);
    ok(cs.every((c) => c.fits && c.bottom <= c.r[3] + 0.5), `callouts: each card's text fits (${cs.filter((c) => !c.fits || c.bottom > c.r[3] + 0.5).map((c) => `${c.term} ${c.over} px over`).join(", ") || "all"})`);
    ok(cs.every((c) => c.r[0] >= 0 && c.r[1] >= 0 && c.r[2] <= c.w && c.r[3] <= c.cueTop), `callouts: each card inside the stage, above the cue (${cs.map((c) => `${c.term} ${c.r.map((v) => v.toFixed(0)).join(",")}`).join("; ")})`);
  } catch (e) {
    ok(false, "error: " + (e && e.stack || e));
  } finally {
    await page.close();
    srv.kill();
    console.log(`${checks - fails}/${checks} ok`);
    process.exit(fails ? 1 : 0);
  }
})();
