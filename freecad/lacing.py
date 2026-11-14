# The lacing tutorial's hose, cables and lacing (fork-only, 2026-11-12): the Python twins of web/js/hose_route.js,
# checked against it by tests/test_hose_route.js. hose_route and cord_route are frozen copies of lr4's as they stood when
# the tutorial was drawn (page 0.66.2 + the fork's continuity fixes): upstream's page now hangs the hose and cords as
# ropes (hose_bom.js) and dropped lr4.cord_route, so the tutorial keeps its own geometry here instead of tracking theirs.
# lr4.py stays as upstream has it (the constants, cable_places and catmull_rom are read from it).
import math

from lr4 import catmull_rom


def hose_route(h, dx=0.0, dz=0.0):
    """Hose control points [(x, y, z, frame)] at the build pose with the core moved dx in X (and the beam
    dz in Z, which moves it against the YZ_Max plate the U-turn bows around). frame:
    'core' rides the core (X+Y+Z), 'beam' the beam (Y+Z), 'table' is fixed. h = HOSE plus the
    build's anchors: port (x, y, z) top of the shoe socket, top (Z of the router's top), over_z (axis
    Z going back over the core), tie_y / tie_z (axis along the core's top), core_end_dx (core's +X end
    from the port), tray_y, tray_z (axis), bump (x0, x1, z) = Jackpot3 lid (z = its top under the hose), bump_next (X of the first
    tray holder past it), clamp_x (the Min-end
    holder), run (fixed length of upper + lower run, see build.py), table_t, floor_y."""
    r, od, R = h["od"] / 2, h["od"], h["loop_r"]
    px, py, pz = h["port"][0] + dx, h["port"][1], h["port"][2] - h["cuff_in"]
    ztop = h["top"] + h["clear"] + r
    ty, tz = h["tray_y"], h["tray_z"]
    x0, x1, zl = h["bump"]
    zb = max(zl + r + 2.0, tz)                     # hose axis over the Jackpot3 lid (flat if it clears)

    xa, xn = h["clamp_x"], h["bump_next"]

    def tray_z(x):                                 # lower run: in the trays; straight up from the clamp holder
        if xa <= x < x0:                           # onto the Jackpot3 lid, flat across its top, straight down
            return tz + (zb - tz) * (x - xa) / (x0 - xa)   # to the next holder with a tray (bump_next)
        if x0 <= x <= x1:
            return zb
        if x1 < x < xn:
            return zb + (tz - zb) * (x - x1) / (xn - x1)
        return tz

    def run_xs(hi, lo):                            # sample points hi -> lo; 30 mm either side of each corner of
        cor = (xn, x1, x0, xa)                     # the straight runs, so the hose rounds them (the short rise
        brk = [b for b in (xn - 30, xn + 30, x1 - 30, x1 + 30, x0 + 30, xa)   # from the clamp onto the lid
               if lo <= b < hi]                    # is one S-bend: clamp point, then 30 mm onto the lid)
        xs, x = [], hi
        while x > lo:
            if all(abs(x - b) > 40 for b in cor) and all(abs(x - b) > 25 for b in brk):
                xs.append(x)
            x -= h["pitch"]
        return sorted(xs + brk, reverse=True)
    # up out of the socket beside the router, back over the core's Min side, a turn to +X, lengthwise
    # along the core's top between the two zip-tie pairs, off its +X end and an S back to the trays' line
    # (user markup, 2026-10-18)
    Rb, T, L = h["rise_r"], h["turn"], h["out_dx"]
    zc, yh, zr = h["over_z"], h["tie_y"], h["tie_z"]
    pts = [(px, py, pz, "core"), (px, py, (pz + zc - Rb) / 2, "core")]
    for k in range(5):                             # straight up -> heading back (+Y), radius Rb
        a = math.radians(22.5 * k)
        pts.append((px, py + Rb * (1 - math.cos(a)), zc - Rb + Rb * math.sin(a), "core"))
    for k in range(5):                             # heading back -> heading +X, radius T, centre (px + T, yh - T)
        a = math.radians(180 - 22.5 * k)
        pts.append((px + T + T * math.cos(a), yh - T + T * math.sin(a), zc + (zr - zc) * k / 4, "core"))
    xe = px + h["core_end_dx"]                     # the core's +X end
    # (along the top over both tie pairs to the core's end xe, then the upper run: sampled together below)
    zt = zr                                        # upper run level where it leaves the core / tops the U-turn

    # The upper run lies on top of the lower one (user, 2026-10-18) except at the bend: off the core it
    # slides over to the trays' line (a cosine S, up to L long) and settles onto the lower run, and it
    # rises back to the core-top level only over the last Ld before the U-turn. When the U-turn is close
    # (core near +X) the S is shortened with its shift scaled by the square of its length (the U-turn twists
    # the rest) and the dip shrinks with the square of the room too, so no bend gets tighter than with room to spare.
    ch, Ld = h["uturn_gap"], L                      # Ld: the upper run settles / rises back over this length -
                                                   # the same as the S, so it moves straight onto its rest
                                                   # spot (a quicker drop dips into the upper X rail)
    xu = max(xe + ch, (h["run"] + xa + xe) / 2)   # U-turn: upper (xu - xe) + lower (xu - xa) = run; at full +X
    g = xu - xe                                    # travel it starts right at the core's end
    Ly = min(L, g)
    Af = (Ly / L) ** 2                             # share of the S's shift made before the U-turn (curvature ~
    dip = min(1.0, (g / (2 * Ld)) ** 2)           # shift / Ly^2, so the shift scales with Ly^2)
    ry_, rz_, rr_ = h["rail_up"]

    def nest(zl):                                  # where the upper run rests: on the lower hose (axis ty, zl)
        ay, az, by, bz = ty, zl, ry_, rz_          # and against the beam - the upper X rail (user, 2026-10-18:
        ra, rb = od + 1.0, r + rr_ + 1.0           # "laying against the beam on top of the other hose")
        d = math.hypot(by - ay, bz - az)
        a_ = (ra * ra - rb * rb + d * d) / (2 * d)
        hh = math.sqrt(max(ra * ra - a_ * a_, 0.0))
        py_, pz_ = ay + a_ * (by - ay) / d, az + a_ * (bz - az) / d
        return py_ + hh * (bz - az) / d, pz_ - hh * (by - ay) / d   # the upper of the two circle intersections

    def S(u):
        return (1 - math.cos(math.pi * min(max(u, 0.0), 1.0))) / 2

    def S5(u):                                     # smootherstep: no curvature at either end, so the slide-over
        u = min(max(u, 0.0), 1.0)                  # adds nothing to the U-turn's bend where they meet
        return u * u * u * (u * (6 * u - 15) + 10)
    yu = yh + (nest(tray_z(xu))[0] - yh) * Af
    # The U-turn: half an ellipse in the plane through the X axis and the line from its top (yu, zu) to its
    # bottom (ty, tz) - tilted when the core is near +X and the upper run hasn't reached the trays' line.
    # It must pass outside the Max-end plates' top back edges (h["plates"]: x0, x1, back Y, top Z, frame;
    # a "gantry" plate doesn't ride the beam's Z travel, so it sits -dz in this frame): as the loop comes
    # within 40 mm of a plate, its top lifts clear of that plate's top and its middle bows out round the edge.
    reach = lambda x0: min(1.0, max(0.0, (xu + R + r - x0 + 40) / 40))
    zu = zt
    for qx0, qx1, ey, ez, fr in h["plates"]:   # (not x0/x1: those are the lid's)
        ez = ez - dz if fr == "gantry" else ez
        if ez + r + 3 > zt:
            zu = max(zu, zt + (ez + r + 3 - zt) * reach(qx0))
    dyz = (ty - yu, tz - zu)
    Lc = math.hypot(*dyz)
    u = (dyz[0] / Lc, dyz[1] / Lc)
    nv = (-u[1], u[0])                             # in-plane normal: the outside (+Y +Z) of the turn
    bulge = 0.0
    for qx0, qx1, ey, ez, fr in h["plates"]:   # (not x0/x1: those are the lid's)
        ez = ez - dz if fr == "gantry" else ez
        cy_, cz_ = ey - yu, ez - zu
        sc, tc = nv[0] * cy_ + nv[1] * cz_, (u[0] * cy_ + u[1] * cz_) / Lc
        if 0 < tc < 1 and sc > -(r + 3):           # the plate's body lies on the -nv side of its edge: pass
            need = (r + 3 + sc) / math.sqrt(max(0.2, 1 - (1 - 2 * tc) ** 2))   # outside it with r + 3 to spare
            bulge = max(bulge, need * reach(qx0))
    x0s = px + T                                   # samples every 20 mm back from the U-turn's top to just past the
    xs, x = [], xu - 20.0                          # turn onto the core: flat on the core's top up to its end (xe),
    while x > x0s + 10.0:                          # then the upper run's S and dip (uneven spacing makes the spline
        xs.insert(0, x)                            # kink: the one uneven gap is on the core's flat top). Anchored to
        x -= 20.0                                  # the U-turn, they slide with it (re-spacing them as the core moved
    if not xs:                                     # twitched the hose ~0.5 mm when their count changed)
        xs = [(x0s + xu) / 2]
    for x in xs:
        if x <= xe:
            pts.append((x, yh, zr, "core"))
            continue
        t = x - xe
        ys, zs = nest(tray_z(x))                   # lying on the lower run, against the beam
        zl = zt + (zu - zt) * S(t / g)             # the run's own level: core top -> the U-turn's top
        pts.append((x, yh + (ys - yh) * Af * S5(t / Ly), zl - (zl - zs) * dip * S5(t / Ld) * S5((g - t) / Ld), "beam"))
    # bend radius at the U-turn's top and bottom = Rx^2 / |dyz/2 + 2 bulge nv|: widen the loop (X) when a big
    # bow would make it tighter than ~40 mm
    acc = math.hypot(dyz[0] / 2 + 2 * bulge * nv[0], dyz[1] / 2 + 2 * bulge * nv[1])
    Rx = max(R, math.sqrt(40.0 * acc))
    for k in range(0 if g >= 30 else 1, 13):       # (right at the core's end the top point and the run's last
        a = math.radians(90 - 15 * k)              # point are too close: skip the top, it spikes the bend)
        f = (1 - math.sin(a)) / 2                  # 0 at the top, 1 at the bottom
        b = bulge * math.cos(a) ** 2               # full at the middle, no kink where it meets the runs
        pts.append((xu + Rx * math.cos(a), yu + f * dyz[0] + b * nv[0], zu + f * dyz[1] + b * nv[1], "beam"))
    pts.append((xu - 40, ty, tray_z(xu - 40), "beam"))   # level out of the U-turn
    for x in run_xs(xu - 100.0, max(xa, h["exit_x"] + 60)):  # lower run in the trays back to the clamp (xa)
        pts.append((x, ty, tray_z(x), "beam"))
    pts.append((h["exit_x"], ty, tray_z(h["exit_x"]), "beam"))
    ddx, ddy, ddz = h["drop"]
    pts.append((h["exit_x"] + ddx * 0.55, ty + ddy * 0.4, tz + ddz * 0.25, "beam"))
    pts.append((h["exit_x"] + ddx, ty + ddy, tz + ddz, "beam"))
    fx, _, fz = h["floor"]
    pts.append((h["exit_x"] + fx, h["floor_y"], h["table_t"] + fz, "table"))
    return pts


def cord_route(curve, h, c, tip=None, tip2=None, dx=0.0, pose=(0.0, 0.0, 0.0)):
    """Control points of a cable tied along the hose: `curve` = the hose's sampled centre line (dense [(x, y, z)],
    at the pose), h = the hose dict (port, turn, od, core_end_dx), c = the cable (CORD / SLEEVE + core_side / core_r,
    up_dir / up_r, lo_dir / lo_r: its direction + distance from the hose's axis on the core's top, in the pocket and
    on the lower run). By length along the hose: core from the start of the run along the core's top, blended over
    `wrap` after the core's +X end to the pocket (lifted by `lift` mid-way), across the U-turn's tip to the lower run.
    tip / tip2 (the router's cord stub end and a point further along it): it starts there, runs `lead` on, then
    straight back (+Y) to the first tied point; without them it starts on the hose (the sleeve, out of the core).
    c["exit"] = {x, p, d, via} (the sleeve): it leaves the lower run where it passes x, eases down to and through the
    `via` points
    (a brace's hole) and on to the opening at p (all at the build pose; moved by `pose` = the beam's (0, dy, dz)),
    stopping at the wall (the wires go in along d)."""
    x_start = h["port"][0] + dx + h["turn"] + 10.0
    xe = h["port"][0] + dx + h["core_end_dx"]
    i0 = next(i for i, p in enumerate(curve) if p[0] >= x_start)
    i_turn = max(range(len(curve)), key=lambda i: curve[i][0])
    i_end = next((i for i in range(i0, i_turn) if curve[i][0] >= xe), i_turn)
    arc = [0.0]
    for i in range(1, len(curve)):
        arc.append(arc[-1] + math.dist(curve[i], curve[i - 1]))

    def square(v, t):                              # v made square to the unit tangent t, unit length (or None)
        k = sum(x * y for x, y in zip(v, t))
        w = [x - k * y for x, y in zip(v, t)]
        wl = math.sqrt(sum(x * x for x in w))
        return [x / wl for x in w] if wl > 1e-6 else None
    # a frame carried along the hose from the start of the core-top run (e1 up there), turning with it: each
    # cable's place is an angle in it, so they follow the hose round the U-turn and down the drop in order
    tans, e1s = {}, {}
    e1 = None
    for i in range(i0, len(curve)):
        a, b = curve[max(i - 1, 0)], curve[min(i + 1, len(curve) - 1)]
        tn = math.dist(a, b) or 1.0
        t = [(q - p) / tn for p, q in zip(a, b)]
        e1 = square(e1 if e1 is not None else (0.0, 0.0, 1.0), t) or e1
        tans[i], e1s[i] = t, e1

    # the cable's points at fixed arcs from the core's end (a1), so they keep their place on the hose as the core moves
    # (they were the samples every `step`, which slide along the hose with the pose); centre and frame interpolated
    last = len(curve) - 1
    s0 = arc[i0]
    if i0 > 0:
        s0 = arc[i0 - 1] + (arc[i0] - arc[i0 - 1]) * min(1.0, max(0.0, (x_start - curve[i0 - 1][0]) /
                                                             ((curve[i0][0] - curve[i0 - 1][0]) or 1.0)))

    def place(s):
        lo, hi = i0, last
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if arc[mid] <= s:
                lo = mid
            else:
                hi = mid
        if hi == lo:
            return curve[lo], tans[lo], e1s[lo]
        f = min(1.0, max(0.0, (s - arc[lo]) / ((arc[hi] - arc[lo]) or 1.0)))
        p = [curve[lo][k] + (curve[hi][k] - curve[lo][k]) * f for k in range(3)]
        t0 = [tans[lo][k] + (tans[hi][k] - tans[lo][k]) * f for k in range(3)]
        tl = math.hypot(*t0) or 1.0
        t = [x / tl for x in t0]
        return p, t, square([e1s[lo][k] + (e1s[hi][k] - e1s[lo][k]) * f for k in range(3)], t) or e1s[lo]
    def ang(v, s):                                 # angle of world direction v round the hose at arc s
        _, t, e = place(s)
        e2 = (t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0])
        return math.atan2(sum(x * y for x, y in zip(v, e2)), sum(x * y for x, y in zip(v, e)))
    # where the core's +X end and the U-turn's tip fall between samples (the samples slide along the hose as the core
    # moves: snapping to them turned the cables round the U-turn a few degrees a frame)
    a1 = arc[i_end]
    if i0 < i_end < i_turn:
        a1 = arc[i_end - 1] + (arc[i_end] - arc[i_end - 1]) * min(1.0, max(0.0, (xe - curve[i_end - 1][0]) /
                                                                     ((curve[i_end][0] - curve[i_end - 1][0]) or 1.0)))
    a2 = arc[i_turn]
    if 0 < i_turn < len(curve) - 1:
        xa, xb, xc = curve[i_turn - 1][0], curve[i_turn][0], curve[i_turn + 1][0]
        den = xa - 2 * xb + xc
        q = min(0.5, max(-0.5, 0.5 * (xa - xc) / den)) if den < 0 else 0.0
        a2 += q * (arc[i_turn + 1] - arc[i_turn] if q > 0 else arc[i_turn] - arc[i_turn - 1])
    keys = [a1, a1 + c["wrap"], a2 - c["turn_blend"], a2 + c["turn_blend"]]
    for k in range(1, len(keys)):                  # (core near +X: squeeze the blends, keep them in order)
        keys[k] = max(keys[k], keys[k - 1])
    th = [ang(c["core_side"], s0), ang(c["up_dir"], keys[1]), None, ang(c["lo_dir"], keys[3])]
    th[2] = th[1]
    for k in range(1, len(th)):                    # (no jumps across +-180)
        while th[k] - th[k - 1] > math.pi:
            th[k] -= 2 * math.pi
        while th[k] - th[k - 1] < -math.pi:
            th[k] += 2 * math.pi
    rads = [c["core_r"], c["up_r"], c["up_r"], c["lo_r"]]
    ss = [s0]
    k = math.floor((s0 - a1) / c["step"]) + 1
    while a1 + k * c["step"] < arc[last] - 1e-6:
        ss.append(a1 + k * c["step"])
        k += 1
    ss.append(arc[last])
    pts = []
    for s in ss:
        k = next((k for k in range(len(keys)) if s < keys[k]), len(keys))
        if k == 0:
            q, r = th[0], rads[0]
        elif k == len(keys):
            q, r = th[-1], rads[-1]
        else:
            w = (s - keys[k - 1]) / ((keys[k] - keys[k - 1]) or 1.0)
            q = (1 - w) * th[k - 1] + w * th[k]
            r = (1 - w) * rads[k - 1] + w * rads[k] + (c["lift"] * math.sin(math.pi * w) if k == 1 else 0.0)
        p, t, e = place(s)
        e2 = (t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0])
        m = [math.cos(q) * x + math.sin(q) * y for x, y in zip(e, e2)]
        pts.append(tuple(p_ + v * r for p_, v in zip(p, m)))
        if c.get("exit") and s > arc[i_turn] and pts[-1][0] < c["exit"]["x"]:
            break
    if c.get("exit"):                              # off the lower run, down into the box's opening
        e = [a + b for a, b in zip(c["exit"]["p"], pose)]
        d = c["exit"]["d"]
        via = [tuple(a + b for a, b in zip(v, pose)) for v in c["exit"].get("via", ())]
        last = pts[-1]
        p_out = tuple(a - b * 12.0 for a, b in zip(e, d))
        first = via[0] if via else p_out
        n = max(1, int(math.dist(last, first) / 35.0))    # a gradual descent (eased) to the first via point
        for k in range(1, n + 1):
            f = k / (n + 1)
            e_ = (1 - math.cos(math.pi * f)) / 2
            pts.append((last[0] + (first[0] - last[0]) * f, last[1] + (first[1] - last[1]) * e_,
                        last[2] + (first[2] - last[2]) * e_))
        pts += via
        pts += [p_out, tuple(a - b * 1.0 for a, b in zip(e, d))]   # the sleeve stops at the wall, the wires go in
    if tip is not None:                            # from the router: out of the stub, then straight back
        td = [b - a for a, b in zip(tip, tip2)]
        tl = math.sqrt(sum(v * v for v in td))
        p1 = tuple(t + v / tl * c["lead"] for t, v in zip(tip, td))
        pts = [tuple(tip), p1, (p1[0], pts[0][1], (p1[2] + pts[0][2]) / 2)] + pts
    return pts


# Cable lacing (2026-11-08, docs/PLAN.md "Cable lacing"): the cord and the sleeve laced to the hose with one
# continuous waxed tape where the hose moves - running lock stitches (marline hitches) from a starting stitch next to
# the core's last zip tie, round the U-turn and along the lower run to a closing stitch next to the sleeve's breakout
# (NASA-STD-8739.4A Change 4 9.2.6 / 9.2.8.b / 9.2.10: a stitch right before and after a breakout), then a new run
# with the cord alone to a closing stitch where the hose leaves the table. Stitches no more than Table 9-1's 76.2 mm
# apart (harness over 25.4 mm). Each stitch wraps the bundle's outline (the convex hull of the hose and the cables round
# it) square to the hose; the running part between stitches lies along the outside over the cables, on top of the wraps.
LACING = dict(tape=1.2,            # waxed lacing tape / cord, drawn round at this width (GUESS: ~2.5 mm flat tape)
              pitch=68.0,          # lock stitch spacing along the hose (NASA Table 9-1: <= 76.2 for this harness)
              close=8.0,           # a run's last lock stitch at least this far before its closing stitch (so the
                                   # last gap stays under pitch + close = 76)
              start=15.0,          # first stitch this far past the core's +X end (its last zip tie)
              gap=12.0,            # closing / starting stitch this far either side of the sleeve's breakout
              end=25.0,            # last closing stitch this far before the hose drops off the table (exit_x)
              wraps=(2, 1, 2),     # turns round the bundle: starting stitch, lock stitch, closing stitch
              step=6.0,            # sample spacing of the running part
              tail=150.0,          # tape per starting / closing knot, tails trimmed (NAVSHIPS: ~2.5 x the run in all)
              near=12.0,           # a cable up to this far off the hose (past touching it) is in the bundle (laced
                                   # down with it: the sleeve's lift is 11 mm) ...
              fade=15.0)           # ... and fades out over this much more (the other run's cables are >= 80 mm off)


def lacing(curve, h, runs, dx=0.0, L=LACING):
    """The lacing along the hose: curve = the hose's dense centre line (as cord_route's), h = the hose dict, runs =
    [{"to": "breakout" | "exit", "cables": [{"pts": cable control points (cord_route), "d": diameter}],
    "x": the breakout's x (the sleeve's exit x)}] in order from the core. -> {"runs": [{"s": [stitch arc lengths],
    "pts": the tape's centre line}], "stitches": n, "length": tape to buy (mm, the tape's path + a tail per knot)}.
    Continuous in the pose (a still stretch of hose keeps its lacing still): the core's end and the breakouts are where
    the curve crosses their x, each stitch and running-part point sits at its exact arc (centre and tangent interpolated
    between samples), the outline's polygons are laid out from the cables' side, a cable fades out of the bundle between
    near and near + fade mm off the hose, and the ring starts where the ray to the cables' side leaves the outline."""
    arc = [0.0]
    for i in range(1, len(curve)):
        arc.append(arc[-1] + math.dist(curve[i], curve[i - 1]))
    xe = h["port"][0] + dx + h["core_end_dx"]
    last = len(curve) - 1
    i_turn = 0
    for i in range(1, len(curve)):
        if curve[i][0] > curve[i_turn][0]:
            i_turn = i

    def cut(i, x):                                 # the arc where the segment (i - 1, i) crosses x
        a, b = curve[i - 1][0], curve[i][0]
        f = min(1.0, max(0.0, (x - a) / ((b - a) or 1.0)))
        return arc[i - 1] + f * (arc[i] - arc[i - 1])
    i_end, s_end = i_turn, arc[i_turn]             # the core's +X end: where the upper run passes xe
    for i in range(i_turn):
        if curve[i][0] >= xe:
            i_end, s_end = i, (cut(i, xe) if i > 0 else arc[0])
            break

    def after(x):
        for i in range(i_turn + 1, len(curve)):
            if curve[i][0] < x:
                return cut(i, x)
        return arc[last]
    i_f = max(i_end - 1, 0)
    tans, e1s, e1 = {}, {}, None                   # a frame carried along the hose (as cord_route's)
    for i in range(i_f, len(curve)):
        a, b = curve[max(i - 1, 0)], curve[min(i + 1, last)]
        tn = math.dist(a, b) or 1.0
        t = [(q - p) / tn for p, q in zip(a, b)]
        v = e1 if e1 is not None else (0.0, 0.0, 1.0)
        k = v[0] * t[0] + v[1] * t[1] + v[2] * t[2]
        w = [x - k * y for x, y in zip(v, t)]
        wl = math.hypot(*w)
        e1 = [x / wl for x in w] if wl > 1e-6 else e1
        tans[i], e1s[i] = t, e1

    def frame_at(s):                               # -> (centre, t, e, e2) at arc s (between samples)
        lo, hi = i_f, last
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if arc[mid] <= s:
                lo = mid
            else:
                hi = mid
        f = min(1.0, max(0.0, (s - arc[lo]) / ((arc[hi] - arc[lo]) or 1.0)))
        c = [curve[lo][k] + (curve[hi][k] - curve[lo][k]) * f for k in range(3)]
        t0 = [tans[lo][k] + (tans[hi][k] - tans[lo][k]) * f for k in range(3)]
        tl = math.hypot(*t0) or 1.0
        t = [x / tl for x in t0]
        v = [e1s[lo][k] + (e1s[hi][k] - e1s[lo][k]) * f for k in range(3)]
        kk = v[0] * t[0] + v[1] * t[1] + v[2] * t[2]
        w = [x - kk * y for x, y in zip(v, t)]
        wl = math.hypot(*w) or 1.0
        e = [x / wl for x in w]
        return c, t, e, [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]]

    def section(s, cables):                        # -> (hull [(u, v)] CCW in the frame, the cables' side (u, v), frame)
        fr = frame_at(s)
        c, t, e, e2 = fr
        R = h["od"] / 2 + L["tape"] / 2
        found, su, sv = [], 0.0, 0.0
        for cp, d in cables:                       # where the cable crosses the hose's normal plane, if on the hose
            best = None
            for j in range(len(cp) - 1):
                da, db = 0.0, 0.0
                for k in range(3):
                    da += (cp[j][k] - c[k]) * t[k]
                    db += (cp[j + 1][k] - c[k]) * t[k]
                if da * db > 0 or da == db:
                    continue
                f = da / (da - db)
                q = [cp[j][k] + f * (cp[j + 1][k] - cp[j][k]) - c[k] for k in range(3)]
                dq = math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2])
                if best is None or dq < best[0]:
                    best = (dq, q)
            # on the bundle: all of it to `near` mm out (a cable lifting off the hose is laced down with it), fading out
            # over `fade` (the other run's cables, 80 mm and more away, never count); a fading cable slides into the hose
            wt = 0.0 if best is None else 1 - min(1.0, max(0.0, (best[0] - (h["od"] / 2 + d + L["near"])) / L["fade"]))
            if wt <= 0:
                continue
            q = best[1]
            u = (q[0] * e[0] + q[1] * e[1] + q[2] * e[2]) * wt
            v = (q[0] * e2[0] + q[1] * e2[1] + q[2] * e2[2]) * wt
            su, sv = su + u, sv + v
            found.append((u, v, d / 2 + L["tape"] / 2))
        sl = math.hypot(su, sv)
        side = (su / sl, sv / sl) if sl > 1e-9 else (1.0, 0.0)
        a0 = math.atan2(side[1], side[0])
        pts = [(R * math.cos(a0 + 2 * math.pi * (k + 0.5) / 48), R * math.sin(a0 + 2 * math.pi * (k + 0.5) / 48)) for k in range(48)]
        for u, v, r in found:                      # the hose's and each cable's circle, laid out from the cables' side
            # (half a step off it: no vertex on the ray to it, where a rounding would pick the edge)
            pts += [(u + r * math.cos(a0 + 2 * math.pi * (k + 0.5) / 16), v + r * math.sin(a0 + 2 * math.pi * (k + 0.5) / 16)) for k in range(16)]
        pts.sort()                                 # convex hull (monotone chain), CCW
        hull = []
        for part in (pts, pts[::-1]):
            low = []
            for p in part:
                while len(low) >= 2 and ((low[-1][0] - low[-2][0]) * (p[1] - low[-2][1]) -
                                         (low[-1][1] - low[-2][1]) * (p[0] - low[-2][0])) <= 0:
                    low.pop()
                low.append(p)
            hull += low[:-1]
        return hull, side, fr

    def world(fr, uv, along):
        c, t, e, e2 = fr
        return tuple(c[k] + uv[0] * e[k] + uv[1] * e2[k] + along * t[k] for k in range(3))

    def top(hull, side):                           # where the ray from the hose's centre to the cables' side leaves the
        for j in range(len(hull)):                 # outline: (the edge it crosses, the point)
            a, b = hull[j], hull[(j + 1) % len(hull)]
            ca, cb = a[0] * side[1] - a[1] * side[0], b[0] * side[1] - b[1] * side[0]
            if ca < 0 or cb >= 0:                  # (CCW: a on the ray or right of it, b left)
                continue
            f = ca / (ca - cb)
            p = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
            if p[0] * side[0] + p[1] * side[1] > 0:
                return j, p
        return 0, hull[0]
    out, total, n_st = [], 0.0, 0
    s_from = s_end + L["start"]
    for r in runs:
        s_to = after(r["x"]) - L["gap"] if r["to"] == "breakout" else after(h["exit_x"]) - L["end"]
        if s_to <= s_from:
            break
        ss = [s_from]
        while ss[-1] + L["pitch"] <= s_to - L["close"]:
            ss.append(ss[-1] + L["pitch"])
        ss.append(s_to)
        cab = [(catmull_rom(c["pts"], 4), c["d"]) for c in r["cables"]]
        pts = []
        for k, s in enumerate(ss):
            turns = L["wraps"][0] if k == 0 else L["wraps"][2] if k == len(ss) - 1 else L["wraps"][1]
            hull, side, fr = section(s, cab)
            j0, p0 = top(hull, side)
            ring = [p0] + hull[j0 + 1:] + hull[:j0 + 1]
            adv = L["tape"] * 1.1                  # each turn sits beside the last along the hose
            a0 = -adv * turns / 2
            for m in range(turns):
                for j, uv in enumerate(ring):
                    pts.append(world(fr, uv, a0 + adv * (m + j / len(ring))))
            pts.append(world(fr, ring[0], a0 + adv * turns))
            if k == len(ss) - 1:
                break
            nxt = L["wraps"][2] if k + 1 == len(ss) - 1 else L["wraps"][1]
            s_ = s + adv * turns / 2 + L["step"]  # the running part, over the cables to the next stitch
            while s_ < ss[k + 1] - adv * nxt / 2:
                hull, side, fr = section(s_, cab)
                p = top(hull, side)[1]
                pts.append(world(fr, (p[0] + side[0] * L["tape"], p[1] + side[1] * L["tape"]), 0.0))
                s_ += L["step"]
        out.append(dict(s=ss, pts=pts))
        total += sum(math.dist(a, b) for a, b in zip(pts, pts[1:])) + 2 * L["tail"]
        n_st += len(ss)
        s_from = after(r["x"]) + L["gap"] if r["to"] == "breakout" else s_to
    return dict(runs=out, stitches=n_st, length=total)
