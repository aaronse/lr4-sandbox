// Derived from Jason Yeager's lr4-sandbox (MIT, Copyright (c) 2026 Jason Yeager, this repository's LICENSE): these routes were moved out of his
// js/page/hose_bom.js at page 0.66.2 (fork commit 0a709be, 2026-11-08) and frozen here. His page has since replaced them with ropes;
// docs/FORK.md "Last merge". Not to be copied into the private media-* repos.
// The vacuum hose's route and the cables along it (pure: no THREE / DOM; tests/test_hose_route.js checks it against
// the Python): hoseRoute mirrors lacing.hose_route, cordRoute lacing.cord_route, catmullRom lr4.catmull_rom, lacing
// lacing.lacing (freecad/lacing.py) - keep each pair in step. The lacing tutorial's own geometry (fork-only, frozen
// 2026-11-12): the page's hose and cords are upstream's ropes (js/page/hose_bom.js); js/page/lacing_anim.js draws the
// tutorial's hose, cord and sleeve from these instead.
(function (root) {
  "use strict";
  // ---- vacuum hose: clamped in the Min-end holder; between the clamp and the core it folds like a drag
  // chain (lower run in the trays, U-turn, upper run on top back to the core), so it is re-swept for every
  // pose. ----
  function hoseRoute(h, dx, dz) {
    const r = h.od / 2, od = h.od, R = h.loop_r;
    const px = h.port[0] + dx, py = h.port[1], pz = h.port[2] - h.cuff_in;
    const ztop = h.top + h.clear + r;
    const ty = h.tray_y, tz = h.tray_z, [x0, x1, zl] = h.bump, zb = Math.max(zl + r + 2.0, tz);
    const xa = h.clamp_x, xn = h.bump_next;
    const trayZ = (x) => {
      if (x >= xa && x < x0) return tz + (zb - tz) * (x - xa) / (x0 - xa);
      if (x >= x0 && x <= x1) return zb;
      if (x > x1 && x < xn) return zb + (tz - zb) * (x - x1) / (xn - x1);
      return tz;
    };
    const runXs = (hi, lo) => {
      const cor = [xn, x1, x0, xa], xs = [];
      const brk = [xn - 30, xn + 30, x1 - 30, x1 + 30, x0 + 30, xa].filter((b) => lo <= b && b < hi);
      for (let x = hi; x > lo; x -= h.pitch) if (cor.every((b) => Math.abs(x - b) > 40) && brk.every((b) => Math.abs(x - b) > 25)) xs.push(x);
      return xs.concat(brk).sort((a, b) => b - a);
    };
    const Rb = h.rise_r, T = h.turn, L = h.out_dx, zc = h.over_z, yh = h.tie_y, zr = h.tie_z;
    const pts = [[px, py, pz, "core"], [px, py, (pz + zc - Rb) / 2, "core"]];
    for (let k = 0; k < 5; k++) {
      const a = 22.5 * k * Math.PI / 180;
      pts.push([px, py + Rb * (1 - Math.cos(a)), zc - Rb + Rb * Math.sin(a), "core"]);
    }
    for (let k = 0; k < 5; k++) {
      const a = (180 - 22.5 * k) * Math.PI / 180;
      pts.push([px + T + T * Math.cos(a), yh - T + T * Math.sin(a), zc + (zr - zc) * k / 4, "core"]);
    }
    const xe = px + h.core_end_dx, zt = zr;
    const ch = h.uturn_gap, Ld = L, xu = Math.max(xe + ch, (h.run + xa + xe) / 2), g = xu - xe;
    const Ly = Math.min(L, g), Af = (Ly / L) ** 2, dip = Math.min(1, (g / (2 * Ld)) ** 2);
    const [ry, rz, rr] = h.rail_up;
    const nest = (zl) => {                       // on the lower hose (ty, zl), against the upper X rail
      const ay = ty, az = zl, ra = od + 1.0, rb = r + rr + 1.0, d = Math.hypot(ry - ay, rz - az);
      const a_ = (ra * ra - rb * rb + d * d) / (2 * d), hh = Math.sqrt(Math.max(ra * ra - a_ * a_, 0));
      const py_ = ay + a_ * (ry - ay) / d, pz_ = az + a_ * (rz - az) / d;
      return [py_ + hh * (rz - az) / d, pz_ - hh * (ry - ay) / d];
    };
    const S = (q) => (1 - Math.cos(Math.PI * Math.min(Math.max(q, 0), 1))) / 2;
    const S5 = (q) => { const v = Math.min(Math.max(q, 0), 1); return v * v * v * (v * (6 * v - 15) + 10); };
    const yu = yh + (nest(trayZ(xu))[0] - yh) * Af;
    const reach = (x0) => Math.min(1, Math.max(0, (xu + R + r - x0 + 40) / 40));
    let zu = zt;
    for (const [x0, x1, ey, ez0, fr] of h.plates) {
      const ez = fr === "gantry" ? ez0 - dz : ez0;
      if (ez + r + 3 > zt) zu = Math.max(zu, zt + (ez + r + 3 - zt) * reach(x0));
    }
    const dyz = [ty - yu, tz - zu], Lc = Math.hypot(dyz[0], dyz[1]);
    const u = [dyz[0] / Lc, dyz[1] / Lc], nv = [-u[1], u[0]];
    let bulge = 0;
    for (const [x0, x1, ey, ez0, fr] of h.plates) {
      const ez = fr === "gantry" ? ez0 - dz : ez0;
      const cy = ey - yu, cz = ez - zu;
      const sc = nv[0] * cy + nv[1] * cz, tc = (u[0] * cy + u[1] * cz) / Lc;
      if (tc > 0 && tc < 1 && sc > -(r + 3)) {
        const need = (r + 3 + sc) / Math.sqrt(Math.max(0.2, 1 - (1 - 2 * tc) ** 2));
        bulge = Math.max(bulge, need * reach(x0));
      }
    }
    // every 20 mm back from the U-turn's top to just past the turn onto the core (anchored to the U-turn, so they
    // slide with it: re-spacing them as the core moved twitched the hose ~0.5 mm when their count changed); the one
    // uneven gap is on the core's flat top
    const x0s = px + T, xs = [];
    for (let x = xu - 20.0; x > x0s + 10.0; x -= 20.0) xs.unshift(x);
    if (!xs.length) xs.push((x0s + xu) / 2);
    for (const x of xs) {
      if (x <= xe) { pts.push([x, yh, zr, "core"]); continue; }
      const t = x - xe, [ys, zs] = nest(trayZ(x)), zl = zt + (zu - zt) * S(t / g);
      pts.push([x, yh + (ys - yh) * Af * S5(t / Ly), zl - (zl - zs) * dip * S5(t / Ld) * S5((g - t) / Ld), "beam"]);
    }
    const acc = Math.hypot(dyz[0] / 2 + 2 * bulge * nv[0], dyz[1] / 2 + 2 * bulge * nv[1]);
    const Rx = Math.max(R, Math.sqrt(40.0 * acc));
    for (let k = g >= 30 ? 0 : 1; k < 13; k++) {
      const a = (90 - 15 * k) * Math.PI / 180, f = (1 - Math.sin(a)) / 2, b = bulge * Math.cos(a) ** 2;
      pts.push([xu + Rx * Math.cos(a), yu + f * dyz[0] + b * nv[0], zu + f * dyz[1] + b * nv[1], "beam"]);
    }
    pts.push([xu - 40, ty, trayZ(xu - 40), "beam"]);
    for (const x of runXs(xu - 100, Math.max(xa, h.exit_x + 60))) pts.push([x, ty, trayZ(x), "beam"]);
    pts.push([h.exit_x, ty, trayZ(h.exit_x), "beam"]);
    const [ddx, ddy, ddz] = h.drop;
    pts.push([h.exit_x + ddx * 0.55, ty + ddy * 0.4, tz + ddz * 0.25, "beam"]);
    pts.push([h.exit_x + ddx, ty + ddy, tz + ddz, "beam"]);
    pts.push([h.exit_x + h.floor[0], h.floor_y, h.table_t + h.floor[2], "table"]);
    return pts;
  }

  // ---- router cord + cable sleeve tied along the hose ----
  function cordRoute(curve, h, c, tip, tip2, dx, pose) {
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const xStart = h.port[0] + dx + h.turn + 10.0, xe = h.port[0] + dx + h.core_end_dx;
    const i0 = curve.findIndex((p) => p[0] >= xStart);
    let iTurn = 0;
    for (let i = 1; i < curve.length; i++) if (curve[i][0] > curve[iTurn][0]) iTurn = i;
    let iEnd = iTurn;
    for (let i = i0; i < iTurn; i++) if (curve[i][0] >= xe) { iEnd = i; break; }
    const arc = [0];
    for (let i = 1; i < curve.length; i++) arc.push(arc[i - 1] + dist(curve[i], curve[i - 1]));
    const square = (v, t) => {               // v made square to the unit tangent t, unit length (or null)
      const k = v.reduce((s, x, q) => s + x * t[q], 0);
      const w = v.map((x, q) => x - k * t[q]), wl = Math.hypot(...w);
      return wl > 1e-6 ? w.map((x) => x / wl) : null;
    };
    const cross = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
    // a frame carried along the hose (e1 up at the core-top run's start): each cable's place is an angle in it
    const tans = [], e1s = [];
    let e1 = null;
    for (let i = i0; i < curve.length; i++) {
      const a = curve[Math.max(i - 1, 0)], b = curve[Math.min(i + 1, curve.length - 1)];
      const tn = dist(a, b) || 1, t = b.map((v, k) => (v - a[k]) / tn);
      e1 = square(e1 || [0, 0, 1], t) || e1;
      tans[i] = t; e1s[i] = e1;
    }
    // the cable's points at fixed arcs from the core's end (a1), so they keep their place on the hose as the core moves
    // (they were the samples every `step`, which slide along the hose with the pose); centre and frame interpolated
    const last = curve.length - 1;
    const s0 = i0 > 0 ? arc[i0 - 1] + (arc[i0] - arc[i0 - 1]) *
      Math.min(1, Math.max(0, (xStart - curve[i0 - 1][0]) / ((curve[i0][0] - curve[i0 - 1][0]) || 1))) : arc[i0];
    const place = (s) => {
      let lo = i0, hi = last;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arc[mid] <= s) lo = mid; else hi = mid; }
      if (hi === lo) return [curve[lo], tans[lo], e1s[lo]];
      const f = Math.min(1, Math.max(0, (s - arc[lo]) / ((arc[hi] - arc[lo]) || 1)));
      const p = [0, 1, 2].map((k) => curve[lo][k] + (curve[hi][k] - curve[lo][k]) * f);
      const t0 = [0, 1, 2].map((k) => tans[lo][k] + (tans[hi][k] - tans[lo][k]) * f), tl = Math.hypot(...t0) || 1, t = t0.map((x) => x / tl);
      return [p, t, square([0, 1, 2].map((k) => e1s[lo][k] + (e1s[hi][k] - e1s[lo][k]) * f), t) || e1s[lo]];
    };
    const ang = (v, s) => {                  // the angle of world direction v round the hose at arc s
      const [, t, e] = place(s), e2 = cross(t, e);
      return Math.atan2(v.reduce((s_, x, q) => s_ + x * e2[q], 0), v.reduce((s_, x, q) => s_ + x * e[q], 0));
    };
    // where the core's +X end and the U-turn's tip fall between samples (the samples slide along the hose as the core
    // moves: snapping to them turned the cables round the U-turn a few degrees a frame)
    const a1 = iEnd > i0 && iEnd < iTurn ? arc[iEnd - 1] + (arc[iEnd] - arc[iEnd - 1]) *
      Math.min(1, Math.max(0, (xe - curve[iEnd - 1][0]) / ((curve[iEnd][0] - curve[iEnd - 1][0]) || 1))) : arc[iEnd];
    let a2 = arc[iTurn];
    if (iTurn > 0 && iTurn < curve.length - 1) {
      const xa = curve[iTurn - 1][0], xb = curve[iTurn][0], xc = curve[iTurn + 1][0], den = xa - 2 * xb + xc;
      const q = den < 0 ? Math.min(0.5, Math.max(-0.5, 0.5 * (xa - xc) / den)) : 0;
      a2 += q * (q > 0 ? arc[iTurn + 1] - arc[iTurn] : arc[iTurn] - arc[iTurn - 1]);
    }
    const keys = [a1, a1 + c.wrap, a2 - c.turn_blend, a2 + c.turn_blend];
    for (let k = 1; k < keys.length; k++) keys[k] = Math.max(keys[k], keys[k - 1]);
    const th = [ang(c.core_side, s0), ang(c.up_dir, keys[1]), 0, ang(c.lo_dir, keys[3])];
    th[2] = th[1];
    for (let k = 1; k < th.length; k++) {   // (no jumps across +-180)
      while (th[k] - th[k - 1] > Math.PI) th[k] -= 2 * Math.PI;
      while (th[k] - th[k - 1] < -Math.PI) th[k] += 2 * Math.PI;
    }
    const rads = [c.core_r, c.up_r, c.up_r, c.lo_r];
    const ss = [s0];
    for (let k = Math.floor((s0 - a1) / c.step) + 1; a1 + k * c.step < arc[last] - 1e-6; k++) ss.push(a1 + k * c.step);
    ss.push(arc[last]);
    let pts = [];
    for (const s of ss) {
      let k = keys.findIndex((q) => s < q);
      if (k < 0) k = keys.length;
      let q, r;
      if (k === 0) { q = th[0]; r = rads[0]; }
      else if (k === keys.length) { q = th[th.length - 1]; r = rads[rads.length - 1]; }
      else {
        const w = (s - keys[k - 1]) / ((keys[k] - keys[k - 1]) || 1);
        q = (1 - w) * th[k - 1] + w * th[k];
        r = (1 - w) * rads[k - 1] + w * rads[k] + (k === 1 ? c.lift * Math.sin(Math.PI * w) : 0);
      }
      const [p, t, e] = place(s), e2 = cross(t, e);
      pts.push(p.map((x, j) => x + (Math.cos(q) * e[j] + Math.sin(q) * e2[j]) * r));
      if (c.exit && s > arc[iTurn] && pts[pts.length - 1][0] < c.exit.x) break;
    }
    if (c.exit) {                            // off the lower run, down into the box's opening (it rides the beam)
      const sh = (p) => p.map((v, k) => v + (pose ? pose[k] : 0));
      const e = sh(c.exit.p), d = c.exit.d, last = pts[pts.length - 1], via = (c.exit.via || []).map(sh);
      const pOut = e.map((v, k) => v - d[k] * 12.0), first = via.length ? via[0] : pOut;
      const n = Math.max(1, Math.floor(Math.hypot(...first.map((v, k) => v - last[k])) / 35.0));
      for (let k = 1; k <= n; k++) {           // a gradual descent (eased) to the first via point
        const f = k / (n + 1), e_ = (1 - Math.cos(Math.PI * f)) / 2;
        pts.push([last[0] + (first[0] - last[0]) * f, last[1] + (first[1] - last[1]) * e_, last[2] + (first[2] - last[2]) * e_]);
      }
      pts.push(...via);
      pts.push(pOut, e.map((v, k) => v - d[k] * 1.0));   // stops at the wall, the wires go in
    }
    if (tip) {                               // from the router: out of the stub, then straight back
      const td = tip2.map((v, k) => v - tip[k]), tl = Math.hypot(...td);
      const p1 = tip.map((v, k) => v + td[k] / tl * c.lead);
      pts = [tip, p1, [p1[0], pts[0][1], (p1[2] + pts[0][2]) / 2]].concat(pts);
    }
    return pts;
  }

  // catmullRom mirrors lr4.catmull_rom: points along a centripetal Catmull-Rom curve through pts (three.js
  // CatmullRomCurve3, "centripetal", open), n per span
  function catmullRom(pts, n = 12) {
    const P = pts.map((p) => [p[0], p[1], p[2]]), out = [];
    const dsq = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    for (let k = 0; k < P.length - 1; k++) {
      const p0 = k > 0 ? P[k - 1] : P[0].map((v, i) => P[0][i] - P[1][i] + v);
      const p1 = P[k], p2 = P[k + 1];
      const p3 = k + 2 < P.length ? P[k + 2] : P[P.length - 1].map((v, i) => P[P.length - 1][i] - P[P.length - 2][i] + v);
      let dt0 = dsq(p0, p1) ** 0.25, dt1 = dsq(p1, p2) ** 0.25, dt2 = dsq(p2, p3) ** 0.25;
      if (dt1 < 1e-4) dt1 = 1.0;
      if (dt0 < 1e-4) dt0 = dt1;
      if (dt2 < 1e-4) dt2 = dt1;
      const cs = [0, 1, 2].map((i) => {
        const t1 = ((p1[i] - p0[i]) / dt0 - (p2[i] - p0[i]) / (dt0 + dt1) + (p2[i] - p1[i]) / dt1) * dt1;
        const t2 = ((p2[i] - p1[i]) / dt1 - (p3[i] - p1[i]) / (dt1 + dt2) + (p3[i] - p2[i]) / dt2) * dt1;
        return [p1[i], t1, -3 * p1[i] + 3 * p2[i] - 2 * t1 - t2, 2 * p1[i] - 2 * p2[i] + t1 + t2];
      });
      for (let j = 0; j < (k < P.length - 2 ? n : n + 1); j++) {
        const t = j / n;
        out.push(cs.map((c) => c[0] + c[1] * t + c[2] * t * t + c[3] * t ** 3));
      }
    }
    return out;
  }

  // ---- cable lacing (lacing mirrors lacing.lacing, LACING lacing.LACING - keep them in step): the cord and the sleeve laced
  // to the hose where it moves - a starting stitch next to the core's last zip tie, running lock stitches (marline
  // hitches) <= 76.2 mm apart (NASA-STD-8739.4A Table 9-1), a closing stitch next to the sleeve's breakout (8739.4A
  // Change 4 9.2.6 / 9.2.8.b / 9.2.10: a stitch right before and after a breakout), then the cord alone to a closing
  // stitch where the hose leaves the table. Each stitch wraps the bundle's outline (hull of the hose and the cables)
  // square to the hose; the running part lies over the cables, on top of the wraps. ----
  const LACING = { tape: 1.2, pitch: 68.0, close: 8.0, start: 15.0, gap: 12.0, end: 25.0, wraps: [2, 1, 2], step: 6.0, tail: 150.0, near: 12.0, fade: 15.0 };
  // curve = the hose's dense centre line, h = the hose, runs = [{ to: "breakout" | "exit", x: the breakout's x,
  // cables: [{ pts: cordRoute's points, d }] }] from the core -> { runs: [{ s: stitch arcs, pts: the tape's line }],
  // stitches, length: tape to buy (mm: its path + a tail per knot) }
  // Continuous in the pose (draft 3: a still stretch of hose kept its lacing still only to the nearest curve sample -
  // 4-7 mm jumps a frame while the core moved): the core's end and the breakouts are found where the curve crosses their
  // x, each stitch and running-part point sits at its exact arc (centre and tangent interpolated between samples), and
  // the outline's polygons are laid out from the cables' side, so the carried frame's twist changes nothing.
  function lacing(curve, h, runs, dx = 0, L = LACING) {
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    const arc = [0];
    for (let i = 1; i < curve.length; i++) arc.push(arc[i - 1] + dist(curve[i], curve[i - 1]));
    const xe = h.port[0] + dx + h.core_end_dx, last = curve.length - 1;
    let iTurn = 0;
    for (let i = 1; i < curve.length; i++) if (curve[i][0] > curve[iTurn][0]) iTurn = i;
    const cut = (i, x) => {                         // the arc where the segment (i - 1, i) crosses x
      const a = curve[i - 1][0], b = curve[i][0], f = Math.min(1, Math.max(0, (x - a) / ((b - a) || 1)));
      return arc[i - 1] + f * (arc[i] - arc[i - 1]);
    };
    let iEnd = iTurn, sEnd = arc[iTurn];             // the core's +X end: where the upper run passes xe
    for (let i = 0; i < iTurn; i++) if (curve[i][0] >= xe) { iEnd = i; sEnd = i > 0 ? cut(i, xe) : arc[0]; break; }
    const after = (x) => { for (let i = iTurn + 1; i < curve.length; i++) if (curve[i][0] < x) return cut(i, x); return arc[last]; };
    const iF = Math.max(iEnd - 1, 0), tans = [], e1s = [];   // a frame carried along the hose (as cordRoute's)
    let e1 = null;
    for (let i = iF; i < curve.length; i++) {
      const a = curve[Math.max(i - 1, 0)], b = curve[Math.min(i + 1, last)];
      const tn = dist(a, b) || 1, t = b.map((v, k) => (v - a[k]) / tn);
      const v = e1 || [0, 0, 1], k = v[0] * t[0] + v[1] * t[1] + v[2] * t[2];
      const w = v.map((x, q) => x - k * t[q]), wl = Math.hypot(...w);
      if (wl > 1e-6) e1 = w.map((x) => x / wl);
      tans[i] = t; e1s[i] = e1;
    }
    const frameAt = (s) => {                        // -> [centre, t, e, e2] at arc s (between samples)
      let lo = iF, hi = last;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (arc[mid] <= s) lo = mid; else hi = mid; }
      const f = Math.min(1, Math.max(0, (s - arc[lo]) / ((arc[hi] - arc[lo]) || 1)));
      const c = [0, 1, 2].map((k) => curve[lo][k] + (curve[hi][k] - curve[lo][k]) * f);
      const t0 = [0, 1, 2].map((k) => tans[lo][k] + (tans[hi][k] - tans[lo][k]) * f), tl = Math.hypot(...t0) || 1, t = t0.map((x) => x / tl);
      const v = [0, 1, 2].map((k) => e1s[lo][k] + (e1s[hi][k] - e1s[lo][k]) * f), kk = v[0] * t[0] + v[1] * t[1] + v[2] * t[2];
      const w = v.map((x, q) => x - kk * t[q]), wl = Math.hypot(...w) || 1, e = w.map((x) => x / wl);
      return [c, t, e, [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]]];
    };
    const section = (s, cables) => {               // -> { hull: [[u, v]] CCW in the frame, side: the cables' side, fr }
      const fr = frameAt(s), [c, t, e, e2] = fr;
      const R = h.od / 2 + L.tape / 2, found = [];
      let su = 0, sv = 0;
      for (const [cp, d] of cables) {              // where the cable crosses the hose's normal plane, if on the hose
        let best = null;
        for (let j = 0; j < cp.length - 1; j++) {
          let da = 0, db = 0;
          for (let k = 0; k < 3; k++) { da += (cp[j][k] - c[k]) * t[k]; db += (cp[j + 1][k] - c[k]) * t[k]; }
          if (da * db > 0 || da === db) continue;
          const f = da / (da - db), q = [0, 1, 2].map((k) => cp[j][k] + f * (cp[j + 1][k] - cp[j][k]) - c[k]);
          const dq = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2]);
          if (best === null || dq < best[0]) best = [dq, q];
        }
        // on the bundle: all of it to NEAR mm out (a cable lifting off the hose is laced down with it), fading out by FAR
        // (the other run's cables, 80 mm and more away, never count); a fading cable's circle slides into the hose's
        const w = best === null ? 0 : 1 - Math.min(1, Math.max(0, (best[0] - (h.od / 2 + d + L.near)) / L.fade));
        if (w <= 0) continue;
        const q = best[1], u = (q[0] * e[0] + q[1] * e[1] + q[2] * e[2]) * w, v = (q[0] * e2[0] + q[1] * e2[1] + q[2] * e2[2]) * w;
        su += u; sv += v;
        found.push([u, v, d / 2 + L.tape / 2]);
      }
      const sl = Math.hypot(su, sv), side = sl > 1e-9 ? [su / sl, sv / sl] : [1, 0], a0 = Math.atan2(side[1], side[0]);
      let pts = [];                                 // the hose's and each cable's circle, laid out from the cables' side
      // (half a step off it: no vertex on the ray to it, where a rounding would pick the edge)
      for (let k = 0; k < 48; k++) pts.push([R * Math.cos(a0 + 2 * Math.PI * (k + 0.5) / 48), R * Math.sin(a0 + 2 * Math.PI * (k + 0.5) / 48)]);
      for (const [u, v, r] of found)
        for (let k = 0; k < 16; k++) pts.push([u + r * Math.cos(a0 + 2 * Math.PI * (k + 0.5) / 16), v + r * Math.sin(a0 + 2 * Math.PI * (k + 0.5) / 16)]);
      pts = pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);   // convex hull (monotone chain), CCW
      const hull = [];
      for (const part of [pts, pts.slice().reverse()]) {
        const low = [];
        for (const p of part) {
          while (low.length >= 2 && ((low[low.length - 1][0] - low[low.length - 2][0]) * (p[1] - low[low.length - 2][1]) -
            (low[low.length - 1][1] - low[low.length - 2][1]) * (p[0] - low[low.length - 2][0])) <= 0) low.pop();
          low.push(p);
        }
        hull.push(...low.slice(0, -1));
      }
      return { hull, side, fr };
    };
    const world = ([c, t, e, e2], uv, along) => [0, 1, 2].map((k) => c[k] + uv[0] * e[k] + uv[1] * e2[k] + along * t[k]);
    const top = (hull, side) => {                  // where the ray from the hose's centre to the cables' side leaves the
      for (let j = 0; j < hull.length; j++) {      // outline: [the edge it crosses, the point] (continuous, where the
        const a = hull[j], b = hull[(j + 1) % hull.length];   // furthest vertex jumped between two cables)
        const ca = a[0] * side[1] - a[1] * side[0], cb = b[0] * side[1] - b[1] * side[0];
        if (ca < 0 || cb >= 0) continue;           // (CCW: a on the ray or right of it, b left)
        const f = ca / (ca - cb), p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        if (p[0] * side[0] + p[1] * side[1] > 0) return [j, p];
      }
      return [0, hull[0]];
    };
    const out = [];
    let total = 0, nSt = 0, sFrom = sEnd + L.start;
    for (const r of runs) {
      const sTo = r.to === "breakout" ? after(r.x) - L.gap : after(h.exit_x) - L.end;
      if (sTo <= sFrom) break;
      const ss = [sFrom];
      while (ss[ss.length - 1] + L.pitch <= sTo - L.close) ss.push(ss[ss.length - 1] + L.pitch);
      ss.push(sTo);
      const cab = r.cables.map((c) => [catmullRom(c.pts, 4), c.d]), pts = [];
      for (let k = 0; k < ss.length; k++) {
        const turns = k === 0 ? L.wraps[0] : k === ss.length - 1 ? L.wraps[2] : L.wraps[1];
        const { hull, side, fr } = section(ss[k], cab), [j0, p0] = top(hull, side);
        const ring = [p0].concat(hull.slice(j0 + 1), hull.slice(0, j0 + 1)), adv = L.tape * 1.1, a0 = -adv * turns / 2;
        for (let m = 0; m < turns; m++)            // each turn sits beside the last along the hose
          for (let j = 0; j < ring.length; j++) pts.push(world(fr, ring[j], a0 + adv * (m + j / ring.length)));
        pts.push(world(fr, ring[0], a0 + adv * turns));
        if (k === ss.length - 1) break;
        const nxt = k + 1 === ss.length - 1 ? L.wraps[2] : L.wraps[1];
        for (let s_ = ss[k] + adv * turns / 2 + L.step; s_ < ss[k + 1] - adv * nxt / 2; s_ += L.step) {   // the running part
          const q = section(s_, cab), p = top(q.hull, q.side)[1];
          pts.push(world(q.fr, [p[0] + q.side[0] * L.tape, p[1] + q.side[1] * L.tape], 0));
        }
      }
      out.push({ s: ss, pts });
      for (let i = 1; i < pts.length; i++) total += dist(pts[i], pts[i - 1]);
      total += 2 * L.tail;
      nSt += ss.length;
      sFrom = r.to === "breakout" ? after(r.x) + L.gap : sTo;
    }
    return { runs: out, stitches: nSt, length: total };
  }

  const api = { hoseRoute, cordRoute, catmullRom, lacing, LACING };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LR4Hose = api;
})(typeof self !== "undefined" ? self : this);
