// The rider's gates (media-anim MA-11 C3, C4; web/js/lacing/rider.js), every 30 fps frame in Node, no browser:
//   C3, the main view: per scene, the frames where the rider's box covers the action point (frameBase's focus) while the
//       rider shows (riderO > 0; target 0 outside the head-only LOD), the frames it shows, the LOD's frames (close-up /
//       cover), the gestures.
//   C4, Jensen Cam: per scene, the inset's frames, the chase camera's view-to-tangent angle (asin |fw . tangent|: 0
//       side-on; flagged over 60 deg), the frames the inset overlaps a callout card on screen (target 0), and the
//       rider's share inside the inset.
//   node tools/lacing_rider.js [--shots FILE] [--json OUT] [--check-chunks] [--set rider.scale=1.5 ...]
//       --check-chunks: the frame at t from the horizon's bake vs the full bake (rider.js's purity across chunks).
//       --set k=v: a shots value for this run (rider.* / jensenCam.*; numbers and JSON).
// Prints one table a gate and exits 1 if a gate fails.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const T = require("../web/js/lacing_tutorial.js"), H = require("../web/js/hose_route.js"), RD = require("../web/js/lacing/rider.js");
const CH = require("../web/js/lib/media-anim/media-anim-characters.min.js"), RT = require("../web/js/lib/media-anim/media-anim-runtime.min.js");

const args = process.argv.slice(2), flag = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const shots = JSON.parse(JSON.stringify(flag("--shots") ? JSON.parse(fs.readFileSync(path.resolve(ROOT, flag("--shots")), "utf8")) : T.SHOTS));
for (let i = 0; i < args.length; i++) if (args[i] === "--set") {
  const [k, v] = args[++i].split("="), keys = k.split("."), last = keys.pop();
  let o = shots;
  for (const q of keys) o = o[q] = o[q] || {};
  try { o[last] = JSON.parse(v); } catch (e) { o[last] = v; }
}
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "web", "data", "lr4_config.json"), "utf8"));
const tm = T.timing(), P = T.referencePlan(H, cfg.hose);
const def = CH.cast.JENSEN, geom = CH.body.bodyGeometry(def, fs.readFileSync(path.join(ROOT, "web", "js", "lib", "media-anim", "jensen-torso.svg"), "utf8"));
const c = RD.contextOf(P, tm, shots), track = RD.trackOf(c);
const w0 = Date.now(), all = track.upTo(tm.duration), trackS = (Date.now() - w0) / 1000;
const bad = all.filter((s) => !s.slideOk).length;
if (bad) throw new Error(`lacing_rider: ${bad} samples where frameBase's tipSlide disagrees with the jumps (frame.js jumpsOf changed?)`);
const fps = c.fps, frames = all.filter((s) => Math.abs(s.t * fps - Math.round(s.t * fps)) < 1e-6);
const out = { track: { samples: all.length, frames: frames.length, s: +trackS.toFixed(2) } };
let fail = 0;
const pad = (s, n) => String(s).padStart(n);

// ---- C3 ----
const main = RD.mainRide(track, def, geom), R = main.config;
{
  const w = Date.now(), v = main.bakeTo(tm.duration), ms = Date.now() - w, rows = new Map();
  // peak joint speed where he shows: deg/s over 1 ms after each frame, the largest of the bones (as media-anim C2), not
  // across a facing turn (the mirrored offsets swap in one step there, with the sprite at 0 width)
  const speedAt = (t) => {
    const a = CH.body.poseAt(t, def, v.perf, v.baked), b = CH.body.poseAt(t + 0.001, def, v.perf, v.baked);
    if (Math.sign(a.facing) !== Math.sign(b.facing)) return 0;
    let m = 0;
    for (const k of Object.keys(a.angles)) m = Math.max(m, Math.abs(b.angles[k] - a.angles[k]) / 0.001);
    return m;
  };
  for (const f of v.frames) {
    const r = rows.get(f.scene) || { scene: f.scene, frames: 0, shown: 0, detail: 0, rider: 0, riderDetail: 0, noTail: 0, covers: 0, coverRider: 0, lod: 0, speed: 0, speedAt: null };
    const o = main.at(f.t).riderO, shownMain = f.shown && !(R.lod.detail && f.detail);
    r.frames++; if (f.shown) r.shown++; if (f.shown && f.detail) r.detail++;
    if (f.shown && !f.tail) r.noTail++;
    if (shownMain && o > 0) {
      r.rider++; if (f.detail) r.riderDetail++;
      const sp = speedAt(f.t); if (sp > r.speed) { r.speed = sp; r.speedAt = f.t; }
    }
    if (f.cover) r.covers++;
    if (f.cover && o > 0) r.coverRider++;
    if (f.shown && o < 1) r.lod++;
    rows.set(f.scene, r);
  }
  const list = [...rows.values()], cover = list.reduce((n, r) => n + r.coverRider, 0), riders = list.reduce((n, r) => n + r.rider, 0);
  console.log(`C3 rider (main view): ${R.pose}, anchor ${R.anchor}, scale ${R.scale}, maxPx ${R.maxPx}; LOD ${JSON.stringify(R.lod)}; bake + LOD ${ms} ms, track ${trackS.toFixed(1)} s (${all.length} samples)`);
  console.log("scene    frames  tip  close-up  no-tail  rider  in-close-up  covers  over-while-shown  head-only  peak deg/s (at)");
  for (const r of list) console.log(`${r.scene.padEnd(8)} ${pad(r.frames, 6)} ${pad(r.shown, 4)} ${pad(r.detail, 9)} ${pad(r.noTail, 8)} ${pad(r.rider, 6)} ${pad(r.riderDetail, 12)} ${pad(r.covers, 7)} ${pad(r.coverRider, 17)} ${pad(r.lod, 10)}  ${r.rider ? `${r.speed.toFixed(0)} (${r.speedAt.toFixed(2)})` : "-"}`);
  console.log(`gate: frames with the rider's box over the action point while it shows: ${cover} (target 0); rider shown in ${riders} frames`);
  const cues = v.perf.gestures.map((q) => `${q.gesture} ${q.t0.toFixed(2)}-${q.t1.toFixed(2)}${q.target ? ` at ${q.target.map((x) => x.toFixed(0)).join(",")}` : ""}`);
  console.log(`gestures: ${cues.join("; ") || "none"}`);
  // the rider's size where it shows: its box w x h px, and the head
  const shown = v.frames.filter((f) => f.rect && main.at(f.t).riderO > 0);
  if (shown.length) {
    const q = (k) => { const a = shown.map((f) => f.rect[k]).sort((x, y) => x - y); return `${a[0].toFixed(0)}-${a[a.length - 1].toFixed(0)} (median ${a[a.length >> 1].toFixed(0)})`; };
    console.log(`rider box where shown: w ${q("w")} px, h ${q("h")} px at 1280x720`);
  }
  if (cover && R.lod.cover) fail++;                 // (lod.cover off: he rides throughout, the count reported, not failed)
  // (d29, the owner: what is in front of him hides him) the main view's rider is depth-tested with a faint ghost, Jensen
  // Cam's drawn on top. The gate: the config, then per scene the frames where he shows and his seat (the tip, where
  // the sprite stands) is behind the bundle - the ray from the camera to the tip passes through the hose, cord or
  // sleeve (their tubes at the build pose: the wide step scenes; close-ups and the moving goal / finale not measured)
  const C0 = RD.configOf(shots).cam;
  const cfgOk = R.onTop === false && R.ghost >= 0.25 && R.ghost <= 0.3 && C0.onTop === true;
  console.log(`occlusion: main rider onTop ${R.onTop}, ghost ${R.ghost} (want false, 0.25-0.30); Jensen Cam onTop ${C0.onTop} (want true)${cfgOk ? "" : "  FAIL"}`);
  if (!cfgOk) fail++;
  const tubes = [{ pts: P.curve, r: cfg.hose.od / 2 }, { pts: P.cab.cord, r: cfg.hose.cord.d / 2 }].concat(P.cab.sleeve ? [{ pts: P.cab.sleeve, r: cfg.hose.sleeve.d / 2 }] : []);
  const segD = (a, b, q) => {                        // the distance from q to the segment a-b, and where on it (0..1)
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], aq = [q[0] - a[0], q[1] - a[1], q[2] - a[2]], L = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
    const u = Math.max(0, Math.min(1, (aq[0] * ab[0] + aq[1] * ab[1] + aq[2] * ab[2]) / L));
    return Math.hypot(aq[0] - u * ab[0], aq[1] - u * ab[1], aq[2] - u * ab[2]);
  };
  const behind = (s) => {                            // the camera -> tip ray, stopped 2 mm short of the tip (its own surface)
    const a = s.cam[0], d = Math.hypot(s.p[0] - a[0], s.p[1] - a[1], s.p[2] - a[2]), k = (d - 2 - shots.tip.r) / d;
    const b = [a[0] + (s.p[0] - a[0]) * k, a[1] + (s.p[1] - a[1]) * k, a[2] + (s.p[2] - a[2]) * k];
    return tubes.some((tb) => tb.pts.some((q) => segD(a, b, q) < tb.r - 0.5));
  };
  const occ = new Map(), WIDE = new Set(["start", "lock", "uturn", "spacing"]);
  for (const s of frames) {
    if (!WIDE.has(s.scene) || s.detail || !s.p || !(main.at(s.t).riderO > 0) || !s.tip) continue;
    const r = occ.get(s.scene) || { scene: s.scene, shown: 0, behind: 0, first: null, last: null, ts: [] };
    r.shown++;
    if (behind(s)) { r.behind++; r.ts.push(+s.t.toFixed(3)); if (r.first === null) r.first = s.t; r.last = s.t; }
    occ.set(s.scene, r);
  }
  for (const r of occ.values()) console.log(`  ${r.scene.padEnd(8)} rider shown ${pad(r.shown, 4)} frames, seat behind the bundle ${pad(r.behind, 4)} (ghosted)${r.behind ? ` ${r.first.toFixed(2)}-${r.last.toFixed(2)} s` : ""}`);
  out.c3 = { config: R, scenes: list, over: cover, gestures: v.perf.gestures, occlusion: { ok: cfgOk, scenes: [...occ.values()] } };
}

// ---- C4 ----
const cam = RD.camRide(track, def), C = cam.config;
{
  const w = Date.now(), v = cam.bakeTo(tm.duration), ms = Date.now() - w;
  const rep = RT.chase.report(v.B, { fps, px: 180, fov: C.fov, over: 60 });
  const angleAt = new Map(rep.samples.map((s) => [Math.round(s.t * 1e6), s]));
  const rows = new Map(), rect = (F) => { const k = (F.callouts || [])[0]; return k && k.card && k.card.opacity > 0 ? k : null; };
  const HEAD = (def.proportions.chin - def.proportions.top) * CH.bodyOverlay.SY_MAX;
  let overCard = 0, overMs = 0;
  for (const s of frames) {
    const fr = RT.inset.at(v.plan, s.t), r = rows.get(s.scene) || { scene: s.scene, frames: 0, inset: 0, angleMax: 0, angleAt: null, over60: 0, cards: 0, insideMin: 1, corner: new Set() };
    r.frames++;
    if (fr && fr.opacity > 0 && fr.rect) {
      r.inset++; r.corner.add(fr.corner);
      const a = angleAt.get(Math.round(s.t * 1e6));
      if (a && a.seen !== false) { if (a.angle > r.angleMax) { r.angleMax = a.angle; r.angleAt = s.t; } if (a.angle > 60) r.over60++; }
      const F = T.frameAt(s.t, P, RD.G, tm, shots), k = rect(F);
      if (k && RT.inset.overlaps(fr.rect, k.card, 0)) { r.cards++; overCard++; }
      // the rider in the inset: its box in the inset's own 1280 x 720 frame, the share inside it
      const view = RT.chase.at(v.B, s.t), local = (p) => { const d = [p[0] - view.pos[0], p[1] - view.pos[1], p[2] - view.pos[2]]; return { x: d[0] * view.right[0] + d[1] * view.right[1] + d[2] * view.right[2], y: d[0] * view.up[0] + d[1] * view.up[1] + d[2] * view.up[2], z: -(d[0] * view.fw[0] + d[1] * view.fw[1] + d[2] * view.fw[2]) }; };
      const ty = Math.tan((C.fov * Math.PI) / 360), tx = ty * 16 / 9, top = s.p && CH.bodyOverlay.topOf(local(s.p), shots.tip.r, false);
      if (top) {
        const anchor = [((top.p[0] / -top.p[2] / tx) + 1) / 2 * 1280, (1 - (top.p[1] / -top.p[2] / ty)) / 2 * 720];
        const pose = CH.body.poseAt(s.t, def, v.perf, v.baked), box = RD.boxOf(geom, def, pose, { anchor, s: C.riderPx / HEAD }, R.anchor);
        const ix = Math.max(0, Math.min(1280, box.x + box.w) - Math.max(0, box.x)), iy = Math.max(0, Math.min(720, box.y + box.h) - Math.max(0, box.y));
        r.insideMin = Math.min(r.insideMin, (ix * iy) / (box.w * box.h));
      }
    }
    rows.set(s.scene, r);
  }
  // the cards on a 1 ms grid too (B2's gate, on lr4's own cards)
  for (let t = 0; t < tm.duration; t += 0.001) {
    const fr = RT.inset.at(v.plan, t);
    if (fr && fr.opacity > 0 && fr.rect && cam.cards.some((k) => t >= k.tIn && t < k.tGone && RT.inset.overlaps(fr.rect, k, 0))) overMs++;
  }
  const list = [...rows.values()];
  console.log(`\nC4 Jensen Cam: corner ${C.corner}, chase dist ${C.dist} mm el ${C.el} behind ${C.behind} lift ${C.lift} hz ${C.hz}, rider head ${C.riderPx} px at 720 lines; bake + plan ${ms} ms`);
  console.log("scene    frames  inset  corner  angle-max (at)        over-60  over-card  rider-inside-min");
  for (const r of list) console.log(`${r.scene.padEnd(8)} ${pad(r.frames, 6)} ${pad(r.inset, 6)} ${pad([...r.corner].join("/") || "-", 7)} ${pad(r.inset ? r.angleMax.toFixed(1) + " deg (" + r.angleAt.toFixed(2) + ")" : "-", 21)} ${pad(r.over60, 8)} ${pad(r.cards, 10)} ${pad(r.inset ? r.insideMin.toFixed(3) : "-", 17)}`);
  const flagged = list.filter((r) => r.angleMax > 60).map((r) => `${r.scene} ${r.angleMax.toFixed(1)}`);
  console.log(`gate: frames of inset over a callout card: ${overCard} (1 ms grid: ${overMs} ms) (target 0); scenes over 60 deg: ${flagged.join(", ") || "none"} (flagged, not failed)`);
  console.log(`inset plan: ${v.plan.scenes.filter((s) => s.corner).map((s) => `${s.id} ${s.corner}${s.clash ? ` (${s.clash} clash)` : ""}`).join(", ")}; hidden spans ${v.plan.hide.length}`);
  if (overCard || overMs) fail++;
  out.c4 = { config: C, scenes: list.map((r) => Object.assign({}, r, { corner: [...r.corner] })), overCard, overMs, flagged, plan: v.plan.scenes };
}

// ---- the chunks: the frame at t from its horizon's bake = from the full bake ----
if (args.includes("--check-chunks")) {
  const fresh = RD.trackOf(c), m2 = RD.mainRide(fresh, def, geom), c2 = RD.camRide(fresh, def), full = main.bakeTo(tm.duration), fullC = cam.bakeTo(tm.duration);
  let n = 0, poseDiff = 0, oDiff = 0, viewDiff = 0, insetDiff = 0, camPose = 0;
  const w = Date.now();
  for (const s of frames) {                          // (in time order, as a render: each horizon made once)
    const a = m2.at(s.t), pa = JSON.stringify(CH.body.poseAt(s.t, def, a.perf, a.baked)), pf = JSON.stringify(CH.body.poseAt(s.t, def, full.perf, full.baked));
    if (pa !== pf) poseDiff++;
    if (a.riderO !== main.at(s.t).riderO) oDiff++;
    const b = c2.at(s.t), vf = RT.chase.at(fullC.B, s.t), fi = RT.inset.at(fullC.plan, s.t);
    if (JSON.stringify(b.view) !== JSON.stringify(vf)) viewDiff++;
    if (JSON.stringify(b.frame) !== JSON.stringify(fi)) insetDiff++;
    if (JSON.stringify(CH.body.poseAt(s.t, def, b.perf, b.baked)) !== JSON.stringify(CH.body.poseAt(s.t, def, fullC.perf, fullC.baked))) camPose++;
    n++;
  }
  console.log(`\nchunks (horizon = the next ${RD.CHUNK} s boundary >= t + ${RD.AHEAD} s) vs the full bake, ${n} frames in ${((Date.now() - w) / 1000).toFixed(1)} s: rider pose ${poseDiff} differ, rider opacity ${oDiff}, chase view ${viewDiff}, inset ${insetDiff}, inset rider pose ${camPose}`);
  if (poseDiff || oDiff || viewDiff || insetDiff || camPose) fail++;
  out.chunks = { frames: n, poseDiff, oDiff, viewDiff, insetDiff, camPose };
}
if (flag("--json")) fs.writeFileSync(path.resolve(ROOT, flag("--json")), JSON.stringify(out, null, 1) + "\n");
process.exit(fail ? 1 : 0);
