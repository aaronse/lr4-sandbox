// The script view: each scene's phases in its work (phasesOf), a camera key's local s (keyLocal), and every scene's
// events in its own time (eventsOf: camera keys, layers, knot / draw phases, the pose, cuts, swipes, callouts, the
// reveal, the credits, the voice's lines) - read by tools/lacing_voice.js transcript.
//   Uses data, timeline, core, opening, knots, shots, blade, callouts, media-anim reveal / credits / camera. Tests: tests/test_lacing_tutorial.js
//     --only events, transcript.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { SHOTS, STORYBOARD } = use("data");
  const { TOKENS, bodyOf } = use("timeline");
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { REVEAL, at: revealAt } = lib("reveal"), CR = lib("credits").LAYOUT, CAM = lib("camera");
  const { SETTLE, MOVE_DX, HITCH, TIGHT, timing, localOfWork } = use("core");
  const { SQ } = use("knots");
  const { stepsOf, macrosOf } = use("knot_gen");
  const { isCut, leadOf, LAYERS } = use("shots");
  const { sfxAt } = use("blade");
  const { calloutsOf } = use("callouts");
  const { legsOf, OPENING } = use("opening");

  // ---- the script view (draft 8): each scene's events in its own time, from what the picture reads - the shots' keys and
  // layer tracks, the knots' phases (their steps' until / draw / pull, SQ), the blade's cuts (localOfWork, as bladeAt),
  // the swipes (sfxAt), the voice's lines (timing) - so the transcript says what the video does, nothing typed twice ----
  // a scene's phases in its work w (0 - 1): [{ what, w0, w1, kind }] - "knot" for the knots (knotGen's steps; the square
  // knots' SQ, as knotAt draws them; the lock stitch's three close-ups, as hitchAt), "draw" for the tape drawn on
  // (drawOf); none for the rest
  function phasesOf(id, shots = SHOTS) {
    // knotGen: the steps' untils (from their from, else the until before; a step's what names it), else K.draw, then each
    // pull; on a knot over several scenes (K.scenes, draft 9) its work u = the scene's place + w: the scene's own share
    const gen = (K, sc) => {
      const out = [], steps = stepsOf(K), pulls = steps.filter((s) => s.op === "pull");
      let w0 = 0, ops = [];
      steps.forEach((s, si) => {
        if (s.op === "pull") { if (ops.length) { out.push({ what: [...new Set(ops)].join(", "), w0: K.draw ? K.draw[0] : w0, w1: K.draw ? K.draw[1] : s.from, i: si - 1 }); ops = []; } out.push({ what: s.what || "pull snug", w0: s.from, w1: s.to, i: si }); return; }
        if (s.op === "start") return;
        ops.push(s.what || (s.under ? "tuck under" : s.op === "wrap" ? "wrap" + (s.loose ? " (loose)" : "") : "lay"));
        if (s.until !== undefined) { out.push({ what: [...new Set(ops)].join(", "), w0: s.from === undefined ? w0 : s.from, w1: s.until, i: si }); w0 = s.until; ops = []; }
      });
      if (ops.length) out.push({ what: [...new Set(ops)].join(", "), w0: K.draw ? K.draw[0] : w0, w1: K.draw ? K.draw[1] : 1, i: steps.length - 1 });
      // (a knot written as macros, 2026-11-10: a phase a macro - its words, its span - with its steps' phases as its
      // parts; a trim, which has no steps, at its blade cut)
      const ms = macrosOf(K);
      const ph = !ms.length ? out : ms.map((M, mi) => {
        const parts = out.filter((p) => p.i >= M.steps[0] && p.i <= M.steps[1] && M.do !== "pull");
        let w0_ = M.from, w1_ = M.until;
        if (M.do === "trim") for (const [k, id] of (K.scenes || []).entries()) for (const c of ((shots.blade || {}).cuts || {})[id] || []) if (c.end === K.sequence[mi].end) w0_ = w1_ = k + c.w;
        if (w1_ === undefined && parts.length) w1_ = parts[parts.length - 1].w1;
        return Object.assign({ what: M.what, w0: w0_, w1: w1_, macro: M.do }, parts.length ? { parts: parts.map((p) => ({ what: p.what, w0: p.w0, w1: p.w1 })) } : {});
      }).filter((p) => p.w0 !== undefined && p.w1 !== undefined);
      ph.forEach((p) => delete p.i);
      ph.sort((a, b) => a.w0 - b.w0);
      const i = sc && K.scenes ? K.scenes.indexOf(sc) : -1;
      const loc = (p) => Object.assign(p, { w0: +(p.w0 - i).toFixed(9), w1: +(p.w1 - i).toFixed(9) }, p.parts ? { parts: p.parts.map(loc) } : {});
      const mine = i < 0 ? ph : ph.filter((p) => p.w0 >= i - 1e-9 && p.w1 <= i + 1 + 1e-9).map(loc);
      return mine.map((p) => Object.assign(p, { kind: "knot" }));
    };
    const KC = shots.knots.closing;
    if (KC && KC.scenes.includes(id)) return gen(KC, id);
    const reef = (second) => [["lay both ends", 0, SQ.lay], [`first half knot: right over left${second ? "" : " (right end over and under the left)"}`, SQ.lay, SQ.h1],
      ["left end round and back", SQ.h1, SQ.endL], ["second half knot: left over right", SQ.endL, SQ.h2], ["pull snug", SQ.h2, SQ.pull]]
      .map(([what, w0, w1]) => ({ kind: "knot", what, w0, w1 }));
    switch (id) {
      case "clove": return gen(shots.knots.clove);
      case "square": return reef(false);
      case "wrap": return [{ kind: "knot", what: "one loose turn round the bundle", w0: 0, w1: 1 }];
      case "tuck": return [{ kind: "knot", what: "the end over its standing part, then under the turn's start (the lock)", w0: 0, w1: 1 }];
      case "tight": return [{ kind: "knot", what: `pulled: the loop shrinks onto the bundle (${HITCH.loose} x -> 1 x its radius)`, w0: 0, w1: TIGHT }];
      case "start": return [{ kind: "draw", what: "the starting stitch drawn on", w0: 0, w1: 1 }];
      case "lock": return [{ kind: "draw", what: "the lock stitches to the U-turn", w0: 0, w1: 1 }];
      case "uturn": return [{ kind: "draw", what: "the lock stitches round the U-turn and back, on from the lock scene at one pace", w0: 0, w1: 1, l0: 0 }];   // (d14: draw.js runAt)
      default: return [];
    }
  }
  // a camera key's local s: its clock ("share", "work", "s") at its x, through the scene's "time" ease
  const keyLocal = (cam, sc, x) => CAM.keyLocal(cam, sc, x, localOfWork);
  const r2 = (v) => +v.toFixed(2), r3 = (v) => +v.toFixed(3);
  // -> [{ id (scene), events: [{ at_rel (share of the scene), t (s into the video), kind, what, ... }] }], each scene's
  // events by t. Kinds: camera (a key: focus, az / el, fit / dist / fitFocus), layer (a layer's opacity set or reached),
  // knot / draw (a phase's start and end), pose (the core's travel), cut (the blade cuts an end), sfx (a swipe's wav
  // starts), voice (a line starts / ends), callout (a term card starts to pop in / is gone: draft 10)
  function eventsOf(tm = timing(), shots = SHOTS) {
    return tm.scenes.map((sc, i) => {
      const ev = [], own = shots.scenes[sc.id] || {}, push = (local, kind, what, extra) => ev.push(Object.assign(
        { at_rel: r3(Math.max(0, Math.min(1, local / sc.dur))), t: r3(sc.start + local), kind, what }, extra || {}));
      const cam = own.camera;
      if (cam) cam.keys.forEach((k, j) => {
        const size = k.dist !== undefined ? `dist ${k.dist} mm` : k.fit !== undefined ? `fit ${k.fit} mm` : `fitFocus ${k.fitFocus}`;
        push(keyLocal(cam, sc, k.x), "camera", `key ${j + 1}/${cam.keys.length}: focus ${JSON.stringify(k.focus)}, ${k.frame || "world"} az ${r2(k.az)} el ${r2(k.el)}, ${size}` +
          (j === 0 && k.x === 0 && i > 0 ? (isCut(tm, i - 1, i) ? " (cut to, under the dip)" : ` (moved to over ${leadOf(tm, i, shots)} s either side of the scene's start)`) : k.ease ? `, eased ${k.ease}` : ""),
        { key: j, x: k.x });
      });
      for (const L of LAYERS) {
        const tr = own.layers && own.layers[L];
        if (tr === undefined) continue;
        if (typeof tr === "number") { push(0, "layer", `${L} ${tr} (default ${shots.defaults.layers[L]})`, { layer: L, value: tr }); continue; }
        tr.forEach((k, j) => push(k[0], "layer", j ? `${L} reaches ${k[1]} (from ${tr[j - 1][1]}, ${k[2] || "linear"} over ${r2(k[0] - tr[j - 1][0])} s)` : `${L} ${k[1]}`, { layer: L, value: k[1] }));
      }
      for (const p of phasesOf(sc.id, shots)) {
        push(p.l0 !== undefined ? p.l0 : localOfWork(sc, p.w0), p.kind, `${p.what}: starts`, Object.assign({ w: p.w0, edge: "start" }, p.macro ? { macro: p.macro } : {},
          p.parts ? { parts: p.parts.map((q) => `${q.what} (w ${q.w0} - ${q.w1}, ${r3(localOfWork(sc, q.w0))} - ${r3(localOfWork(sc, q.w1))} s)`) } : {}));
        push(localOfWork(sc, p.w1), p.kind, `${p.what}: ends`, { w: p.w1, edge: "end" });
      }
      if (sc.purpose === "preview-goal") {          // (d12) opening.js travelOf: out and back n times, parked before the end
        const L = legsOf(sc.dur);
        for (let c = 0; c < L.n; c++) {
          push(c * L.cycle, "pose", `the core sets off out along X (${c + 1} of ${L.n}: to ${MOVE_DX} mm in ${r2(L.leg)} s)`, { edge: "out" });
          push(c * L.cycle + L.leg + L.dwell, "pose", `the core sets off back home (${c + 1} of ${L.n})`, { edge: "back" });
        }
        push(L.n * L.cycle, "pose", "the core parked at home", { edge: "parked" });
      }
      if (sc.purpose === "confirm") {               // poseOf: out MOVE_DX and back over the scene, past its arrival
        push(TOKENS.slow, "pose", `the core starts out along X (to ${MOVE_DX} mm and back)`);
        push(TOKENS.slow + (bodyOf(sc) - TOKENS.slow - SETTLE) / 2, "pose", `the core at its furthest, ${MOVE_DX} mm out`);
        push(bodyOf(sc) - SETTLE, "pose", "the core back home");
      }
      const B = shots.blade;
      for (const c of (B && B.cuts[sc.id]) || []) push(localOfWork(sc, c.w), "cut", `the blade cuts the ${c.end === "short" ? "short end" : c.end === "L" ? "left end" : c.end === "R" ? "right end" : c.end + " end"}`, { w: c.w });
      for (const q of sfxAt(tm, shots).filter((q_) => q_.scene === sc.id)) push(q.t - B.sfxLead - sc.start, "sfx", `swipe (the cut ${B.sfxLead} s later)`, { sfx: q.id, cut_t: r3(q.t) });
      for (const co of calloutsOf(tm).filter((q) => q.scene === sc.id)) {   // (draft 10: in = it starts to pop in, out = it is gone)
        const why = co.word ? `on "${co.word}"` : `at ${r2((co.want - sc.start) / sc.dur)} of the scene`;
        push(co.tIn - sc.start, "callout", `${co.title} in (${why}${co.waited > 1e-6 ? `, waited ${r2(co.waited)} s` : ""}): "${co.def}" - ${co.source}`, { term: co.term, edge: "in", anchor: co.anchor });
        push(co.tGone - sc.start, "callout", `${co.title} out (held ${r2(co.tOut - co.tIn)} s${co.short > 1e-6 ? `, ${r2(co.short)} s short to end in the scene` : ""})`, { term: co.term, edge: "out", anchor: co.anchor });
      }
      const rv = revealAt(sc, sc.start, tm);          // (draft 11: the opening's flash on the music's hit; d12: on the word)
      if (rv) {
        const gl = own.layers && own.layers.ghost, R = (STORYBOARD.scenes.find((q) => q.id === sc.id) || {}).reveal;
        const on = R ? `as the voice first says "${R.word}" (${R.line} + ${R.wordS === undefined ? "estimated" : R.wordS + " s, measured"}; the music's hit)` : "on the music's hit";
        push(tm.hit - sc.start, "reveal", `the lacing flashes in ${on}, from 0: a warm-white core (${REVEAL.flash}) and a halo; the loose cord and sleeve start to draw in to the hose`, { edge: "flash" });
        push(tm.hit - sc.start + OPENING.drawIn, "reveal", `the cord and sleeve neat on the hose (drawn in over ${OPENING.drawIn} s), the core still travelling`, { edge: "neat" });
        push(tm.hit - sc.start + REVEAL.settle, "reveal", `the lacing settled to the tape's colour${typeof gl === "number" ? `, opacity ${gl}` : ""}; the halo gone ${r2(REVEAL.halo.s - REVEAL.settle)} s later`, { edge: "settled" });
      }
      if (sc.credits && tm.credits) {                 // (draft 11: the credits, after the finale)
        const it = tm.credits.items || [];
        push(bodyOf(sc), "credits", `in: the picture fades to the dark backdrop; "${tm.credits.title}", then ${it.length} credits (${it.map((q) => q.role).join(", ")})`, { edge: "in" });
        push(sc.dur - CR.black, "credits", `out: the whole frame fades to black over ${CR.black} s`, { edge: "out" });
      }
      for (const l of sc.lines) {
        push(l.at - sc.start, "voice", `${l.id}${l.voiced ? "" : " (not voiced yet)"} starts: "${l.text}"`, { line: l.id, edge: "start" });
        push(l.at + l.dur - sc.start, "voice", `${l.id} ends`, { line: l.id, edge: "end" });
      }
      ev.sort((a, b) => a.t - b.t);
      return { id: sc.id, events: ev };
    });
  }
  const api = { eventsOf, phasesOf, keyLocal };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).events = api;
})(typeof self !== "undefined" ? self : this);
