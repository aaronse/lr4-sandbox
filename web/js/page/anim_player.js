// lr4-sandbox page: the live preview of a tutorial animation (index.html?anim=lacing&play=1; docs/specs/lacing-tutorial.md
// "Live preview"): lr4's wiring of media-anim's player (js/lib/media-anim/player.js: the clock, bar, voice-over, stamp).
// The picture stays window.__anim.setT(t) (js/page/lacing_anim.js -> LR4LacingTut.frameAt); the page's tick
// (js/page/scripting.js) calls window.LR4AnimTick before it draws, so the frame drawn is the frame of that t.
// URL params (with anim=):
//   play=1        the player: a bar on top (play / pause, a scrubber, the time, the scene id), the voice-over
//   autoplay=1    start at once (a browser plays sound only after a click: without one the voice waits for the button)
//   bar=0         no bar (media-anim tools/capture/draft.mjs: the picture only)
//   voice=0       no voice-over; voice=<dir> the wavs' folder (default ../exports/<anim>_voice/: git-ignored, served by
//                 tools/serve.py; one <line id>.wav a line, from tools/lacing_voice.js tts; sound cues in sfx/)
//   stamp=1       t stamped into the top-left corner (media-anim tools/capture/draft.mjs reads it: lib/player.js STAMP / stampT)
// In node: the player's pure parts (STAMP, STAMP_CELLS, stampCells, stampT, voicePlan), as before the move.
(function (root) {
  "use strict";
  const node = typeof module !== "undefined" && module.exports;
  const P = node ? require("../lib/media-anim/media-anim-runtime.min.js").player : root.MediaAnim.player;
  const api = { STAMP: P.STAMP, STAMP_CELLS: P.STAMP_CELLS, stampCells: P.stampCells, stampT: P.stampT, voicePlan: P.voicePlan };
  if (node) { module.exports = api; return; }
  root.LR4AnimPlayer = api;

  const q = new URLSearchParams(location.search), anim = q.get("anim");
  if (!anim || q.get("play") !== "1") return;
  const p = P.mount({
    voice: q.get("voice") === "0" ? null : q.get("voice") || `../exports/${anim}_voice/`,
    bar: q.get("bar") !== "0", stamp: q.get("stamp") === "1", autoplay: q.get("autoplay") === "1",
  });
  window.LR4AnimTick = p.tick;
})(typeof self !== "undefined" ? self : this);
