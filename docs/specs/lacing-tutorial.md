# Cable-lacing tutorial animation

A teaching video (draft 11: 135.47 s, 4,064 frames at 30 fps) that shows how to lace the router cord and the cable sleeve to the vacuum hose,
voiced in the maintainer's cloned voice. It is drawn in the page's own three.js scene from the lacing the model already
makes (`LR4Hose.lacing`, the twin of `freecad/lr4.py` `lacing`), with the knots and the lock stitch taught in enlarged close-ups, and
recorded to MP4 by the page's video director. The procedure is the `tutorial-animation` skill; the rules are the practice
`azab2c-private/practices/tutorial-animations.md` (v0.2, §9-11 for teaching videos). The deviations are listed at the end.

| File | What |
|---|---|
| `docs/specs/lacing-tutorial.storyboard.json` | the storyboard (`"kind": "video"`, each scene's measured `audioS`); `node ../media-anim/pipeline/storyboard.ts` gates it |
| `docs/specs/lacing-tutorial.transcript.json` | the timestamped, indexed transcript: times, caption, spoken line, numbers with their code source, sources (generated) |
| `web/js/lacing_tutorial.js` | `LR4LacingTut`, pure: storyboard copy, `spoken`, `timing`, `sceneAt`, `plan`, `hitchPath`, `drawAt`, `poseAt`, `dipAt`, `cameraAt`, `frameAt(t)` |
| `web/js/page/lacing_anim.js` | `LR4LacingAnim`: builds the meshes once, applies `frameAt(t)`; `index.html?anim=lacing` exposes `window.__anim` |
| `web/js/page/director.js`, `web/js/demo_script.js` | `(Video Lacing:)`: the tutorial as a video's intro |
| `tools/lacing_voice.js` | `tts` (media-gen, measured wavs -> `audioS`), `sync`, `transcript`, `mux` (each wav at its scene's start), `scenes` (the changed-scene diff), `brief` |
| `docs/examples/lacing_tutorial.gcode` | the video's script (no moves) |
| `tests/test_lacing_tutorial.js` | the pure parts: storyboard = JSON, spoken rule, timing, plan, hitch, frame by frame, the stills rules as numbers, transcript current |

## Agent quickstart

For an agent asked to change a scene, knot, callout or timing. Read this section, the facade's header map
(`web/js/lacing_tutorial.js`, lines 1-34: "to change X, edit Y, test with Z") and the section below for your kind of
change: "Where the events come from", "Clearance" or "Shots and knots as data". Skip the rest of this file. Don't read
`lacing-tutorial.history.md` (the drafts' record), the generated files (`web/js/lacing/data.js`,
`lacing-tutorial.transcript.json`, `lacing-tutorial.sidebar.json`) or the whole test file: `--list` names its sections,
and you grep for the one you need. Knot and stitch words: media-mesh `lib/knot-terms.md` (lockstitch, turn, tuck, half hitch
against overhand, running end, tip, tie-off end, offcut). What the tutorial draws for them: the running end's last 15 mm in green
(`Lacing_Tutorial_end`; `endSeg`, "light end" in code comments) and a ball on its tip (`Lacing_Tutorial_tip`; `tip`,
`tipAt`); a trimmed end's falling piece is the offcut (`offcuts`), what stays on the knot the stub.

The video's retention and pacing rules are azab2c-private `practices/youtube-videos.md`: the opening (OP-1 to OP-3:
the problem by 7 s, "Cable lacing" by 10 s; `--only opening` pins both), heard gaps between lines over 0.5 s listed
(PC-3), the voice disclosed when published (PB-1). A voice or timing change runs its checklist.

| you change | then run | s |
|---|---|---|
| storyboard words, holds, callouts (`lacing-tutorial.storyboard.json`) | `node tools/lacing_voice.js sync`, then `transcript`; `node tests/test_lacing_tutorial.js --only storyboard,callouts,events,transcript,stills` | 4 |
| a camera, layer, blade cut (`lacing-tutorial.shots.json`) | `sync`; `--only shots,frames,framing,events,blade,stills` | 5 |
| a knot's steps (`shots.json` `knots`) | `sync`; `--only knotgen,closing,tape,story,stills`; `--only clearance` once the knot looks right | 3; 7 |
| any of the three above, to check it and see it in one go (R8) | `sync`, then `node tools/lacing_voice.js iterate [--shots <copy>]`: the changed scenes, the three rows' test sections (on `data.js`, not a `--shots` copy), its own server, render, the changed-scenes clip and contact sheet (`.exports/lacing_drafts/iterate_<stamp>_clip.mp4`, `_sheet.jpg`), a timelog line; stops at the first failing step, one summary block | 12 nothing changed; 63 one camera key |
| anything a stills round would look at (a callout's dot or card, a knot's size, the action in frame or hidden, the cue) | `--only stills` (the stills rules as numbers, every frame, no browser: "f-h. Checks") | 2.6 |
| code, meant to change no frame | `node tools/lacing_voice.js scenes check` (prints `same:`; media-anim `pipeline/golden.ts`) | 7 |
| media-anim / media-mesh `lib/` | `node --test lib/*.test.js` there; `node tools/sync_media.js` here; then the row above | 1 + the row |
| anything, to see what moved | `node tools/lacing_voice.js scenes` (a line a scene: changed frames, first / last t, max diff, or `identical`) | 8 |
| a draft the maintainer accepted | `node tools/lacing_voice.js scenes accept` (the baseline: `.cache/lacing-tutorial/golden/accepted.json.gz`) | 8 |
| anything, to watch it | `python tools/serve.py sandbox --no-open --port=<p>` (`--port <p>` is ignored: 8767) (a shots copy: `LR4_SHOTS_FILE=<copy>`), then `node tools/lacing_voice.js clip <out.mp4> --url http://127.0.0.1:<p>/web/index.html?anim=lacing [--shots <copy>]` (the changed scenes, 1 s either side, with sound; cache misses rendered) | 7 + 0.1 a changed frame |
| one or two scenes, to see them move (a review of a scene, or part of one: render the scene) | `scenes diff` and `brief` end with a `see just these: ... render <out> --scenes a,b` line: run it with a server up (row above; `--dry-run` first: hit or miss). Picture only, ~20 s + 0.13 s a frame (the goal: 112 s); each segment is cached by the scene's key, so the full render reuses it. The diff also lists other sessions' edits: `scenes write .cache/lacing-tutorial/<task>/before.json.gz` before you change, `scenes diff --against` it after. `clip`: with sound; `render` without `--scenes`: only the full video | 112 the goal |
| a still to look at | `node tools/lacing_voice.js still <t...> --out <dir>` (from the cached segments, no browser; a contact sheet) | 6 |
| the V1E part files (a new download, or media-mesh `tools/reduce.mjs`) | `node tools/lacing_voice.js parts` (the reduced set and its report; renders then load it), then the render you need | 8.3 |
| before handing back | `node tests/run_tests.js`, once (6 at a time, the lacing file split by section; `npm test` is upstream's one-at-a-time run.js) | 17 |

Seconds measured 2026-11-09 with other sessions on the machine; each section prints its own. Resumed after a compaction:
`node tools/lacing_voice.js brief` (8 s) prints the changed scenes, each with its storyboard entry and shots rows, and
this table; read that in place of the modules. The voice
(`lacing_voice.js tts`) runs on the GPU and loads its model for 13 s: run it once, with `--only <ids>` for the lines you changed;
in a session that voices several times, `tts --keep` keeps the model warm (20 s for 5 lines against 41 s; it exits after 15 min unused,
or `node ../media-anim/audio/tts.ts --stop` before another NVIDIA GPU job). Stills are for the owner, at the end, one browser at a time:
`node ../media-anim/pipeline/safety.ts browsers` must exit 0 first. Check a camera with `framing` and `stills`
numbers, not screenshot rounds. Log your stage in `lacing-tutorial.timelog.jsonl` (`timelog.mjs start` / `end`).

### Where the events come from (read this before editing draft N+1)

`docs/specs/lacing-tutorial.transcript.json` is the movie-script view: each scene's `events: [{ at_rel, t, kind, what }]`
(`at_rel` = share of the scene, `t` = s into the video), generated by `node tools/lacing_voice.js transcript` from
`LR4LacingTut.eventsOf`, which reads the same data the picture does. Change the source, run `sync` (shots or storyboard)
and `transcript`; never edit the transcript.

| kind | what changes it | file and key |
|---|---|---|
| voice | a line's words, its place in the scene, its length | `docs/specs/lacing-tutorial.storyboard.json` scene `narration` / `holdS`, a later line in `more: [{ id, narration, gapS }]`; `audioS` is measured by `lacing_voice.js tts [--only id]` |
| camera | a key's time, focus, az / el, fit / dist / fitFocus, ease | `docs/specs/lacing-tutorial.shots.json` `scenes.<id>.camera` (`clock`: share / work / s, `time`, `path`, `keys[].x`); the move between scenes: `scenes.<id>.lead`, `defaults.lead` (or the tweak panel) |
| layer | an opacity set or reached | `shots.json` `scenes.<id>.layers.<layer>`: a number, or `[[s, value, ease]]` keys (s into the scene); defaults `defaults.layers` |
| knot | a knot's phases | clove / closing: `shots.json` `knots.clove` steps / `knots.closing` sequence (one phase a macro, its steps' phases as its `parts`; a trim at its blade cut; `until`, `from`, `what`, `draw`, each `pull`'s `from` / `to`; the closing sequence's work runs over its `scenes`: close 0-1, seal 1-2, tie 2-3); the square knot: `SQ` in `web/js/lacing_tutorial.js`; the lock stitch's close-ups: `TIGHT`, `HITCH` there |
| draw | the tape drawn on (start, lock, uturn) | the scene's work (its voice + hold, `SETTLE`); which stitches: `drawOf`, `lockK` in `lacing_tutorial.js` |
| pose | the core's travel: the opening's legs (d12), the finale's out and back | the opening: `OPENING` (legS, dwellS, parkS), `travelOf` in `web/js/lacing/opening.js`; the finale: `MOVE_DX`, `poseOf` in `lacing/draw.js` |
| reveal | the lacing's flash and the loose cables drawn in (d12) | the goal's `reveal: { line, word, wordS }` in the storyboard (wordS measured in that line's wav: `node tools/lacing_words.js`), read by `timing()` as `tm.hit`; the draw-in: `OPENING.drawIn`; the flash: media-anim `REVEAL` |
| cut | when the blade cuts which end | `shots.json` `blade.cuts.<scene>: [{ w, end }]` (w = the scene's work) |
| sfx | the swipe's wav start | each cut less `blade.sfxLead` (`sfxAt`); the sound itself: `lacing_voice.js sfx` |

Knot and draw phases are in the scene's work w (from the camera's arrival to `SETTLE` before the scene ends), so they move
when a voice line or a hold changes the scene's length. `tests/test_lacing_tutorial.js` checks each event against the
picture at its t: the camera on its key, the layer at its value, the work at the phase's w, the blade drawn at a cut,
`sfxAt`, the voice's lines.

## a. Brief

- **Goal:** lace the router cord and the cable sleeve to the vacuum hose: a starting stitch, lock stitches no more than
  76 mm apart, a closing stitch before the sleeve's breakout. The page's `Vacuum_Hose`, `Router_Cord_Run` and
  `Cable_Sleeve` are hidden while it shows: it draws its own (`Lacing_Tutorial_hose` / `_cord` / `_sleeve`, the rig in
  `js/page/lacing_anim.js`) from `js/hose_route.js`, frozen at page 0.66.2's routes (fork, 2026-11-12: upstream's page
  hangs them as ropes, and dropped the page's `Cable_Lacing`).
- **Audience:** someone building an LR4 who has the hose, cord and sleeve in place on the machine and has not laced
  cables before.
- **Surface:** a teaching video with a voice-over (the page's director, `(Video Lacing:)`, then
  `tools/lacing_voice.js mux`), and the check page `index.html?anim=lacing`. Not an in-app empty state: the page has no
  empty state for it (see the checklist, §4).
- **Personality:** `tutorial`: transform, opacity and attribute values only; durations from the tokens quick 150 ms,
  standard 300 ms, slow 600 ms; no filters or blur.
- **Dimension:** 3D. The task happens in space (round a hose that folds back under itself) and the page already draws the
  hose, cord and sleeve from measured geometry, so the tutorial is drawn in that scene, not as SVG.

### Survey (how lacing is taught)

| Source | Start | Running stitches | End | Spacing |
|---|---|---|---|---|
| NASA-STD-8739.4A (Change 4) §9.2, pp. 34-37 | §9.2.4 starting stitch = a spot tie with a running end; §9.2.5 spot tie = clove hitch + square knot (Fig. 9-2) | §9.2.7 running lockstitches (Fig. 9-5: the end over its standing part, then under the turn, read from the figure) | §9.2.6 closing stitch at every major breakout (Fig. 9-3: lockstitch + two half hitches, one tie-off end); §9.2.8.b a stitch before and after a breakout; §9.2.10 start anew past it | Table 9-1: max 76.2 mm for a bundle over 25.4 mm |
| NAVSHIPS lacing section | starting knot | lock stitch, "over and under", so a cut stitch does not unravel the lace | closing knot | cord about 2.5x the run for thin bundles |
| WireCare marline hitch guide | a locked clove hitch | marline hitches, the tape kept flat | extra turns + a square knot (not NASA's: draft 9 follows Fig. 9-3) | by bundle size |

The model follows NASA's numbers: `LR4Hose.LACING` pitch 68 mm (under 76.2), a starting stitch of 2 wraps, lock stitches
of 1 wrap, a closing stitch of 2 wraps 12 mm before the breakout.

## b. Storyboard

`node ../media-anim/pipeline/storyboard.ts docs/specs/lacing-tutorial.storyboard.json` (exit 0). A teaching video
(`"kind": "video"`: scenes 3-30 s, no loop limit). Each scene lasts its voice-over's measured wav (`audioS`, ffprobe) plus
its hold; 150 words a minute was only the estimate before the audio existed. Captions give inches after mm; the voice
says only the metric figure: `spoken()` strips the parenthesised conversion (the same regex as media-anim's, tested on
its cases).

| id | purpose | start s | dur s | audio s | hold s | cue | spoken |
|---|---|---|---|---|---|---|---|
| goal | preview-goal | 0.00 | 23.77 | 5.16 (+ 4.88, 5.64, 6.04 in its hold) | 18.61 (lead 0.5) | Lace the cables to the hose | A LowRider's router cord and sleeved wiring ride the gantry with the core. / Left loose, they flap, snag and chafe, and can yank a plug mid-cut. / The fix? Cable lacing: the method NASA specifies for its mission hardware. / (goal_why) (d12: the lacing flashes in on "Cable lacing", 12.21 s) |
| start | step | 6.40 | 7.60 | (6.80 est.) | 0.8 | Start by the last zip tie | Start beside the core's last zip tie, with a spot tie round the hose and both cables. |
| clove | step | 14.00 | 8.80 | (7.20 est.) | 1.6 | Clove hitch: two crossed turns | Two turns, the second crossing over the first, with both ends tucked under the cross: a clove hitch. |
| square | step | 22.80 | 9.20 | (7.20 est.) | 2 | Right over left, left over right | Square knot: right end over left and under, then left over right; pull tight, trim the short end. |
| wrap | step | 32.00 | 6.44 | 5.64 | 0.8 | Wrap once, loosely | Each lock stitch starts with one loose turn of tape round the hose and both cables. |
| tuck | step | 38.44 | 6.44 | 5.64 | 0.8 | Tuck the end under itself | Pass the end under its own standing part. That crossing is the lock. |
| tight | step | 44.88 | 5.44 | 3.84 | 1.6 | Pull it tight | Pull the end along the hose, and the loop closes down onto the bundle. |
| lock | step | 50.32 | 13.30 | 6.84 | 6.46 | Lock stitch every 68 mm (2.7") | Repeat along the hose: one lock stitch every 68 millimetres, round the U-turn and back. |
| spacing | pitfall | 63.62 | 6.72 | 5.52 | 1.2 | Never over 76 mm (3") apart | Never leave more than 76 millimetres between stitches, or the cables sag away from the hose. |
| close | step | 70.34 | 6.52 | 5.72 | 0.8 | Two turns to close | Close with two turns and a knot, just before the sleeve leaves the hose. |
| seal | step | 76.86 | 7.60 | (6.00 est.) | 1.6 | Lock them with a marline hitch | Lock the two turns with a marline hitch: the end passes under its own turn. |
| tie | step | 84.46 | 8.40 | (6.40 est.) | 2 | Square knot again, trim both ends | Finish with a square knot, right over left then left over right, and trim both ends. |
| done | confirm | 92.86 | 14.80 | 5.80 | 9 | One bundle, moving together | Now, as the core moves, the cord and sleeve follow the hose as one bundle. |

Total 107.66 s; still 93.46 s (the confirm scene's start + slow). Draft 4 re-timed only holds and the two square-knot
lines (still unvoiced): the lock run's hold 3.8 -> 6.46 s (10.64 -> 13.30 s, 25% slower, its wav kept), the finale's 3 ->
9 s (8.8 -> 14.8 s), square / seal / tie 1.2 / 1.2 / 1.6 -> 2.0 / 1.6 / 2.0 s for their phases. **Draft 3: TTS deferred** (the maintainer: no new voice
until the picture is locked): the five scenes with new words (start, clove, square, seal, tie) have no `audioS` and are
timed at 150 words a minute + their hold ("est." above); they play silent, the caption carrying them (`timing().voiced`
false: the live preview loads no wav for them, `lacing_voice.js mux` skips them). The other eight keep their measured
wavs. Re-voice those five once the maintainer approves the visuals. The lock run's hold is long on purpose: its drawing
runs 11.9 s for 8 stitches in draft 4 (draft 3: 9.24 s; draft 1: 3.8 s), about 1.5 s a stitch. Draft 1's
order put the pitfall after "close"; it now follows the lock run it is about.

### Voice-over

`node tools/lacing_voice.js tts`: checks `nvidia-smi` says the power limit is 300 W, writes `exports/lacing_voice/jobs.jsonl`
(git-ignored: the record of what was said), runs media-gen `scripts/voice/say.py --batch` with
`voices/aza` (media-gen's name for the owner's current voice; `voices/aza/README.md`) in `envs/tts` (one model load; contract: media-gen `docs/tts-worker.md`), stops the
workers (`--stop-workers`) before anything renders (`--keep [--idle 900]`: left warm for the next `tts`, R4), measures each wav with ffprobe and writes `audioS` into the
storyboard JSON and its copy in `lacing_tutorial.js`. `node tools/lacing_voice.js mux <silent.mp4> <out.mp4>` places each
wav at its scene's start. **The voice is a synthetic clone of the maintainer, made with his consent** (media-gen `voices/aza/PROVENANCE.md`):
anything published carries its disclosure line (the credits' Voice row says it; add it to a video's description too).
Draft 18 (2026-11-12) re-voiced every line in aza v2; the holds it moved are in the history's "Draft 18".

## c. Plan (mm, the model's frame: X along the beam, Y along the table, Z up)

The plan is `LR4LacingTut.plan(dense, lace, LACING, { cord, sleeve })`, made once when the tutorial turns on, at the build pose
(dx = dy = dz = 0; the page is moved there while the tutorial shows):

- `dense` = the hose's centre line as the rig's `rigSweep` makes it (`LR4Hose.hoseRoute(meta.hose, 0, 0)` through a
  centripetal Catmull-Rom, 12 points a span); `lace` = `laceAt(dense, cordRoute(cord), cordRoute(sleeve), 0)`, the
  same call the finale's `Lacing_Tutorial_real` is swept from. Only run 0 is drawn: the cord + sleeve from the starting stitch to the closing stitch.
- Each tape point's place along the hose: projected onto the centre line, walked forward from the first stitch.
- A stitch = the tape points within its wraps' width (1.32 mm a turn) + 2 mm of the centre-line sample `lacing` wrapped it
  round. `f0`, `f1` = where the stitch starts and ends as a fraction of the tape's length.
- The pitfall's bracket: on the bundle between lock stitches 7 and 8 (68 mm; the lock run ends there, so the camera
  keeps its angle), along the side facing the lock run's camera: at each end the bundle's extent that way (the stitch's
  own ring) + the tape's thickness, a 6 mm tick out from the bundle at each stitch.
- The close-ups (`details`): one stitch with a short length of hose, cord, sleeve and tape round it, each cable's longest
  run of points whose nearest hose arc is in range (and within 110 mm of the centre line). Lock: stitch 6, s 816 - 936
  mm (120 mm; both cables on the hose and clear of the U-turn). Close: stitch 9, s 985 - 1100 mm (115 mm, the sleeve
  leaving the hose). Each has the bundle's outline from the stitch's own tape ring (radius by angle, 5 degree bins) and a
  frame: `u` = the cables' side (its widest point), `v` = t x u.
- The lock stitch in detail (`hitchPath(D, lam, e)`, a marline hitch, draft 9: NASA-STD-8739.4A Fig. 9-5): the standing
  part comes along the cables' side from 60 mm back; at +4 mm it turns once round the bundle, drifting back 8 mm along
  the hose, and its end crosses **over** the standing part at -4 mm (2 x the tube radius above it: the lock's crossing,
  the tuck's focus); the end steps 9 mm aside and runs on **under** the turn's start (the end dips 2 tube radii there, no
  lower than the outline + a tube radius, and the turn's start rises one radius over it) and 12 - 58 mm towards the next
  stitch. Slid off a straight bundle it is an overhand knot: knot determinant 3 at lam 1 and 1.45, in 4 views x 3
  closings (draft 3-8's crossings, under then over, gave 1: a half hitch). `lam` = how loose (1.45 x the outline's radius loose, 1 snug), `e` = how far the
  end is pulled. The frame follows the hose's bend. Drawn as a 2 mm round tube (the tape: 1.2 mm thick, ~2.5 wide).

Model note: at stitches 0-2 the sleeve hovers 51-56 mm from the hose's centre (on the hose it is 41): `cordRoute`'s
`lift` (11 mm over the sleeve's first 160 mm). Until draft 3 `lacing()` left it out there (the tape passed under it);
since draft 3 a cable up to `LACING.near` (12 mm) past touching the hose is in the bundle, fading out over `fade` (15 mm),
so the tape goes over the lifted sleeve. The lock close-up still uses stitch 6.

At the reference hose (`web/data/lr4_config.json`, 26 x 50 in): 10 stitches, tape 3307 mm (run 0's path; 3234 before draft 3's lacing fix).

| Stitch | s along hose mm | wraps | centre (x, y, z) | where |
|---|---|---|---|---|
| 0 start | 468.1 | 2 | 597, 728, 293 | upper run, 15 mm past the core's +X end |
| 1-2 lock | 536.1, 604.1 | 1 | 665, 737, 292 / 732, 748, 293 | upper run |
| 3-4 lock | 672.1, 740.1 | 1 | 794, 756, 277 / 800, 782, 219 | the U-turn |
| 5-8 lock | 808.1 - 1012.1 | 1 | 742 - 538, 793, 194 | lower run (6: the close-up; 7-8: the bracket's pair) |
| 9 close | 1045.0 | 2 | 505, 793, 194 | 12 mm before the sleeve's breakout |

The knots in detail (draft 3; `KNOT`, `cloveCps`, `knotCps`, `sealCps`, `knotAt`): strands of control points [a mm along
the hose from the stitch, w mm round the bundle on its surface, h layers of tape under it], through a centripetal
Catmull-Rom, laid on the close-up's outline (`rho` x how loose + a tube radius a layer). The start close-up (stitch 0,
s 423 - 528 mm) and the close one carry them 32 mm round from the cables' side (`KNOT.w0`), on the bare hose where they
read:
- **Clove hitch** (scene clove): the short end comes in under the cross, a turn at -7 mm, the cross over the top (layer 1)
  to +7 mm, a second turn, the end out under the cross the other way; drawn on loose (1.35 x the outline), pulled snug.
- **Square knot** (square; draft 5, `REEF`, `reefFlat`): the generic textbook square (reef) knot - two U-bights
  interlocked, each end leaving beside its own standing part, both standing parts on one side and both ends on the other
  (a thief knot has the ends on opposite sides). Units: L's standing part in from the left at y -0.45, its bight round
  (1, 0) radius 1, its end back out to the left at y +0.45; R is L mirrored. Six crossings, under and over in turn along
  each strand; the working end R goes under L's bight first, then over L's standing part on the knot's middle (right
  over left). Laid flat on the cables' side (w 0) on top of the tape under it (1.6 layers, 0.5 a bump = one tape's
  thickness between the strands at a crossing), the standing parts towards the clove (+w);
  4.0 mm a unit while tied, 2.4 pulled snug (a bight's legs then a tape's width apart). The start's short end is
  trimmed to 3 mm, its long end runs on to the next stitch. (Draft 3-8 tied a second square knot at the close, with a
  spare end; draft 9's closing sequence has neither.) Its geometry is the
  generic reef knot: NASA-STD-8739.4A §9.2.5 names it and Fig. 9-2 B draws it with the clove hitch, too small to trace,
  so its shape is not cited.
- **Closing sequence** (close, seal, tie; draft 9, `knots.closing`; NASA-STD-8739.4A Fig. 9-3, "lockstitch plus two half
  hitches"): one strand from the close-up's own tape, clipped where it first reaches a = -50 mm (`tapeTo`: between stitch
  7 and stitch 8). Written as macros (`knots.closing.sequence`, expanded by media-mesh `rope.expand`; see "The closing
  stitch as macros" below). It ties lockstitch 8, at -33.5, the last lockstitch's shape, shown tied from the close's
  first frame and pulled snug over its first 0.7 s (2026-11-10: drafts 9-12 clipped at -30, so the close-ups showed stitch 8 as the model's plain turn;
  every later step's w is a lap on: "2C" is on H past it). Its steps are `context: true`: the page draws that stretch
  (`ctx` mm of strand 0) as its own tube at the context layer's opacity, faded in the seal and tie as the model's tape
  was, so the eye stays on the knot being tied. Each pull ends tight (`tighten`, media-mesh `rope.js`: Pieranski's SONO,
  the slack taken until tape lies on tape and on the bundle, its topology checked - 9 after the close, 81 after the tie;
  1.3 s a pull once, 19 ms a frame part way). One pull per stitch: each pull moves only its own macro's steps (+ 5 mm),
  and a pulled stitch holds (lockstitch 8 moves 0 mm after its pull; lockstitch 9's turn and tuck 0.76 mm, lifted where
  a half hitch passes under H). The strand 924 -> 915 (lockstitch 8) -> 736 (lockstitch 9) -> 671 mm (the half hitches). H, the tape along the bundle, runs to the last lockstitch at 0 (the lock
  stitch's crossings: over H at -4, under the turn's start at about +1.5, 6.5 mm round); the turn is loose (22 mm out)
  and pulled snug in the close. Then a bight rises past the stitch, crosses over its turn and comes back down at -6;
  half hitch 1 (tied first) round H at -12 and half hitch 2 at -22, each down over H, round under it and up over its own leg, out
  through its loop (draft 12: drawn open in the seal - the loop 22 mm round, not 12, its down leg 5 mm loose, the tuck
  7 mm above H - 1.8 s a hitch with the camera on it; the tie's pull draws each loop closed onto H through the steps'
  `snug` points, the round and the tuck 6 mm along from the leg so knotGen's lifts don't stack). Drafts 9-12 tucked
  under the leg: beneath the loop, a turn that pulls out, no knot (2026-11-10, `.cache/lacing-tutorial/halfhitch/REPORT.md`).
  A half hitch round the tape's own standing part is an overhand knot in the tape. The one tie-off end leaves half hitch 2 and is pulled snug and trimmed 3 mm past its start
  in the tie (`blade.cuts.tie`: `end: "tie-off"`, the step that names it). The figure's spacing (1.2 D and 2.2 D back
  from the stitch) is 12 and 22 mm here: 0.1 x, the same ratio, so both hitches fit the 60 mm close-up. The machine view
  keeps the model's two closing turns (`LR4Hose.LACING` is unchanged).
- The lock stitch's and the closing sequence's crossings are read from NASA-STD-8739.4A Figs. 9-3 and 9-5 (the text gives
  no steps). The clove hitch and the square knot are drawn by the tutorial, not traced.

Pinned by tests: `tests/test_lacing_tutorial.js` builds the plan from the same `LR4Hose` calls on the reference hose
and checks that each stitch is found, the spacing is 68 mm and at most 76.2 mm (`MAX_GAP`), the stitches tile the tape in
order, the bracket lies on the bundle, the close-ups hold 90 - 150 mm of hose with both cables on it, and the hitch's end
passes over its standing part loose and pulled, snug when pulled, and slides off as an overhand knot (determinant 3, a JS
port of the research's check, itself checked on a trefoil, 3, and a figure-eight, 5); the closing sequence's lockstitch 8
slides off as 3, with the last lockstitch as 9 and the whole strand as 81 (four overhand knots), its crossings are the
figure's (each lockstitch over its standing part, under the turn's start; each half hitch over H, under H, over its own
leg; the bight over the turn), half hitch 1 nearer the stitch, lockstitch 8 is drawn whole from the close's first frame, it starts on the clipped tape's end
(between stitches 7 and 8) and has one end, cut once;
`tests/test_hose_route.js` keeps `LR4Hose.lacing` equal to the Python.

## d. Element inventory

Carriers are three.js meshes (object names), the camera and two DOM elements; each motion is a transform, an opacity, an
attribute (a tube's draw range, a layer mask, a material colour) or the machine's pose. Coordinates come from the plan.

| Scene | Concept property | Carrier (id) | Motion | Ease / token | Placement |
|---|---|---|---|---|---|
| all | the scene's one line | `[data-part=cue]` in `main.stage` | opacity in at each scene start | standard, ease-out | bottom centre, 6% up |
| all | where we are | `main.stage` `data-scene`, `data-t`, `data-reached` (stitches tied) | attribute | - | - |
| cuts | machine <-> close-up | the dip (`main.stage` overlay, `--scene-bottom`, no text) | opacity out over quick, held quick / 2, in over quick (`DIP`, 0.375 s; draft 10: slow, quick, slow, 1.35 s); camera and layers switch under it | ease-in-out | whole frame |
| goal | the core and router on the gantry (d12) | the machine's pose (`move`, the hose, cord, sleeve re-swept) | 3 out-and-backs of 280 mm (`MOVE_DX`), smootherstep legs of 2.40 s with 1.40 s dwells (d13: the swing dies away in them), parked 1 s before the scene ends (`opening.js` `travelOf`) | smootherstep | along +X from the build pose |
| goal | the problem: loose cables (d12) | `Router_Cord_Run`, `Cable_Sleeve` (the page's own, re-tubed each frame from `lacing/slack.js` `looseOf`) | hang 60 mm off the hose (down where there is room above the tray, out from it), the sag bouncing (1.7 Hz, x 8) and the loop swinging sideways (a 250 mm pendulum, 1.0 Hz, x 2 its true lean: at most ~27 mm drawn, d13b) behind the core's acceleration and, through the air's drag, its velocity (media-anim `swing.js`), a wave running down the cable at 2 m/s; still within 0.7 s of the core stopping (d13c); pinned at the core and the far end, kept out of the hose; drawn in to the laced line over 0.7 s from the word | damped springs (d13: sway zeta 0.42 + drag 0.025, 5 % in 1.07 s; flap 0.45, 0.62 s); ease-in-out draw-in | cordRoute's line at the pose |
| goal | the finished lacing | `Lacing_Tutorial_ghost` (the tape ahead of the drawn end, 2 mm round as the tape (d17; 4.8 mm since draft 2), red, emissive; re-swept with the core's travel, d12) | opacity 0 until the voice first says "Cable lacing" (d12: `tm.hit`, the goal's `reveal`; the music's hit lands there, `music.intro.hitInS`), then in over quick to 1 and back to 0.7 (draft 11: `revealAt`) | quick, ease-out; settled over 1.5 s | run 0's tape at the pose |
| goal | the reveal's flash | the ghost's colour and emissive (`REVEAL.flash` `#fff4d6`, emissive 0.5 -> 1.1) | mixed to the warm white at the hit, back to the tape's red by 1.5 s | smoothstep from quick | - |
| goal | the reveal's halo | `Lacing_Tutorial_halo` (a 2.8 mm tube along the ghost, `#ffd89a`, additive, its edge's alpha falling off as its surface turns from the camera; no bloom pass) | opacity 0 -> 0.42 over quick, -> 0 by 1.6 s; radius widened 1 -> 3.2 x (a uniform: the vertices out along their normals) | quick in, smoothstep out; ease-out widening | run 0's tape |
| goal | the core, the U-turn and the loose cables, then the laced run | camera | Catmull-Rom over 6 keys (shares of the scene; d12): from behind and above the core's travel and the U-turn while the cables hang loose (az 104 -> 96, el 46 -> 50, 640 -> 600 mm; draft 11's view from above hid them under the hose, a view from the front behind the core and rails), then after the reveal a push in towards stitch 0 (az 88, 81, 76; el 54, 59, 63; 560 -> 470 mm), ending between the lacing and stitch 0 | never stops | fixed points (the core's travel moves no focus) |
| start | two turns + a knot | `Lacing_Tutorial_tube` (red, `COLOURS.tape`) | draw-on 0 -> stitch 0's `f1` | work, ease-in-out | stitch 0 at s 468 |
| the steps and the pitfall | the tape's end | `Lacing_Tutorial_tip` (a `shots.tip.r` 2.2 mm sphere in `colours.tip` green, both layers; at least `tip.minPx` 40 px tall at 720 lines, scaled up in the wide shots) and `Lacing_Tutorial_end` (the main tape's last END mm in `colours.end`, as the close-ups' `_end`) | translate along the tape; the ball wherever the light end shows (d14o: not in the opening or the finale; in over `quick` as the first step's work starts; no fade at the settles, the square knot's changes of end or the tie; a trimmed end takes both down with the offcut, the stub left the tape's colour); across a change of end (each scene's start, the square knot's lay / h1 / endL) it slides from where it was over `tip.slide` 0.2 s (`frameAt` `tipSlide`) | ease-in-out slide | the drawn end; the knots' trimmed end once nothing is worked |
| the steps and the pitfall | the character head | `Lacing_Tutorial_head` (media-anim `research/jensen`, vendored to `web/js/lib/jensen/` by `sync_media.js`: `FaceOverlay.attach` on `Lacing_Tutorial_tip`, a sprite in front of the ball, depth-tested); on by default (`shots.head.on`), off with the page's `?head=0` or `lacing_voice.js render --no-head` (the head state is in the renderer's hash) | with the ball: faded and hidden with it; lip-syncs the voice lines, a mood per scene (`head.moods`) | the rig's own (blinks, sway) | its cover circle `head.scale` 2.0 x the ball's silhouette, at most `head.maxPx` 120 px tall at 720 lines, never less than covers the ball |
| start | (ghost steps back) | ghost | opacity 0.7 -> 0.3 | slow | - |
| start | close on the stitch | camera | move in | 2 x slow | 240 mm above stitch 0 |
| wrap, tuck, tight | only the stitch's surroundings | `Lacing_Tutorial_lock_{hose,cord,sleeve,tape}` on layer 1; camera layers = 1 | layer mask | under the dip | s 816 - 936 |
| wrap | one loose turn | `Lacing_Tutorial_lock_tape` (the hitch path at lam 1.45) | draw-on from the standing part to 84% round | work, ease-in-out | stitch 6 |
| tuck | the end over its standing part, then under the turn's start | lock tape | draw-on through the crossing and 12 mm on | work | the crossing at -4 mm |
| tuck | the crossing, close | camera | move in to 0.6 x the close-up's fit, on the crossing | 2 x slow | cables' side + 0.45 v + 0.55 t |
| tight | the loop shrinks onto the bundle | lock tape (path rebuilt per frame) | lam 1.45 -> 1 by 55% of the work (`TIGHT`), the end 12 -> 58 mm over all of it | work, smoothstep | - |
| tight | the loop seen closing round the bundle | camera | near end-on (0.6 u, 0.3 v, 1 t) | 2 x slow from tuck | on the stitch, 0.2 R0 to the cables |
| close-ups | the working end | `Lacing_Tutorial_<id>_end` (its last 15 mm, `COLOURS.end`, light red) | rebuilt per frame with the drawn end | - | the hitch's or the worked strand's end |
| close-ups | light on the cables' side | `DirectionalLight` on layer 1 at the camera | translate with the camera | - | - |
| clove | two crossed turns, ends under the cross | `Lacing_Tutorial_start_strand0` (layer 1) | draw-on loose (70%), then lam 1.35 -> 1 | work | stitch 0, 32 mm off the cables |
| square | the first half knot: right over left | `..._start_strand1` (L, the end on the screen's left, deep red `COLOURS.left`), `..._strand2` (R, the working end, red) | L draw-on to its bight's far point (to `SQ.lay`, 12%), then R under L's bight, over L's standing part, under it again to its own bight's far point (to `SQ.h1`, 38%) | work | the reef's L and R, 4.0 mm a unit, on the cables' side (w 0) |
| square | the second half knot: left over right | strands 1, 2 | L's end round its bight and back across (to `SQ.endL`, 50%), then R's end round, over L's end, under it and over L's bight, out (to `SQ.h2`, 70%) | work | - |
| square | pulled snug, trimmed | strands 1, 2; the tip and the light end off once both ends are through | k 4.0 -> 2.4 mm a unit (to `SQ.pull`, 88%), the ends out by what the bights give, the short one cut to 3 mm | work | - |
| square, seal, tie | the knot is the focus | the clove (strand 0, square only), the close-up's model tape (`..._close_tape`: to the strand's start at -50, before stitch 8), the hose | opacity 1 -> 0.3 (square) / 0.2 (seal, tie), hose 0.45 | slow | - |
| clove | the knot faces the camera | camera | straight at the knot from outside, fit 40 mm | 2 x slow between scenes | `shots.json` |
| square | the knot from one fixed angle | camera | straight at the cables' side (no tilt), fit 12 mm, still for the whole knot | in over 2 x slow either side (`leadOf`) | `shots.json` |
| close | lockstitch 8 pulled snug, then H and the last lockstitch: one loose turn, the end over H and under the turn's start, pulled snug | `Lacing_Tutorial_close_strand0` (`knots.closing`, one strand) | lockstitch 8 pulled 0 -> 0.005 (0.6 -> 1.3 s); draw-on H 0.005 to 0.2, the turn to 0.5 (22 mm loose), over H to 0.6, under the turn's start to 0.7; pulled 0.72 -> 0.95 | work | a -30 -> +4.5 mm |
| close | the lockstitch, then closer on its crossings | camera | on H at -10 mm, fit 52, along to -2 mm (work 0.3), in to fit 24 on the crossings (0.72) | work, smooth, log distance | the surface frame, az 11.3 el 16.4 |
| seal | a bight back over the lockstitch, two half hitches round H, the tie-off end | strand 0 | (draft 12: set by seconds, 1.8 s a hitch, through the cubic work) bight 0 -> 0.021 (5 mm loose), half hitch 1 to 0.329 (over H, round under it, up over its own leg), a hold, half hitch 2 0.458 -> 0.935, the tie-off end 0.963 -> 0.993; drawn open (`snug` is where the tie pulls them) | work | a +6 -> -26 mm |
| seal | the half hitches | camera | fit 34 at -10 mm; in to fit 17 on half hitch 1 (a -10, w 1.5) by 0.021, held to 0.329; along to half hitch 2 (a -20) by 0.55, held to 0.96; out to the tie's key by 0.993 | work, smooth, log distance | the surface frame |
| tie | pulled snug, the one tie-off end trimmed | strand 0; no tip, no light end (nothing worked, as in the square knot's pull) | pull 0.05 -> 0.55: both loops close onto H (each point to its `snug`, up to 4.5 mm across the screen; the strand 31 mm shorter), the end out 3 mm; the blade cuts the tie-off end at 0.8, 3 mm past its start; the offcut falls | work | the tie-off end at -25 mm |
| tie | the half hitches and the tie-off end, still | camera | one key, fit 24 at -16 mm, 11 mm round | 2 x slow from the seal | the surface frame |
| lock | one wrap every 68 mm | tube | draw-on stitch 0's `f1` -> stitch 8's `f1` (11.9 s) | work, ease-in-out | stitches 1-8 |
| lock | follow the work | camera target = the mean of the tape's end on the hose over +-0.6 s | translate | work | 250 mm, TOP (draft 3: 420) |
| lock | the tape not laced yet | the ghost ahead of the tape (the hose, cord and sleeve keep their own look: draft 5) | ghost 0.3 -> 0.1 | slow in, slow out in the pitfall | from `tipS(f)` along the hose |
| spacing | the gap between stitches | `Lacing_Tutorial_bracket` (3 mm round, `--warn`) | scale from its centre 0 -> 1; opacity | standard / quick, after slow | on the bundle, stitches 7-8 |
| spacing | the step's own angle | camera | move 420 -> 300 mm, same direction | 2 x slow | TOP, on the bracket |
| close | only the closing stitch's surroundings | `Lacing_Tutorial_close_{hose,cord,sleeve,tape}` on layer 1 (the tape: the plan's, clipped at a = -30 mm, whole as the close-up opens, in the dip) | layer mask | under the dip | s 985 - 1100 |
| done | the bundle following the core | the machine's pose (`move([dx, 0, 0])`, and `rigSweep` re-sweeps the rig's hose, cord, sleeve) | dx 0 -> 280 -> 0 mm (sin squared; 300 in draft 2) | work | - |
| done | the laced bundle | `Lacing_Tutorial_real` (every run, knotted) in the tutorial's red | colour attribute | - | - |
| done | the finale | camera (`finaleAt`) | keyframes at 0 / 22 / 45 / 66 / 84 / 100% of the scene's body (its first 15.74 s; draft 11: not the credits): the U-turn from the front-high, low and close from behind, over the upper run riding with the core, high from behind, the lacing's box, the whole machine; Catmull-Rom on azimuth, elevation, log distance and target over a smoothstep of the scene's time | never stops between keyframes; at most 5% of its distance a frame | `g.machine` = the page's machine box |
| done | all tied | `data-reached` = 10 | - | - | - |
| all | the page's hose, cords, ties and wires | `hoseMesh`, `cordMesh`, `sleeveMesh`, `tieMesh`, `reliefMesh`, `wireMesh` | hidden while on (the rig in their place), restored after | - | - |
| callouts (8 scenes) | a term, defined and sourced | the card (draft 11: 1.5 x draft 10's, for phones and tablets; 0.63 x the height wide, at most 0.45 x the width; padding 24 / 30 px): `[data-callout-part=card]` in the callout overlay (`[data-callout]` in `main.stage`): term (45 px bold, the cue's font), definition (36 px), source (27 px small caps, 0.62 opacity); dark `rgba(14,16,20,0.86)`, radius 18, a 4.5 px bar in `colours.tape`, a 1 px light outline | in: scale 0.92 -> 1 (ease-out-back, at most 1.008) and opacity 0 -> 1 over standard, from quick after the pop-in; out: 1 -> 0.92 and opacity -> 0 over quick | standard in, quick out | laid out once a callout (`placeOf`): beside its anchor, inside a 4 % margin, above the cue's band (0.84 of the height), at least 0.07 x the height from the focus point and 0.035 from the anchor, covering the least drawn tape (leaders 0.09 - 0.36 x the height); still for its life |
| callouts | where the term is | the leader: an SVG line, 3 px light (`#f4f5f6`, 0.85) on a 7.5 px dark casing (`rgb(14 16 20)`, 0.5) | its end drawn out from the dot to the card's nearest edge (line endpoints) | standard in after quick, quick out | anchor -> card edge |
| callouts | the point itself | the dot: an SVG circle, `colours.tape`, a 3.75 px light ring, r 10.5 px | r 0 -> 10.5 (ease-out-back) and opacity, over quick; out last, over quick | quick | the anchor (`anchorOf`, projected through the frame's camera): stitch0, clove, square_knot, running_end, lock_cross, bracket, breakout, half_hitches, tie_off_end, closing_knot |
| callouts | when | the storyboard's `callouts: [{ term, anchor, word (wordS: measured) \| at, holdS }]` | in at the word (or the share), out holdS later; the next waits; gone before its scene ends (before the dip across a cut) | - | `calloutsOf` |
| done | the credits | the backdrop (`rgb(14 16 20)` over the stage), the panel (`[data-credits]`: the title 56 px bold, the cue's font; a 72 x 5 px bar in `colours.tape`; the items in two columns: role 22 px small caps 0.62, text 30 px, url 21 px lighter), black over all of it (`creditsAt`, `creditsLayout`) | the backdrop in over slow from the finale's end; the title over slow after it, the items a quick apart in reading order, each opacity 0 -> 1 and up 0.018 x the height; the whole frame to black over the last 1 s | slow, ease-out; ease-in-out | the panel centred, 1.5 x the height wide (at most 0.9 of the width) |

Every property has a carrier. The cue is the one line of text the stills rules check; the callouts' cards are the other
text (draft 10), sized in shares of the frame's height (px at 1080p above). The bracket carries no number (the cue says
76 mm (3")).

## e. Picture

`LR4LacingTut.frameAt(t, plan, { fov, aspect })` returns the frame: scene, cue, main tape drawn `f`, stitches tied, the
close-up (`detail`: the hitch path and its drawn length, or the closing stitch's drawn fraction), ghost / tape / tip /
bracket, the dip, the pose, the action point (`focus`) and the camera `[[position], [target]]`. `LR4LacingAnim.setT(t)`
applies it. No clock, random number, timer or rAF in either file; the camera has no smoothing state; the hitch's tube is
rebuilt from the frame's path each frame. A move between scenes takes 2 x slow (1.2 s), starting slow before the scene
ends; across a cut the camera jumps while the dip is full (draft 11: the dip is 0.375 s, `DIP`) (the test: every jump over half the view distance has the dip
at 0.95 or more; 4 cuts; otherwise at most 6% of the view distance a frame). A step's work runs from slow into its scene
to `SETTLE` (0.8 s) before its end.

The check page `index.html?anim=lacing`: the 3D view fills the window, `window.__anim = { setT, duration, scenes, still,
reducedMotion, camera, occluder }` once the machine and the hose are built. It does not play by itself. Under
`prefers-reduced-motion: reduce` it shows the still (93.46 s) and stays there. `occluder()` (practice §9.5) casts a ray
from the camera to the frame's action point and names the first visible mesh before it.

## f-h. Checks and video

- Text gate: `node ../media-anim/pipeline/storyboard.ts docs/specs/lacing-tutorial.storyboard.json` exits 0 (video
  107.66 s, still 93.46 s; drafts 2-3: [history][ck]).
- Unit: `node tests/test_lacing_tutorial.js` (in `npm test`); `tests/test_demo_script.js` covers `(Video Lacing:)`.
- Stills as numbers (velocity R2, 2026-11-10): `--only stills`, every frame at 30 fps through `frameAt` and the page's
  camera at 720p, 2.6 s, no browser. Each rule, what it replaces, its limit and draft 11's worst:

  | rule | replaces | limit (draft 11) |
  |---|---|---|
  | a callout's dot on what it names, from its pop-in to gone: within a tape's width of the drawn tape's edge on screen, or inside the knot (drawn tape within 0.25 of the height in all 8 directions); the bracket drawn full, the sleeve shown | the sheet's "each dot on its knot" | on it (square knot: inside its bights, 47 px from their edges) |
  | the tape at least 8 px wide at the action point in every close-up frame; the drawn knot at its work's end at least 0.4 of the height; the bracket, shown, 0.2 of the height and 6 px wide | HT-1 / FR-2 on the sheet ("the stitch too small", "the bracket reads thin") | 12.6 px (tight); 0.73 (tight); 0.36, 11.3 px |
  | a card covers at most 12 % of the drawn tape on screen (by length), no tape within 0.15 of the height of the action point, never the live end | the sheet's "no card over the action" (draft 10: the square knot's card over the clove's loop) | 6.2 % (square knot); 0.196 (closing stitch); 0 |
  | the action point on screen and clear of the cue's box at every frame; the live end off screen or under the cue at most 0.3 s at a time (it goes round the bundle) | FR-1 between its key times; the sheet's "nothing under the cue" | 0 frames; 0.23 s (clove, round the cables' front) |
  | the line of sight from the camera to the action point enters none of the close-up's hose, cord or sleeve with an opacity of 0.6 or more (media-mesh `clearance.sight`; see-through hits counted) | `__anim.occluder()` on the knot scenes (HT-2 / HT-5) | 0 of 1,701 frames |
  | the cue is the scene's storyboard line and fits one row (0.6 em a character + padding within 90 % of the width); consecutive stills samples differ; the confirm scene's pose moves | `stills.mjs` `cue-known`, `cue-fits`, `frames-differ`; HT-9 | widest cue 635 of 1,152 px |

  Each rule failed on a seeded defect, planted in memory (`.cache/velocity/r2/plant.js`, `run.js`, `plants.txt`): a
  card moved to the close scene (dot 17 px off the tape), the tight scene's fit 60 -> 260 (2.7 px, 0.19), every card
  laid over its anchor (8 of 10 fail: 10.7-60.1 % covered, tape as near as 0.000 of the height to the action point), seal's camera turned 28 mm round (115 frames under the cue), the tuck seen
  from the hose's far side (203 frames behind the opaque hose), the clove's fit 40 -> 14 (the live end off 2.27 s), a
  70-character cue, the U-turn frozen, the confirm pose held. The machine views' occlusion (the machine's meshes),
  `not-blank`, `renders`, `reduced-motion`, page errors and what needs eyes (a knot against its figure, the reveal's
  look, the credits' composition, colours on the backdrop) stay in one `stills.mjs` run before a draft goes out.
- Stills: `node ../media-anim/pipeline/stills.ts "http://127.0.0.1:8767/web/index.html?anim=lacing" --out <dir>
  --t <each scene's start + 0.7 and middle> --selector main.stage --width 1280 --height 720 --storyboard
  docs/specs/lacing-tutorial.storyboard.json` (Edge, `--disable-gpu`: SwiftShader): draft 4: canvas mode, 27 samples, 110 rules
  passed, 0 failed, 37 s (drafts 2-3: [history][ck]).
- Occlusion (`__anim.occluder()` at t = 3, 16, 20.5, 22.5, 25, 28.5, 30.5): nothing in the way of the lock stitch's
  crossing. A first close-up on stitch 1 had the sleeve in the way (see the model note); the closing stitch's first focus
  point was the hose's centre, now the turns on the cables' side. Draft 4 reran it on every knot scene (clove 18.4,
  square 24.0 - 30.97, tight 45.6 - 49.9, seal 79.3 - 83.9, tie 85.6 - 91.9, 17 frames): nothing in the way. In the lock
  run the ray meets the hose's own wall (the focus is the hose's centre line under the tape's end), as before.
- Video: the draft's numbers are at the end.

## Deviations from the practice

| Rule | Deviation | Reason |
|---|---|---|
| §6.2 Remotion or HyperFrames | the page's own director (`record_demo.js`, frame-stepped) renders the video | the maintainer asked for it: the scene is the page's own three.js model, which neither renderer hosts; the director records it frame by frame at t = frame / fps |
| §6.5 SSIM against a second renderer | not measured | one renderer; the check page and the video draw the same `frameAt` |
| §4 in-app placement, §3.3 / §5.4 device evidence | N/A | a video and a check page, not an in-app empty state; no phone target |
| §3.2 budget | the tutorial adds the tape tube (~14.6 k triangles), its ghost, a sphere, the bracket, and two close-up sets (a hose tube, two cable tubes, a tape tube) drawn only on layer 1 | the page's scene is already ~400 meshes |
| §7.1 assets | the trim's blade, trail and offcut are drawn as geometry here; the swipe is synthesised by `tools/lacing_voice.js sfx` | an original effect "in the style of" an arcade slice (the maintainer's note): no game's art, assets or sounds |
| §10.1 voice | a private prototype clone | drafts only, as the maintainer allowed; release waits for media-gen's provenance record |
| skill: colours from the repo's CSS tokens (`--accent`) | the lacing is `COLOURS.tape` #e01b2b, the square knot's left end #7a0812, the working end #ff9aa2 (`web/js/lacing_tutorial.js`) | the maintainer's choice (draft 4): the dark theme's `--accent` (#ff5a4c) read orange; this red reads on the dark close-up backdrop and the wood table, against the hose's grey helix and the black cables (checked on the contact sheet) |

## Clearance

(Set in draft 11; the before / after numbers are in the history, Draft 11.)


Every close-up frame at 30 fps (1721 frames), the tape as the page draws it: a 2 mm round tube (`HITCH.tr` 1.0) through
a centripetal Catmull-Rom, sampled every 0.5 mm.

- Tape to tape, one tape included: two points further apart along the tape than 3 r at least 2 r apart. The square
  knot's ends grow from the clove's ends and the closing sequence from the close-up's model tape: each is joined into
  one tape, so the joins are not counted as contacts.
- Tape to cable: the cable's centre line at least its radius + r away (cord 3.7 + 1, sleeve 6.5 + 1).
- Tape to hose: the hose's centre line at least od / 2 + r (35 mm) away.
- A knot strand to its outline: no deeper than rho (+ the cables' rise, below) + r.
- The tip may touch: tape within the strand's diameter (2 mm) of the tape's end is not checked. The ball (2.2 mm, full
  size in every view) is drawn only: nothing checks it against the tape or the objects.
- Tolerances: 0.1 mm between tapes only while a pull presses them together (the square knot from `SQ.h2`, the closing
  sequence's two pulls and the hold after the first, the clove's pull, the tight scene); 0.25 mm on the outline (5-degree
  bins, a hull's corners: no object there, and the hose and cables are checked themselves); none on the hose and cables.
- The model's own tape (run 0 on the machine view, and the close-up's clipped piece) is held to its measured numbers,
  not to the rule: see Open.

## Shots and knots as data (2026-11-09, after draft 5)

So a note becomes a data edit, not 3D code. Both live in `docs/specs/lacing-tutorial.shots.json`; `frameAt(t, plan, g,
tm, shots)` reads it. Its copy in `web/js/lacing_tutorial.js` (between `<shots>`) is written by `node
tools/lacing_voice.js sync`, and the test fails while they differ. When the page is served from the repo, it reads the
file itself (`LR4LacingAnim.ready()`), so a saved edit shows on reload, in the director and in `anim_draft.js`.

**Shots.** Each scene has a `camera`, optional `layers` and `colours`, and an optional `lead`:

- `camera.keys`: `{ x, focus, frame, az, el, dist | fit | fitFocus, ease }`.
  - `x` runs on the scene's clock: `share`, `work`, or `s` (the default).
  - `focus` is a named point: `lacing`, `machine`, `cross`, `bracket`, `{ stitch, move }`, `{ detail, aim }`,
    `{ surface, a, w, lift }`, `{ tape }`, `{ between }` or `{ point }`.
  - `az` / `el` are degrees in a frame: `world`, `detail:<id>`, or the surface's own frame.
- Between keys the camera moves by the later key's ease, with `dist` set to `lin` or `log`. With `path: "spline"` it
  follows a Catmull-Rom through all the keys (the finale).
- `layers`: opacity tracks for `tape`, `ghost`, `hose`, `cord`, `sleeve`, `context` and `base`. Each is a number or
  `[[s, value, ease]]`.
- `colours`: `tape`, `left`, `end`, and `backdrop` (null keeps the page's own background).
- `lead`: the half of a move into the scene, in seconds. The test holds it to a motion-token multiple.

`tests/fixtures/lacing_frames_d5.json` holds draft 5's frames (c5fa7ad, 457); the data-driven camera matches it within
2.2e-6 mm and the layers within 1e-6. Draft 5's stills SSIM: [history][sk].

**Tweak panel.** `http://127.0.0.1:8767/web/index.html?anim=lacing&play=1&tweak=1` (`web/js/page/anim_tweak.js`).

- Pick a scene to jump to it. Step through its camera keys, or follow the active one.
- Sliders set the key's distance, azimuth and elevation, and each layer's value at the key active now. Colour
  pickers set the four colours.
- **Add key at t** adds a key that holds the current frame (`LR4LacingTut.addKey`; tested to move the camera under
  0.05 mm). **Delete key** removes the selected one.
- **Copy JSON** puts the file's text on the clipboard. **Save** POSTs it to `tools/serve.py`.
- Edits redraw at the player's t at once, playing or scrubbing. The panel folds to its header.

Save is the path chosen. serve.py takes a POST to `/docs/specs/lacing-tutorial.shots.json` and no other path. It
refuses:

- any client but loopback, even under `--lan`;
- a browser `Origin` other than its own;
- anything not `application/json` (so a cross-site form can't send it without a preflight, which is refused);
- non-JSON, or JSON without `scenes`;
- a body over 256 KB.

It writes whole files only (`os.replace`), in `formatShots`' layout: one line per key or step. `tests/test_serve.js`
covers each refusal and puts the file back afterwards. A serve.py started before commit 100dd80 has no POST: restart
it for Save, or use Copy JSON.

A camera note's cost is now the quickstart's rows (draft 5's 5-minute loop: [history][sk]).

**Knots as steps.** `SHOTS.knots.<id>` is a short list of steps per strand: `start`, `to`, `wrap`, `arc` and `pull`.

- A point is `[a, w, h]`: a in mm along the hose, w in mm round it (`"C-10"` means a lap less 10 mm), h in layers.
- Any step may set `loose`, `under` or `until`. A `to` step may give `snug` points, one a point: where its pull
  takes them (draft 12: the half hitches drawn open, pulled closed across the bundle).
- One generator, `knotGen`, lays the steps on the close-up's bundle outline: `D.rho`, the ring the model's `lacing()`
  wrapped the stitch round. It adds a tube radius per layer, plus the knot's `loose` mm, which the pull shrinks to 0.
- Crossings are found, not typed: round the bundle, laps apart count as the same place. The strand on top is lifted
  one tape thickness (`KNOT_GEN.bump`, Gaussian over 2.4 mm along it). The later strand is on top unless its step says
  `under` or its strand alternates. The earlier strand lifts only once the later one has been drawn past.
- Drawing runs evenly by length on the bundle, by each step's `until`, or over the knot's `draw`.
- Ported: the clove hitch (spot tie, 9 steps) and the marline hitch (lock-off, 5 steps). `cloveCps`, `sealCps` and
  `SEAL` are gone. The square knots now sit on the generated clove and marline.
- The square knot from steps (`knots.square`, 2 strands of 4, `alternate: "under"`) read less well than draft 5's
  reef (no leads, no tails, crossings harder to follow), so `knots.square.use` stays `"reef"` (`reefFlat` / `layered` /
  `knotCps`); `"gen"` switches to the generator's. The comparison stills and the port's SSIM: [history][sk].
- Tests: lap notation; drawn on monotonically; loose then snug, so the loop shrinks onto the bundle; at every
  crossing found, the top strand sits at least 1.2 mm further out; the marline's end goes under its turn.
- Stills after the port: 110 / 110 rules, and the contact sheet was reviewed with 0 repairs. SSIM against draft 5 is
  0.99 or higher except where the generated knots show: 18.40 s 0.946, 80.66 s 0.959, 85.16 s 0.973, 88.66 s 0.963
  (the marline under the tie).

### The closing stitch as macros, one pull per stitch (decided and built 2026-11-10)

Read this before changing `knots.closing`. The record behind it is `.cache/lacing-tutorial/halfhitch/REPORT.md`: the
verdict, the sources, iterations 1-6 and the render times. The general knot learnings, the macro format and the
references are in media-mesh `lib/README.md` "rope".

| Part | State |
|---|---|
| Data | `knots.closing.sequence`: one line a macro, each holding its own steps (points as before). `rope.expand` flattens it; `stepsOf(K)` (knot_gen.js) is what code reads, never `K.steps`. |
| Half hitches | Numbered in tying order: 1 at -12 (nearer the stitch, tied first), 2 at -22. Over H, under H, over their own leg. An overhand each. |
| Lockstitch 8 | Shown tied (`until: 0`, `context: true`: drawn faded in the seal and tie), pulled over work 0 -> 0.005 (0.6 -> 1.3 s). |
| Pulls | `tighten` (SONO, `win` 0.35) scoped: a pull moves its own steps since the pull before, 5 mm either side; a pulled stitch is frozen. Solves see only what is drawn. The move eases out past a scope's end and in from the pin over `taper` (15 mm): a hard stop made the 0:02 seam (iteration 7-10, REPORT.md). |
| Transcript | One knot phase a macro, its steps as `parts`; the trim at its blade cut. |
| Commits | lr4 a91ebad, 8320549, this part; media-mesh 53d0d0b, 19f9e66, this part. |
| Last render | `.exports/lacing_drafts/halfhitch_close_seal_tie_720_i6.mp4` (close, seal, tie), the 0:02 seam fixed in `halfhitch_close_first3s_720_i10.mp4` (accepted), then all three again: `halfhitch_close_seal_tie_720_i11.mp4`, in the scene cache for the full draft. |

**The sequence** (the maintainer's, 2026-11-10; `knots.closing.sequence` reads the same):

```
lockstitch(8)            shown tied (as the model left it)
pull(lockstitch 8)       0 -> 0.005: ~0.7 s at the close's start
lockstitch(9)            the last: on along H, one turn laid loose, end over H, end under the turn's start
pull(lockstitch 9)       moves lockstitch 9 (+5 mm) only; lockstitch 8 holds (0 mm)
bight                    the end carried back over lockstitch 9
halfHitch(1)             tied first, nearer the stitch: down over H, round under H, up over its own leg
halfHitch(2)             tied second, 10 mm further along H
tieOff                   the one end drawn out
pull(halfHitch 1, 2)     with the bight; both lockstitches hold (9's turn and tuck 0.76 mm: H lifted over the hitches)
trim                     the blade, 3 mm past the knot (its time: blade.cuts.tie)
```

To change a stitch, edit its macro's steps; to retime, its steps' `until` / `from` and the pulls' `from` / `to`. Then
the quickstart's knot row, the closing determinants (3 / 9 / 81: `--only closing`), and render only close, seal, tie:
`node tools/lacing_voice.js render .exports/lacing_drafts/<name>.mp4 --scenes close,seal,tie --url
http://127.0.0.1:<port>/web/index.html?anim=lacing`, then `still <t...> --out <dir>` for the sheet.
   - If media-anim's capture code has uncommitted MA-9 (GPU pool) edits, render against an export of its last commit:
     `git -C ../media-anim archive HEAD | tar -x -C <dir>/media-anim`, then `MEDIA_ROOT=<dir>`.
   - No full draft: draft 13 waits for the maintainer's go.

## Pipeline (after draft 11, 2026-11-09)

The map for the refactoring: what runs, what it reads and writes, where the files are, and what it costs. Times are
measured unless marked "est.".

| step | command | writes | time |
|---|---|---|---|
| storyboard (words, holds, callouts, terms, chapters, music, credits) | edit `docs/specs/lacing-tutorial.storyboard.json`; gate `node ../media-anim/pipeline/storyboard.ts <sb> --voice --units in --transcript <transcript>` | - | < 1 s |
| shots (cameras, layers, knots, blade) | edit `docs/specs/lacing-tutorial.shots.json` (or the live preview's tweak panel) | - | - |
| copy into the page | `node tools/lacing_voice.js sync` | the STORYBOARD / SHOTS copies in `web/js/lacing/data.js` | < 1 s |
| voice | `node tools/lacing_voice.js tts [--only id,...] [--keep [--idle 900]]` (media-anim `audio/tts.ts`: GPU, 300 W cap; workers stopped after, or with `--keep` left warm until `--idle` s unused; `tts.mjs --stop` frees the GPU) | `exports/lacing_voice/<id>.wav`, `audioS` | 5 lines (2026-11-10): 40-42 s cold (13.2 s of it the model load), 19-20 s warm (`--keep`) |
| tightened takes (d27) | `node tools/lacing_voice.js tighten [--only id,...]` (media-anim `audio/words.ts`, CPU, for the pause cap, then `audio/tighten.ts`: lead and trail cut to 0.05 s, pauses between words capped at 0.35 s, sped to 175 wpm with the pitch kept, tempo 1.00-1.20, by ffmpeg `atempo` since d29 (rubberband's phase vocoder was heard as an echo in d28; the engines' measure is in `tighten.ts`'s header); the storyboard's `voice.tighten`). With it set, `mux` plays the `.tight.wav` files, `tts` tightens what it voices and `lacing_words.js` times the words in them; the picked takes are never rewritten | `exports/lacing_voice/<id>.tight.wav`, `audioS`; `.cache/lacing-tutorial/tighten/` (jobs.jsonl, words.json, tighten.json) | 38.8 s for 17 takes (words 34.0 s, tighten 4 s; 2026-11-14) |
| callout word times, every line's words (d29) | `node tools/lacing_words.js [--words-only]` (media-anim `audio/words.ts`: faster-whisper small.en, CPU; d27: in the `.tight.wav` files; d29: every line's words snapped to the wav's voiced runs, for the head's and the rider's lip sync, `rider.js` `speechOf`), then `lacing_voice.js sync` | `wordS` on callouts; `docs/specs/lacing-tutorial.words.json` -> `data.js` `WORDS` | 19.5 s for 8 wavs; 13.2 s for 5 (2026-11-09); 15.8 s for 6 tightened (2026-11-14) |
| generated docs | `node tools/lacing_voice.js transcript \| chapters \| sidebar \| zoomtube` (media-anim `publish/exports.ts`) | `docs/specs/lacing-tutorial.{transcript.json, chapters.vtt, youtube.txt, sidebar.json}`, `exports/lacing_zoomtube/` | < 2 s each |
| changed-scene diff | `node tools/lacing_voice.js scenes [check \| accept \| hashes]`, `brief` (media-anim `pipeline/golden.ts`) | `.cache/lacing-tutorial/golden/*.json.gz` | write 7.4 s, check 7.3 s, diff 8.1 s; brief 8 s |
| tip track (media-anim MA-11: the rider's springs, Jensen Cam) | `node tools/lacing_track.js [--out FILE] [--shots FILE]` (frameBase at every 30 fps frame + 120 Hz in each 0.2 s tip slide: the tip, its end tangent, the camera basis, px/mm); copied by hand to media-anim `characters/body/fixtures/lr4-track.json` | `.cache/lacing-tutorial/track/lr4-track.json` (0.9 MB) | 7.5-7.8 s (4,458 samples, 1.7 ms each; 2026-11-13) |
| tests | `cd tests && npm test` (CI: the same); while iterating `node tests/test_lacing_tutorial.js --only <sections>` | - | npm test 7-8 s (its slowest `test_strut_cam.js`, 5 s alone; `test_router_body.js` 2.0 s, `test_hose_route.js` 0.8 s, the lacing `clearance` 2.5 s alone; booleans and clearance in worker threads); `test_lacing_tutorial.js` 18 s alone (after V2, before R12); its sections below; older: [history][pl] |
| stills + contact sheet | `node ../media-anim/pipeline/stills.ts <url> --out <dir> --t ...` (SwiftShader); against an earlier round: `node ../media-anim/pipeline/ssim.ts <dirA> <dirB> [--min 0.99]` | `<dir>/t-<s>.png`, `contact-sheet.jpg`, `report.json` | 0.5-4 min (10-31 samples); SSIM 0.7 s for 10 |
| draft video | `python tools/serve.py sandbox --no-open`; `node tools/lacing_voice.js draft .exports/lacing_drafts/lacing_dN_draft_720.mp4` (media-anim `capture/draft.ts`, real-time on the iGPU, then `lacing_voice.js mux` through media-anim `audio/mix.ts`: voice, swipes, music, normalised in two passes to the storyboard's `loudness` (d27: -14 LUFS, TP -1.5); `mux --dry-run` prints the ffmpeg call) | the 720p draft | 163.6 s for 135 s |
| scene-cached video | server as above (one per shots file: `LR4_SHOTS_FILE`); `node tools/lacing_voice.js render <out.mp4> --url <page> [--shots <copy>]` (media-anim `capture/scenes.ts` + `step.mjs`: a warm-up page load, then each scene in its own page load (R9), frame-exact to `.cache/lacing-tutorial/scenes/<key>.mp4`, joined with concat -c copy, then `mux`) | the 720p video, no held frames | cold 394.4-406.9 s; warm 3.5 s; one shot's camera changed 49.1 s (2 scenes re-rendered), one maths constant 28.1 s (only its scene), both before R9's +11 s a re-rendered scene |
| one iteration (R8) | `node tools/lacing_voice.js iterate [--against <dump>] [--shots <copy>] [--url <page>] [--no-log]` (media-anim `pipeline/pipeline.ts`: changed, checks, server, render, clip, stills; each step's seconds in the timelog note) | `.exports/lacing_drafts/iterate_<stamp>_clip.mp4`, `_sheet.jpg`; stills in `.cache/lacing-tutorial/iterate/<stamp>/` | nothing changed 12.1 s (changed 4.4, checks 5.8, render 1.7: 14 hits); `wrap`'s camera az +4 deg in a shots copy 63.2 s (wrap + tuck re-rendered, 412 frames, 50.8 s; clip 1.0; stills 0.9); cold cache 411.1 s |
| review clip | `node tools/lacing_voice.js clip <out.mp4>` (the scenes changed against the accepted dump, 1 s either side, with sound, cut from the full render) | the clip | 7.5 s warm (wrap + tuck: 15.7 s of video) |
| stills from the cache | `node tools/lacing_voice.js still <t...> --out <dir>` (ffmpeg on the segments, no browser) | `<dir>/t-<s>.png`, `contact-sheet.jpg` | 6.0 s for 16 |
| reduced parts (d12) | `node tools/lacing_voice.js parts [--src a,b] [--target 0.05] [--no-measure]`: the files the page draws (its `needed`: the Kobalt set), found by SHA-256 in `.cache/lacing-tutorial/parts_src/<zip>/` (the maintainer's three Printables zips and the loose Peter Plates, extracted STL / DXF only) and `parts/`, reduced by media-mesh `tools/reduce.mjs` (MM-3: weld, meshoptimizer 1.3.0 `simplify`, ErrorAbsolute 0.05 mm, the face-sampled max / mean through `tools/hausdorff.py`); DXFs and the bristle strip (bent along a path by the page) copied; `PARTS_NEAR` takes the zip's XZ Min DXF (other bytes, same placed box to 0.004 mm). While the folder has files, `render` / `clip` / `iterate` / `still` / `draft` load the page with `?parts=/.cache/lacing-tutorial/parts/`, its files are in the render key, and `render` refuses a page in Lite or with fewer files placed than the folder holds | `.cache/lacing-tutorial/parts/<manifest path>` (37 files, 5.1 MB against 42.3 MB), `parts_report.json` | 8.3 s (34 STLs reduced in 0.34 s, the rest the Hausdorff at 50k samples each way). With the parts (2026-11-10, 4,202 frames): cold render 516.9 s against 394-407 s for 4,064 placeholder frames; 111 ms a frame against 89 (step 10.0 against 6.6 ms, grab 99 against 82); page load 3.3-4.4 s against 1.8-3.3 s |
| final video | `node tools/lacing_voice.js render <out.mp4> --size 1920x1080` (not run: 720p only so far); `tools/record_demo.js` is the director's | - | - |

**The tutorial's code** (`web/js/lacing/`, each a UMD file: `LR4Lacing.<name>` in the browser, `require` in Node;
`web/index.html` loads them in this order, then `web/js/lacing_tutorial.js`, the facade that assembles the same
`LR4LacingTut` API; its header maps "to change X, edit Y, test with Z"). Generic modules hold no lacing constants and
are stage 2's to lift into media-anim / media-mesh:

| file | lines | owns | kind |
|---|---|---|---|
| `data.js` | 863 | STORYBOARD, SHOTS (generated by `lacing_voice.js sync`; don't edit) | data |
| `vec3.js` | 11 | an alias of `MediaMesh.vec3` (3-vector helpers, smooth, az / el in a frame, rotAbout), kept so the modules' `use("vec3")` is unchanged | media-mesh `lib/vec3.js` |
| `timeline.js` | 11 | an alias of `MediaAnim.timeline` (spoken / estS, TOKENS, eases, tracks, the clock, sceneAt, the dip), kept so the modules' `use("timeline")` is unchanged | media-anim `lib/timeline.js` |
| `curves.js` | 20 | hoseLine (`MediaMesh.curve.line`, tan over +-3 mm), cableSpan, profile (5-degree bins), spline, alongAt | media-mesh `lib/curve.js` |
| `knot_flat.js` | 42 | the reef's figure (reefFlat, REEF), layered, denseIdx, flatTo: `MediaMesh.knot` under the lacing's names, with their draft notes | media-mesh `lib/knot.js` |
| `core.js` | 74 | the lacing's constants (SETTLE / SETTLE_OF, DIP, DETAIL_OF, HITCH, ...), timing() / voiceLines / sceneAt / settleOf / workAt / localOfWork = `MediaAnim.timeline` with SETTLE, SETTLE_OF, STILL_OFFSET, handover | lacing over media-anim `lib/timeline.js` |
| `plan.js` | 179 | plan, riseOf, cableCut, referencePlan, apexOf, TOP | lacing |
| `knot_gen.js` | 47 | knots as steps (the format), KNOT_GEN; knotGen / layKnot = `MediaMesh.rope` / `bundle` with HITCH.tr, CLEAR, the handover check | lacing over media-mesh `lib/rope.js` |
| `knots.js` | 250 | hitchPath (`MediaMesh.rope.marline` with HITCH, CLEAR), KNOT / SQ, flatOf / surfaceAt / strand (`MediaMesh.bundle`), tapeTo / fromEnd, knotView, knotCps, knotAt, the cuts | lacing over media-mesh `lib/rope.js`, `lib/bundle.js` |
| `opening.js` | 70 | (d12) OPENING, legsOf, travelOf (the core's legs in the goal), cablesOf (the loose cables' state: k, sag, the swing's taps; `MediaAnim.swing`) | lacing over media-anim `lib/swing.js` |
| `slack.js` | 85 | (d12) looseOf, slackOf: the loose cables' shape from cablesOf's state (the page's drawing: loaded by `index.html`, not the facade's frame maths) | lacing |
| `draw.js` | 63 | lockK, drawAt / drawOf, tiedAt, progressAt, hitchAt, tipS, poseAt / poseOf (the goal's: opening.js travelOf) | lacing |
| `shots.js` | 115 | focusOf, frameOf (detail frames), finaleAt, leadOf, LAYERS; keyCam / clockOf / shotOf / addKey / cameraAt = `MediaAnim.camera` through the lacing's rig (focusOf, frameOf, workAt); isCut / dipAt / layersAt = `MediaAnim.timeline` with DETAIL_OF, DIP | lacing over media-anim `lib/camera.js`, `lib/timeline.js` |
| `blade.js` | 67 | bladeAt, sfxAt | lacing |
| `callouts.js` | 144 | anchorOf (topOf, closingFrame, breakoutOf), the placement's sampler (ink, anchor, focus) and memo; calloutsOf / placeOf / calloutsAt / wordAt / sourceOf = `MediaAnim.callout` with the dip / credits limit and the `lacing tutorial: ` prefix | lacing over media-anim `lib/callout.js` |
| `frame.js` | 145 | frameAt, frameBase (revealAt / creditsAt: `MediaAnim.reveal` / `credits`), framing (`MediaAnim.camera.ndc`) | lacing |
| `events.js` | 123 | phasesOf, eventsOf; keyLocal = `MediaAnim.camera.keyLocal` with localOfWork | lacing |

Stage 2 (media-mesh): `web/index.html` loads the vendored `js/lib/media-mesh/{vec3,curve,knot,bundle,rope}.js`
(`node tools/sync_media.js`; `--check` in npm test) before the lacing modules; the lacing values (HITCH.tr, CLEAR, the
handover check, KNOT_GEN) are passed in by `knot_gen.js` / `knots.js`, and the lib's `lib/README.md` keeps each
method's history. The knot determinant and the clearance grid are media-mesh's checks (`lib/knotdet.js`,
`lib/clearance.js`), not vendored: `test_lacing_tutorial.js` requires them from `../media-mesh/lib` (or `MEDIA_ROOT`)
and without the sibling (CI) skips the slid-off determinants (hitch, closing) and the clearance section with a note.

Stage 2 (media-anim): `web/index.html` loads the vendored `js/lib/media-anim/{timeline,camera,reveal,callout,credits}.js`
before the lacing modules (timeline first: the others use it); the facade takes projector, revealAt / REVEAL, the credits
(CR, creditsLayout, creditsAt, creditsIn) and the card's layout (CO, CO_IN / OUT, cardOf, wordIndex) from them directly,
so `projection.js`, `credits_reveal.js` and `callout_layout.js` are gone. The lacing values (SETTLE / SETTLE_OF,
STILL_OFFSET, DIP, DETAIL_OF, the foci and frames, the anchors and the ink) are passed in by `core.js`, `shots.js` and
`callouts.js`; the generic rules' history is in media-anim `lib/README.md`. The refactor's frame-for-frame proof:
[history][pl].

The tests by section: `node tests/test_lacing_tutorial.js --only <a,b>` (`--list` names them; each prints its
seconds; npm test runs it as four processes, by section, through `tests/run_tests.js`). On the full run after V2 (s,
2026-11-10, a quiet machine): frames 2.1, story 0.3, confirm 0.9, tape 0.3, callouts 1.1, events 0.1, knotgen 0.3,
draft11 1.3, clearance 7.6 (2.5-2.7 alone since R12), the rest 0.1 or less; the shared setup about 1 s; `stills` 2.6
alone (R2). Older numbers: [history][pl]. A change that should not move a frame: `node tools/lacing_voice.js scenes
check` (7.3 s, every public output at 30 fps).

**Where files live** (all git-ignored): `.exports/lacing_drafts/` (drafts, contact sheets per draft; no smaller copies: the maintainer watches on this PC);
`.cache/lacing-tutorial/` - `research/` (the NASA PDF text and figure crops, NAVSHIPS, the knot-determinant scripts),
`notes/` (each subagent's spec-ready notes, drafts 9-11), `stills/` (every stills round), `measure/` (clearance,
dead-time, framing and loudness scripts and their outputs), `edits/` (one-off edit scripts), `parts_src/<zip>/` (the V1E downloads, extracted: untrusted, STL / DXF only), `parts/` (the reduced set the renders load), `parts_report.json`, `parts_work/` (the reducer's map), `parts_measure/` (d12's load and frame-time script and its stills); `exports/lacing_voice/`
(the wavs, `jobs.jsonl`); `exports/lacing_zoomtube/`. The music file stays where the maintainer keeps it
(`music.file`).

**Where the time went:** `timelog.mjs report` on `docs/specs/lacing-tutorial.timelog.jsonl`; drafts 9-11 (20-60 min
of subagent build a stage against ~3 min of rendering): [history][wt].

**Open:**
- **Draft 29 (resume here): no echo, the rider occluded, the lips on the words (2026-11-14, the owner's d28 review).**
  `.exports/lacing_drafts/lacing_d29_720.mp4` (stills `lacing_d29_stills/`), history "Draft 29": the stretched lines by
  `atempo` (rubberband's phase vocoder was the echo; measured, A/B `d29_audio_ab.wav`), the main-view rider depth-tested
  with a 0.28 ghost (Jensen Cam on top), the head's and rider's mouths on the words' real times (`words.json`, agreement
  79 -> 91 %, lag 0). With the owner: the draft; two defaults he may reverse: 0.25 s at a scene end with no cut (0.4
  before a dip), and goal_fix / lock / seal listed in `allowedRates` (PC-6).
- **Draft 28: the close-ups sped (2026-11-14, the owner's "speed, don't hold; no re-voicing").**
  `.exports/lacing_drafts/lacing_d28_720.mp4` (120.90 s; stills `lacing_d28_stills/`), history "Draft 28": each close-up
  ends with the 0.4 s hold every scene has, its knot time-scaled x1.16-1.37; close x1.02 (the one-tape test's 20 mm a
  frame) and seal x1.25 (the callouts test's dot) keep listed holds; square and tie keep the blade's fall before the
  dip. `pace.ts`: median gap 1.19 -> 0.52 s, 4 violations (PC-3a median: 13 of 20 gaps are scene ends heard ~0.5 s;
  PC-6 goal_fix, lock, seal). With the owner: the 720p draft; whether non-dip scene ends may hold under 0.4 s (PC-3a).
- **Draft 27: the re-time (2026-11-14, BATCH-01 P8).** `.exports/lacing_drafts/lacing_d27_720.mp4`
  (128.93 s; stills `lacing_d27_stills/`), history "Draft 27": d26's takes tightened (`lacing_voice.js tighten`, 174 wpm),
  0.15 s between a scene's lines, 0.4 s at a cut, the close-ups' knots at d26's speed with their holds listed (`maxS`),
  -14.6 LUFS. `pace.ts`: 4 violations (d26 33): PC-3a median 1.19 s (the close-ups' holds), PC-6 goal_fix 156, lock 146,
  seal 220. With the owner: the 720p draft (no 1080p before his go); whether the close-ups' 1.2-2.8 s holds may go (a
  faster knot, or a per-scene camera arrival under media-anim's fixed 0.6 s); the seven lines at tempo 1.15-1.20; the
  opening's legs 2.41 -> 2.03 s. loudnorm fell back to dynamic (the mix's +0.2 dBTP): -14.6, not -14.0.
- **Draft 20 (resume here): d19 with the branches merged (2026-11-13).** `.exports/lacing_drafts/lacing_d20_720.mp4`
  (sheet `lacing_d20_stills/`): d19's voice and intro, media-mesh `ropepath` merged into its main (vendored check
  passes), `jensen-head` merged with the head on by default (`?head=0` / `render --no-head` for the plain ball). Next:
  the running lockstitches made secure (the session "Running lockstitch unraveling"), then the Draft 19 and 16 items.
  Also open: the green running end crosses the head's face where it leads into the ball (draw the head over it?);
  `test_lacing_tutorial.js` is the slowest loop (`fab perf reflect` 2026-11-13: 17 runs at 22 s, 6.2 min across
  sessions; `--only <section>` while iterating, the full file before a commit).
- **Draft 19: the intro tightened (2026-11-12).** `.exports/lacing_drafts/lacing_d19_720.mp4` is with the
  maintainer (history "Draft 19"; d18, every line in the aza v2 voice, history "Draft 18"). D18-1 answered by a
  one-line problem (the word at 8.55 s), D18-2 by c (the card left at 0.57 s) and b (seal hold 2.0). Open: the
  maintainer's review of the new intro line and pace; `npm test` fails only `test_media_sync.js` (media-mesh has no
  `lib/body.js` until its `ropepath` merge, below).
  D18-3, dead air (the maintainer: d18 too slow, too much dead air between lines; guidance only, after the stitch and
  knot accuracy work): d18 measured (`.cache/lacing-tutorial/pace/report.md`, `gaps.json`, `gaps.js`, session
  04022e6e) 17 heard gaps between lines of 0.50-3.29 s, 20.8 s in all, over 1 s at clove->square 1.83, square->wrap
  1.56, wrap->tuck 1.15, tuck->tight 1.20, close->seal 2.42, seal->tie 3.29, tie->done 1.42; silent below -60 dB from
  35 s on (no music or sfx under the gaps); each gap is the hold plus ~0.35 s of padding in the wavs. The re-time
  (practice PC-3): trim each wav's lead and trail, aim 0.25 s between lines and ~0.4 s at a cut, list every hold over
  0.5 s with the picture it waits for (~16.5 s shorter). Re-measure on d19 first (its goal, square, tight, close,
  seal, tie and done holds moved). Unverified: whether clove, square, close and seal need their holds for the work to
  finish (test: seal holdS 0.25, `render --scenes seal`).
  Then the items under draft 16 below.
- **Draft 16: `ropepath` merged into main (2026-11-12).** The run generated whole and pulled taut
  (draft 15) with main's d14o tip and review fixes; FORK.md F2 done this way round (main took the branch). The
  tutorial draws its own hose, cord and sleeve (`lacing_anim.js` rig); the page's `Cable_Lacing` is gone. Draft 16
  (`.exports/lacing_drafts/lacing_d16_720.mp4`, history "Draft 16") is with the maintainer. Next, after the review:
  1. The head overlay: d17h's branch `jensen-head` merged into main (2026-11-13, the maintainer), the head optional
     (on by default; `?head=0`, `render --no-head`); see the element table's head row.
  2. Code comments say "light end" for the running end (knot-terms words): rename with the next tutorial change (it
     moves every scene's cache key).
  3. The finale (`done`): the running end is out of every shot (the stills check allows it there).
- **Draft 15 review.** Draft 15 (2026-11-10, branch `ropepath` abe7573 in the worktree
  `E:\git\wt\ropepath`, media-mesh `ropepath` 8c8c3b1; history "Draft 14b", its last paragraph) is with the maintainer:
  `.exports/lacing_drafts/lacing_d15_720.mp4`, `lacing_d15_sheet.jpg`, unlisted at https://youtu.be/-B1061TznS0, shared by the maintainer on the V1E forum (https://forum.v1e.com/t/lowrider-4-sandbox-virtual-in-browser/55073/54). Still to do: merge media-mesh `ropepath` into its main and run `node tools/sync_media.js` (lr4 vendors the branch's
  8c8c3b1), then `scenes accept`. Open (the maintainer, 2026-11-11):
  1. The rings fanning out round the U-turn in the opening (12-21 s): the hose's tight bend, the cables on its inside
     18 mm from the bend's centre, so every ring there passes near it; in d14b too (`d14b/goal_14.3.png`). Only a change
     to the U-turn's rings (not round the cables at the bend's inside) or to the cable route would remove it.
  2. With the core moved, the tape goes up to 2.55 mm into the sleeve on the U-turn's inside (and 1.26 mm from itself);
     `--only run` holds the carried poses to those measured values (`POSE`), not to the clearance rule.
  3. `npm test` fails 2 of 39 in the worktree, `test_serve.js` (the `--lan` check that `.exports` is served) and
     `test_lacing_exports.js` (the worktree checks generated files out with CRLF); both fail the same way at the branch's
     first commit. Check them on main before the merge.
  Also from the review: at 115 s knots 3-5 line up along the camera's line of sight (a framing or knot-angle call;
  the camera at 1:52 was the maintainer's "good"). The worktree's `exports/`, `.cache`, `.exports`, `build`,
  `tests/node_modules` are junctions to main's; `media-anim` beside it is a junction (run its tools by the real path:
  through the junction `stills.mjs` and `timelog.mjs` do nothing).
- **Draft 14 review (d14b, done in draft 15 above).** The maintainer's d14 review (2026-11-10, history "Draft 14b"):
  the run's lockstitches malformed (0:12-0:21 they switched between plain rings and loose knots as the core stopped and
  started; 1:52 the same), the NASA card over the machine, a quick pull after each lockstitch (1:09-1:22), the seal
  camera (1:40) cropping the loop's top. lr4 f681867 (work in progress, not rendered): the opening's ghost knotted at
  every pose, NASA card in a top corner, a pull per stitch (`draw.js` `pullsOf`), seal fit 17 -> 21 - these four
  checked on frames. **The run's knots: the splice replaced (branch `ropepath`, not merged, not rendered).** The
  maintainer chose (a), the generic rope path. `plan.js` `runOf` generates the whole run from the stitches' arcs and the
  bundle: a media-mesh body (`body.ofTubes`: the hose and the cord and sleeve as the model's `section` lays them, n 144,
  each cable 0.3 mm more) and `rope.lace` on it - the first and last stitch the model's turns, the rest marline hitches,
  one piece a stitch, the pieces meeting on the outline. A knot whose length lies on the U-turn's inside (stitch 3: the
  outline's mm two tapes up 0.72 of the tape's; lifts stacked 8 mm, the tape 0.89 mm through itself) is turned round the
  hose to where the share holds 0.95 (`RUN.squeeze`, `topOf`), and its neighbours across a bent gap with it (`spread`), so
  the run steps round only in straight gaps (stitches 2-5 at -43 degrees, the steps round in gaps 1-2 and 5-6). The
  opening's ghost and the finale carry the build pose's runs (`refsOf`) to the core's pose (`knotLace`): each point as
  many mm along the outline from its stitch, at its angle and height over that pose's outline - generated anew at each
  pose, a turned knot chose its angle afresh as the U-turn moved along the run and jumped 19 - 33 mm in a mm of travel.
  `--only run` checks: every lockstitch slid off is 3 (snug and at `PULL.loose`), `make(1)` / `make(1.3)` the same
  count, the snug run at least 2.10 mm from itself (2 tr + CLEAR less 0.05), off the cables (spline through cordRoute's
  points, as the page sweeps them) and the hose; carried to the poses, held to what they measure (`POSE`) and moving at
  most 1.5 mm a mm of travel. Not solved: carried, where the U-turn moves onto knots laid on the straight the tape comes
  1.26 mm from itself and up to 2.55 mm into the sleeve on the U-turn's inside (the bend's centre 52 mm from the hose's,
  the lifted sleeve's 48: no room there at any pose; the model's own tape is 1.03 mm into it at the build pose); a knot
  pulled loose (lam 1.3, 15 mm off the outline) can meet the run across the U-turn (0.11 mm) or its own turn (1.57).
  The spans between knots are pulled taut (media-mesh `rope.taut`, `RUN.taut`: the shortest path over the body from one
  knot's end to the next's standing part, leaving and meeting each knot along its own line; at the plan and at every
  pose, 10 ms a run): `--only run` holds their sideways bend to 0.02 /mm over 10 mm and their turn to 6 degrees a mm
  (20 where they meet a knot). At 115 s the U-turn's knots read as a loopy chain: measured, each is as flat and compact
  as the straight run's (`--only run` holds it); from that camera knots 3 - 5 line up along the line of sight and
  overlap - a framing or knot-angle decision for the maintainer. The outline is bilinear, so the tape kinks 2 - 3 degrees
  where it crosses a station's or a bin's line. knotLace 17 ms a new pose for run 0, 27 for both runs.
  Check loop: knot diagrams (`.cache/lacing-tutorial/ropepath/run_json.js <k | k0-k1> <out.json> [--lam]` + `views.py
  [--zoom 10] <json>... <png>`: the tape at its true width, so a gap is a gap), then ~10 page frames, a video only
  after both look right. Draft 14's video: `.exports/lacing_drafts/lacing_d14_720.mp4`.
  Draft 14b (main 288f152, the four fixes, the splice's knots) rendered for review: `lacing_d14b_720.mp4`,
  `lacing_d14b_sheet.jpg` (history "Draft 14b").
- Draft 14 (2026-11-10, rendered): `lacing_d14_720.mp4`, `lacing_d14_sheet.jpg`. Open from it: the storyboard gate's
  2.8 s silence in seal (102.1 s), there before d14. No 1080p before the approval; `scenes accept` once accepted.
- MA-5: lr4 is not pushed until MA-5 has rewritten its unpushed history without those files.
- Draft 12 review (maintainer, 2026-11-10): the closing half hitches (seal, 97.3-101.25 s) still look wrong to the
  maintainer. Draft 12's claim that each already passed through its own loop was the knots agent's, checked on stills,
  not against NASA Fig. 9-3. Session 6d978696 checked it against the references
  (`.cache/lacing-tutorial/halfhitch/REPORT.md`). The claim was wrong: the tuck went under its own leg, which makes no
  knot. Fixed and pulled tight (a91ebad, 8320549), then one pull per stitch as macros (2026-11-10: "The closing stitch
  as macros" under "Shots and knots as data"); the seam (in i6) fixed in 10 ("looks great"); i11 (close,
  seal, tie) is cached for the full draft. The other 11 scenes miss the cache (a full draft re-renders them). Also not yet checked by ear or in motion:
  whether the music's hit at 12.21 s masks the spoken "Cable lacing", and whether the tie pull (105.9-107.7 s) reads as
  tight. The caption stays "Lace the cables to the hose" through the problem lines (0-11 s). The maintainer's ruling
  (2026-11-10): the half-hitch session commits its fix after the knot tests pass, without rendering. Draft 13 is started
  in a new chat only on the maintainer's go, because more fix sessions may land first. Pushes are held until draft 13.
- Peter "open" (`peter/PeterPlates_w_locations.stl`, Printables 1044487) is not on this PC. Draft 12 draws the "solid"
  style, so no frame needs it; `parts` reduces it once the file is in `parts_src/`.
- Draft 12 review (maintainer, 2026-11-10): the opening's loose cord and sleeve kept swinging at full amplitude while
  the core was parked. Fixed (history "D13 swing"): 3 out-and-backs with 1.4 s stops, the swing damped (zeta 0.42 +
  drag 0.025, flap 0.45). d13 review (the goal scene alone): it now dies away, but swung ~80 mm, through the parts beside
  it; d13b: k 6 -> 2, a third (26.8 mm drawn at most). d13b review: damp 50 % faster; d13c: zeta 0.64 + drag 0.025,
  flap 0.68 (5 % in 0.72 s, was 1.07). d13c accepted ("Looks good", 2026-11-10: `.exports/lacing_drafts/d13c_swing_goal.mp4`);
  the goal's segment is in the scene cache, and another session renders the full video.
- Learnings from the d13 swing session (2026-11-10), ranked; each one is later work, not started:
  1. (high, small) A worktree per session, or each file owned by one session: the half-hitch session's uncommitted
     hunks shared `lacing_voice.js` and the test file with this session's, and the commits were staged hunk by hunk, the
     index built by hand once. Cost: the git-ignored `parts/` and `.cache/` need links in each worktree.
  2. (high, ~half a day) A clearance check for the opening's loose cord and sleeve against the parts beside them (the
     knots' `clearance` section does this for the tape): the test let a 20-90 mm swing pass, and the maintainer saw it
     go through the parts at 80 mm.
  3. (medium, small) `brief` writes a before dump on a session's first run: against the stale accepted baseline,
     `scenes diff` lists 8 of 14 scenes and its `render --scenes` line names all 8.
  4. (medium, ~1 h) The swing tuning scripts as a command (`.cache/lacing-tutorial/swing/cable.js`, `jump.js`: the
     drawn swing's reach, its speed after each stop, the biggest step a frame, for any OPENING override in 1 s), and a
     "to change X, set Y" table in `opening.js` (reach: `sway.k`, linear; settle time: `zeta` + `drag`, `swing.settleS`).
  5. (medium, small) A swing-against-time chart beside each clip: a contact sheet cannot show settling.
  6. (low, tiny) `tools/serve.py` takes `--port 8791`: today it needs `--port=8791` and silently serves 8767.
  7. (low, none) Timelog stages through `timelog.mjs start` / `end`: d13b and d13c were logged by hand, their starts
     estimated.
  8. (low, medium) A render of a span within a scene: not needed while scenes are under ~60 s (the goal, 713 frames:
     112 s), and a span cannot be reused by the full render.
- d12 finale occlusion: the real parts (the YZ plate, a red part) cover some of the hose's lower run at about
  112-121 s and 74.6 / 79.3 s; the U-turn and the lacing stay readable. A camera change in `done` if the maintainer
  wants it clear.
- d12 Jackpot3: draft 12 showed the grey placeholder box in the finale's wide shot (about 124-127 s). The maintainer's
  Printables 1434650 download (2026-11-10, `parts_src/jackpot3-box-model_files/`) matches the tested SHA-256s; `parts`
  now reduces 36 files (910,856 -> 81,002 triangles), and only Peter "open" is missing. Draft 13's render picks it up:
  the finale scene re-renders. Not yet seen in a frame.
- d12 parts: 3 of the 40 files the page wants are not on this PC, so they stay grey boxes or are not drawn: the Jackpot3
  box and lid (the zip's `jackpot-box.stl` / `-lid.stl` are another version: placed by the tested A, 25 mm off in Y and Z;
  Printables 1434650's files are needed) and `PeterPlates_w_locations.stl` (Peter "open"; the renders draw "solid", from
  the loose PeterPlateB / T, which match). Core.stl's face-sampled max is 0.41 mm (50k samples; 0.45 at 200k) at the 0.05 mm target on
  meshoptimizer 1.3.0, above the practice row's 0.14-0.28 mm (measured on 0.18.1): media-mesh MM-3 asks for the table's re-measure.
- V1 `frames` on its parts: sweep `cameraAt` / `poseAt` / `drawAt` / `tiedAt` / `dipAt` / `sceneAt` (0.3 s) and hold
  `frameAt` to them at every event, scene edge +-1 and every 15th frame: 5.6 -> 2.1 s. Not applied: a camera change made
  only inside `frameBase` between spot frames would pass.
- D1 (maintainer) the `confirm` check is loose: a 3 mm lacing jump at one pose passes, old and new, because the limit is
  1.6 x the core's step every 3rd frame (up to 6 mm). Tighten it?
- D2 (maintainer) `tests/run_tests.js` (the parallel npm test, 47 lines) is generic but stays in lr4: CI has no sibling
  repos. Keep it here?
- D3 (maintainer) seed the page's own textures (`web/js/page/scene.js` draws them with `Math.random` at load), so a plain
  page load matches the cached video? A page change: `VERSION` bump and CHANGELOG. Until then only the capture tool seeds.
- `done` is not deterministic (render-server session, 2026-11-10, media-anim `docs/gpu-pool.md` "Measured"): two
  forced renders of `done` on one iGPU browser, same key, differed in 348 of 802 frames (SSIM mean 0.9955, min 0.983);
  `wrap` / `tuck` were byte-identical (413/413). Neither the textures (capture seeds Math.random before the page's
  scripts run) nor the order the parts load in is the cause: one `step.mjs` page load (`--clock`, seeded) rendered
  `done` twice identically (0 of 802 frames differ), both with `?parts=` and without it. The difference shows only on
  `scenes.mjs`'s path: a warm-up load stepping every 15th frame, then a fresh reload in the same browser before each
  scene (R9). Next test: render `done` twice through `scenes.mjs` with `plan.capture = { fresh: false }`. If the two
  match, the reload path is the cause (media-anim `docs/gpu-pool.md`).
- The scene cache is never pruned: 60 segments, 59 MB on 2026-11-10, 14 of them stale. Add a prune when it matters.
- R9: the first-load variant's root cause is below the page (Chrome's shader compile / program cache, unverified).
- Open (2026-11-10): `tests/test_sim_config.js` sometimes crashes at exit after all its checks pass (libuv
  `UV_HANDLE_CLOSING` assertion, exit 3221226505), before and after R12; likely the unnamed 1-of-39 npm test failure.
- `fab perf reflect` (2026-11-10): `python -` 14 x 55 s in the R8/R9 agent, not confirmed (`fab perf excerpt
  f06f302a/a7477b47 --turns 30-30`); the rest fixed or superseded: [history][ol].
- D4 (maintainer) a browser pool: render 2, then 4 scenes at once as pages of one browser (segments are independent and,
  since R9, byte-repeatable), logging NVIDIA power, frame ms and watchdog, stopping above 150 W. Est. cold 400 -> 100-200 s
  (unmeasured; the grab is CPU-bound, the pages share the iGPU). Loosens the one-browser rule (the 2026-11-08 reboot with
  two browsers), so it waits for the maintainer.
- `iterate --shots <copy>` runs the checks on the repo's shots, not the copy (the test file can't load one; the summary
  says so); `iterate` does not run `sync`, so a stale `data.js` shows as a failing check.
- R10 touched `docs/specs/render-fps.md` (another session's file): lines 12-13's links to sections already in the history
  file now point there (7f151ef).

**Open for the maintainer's review of draft 11:** draft 11s (`.exports/lacing_drafts/lacing_d11s_*`: frame-exact from the scene cache, every
scene start snapped to a whole frame, so each moved by up to 16.7 ms) not yet watched; the square knot's taller shape (clearance); "Running end" and
"Closing stitch" on screen under 1 s (the faster cuts); the outro music louder than the voice (-13 vs -16 dBFS RMS);
the model's own tape still up to ~1 mm into its neighbours (drawn 2 mm round for a 1.2 mm tape, `TAPE_R`); no
`VERSION` / CHANGELOG entry for the drafts (none since draft 1); 1080p not rendered. zt-web gaps (YouTube-only player,
no document sources, no glossary) are in `exports/lacing_zoomtube/README.md`.

**Velocity rounds 1-3 (2026-11-09..10), done** (a line each; the proofs, measurement narratives and older numbers:
[history][vr]; scripts and seeds: `.cache/velocity/`, git-ignored):
- Refactor: `web/js/lacing_tutorial.js` split into `web/js/lacing/` (the map above), every frame unchanged; the lacing
  tests by section; npm test in parallel. [history][rc]
- MA-5: the generic tools moved to media-anim `tools/` (capture, anim, audio, publish); lr4 keeps the lacing callers
  (`lacing_voice.js`, `lacing_words.js`). [history][rc]
- 1 changed-scene diff (MA-7): `lacing_voice.js scenes`, 4,064 frames: write 7.4 s, check 7.3 s, diff 8.1 s. [history][vi]
- 2 scene render cache (MA-8, MA-3): `lacing_voice.js render`; scene starts snapped to whole frames (largest shift
  16.7 ms), callouts scene-local; not in the key: Chrome's version, the GPU driver. [history][vi]
- 3 the changed-scenes clip: `clip`, 7.5 s warm. 4 stills from the cache: `still`, 16 in 6.0 s. 5 the browser lock
  (MA-6). 7 the stage brief: `brief`, 8 s. [history][vi]
- 6 / R5 the in-page grab (MA-2): not adopted; the best composite with the DOM overlays costs ~98 ms a frame, the
  screenshot's cost. Left: an async readback (PBO) or WebCodecs in the page. [history][r2]
- V2 `clearance`: media-mesh `rope.knotGen` reuses what does not depend on w (7727889), the test caches by coordinates;
  skipping `frameBase` inside a draw phase stays out (knotGen's points move there, up to 1.56 mm). [history][or]
- V3 `LR4_SHOTS_FILE` (serve.py). V4 the pre-commit guard installed (`python tools/check_no_parts.py --install`).
  [history][or]
- R1 the renderer hash leaves out the 23 pure-maths files (`FRAME_MATHS`; 153 hashed); `BUILD_VALUES` hashes what
  `lacing_anim.js` takes outside `frameAt`; one maths constant re-rendered only its scene (28.1 s, before R9). [history][r2]
- R2 the stills rules as numbers: `--only stills`, 2.6 s ("f-h. Checks"). R4 a warm TTS worker: `tts --keep`, 19-20 s
  warm against 40-42 s cold. R6 the timelog's `unmeasured` (media-anim be1ba28). [history][r2]
- R3 `test_router_body.js`'s booleans in worker threads (5e72229): 9.7-9.8 -> 1.9-2.1 s alone. [history][r2]
- R7 a root package.json (48fee4a). R8 `iterate`: 12.1 s nothing changed, 63.2 s one camera key, 411.1 s cold; its
  checks run on `data.js`, so a `--shots` copy is rendered, not tested. [history][r3]
- R9 each scene in a fresh page load after a warm-up (media-anim `CAPTURE.fresh` / `warm`): a second cold render is
  byte-identical; cold 394.4-406.9 s, a one-scene re-render +11 s. [history][r3]
- R10 this file trimmed (2026-11-10): 90,299 -> 65,528 bytes, 816 -> 590 lines;
  from the quickstart's heading to the first open item 558 -> 504 lines; the Pipeline section 358 -> 147 lines; the rest verbatim in [history][vr].
- R11 measured, nothing moved: code-constant tuning is 10.5 % of drafts 6-11's tuning lines (<= ~22 %), none tuned in
  two drafts. [history][r3]
- R12 `test_hose_route.js` 6.5-7.0 -> 0.71-0.81 s, `clearance` 6.8-7.3 -> 2.5-2.7 s alone (frames in worker threads,
  `CLEARANCE_JOBS`, 2 under npm test); npm test 7-8 s, its floor `test_strut_cam.js` (5.0 s alone). [history][r3]

[vr]: lacing-tutorial.history.md#velocity-rounds-1-3-2026-11-0910
[pl]: lacing-tutorial.history.md#pipeline-superseded-numbers
[wt]: lacing-tutorial.history.md#where-the-time-went
[rc]: lacing-tutorial.history.md#refactoring-candidates
[or]: lacing-tutorial.history.md#open-after-the-refactor
[vi]: lacing-tutorial.history.md#video-iteration-velocity-ranked
[r2]: lacing-tutorial.history.md#velocity-round-2
[r3]: lacing-tutorial.history.md#velocity-round-3
[ol]: lacing-tutorial.history.md#open-lines-and-fab-perf-reflect
[sk]: lacing-tutorial.history.md#shots-and-knots-as-data-draft-5-checks
[ck]: lacing-tutorial.history.md#checks-draft-2-4-numbers
