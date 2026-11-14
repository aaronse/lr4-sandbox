// The lacing tutorial's rider (media-anim MA-11 C3, C4; media-anim docs/bodies.md): Jensen riding the tape's running
// end like a bucking horse ("riding the bomb": media-anim's rodeo posture, astride on his seat, one hand on the tape,
// the other arm waving, legs swinging), in the main view (shots.rider) and in Jensen Cam, a picture-in-picture from a
// chase camera (shots.jensenCam). Everything here is pure (no THREE, no DOM, no clock): the tip's track (frameBase's
// live end, its end tangent and the camera at each 30 fps frame plus 120 Hz in each tip slide), the springs baked on
// it (MediaAnim.body.bake), the gestures, the head-only LOD, the chase camera (MediaAnim.chase) and the inset's plan
// (MediaAnim.inset). js/page/lacing_anim.js draws it; tools/lacing_rider.js measures it (the C3 / C4 gates);
// tools/lacing_track.js writes the track as media-anim's fixture.
// Not frame maths: frameAt never reads it, and with shots.rider and shots.jensenCam off the page draws as before.
// Lazy and chunked: the track is ~1.7 ms a sample (frameBase), so it is computed up to a horizon (the next CHUNK s
// boundary at least AHEAD s past t) and memoised; the springs, the LOD and the chase camera are baked from 0 to that
// horizon. Every one of them is causal (a bake to H equals the full bake up to H - 0.1 s; the LOD looks at most
// pad + gap ahead), so the frame at t is the same whatever was asked before (tools/lacing_rider.js --check-chunks).
(function (root) {
  "use strict";
  const NODE = typeof module !== "undefined" && module.exports;
  const LT = NODE ? require("../lacing_tutorial.js") : root.LR4LacingTut;
  const RT = NODE ? require("../lib/media-anim/media-anim-runtime.min.js") : root.MediaAnim;
  const CH = NODE ? require("../lib/media-anim/media-anim-characters.min.js") : root.MediaAnim;
  const DATA = NODE ? require("./data.js") : root.LR4Lacing.data;
  const CAMR = RT.camera;

  // shots.rider / shots.jensenCam, with these for what they leave out
  const RIDER = {
    on: false, character: "jensen", pose: "rodeo", anchor: "seat",
    scale: 2, maxPx: 120,                            // the head: scale x the ball's silhouette, at most maxPx at 720 lines (as shots.head)
    // (d29, the owner: what is in front of him hides him; Jensen Cam keeps him in view.) onTop: false depth-tests the
    // sprite against the scene; ghost: the opacity of a second pass drawn without the depth test, so a hidden part
    // still reads as behind, not gone (d28 drew him over everything: the tip behind the bundle hid 88-91% of him, spacing)
    onTop: false, ghost: 0.28,
    push: null,                                      // [knee, max] g of the springs' eased sideways push (null: the posture's own; shots: [0.4, 0.7], every scene's peak under 900 deg/s)
    // head-only (the head overlay in its place): wherever the rider's box covers the frame's action point (cover; margin
    // px round the point), where the tip shows without its green tail (tail), and in the close-ups only with detail
    // (off: the owner wants him riding whenever the tip and tail show, 2026-11-13, d23 review); the spans merged across
    // gaps under gap s, padded by pad s, the rider faded out over fade s inside the pad (fade <= pad: gone before it covers)
    lod: { detail: false, cover: false, tail: false, margin: 6, pad: 0.4, gap: 1.5, fade: 0.3 },
    gestures: {},                                    // scene -> [{ gesture, callout (point at its anchor) | from, to (shares of the scene), hand }]
  };
  const JENSEN_CAM = {
    on: false, corner: "tr", lines: 720, riderPx: 200, // the rider's head in the inset: riderPx at 720 lines of the inset's height
    dist: 40, el: 12, behind: 20, lift: 4, hz: 1, fov: 35,   // the chase camera (MediaAnim.chase options; mm, deg)
    scenes: null,                                    // scene -> on; null: the main-view steps and pitfalls (no close-up, the tip shown)
    background: null,                                // the inset's clear colour (null: the scene's)
    tipMin: 0.5,                                     // hidden where the tip's opacity is under this
    onTop: true,                                     // the inset's rider drawn over its scenery (side-on, the bundle hid it as the tape wrapped)
  };
  const CHUNK = 10, AHEAD = 3;                       // s: the horizon's step, and how far past t it reaches
  const G = { fov: 35, aspect: 16 / 9 };             // the video's frame (the track does not follow the window's shape)
  const W = 1280, H = 720;
  const configOf = (shots) => {
    const r = Object.assign({}, RIDER, shots.rider || {});
    r.lod = Object.assign({}, RIDER.lod, (shots.rider || {}).lod || {});
    return { rider: r, cam: Object.assign({}, JENSEN_CAM, shots.jensenCam || {}) };
  };

  // ---- vectors ----
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = Math.hypot(...a); return l > 0 ? [a[0] / l, a[1] / l, a[2] / l] : null; };
  const smooth = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };

  // ---- the tip's track (media-anim characters/body/fixtures/README.md; C1's tools/lacing_track.js) ----
  // the render frames (golden.ts: i / fps, i < ceil(duration * fps - 1e-9)) and dense / s inside each span, sorted, unique
  function sampleTimes(duration, fps, spans, dense) {
    const n = Math.ceil(duration * fps - 1e-9), ts = [];
    for (let i = 0; i < n; i++) ts.push(i / fps);
    for (const [a, b] of spans) for (let k = 0; a + k / dense <= b + 1e-9; k++) { const t = a + k / dense; if (t < duration) ts.push(t); }
    ts.sort((x, y) => x - y);
    return ts.filter((t, i) => i === 0 || t - ts[i - 1] > 1e-9);
  }
  // frame.js jumpsOf (not exported: frame.js is a renderer file): each scene's start where the one before is a step whose
  // end is not trimmed, and the square knot's lay / h1 / endL. sampleOf checks it against frameBase's own tipSlide.
  function jumpsOf(tm, shots) {
    const carries = (sc) => !!sc && sc.purpose === "step" && !((shots.blade && shots.blade.cuts[sc.id]) || []).length, J = [];
    tm.scenes.forEach((s, i) => {
      if (i > 0 && carries(tm.scenes[i - 1])) J.push(s.start);
      if (s.id === "square") for (const b of [LT.SQ.lay, LT.SQ.h1, LT.SQ.endL]) J.push(s.start + LT.localOfWork(s, b));
    });
    return J.sort((a, b) => a - b);
  }
  // each scene -> the first scene of its run with no cut (shots.js isCut: a change of DETAIL_OF)
  function shotsOf(tm) {
    const out = [];
    tm.scenes.forEach((s, i) => out.push(i > 0 && !RT.timeline.isCut(tm, i - 1, i, (sc) => LT.DETAIL_OF[sc.id]) ? out[i - 1] : s.id));
    return out;
  }
  const lenOf = (pts) => { let c = 0; for (let j = 1; j < pts.length; j++) c += Math.hypot(...sub(pts[j], pts[j - 1])); return c; };
  function pointAt(pts, s) {
    let c = 0;
    for (let j = 1; j < pts.length; j++) {
      const d = Math.hypot(...sub(pts[j], pts[j - 1]));
      if (c + d >= s) return pts[j - 1].map((v, k) => v + (pts[j][k] - v) * ((s - c) / (d || 1)));
      c += d;
    }
    return pts[pts.length - 1];
  }
  // the tape's end direction: the chord of its light end (frame.js endOf; C1 measured 0.5-12 mm chords, the whole light
  // end the steadiest); none drawn yet: the first END mm it is about to run along
  function tangentOf(F, P) {
    const seg = F.detail ? F.detail.endSeg : F.endSeg;
    if (seg && seg.length >= 2 && lenOf(seg) >= 0.5) return unit(sub(seg[seg.length - 1], seg[0]));
    const D = F.detail, path = !D ? P.pts : D.hitch ? D.hitch.pts : D.strands && D.strands[D.work] ? D.strands[D.work].pts : null;
    return path && path.length >= 2 ? unit(sub(pointAt(path, Math.min(LT.END, lenOf(path))), path[0])) : null;
  }
  // the camera's basis as media-anim camera.ts projector: fwd at the target, right = fwd x Z, up = right x fwd
  function basisOf(cam) {
    const fwd = unit(sub(cam[1], cam[0])), right = unit(cross(fwd, [0, 0, 1]));
    return { right, up: cross(right, fwd), fwd };
  }
  // the context the samples are made in: the plan, the timing, the shots, the jumps and the shots' ids
  function contextOf(P, tm, shots, fps = 30, dense = 120) {
    const slide = shots.tip.slide, J = jumpsOf(tm, shots), spans = J.map((j) => [j, j + slide]);
    return { P, tm, shots, g: G, fps, dense, slide, J, spans, times: sampleTimes(tm.duration, fps, spans, dense), shotIds: shotsOf(tm) };
  }
  // one sample at t: the fixture's fields (p, tan, right, up, fwd, pxPerMm, shot, tip) and, for the rider, the scene,
  // the close-up (detail id), the camera ([position, target]), the action point (focus) and the ball's scale
  function sampleOf(t, c) {
    const F = LT.frameBase(t, c.P, c.g, c.tm, c.shots), { i } = LT.sceneAt(t, c.tm), B = basisOf(F.cam);
    const j = c.J.filter((x) => x <= t && t - x < c.slide).pop();
    let tan = F.tipAt ? tangentOf(F, c.P) : null;
    if (F.tipSlide && tan) {                         // (across a slide: from the old end's tangent to the new end's, by its s)
      const was = tangentOf(LT.frameBase(j - 1e-4, c.P, c.g, c.tm, c.shots, true), c.P);
      if (was) tan = unit(was.map((v, k) => v + (tan[k] - v) * F.tipSlide.s)) || tan;
    }
    const z = CAMR.depthOf(F.cam, F.tipAt || F.cam[1]), seg = F.detail ? F.detail.endSeg : F.endSeg;
    return { t, p: F.tipAt, tan, right: B.right, up: B.up, fwd: B.fwd, pxPerMm: z > 0 ? CAMR.sizePx(1, z, c.g, H) : null,
      shot: c.shotIds[i], tip: F.tip, scene: F.scene, detail: F.detail ? F.detail.id : null, cam: F.cam, focus: F.focus,
      tail: !!(seg && seg.length >= 2),                // (the green light end drawn behind the tip)
      tipScale: F.tipScale, slideOk: (F.tipSlide !== null) === (j !== undefined && !!F.tipAt) };
  }
  // the samples, computed on demand and kept: upTo(T) -> every sample with t <= T
  function trackOf(c) {
    const S = new Array(c.times.length);
    let n = 0;                                       // (samples [0, n) made)
    const upTo = (T) => {
      while (n < c.times.length && c.times[n] <= T + 1e-9) { S[n] = sampleOf(c.times[n], c); n++; }
      let k = n;
      while (k > 0 && c.times[k - 1] > T + 1e-9) k--;
      return S.slice(0, k);
    };
    return { c, upTo, made: () => n };
  }
  const horizonOf = (t, duration) => Math.min(duration, CHUNK * Math.ceil((Math.max(0, t) + AHEAD) / CHUNK));
  // the facing's start is the first screen velocity past the hold (media-anim pose.ts facingOf), wherever it comes: a
  // bake whose track has none yet (a second inside its end) would start facing +1 where the full bake may not, so the
  // horizon moves on a chunk till it has one (the goal hides the tip: lr4's first is past 20 s)
  const decided = (baked, Hz) => {
    const hold = CH.body.FACING.hold, T = baked.times;
    for (let k = 0; k < T.length && T[k] <= Hz - 1; k++) if (Math.abs(baked.screen[4 * k]) > hold) return true;
    return false;
  };

  // ---- the main view's camera: projection of a point, and the rider's box (body-overlay.ts attach + rect) ----
  function viewOf(cam) {
    const B = basisOf(cam), ty = Math.tan((G.fov * Math.PI) / 360), tx = ty * G.aspect;
    const local = (p) => { const d = sub(p, cam[0]); return { x: dot(d, B.right), y: dot(d, B.up), z: -dot(d, B.fwd) }; };
    const px = (q) => [((q.x / -q.z / tx) + 1) / 2 * W, (1 - (q.y / -q.z / ty)) / 2 * H];
    return { local, px, project: (p) => { const q = local(p); return q.z < 0 ? px(q) : null; }, pxPer: (depth) => (H / 2) / ty / depth };
  }
  // where the overlay puts the body, as attach does: the anchor on the ball's silhouette top, the head scale x the
  // silhouette (at most maxPx at 720 lines) -> { anchor [x, y] px, s (px per art px) } | null (behind the camera)
  function placeOf(s, R, def) {
    const V = viewOf(s.cam), top = CH.bodyOverlay.topOf(V.local(s.p), R.radius, false);
    if (!top) return null;
    const f = V.pxPer(top.depth), headPx = Math.min(R.maxPx, R.scale ? R.scale * 2 * top.h * f : R.maxPx);
    const P = def.proportions, HEAD = (P.chin - P.top) * CH.bodyOverlay.SY_MAX;
    return { anchor: V.px({ x: top.p[0], y: top.p[1], z: top.p[2] }), s: headPx / HEAD, headPx };
  }
  // the body's box in the 1280 x 720 frame (y down): bodyBounds through the view attach draws with
  function boxOf(geom, def, pose, at, anchor) {
    const sk = def.skeleton, a = CH.body.anchorOf(sk, CH.body.fk(sk, pose.angles), anchor);
    const ax = sk.size[0] / 2 + pose.facing * (a[0] - sk.size[0] / 2), k = at.s;
    return CH.body.bodyBounds(geom, pose, { view: [k, 0, 0, k, at.anchor[0] - k * ax, at.anchor[1] - k * a[1]] });
  }
  const inside = (r, p, m = 0) => !!p && p[0] >= r.x - m && p[0] <= r.x + r.w + m && p[1] >= r.y - m && p[1] <= r.y + r.h + m;

  // ---- the performance: the head's moods and voice, the rodeo, the scenes' gestures ----
  // the voice for the face rig's lip sync (d29): each line with its words' real times (data.js WORDS, s into the line's
  // wav: tools/lacing_words.js, snapped to its voiced runs), at the line's place; a line with no words, its text spread
  // over its span (d28's). Shared by the head (js/page/lacing_anim.js headOf) and the rider.
  function speechOf(tm, words = DATA.WORDS || {}) {
    return LT.voiceLines(tm).map((l) => {
      const ws = words[l.id];
      return ws && ws.length ? { t0: l.at, t1: l.at + l.dur, text: l.text, words: ws.map((q) => ({ w: q.w, t0: l.at + q.t0, t1: l.at + Math.min(q.t1, l.dur) })) }
        : { t0: l.at, t1: l.at + l.dur, text: l.text };
    });
  }
  function performOf(R, tm, shots, cues) {
    const HD = shots.head || {}, moods = tm.scenes.map((s) => ({ t: s.start, mood: (HD.moods || {})[s.id] || "neutral" }));
    return CH.body.perform({ seed: HD.seed || 1, moods, speech: speechOf(tm), posture: R.pose, gestures: cues, beats: null });
  }
  // the scenes' gesture rows -> cues; point (with a callout): from its card's tIn to its tOut, at its anchor (target(t,
  // screen px) -> art px, or null: the gesture's own reach)
  function cuesOf(R, tm, target, opts = {}) {
    const out = [], callouts = LT.calloutsOf(tm);
    for (const sc of tm.scenes) {
      for (const g of (R.gestures || {})[sc.id] || []) {
        if (opts.skip && opts.skip.includes(g.gesture)) continue;
        const len = sc.end - sc.start, cue = { gesture: g.gesture, hand: g.hand || "R" };
        if (g.callout) {
          const c = callouts.find((q) => q.scene === sc.id && q.term === g.callout);
          if (!c) throw new Error(`rider: scene ${sc.id} has no callout ${g.callout}`);
          Object.assign(cue, { t0: c.tIn, t1: c.tOut });
          const tg = target ? target(c.tIn + 0.35, c.term) : null;
          if (tg) cue.target = tg;
        } else Object.assign(cue, { t0: sc.start + (g.from || 0) * len, t1: sc.start + (g.to === undefined ? 1 : g.to) * len });
        out.push(cue);
      }
    }
    return out;
  }
  // a callout's anchor on screen at t (its dot), px
  function calloutAt(t, term, c) {
    const F = LT.frameAt(t, c.P, c.g, c.tm, c.shots), q = (F.callouts || []).find((x) => x.term === term);
    return q && q.anchor ? [q.anchor.x * H, q.anchor.y * H] : null;
  }

  // the springs' drive: the posture's, with shots.rider.push ([knee, max] g of the eased sideways push) in place of its
  // own when set (the d24 review: the close-ups' flail, damped rather than hidden)
  function driveFor(def, perf, R) {
    const d = CH.body.driveOf(def, perf);
    return R.push ? Object.assign(d, { push: R.push }) : d;
  }

  // ---- the main view's rider ----
  // -> { config, at(t): { perf, baked, riderO, headO, lod: 'detail' | 'cover' | null }, frames(H): the LOD's per-frame
  // record (the gate's), horizon(t) }
  function mainRide(T, def, geom) {
    const c = T.c, R = configOf(c.shots).rider, sk = def.skeleton, memo = new Map();
    const radius = (s) => c.shots.tip.r * (s.tipScale || 1);
    const at = (Hz) => {
      if (memo.has(Hz)) return memo.get(Hz);
      const samples = T.upTo(Hz), track = { fps: c.fps, duration: Hz, jumps: c.spans.filter((j) => j[0] <= Hz), samples };
      // the bake without the gestures gives the facing (the track's alone) the point targets need
      const perf0 = performOf(R, c.tm, c.shots, []), baked0 = CH.body.bake(def, driveFor(def, perf0, R), track);
      if (Hz < c.tm.duration && !decided(baked0, Hz)) { const v = at(Math.min(c.tm.duration, Hz + CHUNK)); memo.set(Hz, v); return v; }
      const target = (t, term) => {
        if (t > Hz) return null;
        const X = calloutAt(t, term, c), s = sampleAt(samples, t);
        if (!X || !s || !s.p) return null;
        const at0 = placeOf(s, { radius: radius(s), maxPx: R.maxPx, scale: R.scale }, def);
        if (!at0) return null;
        const pose = CH.body.poseAt(t, def, perf0, baked0), a = CH.body.anchorOf(sk, CH.body.fk(sk, pose.angles), R.anchor);
        const ax = sk.size[0] / 2 + pose.facing * (a[0] - sk.size[0] / 2);
        const x = ax + (X[0] - at0.anchor[0]) / at0.s, y = a[1] + (X[1] - at0.anchor[1]) / at0.s;
        return [pose.facing < 0 ? sk.size[0] - x : x, y];   // (as seen facing the camera: mirrored when drawn mirrored)
      };
      const perf = performOf(R, c.tm, c.shots, cuesOf(R, c.tm, target).filter((q) => q.t0 <= Hz));
      const baked = CH.body.bake(def, driveFor(def, perf, R), track);
      // the LOD: each frame's close-up, tail and cover, then the spans
      const frames = [], fps = c.fps;
      for (const s of samples) {
        if (Math.abs(s.t * fps - Math.round(s.t * fps)) > 1e-6) continue;   // (render frames only)
        const shown = s.tip > 0 && !!s.p, f = { t: s.t, scene: s.scene, shown, detail: !!s.detail, tail: !!s.tail, cover: false, rect: null, focus: null };
        if (shown && !(R.lod.detail && s.detail)) {
          const pl = placeOf(s, { radius: radius(s), maxPx: R.maxPx, scale: R.scale }, def);
          if (pl) {
            f.rect = boxOf(geom, def, CH.body.poseAt(s.t, def, perf, baked), pl, R.anchor);
            f.focus = s.focus ? viewOf(s.cam).project(s.focus) : null;
            f.cover = inside(f.rect, f.focus, R.lod.margin);
          }
        }
        frames.push(f);
      }
      const L = R.lod, raw = [], dt = 1 / fps;
      for (const f of frames) if ((L.detail && f.detail) || (L.cover && f.cover) || (L.tail && f.shown && !f.tail)) {
        const last = raw[raw.length - 1];
        if (last && f.t - last[1] < L.gap) last[1] = f.t + dt; else raw.push([f.t, f.t + dt]);
      }
      const spans = raw.map(([a, b]) => [a - L.pad, b + L.pad]);
      const v = { Hz, perf, baked, frames, spans, track };
      memo.set(Hz, v);
      return v;
    };
    // the rider's opacity at t (1 - the head-only weight): 0 over each span's core, faded over fade inside its pad
    const riderO = (spans, t, L) => {
      let w = 0;
      for (const [a, b] of spans) if (t > a && t < b) w = Math.max(w, smooth((t - a) / L.fade) * (1 - smooth((t - (b - L.fade)) / L.fade)));
      return 1 - w;
    };
    return {
      config: R, horizon: (t) => horizonOf(t, c.tm.duration), bakeTo: at,
      at(t) {
        const v = at(horizonOf(t, c.tm.duration)), o = riderO(v.spans, t, R.lod);
        return { perf: v.perf, baked: v.baked, riderO: o, headO: 1 - o };
      },
    };
  }
  // the sample at t (the one at or just before it)
  function sampleAt(samples, t) {
    let lo = 0, hi = samples.length - 1;
    if (hi < 0 || samples[0].t > t + 1e-9) return null;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (samples[m].t <= t + 1e-9) lo = m; else hi = m - 1; }
    return samples[lo];
  }

  // ---- Jensen Cam: the chase camera, the inset's plan and the rider in it ----
  // The rider's springs feel the tip's world motion along the chase view's axes (so it gallops the way it goes on the
  // inset's screen), at the main view's px per mm (the same gallop rate and push as the main view's rider); the chase
  // camera's own cuts (snaps) split its runs, as shot changes do.
  function camRide(T, def) {
    const c = T.c, { rider: R, cam: C } = configOf(c.shots), memo = new Map();
    // the inset's cards: each callout's card where it is placed (callout units: x 0..A, y 0..1 down), the plan's
    const cards = LT.calloutsOf(c.tm).map((q) => {
      const F = LT.frameAt((q.tIn + q.tOut) / 2, c.P, c.g, c.tm, c.shots), k = (F.callouts || []).find((x) => x.term === q.term);
      return k ? { tIn: q.tIn, tGone: q.tGone, x: k.card.x, y: k.card.y, w: k.card.w, h: k.card.h, term: q.term } : null;
    }).filter(Boolean);
    // every scene by default (the owner, d24 review: the inset throughout, wherever the tip shows; tipMin hides it
    // where the tip does not); C.scenes[id] false takes a scene out
    const sceneOn = (sc) => (C.scenes && C.scenes[sc.id] !== undefined ? !!C.scenes[sc.id] : true);
    const at = (Hz) => {
      if (memo.has(Hz)) return memo.get(Hz);
      const samples = T.upTo(Hz), jumps = c.spans.filter((j) => j[0] <= Hz);
      const B = RT.chase.bake({ samples, jumps, fps: c.fps }, { dist: C.dist, el: C.el, behind: C.behind, lift: C.lift, hz: C.hz });
      let cut = 0;
      const ride = samples.map((s, k) => {
        if (B.snap[k]) cut++;
        const v = RT.chase.at(B, s.t), z = s.p ? dot(sub(s.p, v.pos), v.fw) : 0;
        return Object.assign({}, s, { right: v.right, up: v.up, fwd: v.fw, shot: `${s.shot}#${cut}`, pxPerMm: s.pxPerMm, camZ: z });
      });
      const perf = performOf(R, c.tm, c.shots, cuesOf(R, c.tm, null, { skip: ["point"] }).filter((q) => q.t0 <= Hz));
      const baked = CH.body.bake(def, driveFor(def, perf, R), { fps: c.fps, duration: Hz, jumps, samples: ride });
      if (Hz < c.tm.duration && !decided(baked, Hz)) { const v = at(Math.min(c.tm.duration, Hz + CHUNK)); memo.set(Hz, v); return v; }
      // hidden: the tip under tipMin, merged with the plan's own rule (spans closer than 2 x fade)
      const hide = [], dt = 1 / c.fps;
      for (const s of samples) if (!(s.tip >= C.tipMin) || !s.p) {
        const last = hide[hide.length - 1];
        if (last && s.t - last[1] < 1e-6 + dt) last[1] = s.t + dt; else hide.push([s.t, s.t + dt]);
      }
      const plan = RT.inset.plan({ A: G.aspect, corner: C.corner, cards, jumps, hide,
        scenes: c.tm.scenes.map((sc) => ({ id: sc.id, start: sc.start, end: sc.end, on: sceneOn(sc) })) });
      const v = { Hz, B, perf, baked, plan, samples };
      memo.set(Hz, v);
      return v;
    };
    return {
      config: C, cards, horizon: (t) => horizonOf(t, c.tm.duration), bakeTo: at,
      // -> { view (chase.at), frame (inset.at: rect, opacity), perf, baked }
      at(t) {
        const v = at(horizonOf(t, c.tm.duration));
        return { view: RT.chase.at(v.B, t), frame: RT.inset.at(v.plan, t), perf: v.perf, baked: v.baked };
      },
    };
  }

  const api = { RIDER, JENSEN_CAM, CHUNK, AHEAD, G, configOf, sampleTimes, jumpsOf, shotsOf, lenOf, pointAt, tangentOf, basisOf,
    contextOf, sampleOf, trackOf, horizonOf, viewOf, placeOf, boxOf, inside, speechOf, performOf, cuesOf, mainRide, camRide, sampleAt };
  if (NODE) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).rider = api;
})(typeof self !== "undefined" ? self : this);
