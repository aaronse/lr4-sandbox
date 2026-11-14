// The cable-lacing tutorial's pure parts (no THREE / DOM / clock): the storyboard (the clock: each scene's measured
// voice-over + its hold), the plan (run 0 of LR4Hose.lacing at the build pose, in mm), and frameAt(t) - everything the
// picture shows at t seconds. js/page/lacing_anim.js draws it in the page's scene; docs/specs/lacing-tutorial.md is the
// brief, storyboard, plan and element inventory. Nothing here reads a clock or a random number: the frame at t is the
// same on every call, in any order.
//
// This file is the facade: it assembles the LR4LacingTut API (browser global; module.exports in Node) from the modules
// in web/js/lacing/ (each a UMD file, LR4Lacing.<name> in the browser; web/index.html loads them in FILES' order,
// before this) and media-anim's lib (js/lib/media-anim/, vendored by tools/sync_media.js: MediaAnim.<name> in the
// browser; change it in media-anim, test there with node --test lib/*.test.js, then sync). To change X, edit Y; test
// with Z (Z = node tests/test_lacing_tutorial.js --only <sections>; --list names them):
//   the storyboard / shots copies     lacing/data.js (generated: edit the JSON, node tools/lacing_voice.js sync)
//   vectors, frames' az / el          media-mesh vec3.js (lacing/vec3.js: its alias)  (all)
//   eases, tokens, spoken, the clock  media-anim timeline.js (lacing/timeline.js: its alias)  storyboard, shots
//   polylines, splines, outlines      media-mesh curve.js (lacing/curves.js: the lacing's names)  plan, knotgen
//   the reef's flat figure, layers    media-mesh knot.js (lacing/knot_flat.js)  story
//   projection, camera keys, moves    media-anim camera.js                  framing, shots, frames
//   the opening's flash               media-anim reveal.js                  draft11
//   the opening's travel, loose cables  lacing/opening.js (media-anim swing.js); their shape: lacing/slack.js  opening
//   the credits' layout and fades     media-anim credits.js                 draft11
//   a callout's card, schedule, pop   media-anim callout.js                 callouts
//   constants, timing(), work, debug  lacing/core.js                        storyboard
//   the plan (stitches, close-ups)    lacing/plan.js                        plan
//   the run's tape (knots, poses)     lacing/plan.js runOf, knotLace (media-mesh body / rope.lace)  run
//   knots from steps (knotGen)        media-mesh rope.js; the lacing's values lacing/knot_gen.js  knotgen, closing, clearance
//   the hitch, square knot, knotAt    lacing/knots.js (the hitch, bundle frame: media-mesh rope / bundle.js)  hitch, story, tape, clearance
//   tape drawn, pose                  lacing/draw.js                        frames, confirm
//   cameras, dips, layers             lacing/shots.js                       frames, shots, framing
//   the blade, swipes                 lacing/blade.js                       blade
//   callouts on the timeline / screen lacing/callouts.js                    callouts
//   frameAt / frameBase, framing      lacing/frame.js                       frames, tape (+ golden.js)
//   phases, the script's events       lacing/events.js                      events, transcript
// Every change: node .cache/lacing-tutorial/refactor/golden.js check (when the change should not move a frame), then
// the sections it touches, then the whole test (npm test runs it all).
(function (root) {
  "use strict";
  const FILES = ["data", "vec3", "timeline", "curves", "knot_flat", "core", "opening", "plan", "knot_gen", "knots", "draw", "shots", "blade", "callouts", "frame", "events"];
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./lacing/${f}.js`) : root.LR4Lacing[f]);
  const lib = (f) => (NODE ? require("./lib/media-anim/media-anim-runtime.min.js")[f] : root.MediaAnim[f]);
  // (Node: a fresh load of this file is a fresh load of every lacing module, as when it was one file -
  // tools/lacing_voice.js drops this file from require's cache to read the storyboard it has just synced)
  if (NODE) for (const f of FILES) delete require.cache[require.resolve(`./lacing/${f}.js`)];
  const { STORYBOARD, SHOTS } = use("data");
  const { dirIn, azElIn } = use("vec3");
  const { bodyOf, spoken, WPM, TOKENS, EASE, trackAt, easeInOut, easeOut } = use("timeline");
  const { alongAt } = use("curves");
  const { REEF, reefFlat } = use("knot_flat");
  const { projector } = lib("camera");
  const { at: revealAt, REVEAL } = lib("reveal");
  const { at: creditsAt, layout: creditsLayout, linesIn: creditsIn, LAYOUT: CR } = lib("credits");
  const { cardOf, wordIndex, LAYOUT: CO, IN: CO_IN, OUT: CO_OUT } = lib("callout");
  const { DIP, SETTLE_OF, settleOf, voiceLines, setDebug, handover, HANDOVER, localOfWork, STILL_OFFSET, SETTLE,
    MAX_GAP, MOVE_DX, HITCH, TIGHT, END, DETAIL_OF, timing, sceneAt, workAt } = use("core");
  const { OPENING, legsOf, travelOf, cablesOf } = use("opening");
  const { apexOf, cableCut, plan, referencePlan, knotLace, refsOf, RUN } = use("plan");
  const { knotGen, stepCps, lapW, stepsOf, macrosOf } = use("knot_gen");
  const { flatOf, fromEnd, cutsOf, SQ, knotView, tapeTo, namedEnd, surfaceAt, hitchPath, KNOT, layered, knotCps,
    knotAt, strand } = use("knots");
  const { lockK, poseOf, drawOf, drawAt, tiedAt, progressAt, tipS, poseAt, PULL, pullsOf, tapeOf, onTape } = use("draw");
  const { LAYERS, finaleAt, shotOf, keyCam, addKey, focusOf, frameOf, clockOf, layersAt, dipAt, cameraAt } = use("shots");
  const { sfxAt, bladeAt } = use("blade");
  const { calloutsOf, calloutsAt, anchorOf, placeOf, breakoutOf, sourceOf, wordAt } = use("callouts");
  const { frameBase, framing, frameAt } = use("frame");
  const { eventsOf, phasesOf, keyLocal } = use("events");
  const api = { revealAt, REVEAL, creditsAt, creditsLayout, creditsIn, CR, DIP, SETTLE_OF, settleOf, bodyOf, calloutsOf, calloutsAt, anchorOf, placeOf, cardOf, sourceOf, wordAt, wordIndex, breakoutOf, projector, frameBase, CO, CO_IN, CO_OUT,
    eventsOf, phasesOf, keyLocal, voiceLines, framing, setDebug, handover, flatOf, fromEnd, lockK, HANDOVER, apexOf, sfxAt, bladeAt, cutsOf, localOfWork, alongAt, spoken, STORYBOARD, SHOTS, LAYERS, WPM, TOKENS, STILL_OFFSET, SETTLE, MAX_GAP, MOVE_DX, HITCH, TIGHT, END, SQ, knotView, tapeTo, namedEnd, finaleAt, cableCut, DETAIL_OF, timing, sceneAt,
    EASE, shotOf, keyCam, addKey, focusOf, frameOf, clockOf, dirIn, azElIn, surfaceAt, trackAt, layersAt, workAt, poseOf, drawOf,
    plan, referencePlan, knotLace, refsOf, RUN, PULL, pullsOf, tapeOf, onTape, hitchPath, KNOT, REEF, reefFlat, layered, knotCps, knotGen, stepCps, lapW, stepsOf, macrosOf, knotAt, strand, drawAt, tiedAt, progressAt, tipS, poseAt, dipAt, cameraAt, frameAt, easeInOut, easeOut,
    OPENING, legsOf, travelOf, cablesOf };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LR4LacingTut = api;
})(typeof self !== "undefined" ? self : this);
