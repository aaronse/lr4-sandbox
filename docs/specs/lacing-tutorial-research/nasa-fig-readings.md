# NASA-STD-8739.4A Figs 9-3, 9-4, 9-5: what the drawings show (read 2026-11-09)

The readings moved to media-mesh's knot catalog on 2026-11-12, where other projects can use them:
- Fig. 9-5 / 9-3's running lockstitch, readings A and B, the cut claim and its sources: `media-mesh/knots/lockstitch.md`.
- Fig. 9-3's closing stitch (strand trace, spacing) and Fig. 9-4's alternate: `media-mesh/knots/closing-stitch.md`.
- The half hitch the tutorial drew by mistake: `media-mesh/knots/half-hitch.md`.
- Every source's quotes (NASA, NASA workmanship 2002, NAVSHIPS 900171, NEETS, Navy 14160, Wikipedia, IGKT):
  `media-mesh/knots/sources.md`.

What stays here is the tutorial's own history and where its research files are.

## What the video drew before draft 9 (a half hitch)

At the tuck, NASA's end goes **over** the standing part S and then **under** the turn's start. Drafts 3-8 had the
opposite at both crossings, and their centre line (the real `hitchPath`, run on a straight 12 mm bundle) slid off as the
**unknot**: knot determinant 1 for lam 1 and 1.45, every view and closing. The tutorial's code then
(`web\js\lacing_tutorial.js` 414-441; spec `docs\specs\lacing-tutorial.md` 132-136):
1. S comes along the cables' side (th 0) from a = -60 to +4.
2. The turn goes from a = +4 to -4, th 0 to 2 pi.
3. At a = -4 the turn ends at radius `rc = rS(-g) - 2*tr`: **under S**.
4. The end steps 9 mm aside (th + 9/R0), runs forward, and is lifted by `over` (2*tr) at a = +g: **over the turn's start**.
5. Slid off: the unknot.

The fix flipped both crossings (at a = -g, `rc = rS(-g) + 2*tr`, over S; a dip under the turn's start): determinant 3.
The closing lock-off `knots.marline` in `docs\specs\lacing-tutorial.shots.json` had the same fault then (one tuck, under
the turn's start, never crossing S). The step proposals P1 (lockstitch) and P2 (closing stitch) are now in the catalog:
P1 as `knots/catalog.test.js` `lockSteps`, P2 in `closing-stitch.md`.

## Files (git-ignored, `.cache/lacing-tutorial/research/`)

**Crops** (`dl\`):
- Fig. 9-3: `f93_native.png` (the native image, PDF xref 420), `f93_zoom_closing.png`, `f93_z_left.png` (half hitch 1 +
  tie-off end, 4x), `f93_z_right.png` (last lockstitch + bight, 3.5x), `f93_zoom_running.png`, `f93_z_lockstitch.png`
  (Fig. 9-3's running lockstitch, the clearest view, 6x)
- Fig. 9-4: `f94_native.png`, `f94_zoom.png`
- Fig. 9-5: `f95_native.png` (PDF xref 419), `f95_600dpi.png`, `f95_zoom.png`, `f95_z_lower.png` (5x), `f95_z_upper.png` (6x)
- NASA workmanship 2002 (`dl3\`): `wm_running_stitch.png`, `wm_stitch_mid.png`, `wm_stitch_end.png`
- NAVSHIPS 900171 (`dl2\`): `navships.pdf`, `nav.txt` (its text; the lacing section is PDF page 8, p. 9-103)

**Scripts** (`scripts\`):
- `extract_figs.py`, `zoom.py`: the crops.
- `hitch_knot.py`: the four over/under variants of the old geometry, plus the knot-determinant routine (ported as
  media-mesh `lib/knotdet.js`).
- `ours.js` + `ours_det.py`: the old `hitchPath`.
- `nasa_options.py`: readings A and B.
- `marline_steps.py`, `closing_steps.py`: the step proposals.
