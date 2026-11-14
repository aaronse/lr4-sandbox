// The opening's loose cables, their shape (d12): a cable's laced points (cordRoute's, at the pose) moved by the state
// opening.js cablesOf gives at t - hanging off the hose by the sag (down where there is room above the tray, out from the
// hose), the sag bouncing (taps' y), the loop swinging sideways across its run (taps' x), each with a wave running down
// the cable from the core (a point s mm along it reads the swing s / wave s ago); pinned at the core (the router's or the
// carriage's end) and at the far end; kept out of the hose. Laced (all zeros): the points themselves.
// Pure (no THREE): js/page/lacing_anim.js tubes it; tests/test_lacing_tutorial.js --only opening checks it on the
// reference hose. It draws, so it is not in tools/lacing_voice.js FRAME_MATHS: a change to it re-renders every scene.
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports, use = (f) => (NODE ? require(`./${f}.js`) : root.LR4Lacing[f]);
  const { clamp01, sub, add, mul, dot, cross, len, unit, dist } = use("vec3");
  const smooth = (u) => { const v = clamp01(u); return v * v * (3 - 2 * v); };
  // ramp: mm from the core to the full loop; decay: mm past the U-turn (the cable's furthest +X) over which the loop
  // settles onto the lower run in the trays, to floor x the loop; pinS: mm over which the far end comes to rest; room: mm
  // above the tray's hose line the sag needs to hang straight down (the lower run lies in the tray: it flops out sideways);
  // out: the share of the sag out from the hose; per cable: amp (the swing x), sag (x), delay (s: the sleeve, heavier,
  // lags the cord)
  const SLACK = { ramp: 140, decay: 260, floor: 0.15, pinS: 160, room: 45, out: 0.45, gap: 0.5,
    cables: { cord: { amp: 1, sag: 1, delay: 0 }, sleeve: { amp: 0.7, sag: 0.8, delay: 0.12 } } };
  // the swing a point s mm along the cable sees: the taps (tap i = i tapS s ago) read at delay + s / wave
  function tapAt(C, tau) {
    const q = Math.max(0, tau / C.tapS), i = Math.min(C.taps.length - 1, Math.floor(q)), j = Math.min(C.taps.length - 1, i + 1), u = q - i;
    const a = C.taps[i], b = C.taps[j];
    return u >= 1 || i === j ? { x: a.x, y: a.y } : { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  }
  // pts: the cable's laced points at the pose; C: the frame's cables (null: pts); which: "cord" | "sleeve"; hose: { pts
  // (its centre line at the pose, dense), r (its radius), d (the cable's diameter), trayZ (the lower run's centre height),
  // pinX (where the cable leaves the trays, if it runs on past them: it rests from there) } -> the loose points (as many)
  function looseOf(pts, C, which, hose, S = SLACK) {
    if (!C || (C.sag === 0 && C.taps.every((q) => q.x === 0 && q.y === 0))) return pts.map((p) => p.slice(0, 3));
    const P = S.cables[which] || S.cables.cord, n = pts.length, s = [0];
    for (let i = 1; i < n; i++) s.push(s[i - 1] + dist(pts[i], pts[i - 1]));
    const L = s[n - 1];
    let iA = 0;
    for (let i = 1; i < n; i++) if (pts[i][0] > pts[iA][0]) iA = i;
    const H = hose.pts, minD = hose.r + hose.d / 2 + S.gap;
    // the nearest centre-line point (a window walked along with the cable; a full search for the first)
    const nearest = (p, j0) => {
      let best = 0, bd = Infinity;
      const lo = j0 < 0 ? 0 : Math.max(0, j0 - 60), hi = j0 < 0 ? H.length : Math.min(H.length, j0 + 60);
      for (let j = lo; j < hi; j++) { const d = dist(p, H[j]); if (d < bd) { bd = d; best = j; } }
      return best;
    };
    const out = [];
    let j = -1;
    for (let i = 0; i < n; i++) {
      const p = pts[i], tn = unit(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]));
      // the loop's size here: in from the core, full to the U-turn, settling past it, at rest at the far end
      let env = smooth(s[i] / S.ramp) * (s[i] <= s[iA] ? 1 : S.floor + (1 - S.floor) * Math.exp(-(s[i] - s[iA]) / S.decay)) * smooth((L - s[i]) / S.pinS);
      if (typeof hose.pinX === "number" && i > iA) env *= smooth((p[0] - hose.pinX) / S.pinS);
      if (env < 1e-9) { out.push(p.slice(0, 3)); continue; }
      j = nearest(p, j);
      // which way it hangs: down where there is room above the tray, out from the hose, square to the cable
      const radial = sub(p, H[j]), outD = unit(sub(radial, mul(tn, dot(radial, tn))));
      const room = clamp01((p[2] - hose.trayZ) / S.room);
      let sagD = add(mul([0, 0, -1], room), mul(outD, S.out + (1 - room)));
      sagD = unit(sub(sagD, mul(tn, dot(sagD, tn))));
      const side = unit(cross(tn, sagD));
      const w = tapAt(C, P.delay + s[i] / C.wave);
      out.push(add(p, add(mul(sagD, env * P.sag * (C.sag + w.y)), mul(side, env * P.amp * w.x))));
    }
    // kept out of the hose: a point inside it (its radius + the cable's + gap) pushed out along the radial
    for (let i = 0; i < n; i++) {
      let q = out[i];
      for (let k = 0; k < H.length; k++) {
        const d = dist(q, H[k]);
        if (d < minD && d > 1e-9) q = add(q, mul(sub(q, H[k]), (minD - d) / d));
      }
      out[i] = q;
    }
    return out;
  }
  // the deepest a loose cable hangs from its laced line (mm): max over its points (the tests: loose before the word)
  const slackOf = (pts, loose) => pts.reduce((m, p, i) => Math.max(m, dist(p, loose[i])), 0);
  const api = { SLACK, looseOf, slackOf, tapAt };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).slack = api;
})(typeof self !== "undefined" ? self : this);
