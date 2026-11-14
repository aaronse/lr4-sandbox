// media-anim's timeline (js/lib/media-anim/timeline.js: eases, tokens, spoken, tracks, the storyboard clock, sceneAt,
// the dip), under the lacing modules' name for it, so `use("timeline")` keeps working. Nothing of the lacing's here:
// its settle, dip and still values are core.js's.
//   Uses media-anim timeline. Tests: media-anim lib/timeline.test.js; tests/test_lacing_tutorial.js --only storyboard.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports;
  const api = NODE ? require("../lib/media-anim/media-anim-runtime.min.js").timeline : root.MediaAnim.timeline;
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).timeline = api;
})(typeof self !== "undefined" ? self : this);
