// The lacing tutorial's constants and clock: the settle, dip, gap, travel, close-up, hitch and clearance constants
// (SETTLE / SETTLE_OF, FPS, DIP, MAX_GAP, MOVE_DX, DETAIL / DETAIL_OF, HITCH, CLEAR, TIGHT, END), timing() (media-anim
// timeline's clock on this storyboard with this video's settles and still), voiceLines, sceneAt (tm defaulting to
// timing()), settleOf / workAt / localOfWork (a step's work, 0 - 1, and back, SETTLE by default), and the one-tape
// handover check (setDebug, HANDOVER, handover).
//   Uses data, vec3, media-anim timeline. Tests: tests/test_lacing_tutorial.js --only storyboard, tape, blade.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const lib = (f) => (NODE ? require("../lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  const { STORYBOARD } = use("data");
  const { dist } = use("vec3");
  const TL = lib("timeline"), { TOKENS } = TL;
  const STILL_OFFSET = TOKENS.slow;                            // the still: the confirm scene's start + slow
  const SETTLE = 0.8;                                          // s: a step's work is done this long before its scene ends
  // draft 11: the work's settle in a scene a cut follows (the maintainer: too much dead air and dead picture at the cut;
  // each side of a cut now has 0.5 s or less with no speech and nothing moving). tight: its loop's end done 0.35 s before
  // the scene ends, then the dip (0.65 till d14n, when the tip's fade filled it: the tip no longer fades). square, tie (the blade's cut, allowedGaps): the work keeps draft 10's
  // pace - the hold trimmed by as much as the settle (3.4 -> 2.45, 2.4 -> 0.85 s) - and the scene cuts away ~0.5 s after
  // the offcut has fallen: the work's still tail after the cut (w 0.96 / 0.8 -> 1) runs past the scene's end, unseen
  // d27 (the re-time, the owner's D7: where the picture needs more time than its line, speed camera moves and settles
  // only): every step scene's settle sped to tight's 0.35 (tight itself to 0.3: draft 11's at most 0.5 s of still picture
  // before the dip); the technique close-ups keep d26's work seconds (their holds set from them), so only the still after
  // the work got shorter. goal and done keep SETTLE
  // d28 (the owner, 2026-11-14: speed a close-up rather than leave a silent hold; no re-voicing): a close-up's hold is the
  // 0.4 s every scene ends with, so its knot is time-scaled (the work's span shorter: x1.16-1.52). square keeps d27's span
  // (its cut already lands on the line's last word); tie's is x1.21 (its cut 0.45 s after the line, the swipe heard
  // ~0.25 s after the words). Both end a fifth of a frame after the offcut has fallen (the blade test: cut + fall + 0.05
  // s), so more of their still tail runs past the scene's end (.cache/lacing-tutorial/d28/holds.cjs)
  const SETTLE_OF = { start: 0.35, clove: 0.35, wrap: 0.35, tuck: 0.35, tight: 0.3, uturn: 0.35, spacing: 0.35, close: 0.35, seal: 0.35,
    square: -0.75, tie: -0.965, lock: 0 };   // (d14 lock: its tape runs on into the U-turn, draw.js runAt)
  // the dip across a cut (draft 11: 1.35 s -> 0.375 s; the maintainer: too much dead air and dead picture at the cut): out
  // over quick, held, in over quick; the camera and the layers switch at the scene's end, in the hold
  const DIP = { out: TOKENS.quick, hold: TOKENS.quick / 2, in: TOKENS.quick };
  const MAX_GAP = 76.2;          // mm: the most between stitches, harness over 25.4 mm (NASA-STD-8739.4 Table 9-1)
  const MOVE_DX = 280;           // mm: how far the core travels (+X and back) in the confirm scene (short of dx ~292, where
                                 // the core comes within 30 mm of the U-turn and the model's hose drops a point: a twitch)
  // the close-ups: which stitch (lock: one on the lower run, where both cables lie on the hose - at stitches 0-2 the
  // model's sleeve still hovers up to 11 mm off it, cordRoute's lift; clear of the U-turn), how much hose either side (mm).
  // view: [before, after] drawn when longer than that (hose, cord, sleeve only; the knots keep before / after) - the
  // start's 105 mm ended in frame and read as a ribbed cup, not a hose (the maintainer, d15 review, 2026-11-11).
  // (their cameras are shots: docs/specs/lacing-tutorial.shots.json)
  const DETAIL = { lock: { k: 6, before: 60, after: 60 }, close: { k: -1, before: 60, after: 55 }, start: { k: 0, before: 45, after: 60, view: [130, 160] } };
  const DETAIL_OF = { clove: "start", square: "start", wrap: "lock", tuck: "lock", tight: "lock", close: "close", seal: "close", tie: "close" };
  // the lock stitch drawn large (mm): tube radius, the gap between the wrap's start and its crossing along the hose, how
  // loose the loop starts (x the bundle's radius), how far the end runs on past the stitch when pulled
  const HITCH = { tr: 1.0, gap: 4.0, loose: 1.45, lead: 60, endMin: 12, endMax: 58 };
  // (draft 11) mm of air kept between two tapes' tubes where one passes over another (the clearance test allows 0.1 less
  // only where a pull presses them together)
  const CLEAR = 0.15;
  const TIGHT = 0.55;            // the "pull it tight" scene: the loop is snug by this share of its work, then held
  // the cameras, layer opacities and colours (draft 4's red tape: the maintainer's choice over the page's accent) are
  // SHOTS (above); the working end's last END mm is drawn lighter
  const END = 15;                // (was 12: 25% longer, user 2026-11-13)

  // the clock (media-anim timeline.timing: each scene its measured voice-over or 150 wpm estimate + its hold, its `more`
  // lines in its hold, leadS, the music's hit, the credits in the confirm scene's last credits.holdS) with this video's
  // settles (SETTLE, SETTLE_OF) and still (STILL_OFFSET); each scene starts on a whole frame at FPS (2026-11-09: a scene
  // that moves keeps its samples, so the scene render cache reuses it; every start moved under 1/60 s)
  const FPS = 30;
  const timing = (sb = STORYBOARD) => revealOn(TL.timing(sb, { settle: SETTLE, settleOf: SETTLE_OF, stillOffset: STILL_OFFSET, fps: FPS }), sb);
  // (d12) the opening's hit (tm.hit: the lacing flashes in, media-anim reveal; the music's hit lands on it, mix.mjs
  // hitInS) is when the voice first says "cable lacing": a scene's `reveal: { line, word, wordS }`, wordS measured in that
  // line's wav (tools/lacing_words.js; without it, the share of the line's characters before the word x its length)
  function revealOn(tm, sb) {
    const s = sb.scenes.find((q) => q.reveal);
    if (!s) return tm;
    const R = s.reveal, l = tm.scenes.find((q) => q.id === s.id).lines.find((q) => q.id === (R.line || s.id));
    if (!l) throw new Error(`lacing tutorial: ${s.id}'s reveal: no line ${R.line}`);
    const i = l.text.toLowerCase().indexOf(R.word.toLowerCase());
    if (i < 0) throw new Error(`lacing tutorial: ${s.id}'s reveal: "${R.word}" is not in ${l.id}'s line`);
    tm.hit = l.at + (typeof R.wordS === "number" ? R.wordS : i / l.text.length * l.dur);
    return tm;
  }
  // every voiced line on the video's timeline (the mux, the live preview, the transcript's voice events)
  const voiceLines = (tm = timing()) => TL.voiceLines(tm);
  // the scene at t on the lacing's clock (tm defaults to timing())
  const sceneAt = (t, tm = timing()) => TL.sceneAt(t, tm);
  // a step's work, 0 -> 1: from when the camera has arrived (slow) to SETTLE (or the scene's settle) before it ends; and
  // the local s at which it reaches w
  const settleOf = (sc) => TL.settleOf(sc, SETTLE);
  const workAt = (sc, local) => TL.workAt(sc, local, SETTLE);
  const localOfWork = (sc, w) => TL.localOfWork(sc, w, SETTLE);
  // ---- one tape (draft 7): every knot, stitch and turn grows from the tape's live end - a strand's first point IS the
  // end it continues (built from it, not from an outline point near it). handover() checks it where a strand is handed
  // its start: one distance, under 0.5 mm, thrown only with DEBUG on (index.html?debug, the tests); the render pays
  // nothing. (Draft 6's marline hitch started from its own step origin at w 0 on the cables' side, 7.5 mm round the
  // bundle from where the closing turns ended: the tape looked to restart behind its end.)
  let DEBUG = false;
  const setDebug = (v) => { DEBUG = !!v; };
  const HANDOVER = 0.5;                              // mm
  function handover(what, end, start) {
    if (!DEBUG) return;
    const d = dist(end, start);
    if (!(d <= HANDOVER)) throw new Error(`lacing tutorial: ${what} starts ${d.toFixed(2)} mm from the end it grows from (at most ${HANDOVER})`);
  }
  const api = { DETAIL, HITCH, CLEAR, handover, SETTLE, FPS, MOVE_DX, TIGHT, timing, sceneAt, workAt, DIP, DETAIL_OF,
    localOfWork, END, settleOf, SETTLE_OF, voiceLines, setDebug, HANDOVER, STILL_OFFSET, MAX_GAP };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).core = api;
})(typeof self !== "undefined" ? self : this);
