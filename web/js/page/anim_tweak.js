// lr4-sandbox page: the lacing tutorial's tweak panel (index.html?anim=lacing&play=1&tweak=1; docs/specs/lacing-tutorial.md
// "Shots and knots as data"): lr4's wiring of media-anim's tweak panel (js/lib/media-anim/tweak.js) over the shots -
// each scene's camera keys, its layers' opacities, the colours (docs/specs/lacing-tutorial.shots.json). Save POSTs the
// file to tools/serve.py, which takes a POST to that one file only, from this machine (see its header).
// In node: formatShots(shots) in the shots file's layout (its knots a block each), activeIndex (tests/test_anim_player.js).
(function (root) {
  "use strict";
  const node = typeof module !== "undefined" && module.exports;
  const TW = node ? require("../lib/media-anim/media-anim-runtime.min.js").tweak : root.MediaAnim.tweak;
  const LISTS = { knots: ["steps", "strands", "sequence"] };   // a knot a block: its steps (or strands, or macros) one a line
  const api = { formatShots: (S) => TW.formatShots(S, { lists: LISTS }), activeIndex: TW.activeIndex };
  if (node) { module.exports = api; return; }
  root.LR4AnimTweak = api;

  const q = new URLSearchParams(location.search);
  if (q.get("anim") !== "lacing" || q.get("play") !== "1" || q.get("tweak") !== "1") return;
  const LT = root.LR4LacingTut;
  TW.mount({
    host: root.LR4LacingAnim.tweak,
    sceneAt: (t, tm) => LT.sceneAt(t, tm),
    cameraX: (cam, sc, local) => { const x = LT.clockOf(cam, sc, local); return cam.time ? LT.EASE[cam.time](x) : x; },
    layers: LT.LAYERS, colours: ["tape", "left", "end", "backdrop"], nullColour: "backdrop",
    file: "docs/specs/lacing-tutorial.shots.json", savedNote: "run node tools/lacing_voice.js sync before a commit",
    lists: LISTS,
  });
})(typeof self !== "undefined" ? self : this);
