// The lacing tutorial's data, generated: STORYBOARD (= docs/specs/lacing-tutorial.storyboard.json), SHOTS (=
// docs/specs/lacing-tutorial.shots.json) and WORDS (d29: lacing-tutorial.words.json's lines), written between the
// <storyboard> / <shots> / <words> markers by `node
// tools/lacing_voice.js sync` (and tts, with the measured audioS). Don't edit here: edit the JSON (or the live
// preview's tweak panel) and sync.
//   Exports: { STORYBOARD, SHOTS, WORDS }. Uses nothing. Tests: tests/test_lacing_tutorial.js --only storyboard,shots (each
//     copy = its JSON).
(function (root) {
  "use strict";
  // = docs/specs/lacing-tutorial.storyboard.json, written here by `node tools/lacing_voice.js sync` (and tts, with the
  // measured audioS); the test keeps them equal; the text gate runs on the JSON
  // <storyboard>
  const STORYBOARD = {
    "variant": "lacing",
    "kind": "video",
    "voice": {
      "name": "aza",
      "version": "v2",
      "picked": "2026-11-14 by ear: anchor uturn; each line its seed (media-gen work/voice/anchor-pick: gen_anchor_page.py, score_rerolls.py, gen_reroll_page.py)",
      "tighten": {
        "edge": 0.05,
        "wpm": 175,
        "maxPause": 0.35
      }
    },
    "references": [
      {
        "id": "nasa-8739.4a",
        "title": "NASA-STD-8739.4A, Workmanship Standard for Crimping, Interconnecting Cables, Harnesses, and Wiring",
        "revision": "Revision A with Change 4",
        "date": "2022-04-13",
        "url": "https://standards.nasa.gov/sites/default/files/standards/NASA/A/4/nasa-std-87394a_w_change_4_0.pdf",
        "pages": "pp. 34-37 (9.2 Lacing, Figs 9-1 to 9-5, Table 9-1); p. 18, p. 20 (3.2 Definitions); pp. 27-28 (7.2.11, 7.2.28); p. 96 (20.5.1.d)",
        "kind": "standard"
      },
      {
        "id": "navships-900171",
        "title": "NAVSHIPS 900171, Electronic Installation Practices Manual, Chapter 9 Cabling, Section 7 Lacing and Binding",
        "revision": "Change 2",
        "date": "1952-05-23",
        "url": "https://www.hellschreiber.com/pdf-hell/article-hell-navships.pdf",
        "pages": "pp. 9-98 to 9-110 (paras 2, 4, 8-11; Figs 9-58 to 9-68)",
        "kind": "manual"
      },
      {
        "id": "navy-14160",
        "title": "US Navy rate-training manual 14160 (title not checked), marline hitch",
        "revision": "tpub.com copy",
        "date": "2026-11-09 (read)",
        "url": "https://engineeringtraining.tpub.com/14160/Blackwall-Hitch-92.html",
        "pages": "p. 92",
        "kind": "manual"
      },
      {
        "id": "wirecare",
        "title": "WireCare, Tying a marline hitch with lacing tape",
        "revision": "web page",
        "date": "2026-11-09 (read)",
        "url": "https://www.wirecare.com/help/how_tos/marline-hitch-lacing-tape",
        "pages": "single page",
        "kind": "guide"
      },
      {
        "id": "wikipedia",
        "title": "Wikipedia, Cable lacing",
        "revision": "web page",
        "date": "2026-11-09 (read)",
        "url": "https://en.wikipedia.org/wiki/Cable_lacing",
        "pages": "n/a",
        "kind": "wiki"
      }
    ],
    "terms": [
      {
        "id": "nasa-standard",
        "term": "NASA-STD-8739.4A",
        "def": "NASA's workmanship standard for cables, harnesses and wiring; lacing is §9.2",
        "ref": "nasa-8739.4a",
        "where": "§9.2 Lacing for Trunk, Branches, and Breakouts",
        "page": "33-37",
        "quote": "9.2 Lacing for Trunk, Branches, and Breakouts. 9.2.1 When engineering documents specify the use and type of lacing, the following requirements shall apply."
      },
      {
        "id": "starting-stitch",
        "term": "Starting stitch",
        "def": "The first stitch: a spot tie with a running end",
        "ref": "nasa-8739.4a",
        "where": "§9.2.4.b, Fig. 9-1 A",
        "page": "34-35",
        "quote": "Single-tape starting stitches shall be the same as a spot tie with a running end or as shown in Figure 9-1 View A."
      },
      {
        "id": "spot-tie",
        "term": "Spot tie",
        "def": "A clove hitch followed by a square knot",
        "ref": "nasa-8739.4a",
        "where": "§9.2.5, Fig. 9-2",
        "page": "34-35",
        "quote": "Spot ties shall consist of a clove hitch followed by a square knot as shown in Figure 9-2 or other non-slip knots."
      },
      {
        "id": "clove-hitch",
        "term": "Clove hitch",
        "def": "Two crossed turns round the bundle",
        "ref": "nasa-8739.4a",
        "where": "§9.2.5, Fig. 9-2 A",
        "page": "35",
        "quote": "a clove hitch followed by a square knot as shown in Figure 9-2"
      },
      {
        "id": "square-knot",
        "term": "Square knot",
        "def": "Ties the clove hitch's two ends off",
        "ref": "nasa-8739.4a",
        "where": "§9.2.5, Fig. 9-2 B",
        "page": "35",
        "quote": "a clove hitch followed by a square knot"
      },
      {
        "id": "running-end",
        "term": "Running end",
        "def": "The long end that laces on",
        "ref": "nasa-8739.4a",
        "where": "Fig. 9-1 A (label)",
        "page": "35",
        "quote": "RUNNING END"
      },
      {
        "id": "continuous-lacing",
        "term": "Continuous lacing",
        "def": "One tape along the bundle in running lockstitches",
        "ref": "nasa-8739.4a",
        "where": "§9.2.7, Fig. 9-5",
        "page": "36",
        "quote": "Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5."
      },
      {
        "id": "lockstitch",
        "term": "Lockstitch",
        "def": "One turn; the end over, then under: locked",
        "ref": "nasa-8739.4a",
        "where": "§9.2.7, Fig. 9-5 (read from the figure)",
        "page": "36",
        "quote": "Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5."
      },
      {
        "id": "over-and-under",
        "term": "Over and under",
        "def": "Why one cut stitch won't unravel the rest",
        "ref": "navships-900171",
        "where": "§7.8 Lacing",
        "page": "9-103",
        "quote": "the \"over and under\" form is necessary to prevent unraveling of entire cable lacing, in the event one or more stitches are cut"
      },
      {
        "id": "stitch-spacing",
        "term": "Stitch spacing",
        "def": "Bundle over 25.4 mm (1\"): at most 76.2 mm (3\") apart",
        "ref": "nasa-8739.4a",
        "where": "§9.2.8.a, Table 9-1",
        "page": "35",
        "quote": "Larger than 25.4 (1.00): 76.2 (3.00) maximum distance between harness ties, mm (in)"
      },
      {
        "id": "breakout",
        "term": "Breakout",
        "def": "Where wires leave the main bundle",
        "ref": "nasa-8739.4a",
        "where": "§3.2 Definitions",
        "page": "18",
        "quote": "The separation of a conductor or group of conductors from the main body of wires in a harness."
      },
      {
        "id": "closing-stitch",
        "term": "Closing stitch",
        "def": "Last lockstitch plus two half hitches",
        "ref": "nasa-8739.4a",
        "where": "§9.2.6.a, Fig. 9-3",
        "page": "34, 36",
        "quote": "Single or double lacing tape shall be terminated with a closing stitch as shown in Figure 9-3."
      },
      {
        "id": "half-hitches",
        "term": "Two half hitches",
        "def": "Round the tape itself, they lock the end",
        "ref": "nasa-8739.4a",
        "where": "Fig. 9-3 (label; read from the figure)",
        "page": "36",
        "quote": "LOCKSTITCH PLUS TWO HALF HITCHES"
      },
      {
        "id": "tie-off-end",
        "term": "Tie-off end",
        "def": "The one short end left, trimmed",
        "ref": "nasa-8739.4a",
        "where": "§9.2.2, Fig. 9-3 (label)",
        "page": "34, 36",
        "quote": "Lacing tie-ends shall be trimmed."
      },
      {
        "id": "restart",
        "term": "Past the breakout",
        "def": "Start anew with a starting stitch",
        "ref": "nasa-8739.4a",
        "where": "§9.2.10.b",
        "page": "37",
        "quote": "The lacing shall start anew with a starting stitch on the opposite side of the breakout on each branch."
      },
      {
        "id": "harness",
        "term": "Harness",
        "def": "Wires handled as one assembly",
        "ref": "nasa-8739.4a",
        "where": "§3.2 Definitions",
        "page": "20",
        "quote": "so arranged that as a unit it can be assembled and handled as one assembly"
      }
    ],
    "chapters": [
      {
        "id": "ch-start",
        "title": "Why lace, and the starting stitch",
        "scenes": [
          "goal",
          "start",
          "clove",
          "square"
        ]
      },
      {
        "id": "ch-lockstitch",
        "title": "Running lockstitches",
        "scenes": [
          "wrap",
          "tuck",
          "tight",
          "lock",
          "uturn",
          "spacing"
        ]
      },
      {
        "id": "ch-close",
        "title": "Closing stitch",
        "scenes": [
          "close",
          "seal",
          "tie"
        ]
      },
      {
        "id": "ch-result",
        "title": "The laced bundle, and a tip",
        "scenes": [
          "done"
        ]
      }
    ],
    "scenes": [
      {
        "id": "goal",
        "purpose": "preview-goal",
        "cue": "Lace the cables to the hose",
        "narration": "Loose cables on a LowRider flap, snag and chafe, and can yank a plug mid-cut.",
        "holdS": 13.71,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§7.2.11",
            "page": "27",
            "says": "\"Harness designs and routing shall provide support and protection to harnesses and cables so that they are protected from abrasion, cold flow, cut through, vibration, chafing, flexing, and sharp edges.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§7.2.28",
            "page": "28",
            "says": "\"Provision shall be made for stress relief in wires entering connectors from harnesses\""
          }
        ],
        "uncited": "\"flap\" and \"snag\" are the tutorial's own (the picture shows the loose cables swaying); \"yank a plug\" is the tutorial's reading of NASA §7.2.28's stress relief at connectors; which cables ride with the core is shown, not said (d19: the problem in one line, the reveal sooner)",
        "leadS": 0.5,
        "reveal": {
          "line": "goal_fix",
          "word": "Cable lacing",
          "wordS": 0.96
        },
        "more": [
          {
            "id": "goal_fix",
            "narration": "The fix? Cable lacing: the method NASA specifies for its mission hardware.",
            "gapS": 0.15,
            "sources": [
              {
                "ref": "nasa-8739.4a",
                "where": "§1.2.2 Applicability",
                "page": "14",
                "says": "\"This standard applies to production and processing of mission hardware\""
              },
              {
                "ref": "nasa-8739.4a",
                "where": "§9.2.7, Fig. 9-5",
                "page": "36",
                "says": "\"Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5.\""
              },
              {
                "ref": "wikipedia",
                "where": "Cable lacing (the article's lead)",
                "page": null,
                "says": "\"Cable lacing is a method for tying wiring harnesses and cable looms, traditionally used in telecommunication, naval, and aerospace applications.\""
              },
              {
                "ref": "wikipedia",
                "where": "Cable lacing, Styles",
                "page": null,
                "says": "\"Some organizations have in-house standards to which cable lacing must conform, for example NASA specifies its cable lacing techniques in chapter 9 of NASA-STD-8739.4.\""
              }
            ],
            "audioS": 4.642,
            "seed": 1000
          },
          {
            "id": "goal_why",
            "narration": "Tight, tidy, tough: one tape, no sharp zip-tie tails, and one cut stitch won't unravel the rest.",
            "gapS": 0.15,
            "sources": [
              {
                "ref": "navships-900171",
                "where": "§7.8 Lacing",
                "page": "9-103",
                "says": "\"the \\\"over and under\\\" form is necessary to prevent unraveling of entire cable lacing, in the event one or more stitches are cut\""
              }
            ],
            "uncited": "\"tight, tidy, tough\" and \"no sharp zip-tie tails\" are the tutorial's own",
            "audioS": 6.376,
            "seed": 1004
          }
        ],
        "audioS": 5.159,
        "callouts": [
          {
            "term": "nasa-standard",
            "anchor": "ghost_close",
            "line": "goal_fix",
            "word": "NASA",
            "wordS": 2.24,
            "holdS": 3,
            "corner": true
          }
        ],
        "seed": 1004
      },
      {
        "id": "start",
        "purpose": "step",
        "cue": "Start by the last zip tie",
        "narration": "Following NASA's lacing standard, start beside the core's last zip tie with a spot tie round all three.",
        "holdS": 0.4,
        "audioS": 6.08,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.4.a-b",
            "page": "34",
            "says": "\"Harnesses laced with single tape shall initially be tied with a starting stitch.\" \"Single-tape starting stitches shall be the same as a spot tie with a running end or as shown in Figure 9-1 View A.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.5",
            "page": "34",
            "says": "\"Spot ties shall consist of a clove hitch followed by a square knot as shown in Figure 9-2 or other non-slip knots.\""
          },
          {
            "ref": "wikipedia",
            "where": "Cable lacing, Styles",
            "page": null,
            "says": "\"Some organizations have in-house standards to which cable lacing must conform, for example NASA specifies its cable lacing techniques in chapter 9 of NASA-STD-8739.4.\""
          }
        ],
        "callouts": [
          {
            "term": "nasa-standard",
            "anchor": "stitch0",
            "word": "NASA's",
            "wordS": 0.36,
            "holdS": 2.2,
            "corner": true
          },
          {
            "term": "starting-stitch",
            "anchor": "stitch0",
            "word": "spot tie",
            "wordS": 4.56,
            "holdS": 2.1
          }
        ],
        "seed": 1000
      },
      {
        "id": "clove",
        "purpose": "step",
        "cue": "Clove hitch: two crossed turns",
        "narration": "Two turns, the second crossing over the first, ends tucked under the cross: a clove hitch grips without slipping.",
        "holdS": 0.25,
        "audioS": 7.086,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.5",
            "page": "34",
            "says": "\"Spot ties shall consist of a clove hitch followed by a square knot as shown in Figure 9-2 or other non-slip knots.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-2 View A (read from the figure)",
            "page": "35",
            "says": "\"CLOVE HITCH\": two crossed turns round the bundle"
          }
        ],
        "uncited": "\"Grips without slipping\" is the tutorial's wording; NASA §9.2.5 only calls the spot tie's knots non-slip (\"or other non-slip knots\").",
        "callouts": [
          {
            "term": "clove-hitch",
            "anchor": "clove",
            "word": "clove hitch",
            "wordS": 5.14,
            "holdS": 2.6
          }
        ],
        "seed": 1000
      },
      {
        "id": "square",
        "purpose": "step",
        "cue": "Right over left, left over right",
        "narration": "Secure it with a square knot: right over left, then left over right, pull snug, and trim the short end.",
        "holdS": 1,
        "audioS": 6.8,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.5",
            "page": "34",
            "says": "\"Spot ties shall consist of a clove hitch followed by a square knot as shown in Figure 9-2 or other non-slip knots.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-2 View B (label)",
            "page": "35",
            "says": "\"CLOVE HITCH AND SQUARE KNOT\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.2",
            "page": "34",
            "says": "\"Lacing tie-ends shall be trimmed.\""
          },
          {
            "ref": "wirecare",
            "where": "procedure, starting knot",
            "page": null,
            "says": "\"Snug the knot tight and trim the short end to about 1/8\" or so.\""
          }
        ],
        "uncited": "\"Right over left, then left over right\" is the common way to tie a square knot; no surveyed source spells it out.",
        "callouts": [
          {
            "term": "square-knot",
            "anchor": "square_knot",
            "at": 0.625,
            "holdS": 1.4
          },
          {
            "term": "running-end",
            "anchor": "running_end",
            "at": 0.803,
            "holdS": 1.5
          }
        ],
        "seed": 1005
      },
      {
        "id": "wrap",
        "purpose": "step",
        "cue": "Wrap once, loosely",
        "narration": "Each lockstitch begins with one loose turn of tape round the hose and both cables.",
        "holdS": 0.25,
        "audioS": 5.158,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.7, Fig. 9-5",
            "page": "36",
            "says": "\"Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-5 (read from the figure)",
            "page": "36",
            "says": "each running lockstitch is one turn round the bundle"
          }
        ],
        "seed": 1000
      },
      {
        "id": "tuck",
        "purpose": "step",
        "cue": "Over, then under the turn",
        "narration": "Bring the end back over its standing part, then under the turn; one cut stitch won't unravel the rest.",
        "holdS": 0.25,
        "audioS": 6.08,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-5; Fig. 9-3's running lockstitch (read from the figure)",
            "page": "36",
            "says": "the end crosses over the standing part, then under the turn's start"
          },
          {
            "ref": "navy-14160",
            "where": "marline hitch",
            "page": "92",
            "says": "\"Just remember that the end of the line goes over the standing part and under the round turn so that it binds itself.\""
          },
          {
            "ref": "navships-900171",
            "where": "§7.8 Lacing",
            "page": "9-103",
            "says": "\"the manner in which the lock stitch is made may vary, but the \"over and under\" form is necessary to prevent unraveling of entire cable lacing, in the event one or more stitches are cut\""
          },
          {
            "ref": "wikipedia",
            "where": "Cable lacing, continuous lacing (cites Bureau of Naval Weapons 1962, pp. 7-9 to 7-14, not read)",
            "page": null,
            "says": "\"A series of half-hitches, while visually similar, is not recommended for this application.\""
          }
        ],
        "callouts": [
          {
            "term": "lockstitch",
            "anchor": "lock_cross",
            "word": "over",
            "wordS": 0.8,
            "holdS": 2.8
          }
        ],
        "seed": 1002
      },
      {
        "id": "tight",
        "purpose": "step",
        "cue": "Pull it tight",
        "narration": "Pull the end along the hose; the loop closes down and grips the bundle.",
        "holdS": 0.4,
        "audioS": 4.55,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.7, Fig. 9-5",
            "page": "36",
            "says": "\"Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5.\""
          },
          {
            "ref": "navships-900171",
            "where": "§7.8 Lacing",
            "page": "9-103",
            "says": "\"The stitch used in keeping the conductors together under pressure is the lock stitch.\""
          }
        ],
        "seed": 1000
      },
      {
        "id": "lock",
        "purpose": "step",
        "cue": "Lockstitch every 68 mm (2.7\")",
        "narration": "Repeat along the hose: one lockstitch every 68 millimetres (2.7\"), each pulled snug before the next.",
        "holdS": 0.84,
        "audioS": 6.181,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.7, Fig. 9-5",
            "page": "36",
            "says": "\"Continuous lacing shall be achieved using running lockstitches as shown in Figure 9-5.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.8.a",
            "page": "37",
            "says": "\"Lacing stitches and spot ties shall be placed as detailed in Table 9-1.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Table 9-1",
            "page": "35",
            "says": "harness larger than 25.4 mm (1.00 in): maximum distance between harness ties 76.2 mm (3.00 in)"
          }
        ],
        "seed": 1000
      },
      {
        "id": "uturn",
        "purpose": "step",
        "cue": "Round the U-turn and back",
        "narration": "Keep the same spacing round the U-turn and back along the lower run, the tape flat on top.",
        "holdS": 0.25,
        "audioS": 6.03,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.8.a",
            "page": "37",
            "says": "\"Lacing stitches and spot ties shall be placed as detailed in Table 9-1.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Table 9-1",
            "page": "35",
            "says": "harness larger than 25.4 mm (1.00 in): maximum distance between harness ties 76.2 mm (3.00 in)"
          },
          {
            "ref": "wirecare",
            "where": "procedure, after the starting knot",
            "page": null,
            "says": "\"Keeping the lacing tape as flat and free of twists as possible\""
          }
        ],
        "seed": 1000
      },
      {
        "id": "spacing",
        "purpose": "pitfall",
        "cue": "Never over 76 mm (3\") apart",
        "narration": "Never leave more than 76 millimetres (3\") between stitches, or the cables sag away from the hose.",
        "holdS": 0.4,
        "audioS": 5.492,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "Table 9-1",
            "page": "35",
            "says": "harness larger than 25.4 mm (1.00 in): maximum distance between harness ties 76.2 mm (3.00 in)"
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.8.a",
            "page": "37",
            "says": "\"Lacing stitches and spot ties shall be placed as detailed in Table 9-1.\""
          }
        ],
        "uncited": "\"Or the cables sag away from the hose\" is the tutorial's reason; NASA states the spacing with no reason.",
        "callouts": [
          {
            "term": "stitch-spacing",
            "anchor": "bracket",
            "word": "76",
            "wordS": 0.94,
            "holdS": 3
          }
        ],
        "seed": 1000
      },
      {
        "id": "close",
        "purpose": "step",
        "cue": "Last lockstitch at the breakout",
        "narration": "Just before the sleeve leaves the hose, the breakout, tie one last lockstitch.",
        "holdS": 2.34,
        "audioS": 4.467,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§3.2 Definitions, Breakout",
            "page": "18",
            "says": "\"The separation of a conductor or group of conductors from the main body of wires in a harness.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.6.b, d",
            "page": "34",
            "says": "\"Lacing shall be terminated at every major breakout or branch\" (25 to 30 percent or more of the wire volume); \"Closing and starting stitches at branches and breakouts shall be next to the breakout.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.10.a",
            "page": "37",
            "says": "\"Lockstitching shall terminate with a closing stitch before each large breakout or branch of the harness.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-3 (label)",
            "page": "36",
            "says": "the closing stitch: \"LOCKSTITCH PLUS TWO HALF HITCHES\""
          }
        ],
        "callouts": [
          {
            "term": "breakout",
            "anchor": "breakout",
            "at": 0.72,
            "holdS": 1.6
          }
        ],
        "seed": 1007
      },
      {
        "id": "seal",
        "purpose": "step",
        "cue": "Two half hitches lock the end",
        "narration": "Then two half hitches round the tape behind it lock the end, so the lacing can't work loose.",
        "holdS": 0.8,
        "audioS": 4.9,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.6.a",
            "page": "34",
            "says": "\"Single or double lacing tape shall be terminated with a closing stitch as shown in Figure 9-3.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-3 (label)",
            "page": "36",
            "says": "the closing stitch: \"LOCKSTITCH PLUS TWO HALF HITCHES\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-3 (read from the figure)",
            "page": "36",
            "says": "the two half hitches are tied round the tape's own standing part between the running lockstitch and the last lockstitch"
          }
        ],
        "uncited": "\"So the lacing can't work loose\" is the tutorial's reason; NASA gives the closing stitch's form (Fig. 9-3), not its purpose.",
        "callouts": [
          {
            "term": "half-hitches",
            "anchor": "half_hitches",
            "at": 0.69,
            "holdS": 2.2
          }
        ],
        "seed": 1000
      },
      {
        "id": "tie",
        "purpose": "step",
        "cue": "Pull snug, trim the end",
        "narration": "Pull them snug and trim the single tie-off end short.",
        "holdS": 1.36,
        "audioS": 3.488,
        "sources": [
          {
            "ref": "nasa-8739.4a",
            "where": "§9.2.2",
            "page": "34",
            "says": "\"Lacing tie-ends shall be trimmed.\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "Fig. 9-3 (read from the figure)",
            "page": "36",
            "says": "one tape throughout; its one free end is labelled \"TIE-OFF END\""
          },
          {
            "ref": "nasa-8739.4a",
            "where": "§20.5.1.d(4)",
            "page": "96",
            "says": "acceptance: \"Lacing terminated with a closing stitch and ends trimmed.\""
          }
        ],
        "callouts": [
          {
            "term": "tie-off-end",
            "anchor": "tie_off_end",
            "word": "tie-off",
            "wordS": 1.8,
            "holdS": 1.5
          },
          {
            "term": "closing-stitch",
            "anchor": "closing_knot",
            "at": 0.76,
            "holdS": 1.3
          }
        ],
        "seed": 1005
      },
      {
        "id": "done",
        "purpose": "confirm",
        "cue": "One bundle, moving together",
        "narration": "Now watch the core travel: the hose, cord and sleeve flex together, held by every stitch along the run.",
        "holdS": 20.23,
        "audioS": 6.515,
        "more": [
          {
            "id": "done_tip",
            "narration": "One last tip: lace with the hose already in its working bend, and keep the tape flat, never twisted.",
            "gapS": 0.9,
            "audioS": 6.42,
            "sources": [
              {
                "ref": "navships-900171",
                "where": "§7.10 Bends",
                "page": "9-103",
                "says": "\"When bends occur in cable runs, always make the bend before lacing, to keep the bend in place (Figure 9-65).\""
              },
              {
                "ref": "wirecare",
                "where": "procedure, after the starting knot",
                "page": null,
                "says": "\"Keeping the lacing tape as flat and free of twists as possible\""
              }
            ],
            "seed": 1000
          }
        ],
        "sources": [
          {
            "ref": "navships-900171",
            "where": "§7.2 Purpose of lacing and binding",
            "page": "9-98",
            "says": "\"When the conductors are properly laced, they support each other and make a single, neat cable.\""
          }
        ],
        "uncited": "\"Held by every stitch\" describes the picture; no source states it.",
        "seed": 1005
      }
    ],
    "allowedGaps": [
      {
        "scene": "goal",
        "why": "the core travels a second before the problem line (d12); the music comes in under it, its hit on \"cable lacing\"; d27: after the last line the core finishes its third out-and-back and parks (opening tests: 3 out-and-backs, the core moving at the reveal and a second after the draw-in)",
        "maxS": 2.2
      },
      {
        "scene": "square",
        "why": "the hold after the knot is the blade’s cut and swipe sound (draft 6, approved); d28: the knot keeps its speed (x1.00: the cut already lands on the line’s last word) and the scene ends once the offcut has fallen, before the dip (draft11 test: the cut + 0.75 s before the dip), its still tail past the scene’s end",
        "maxS": 0.93
      },
      {
        "scene": "lock",
        "why": "d27: the lock run drawn at the maintainer’s pace (draft 4: lock + uturn at least 1.25 x draft 3’s 10.64 s), the tape running on into the U-turn; d29: lock takes the 0.15 s uturn gave up (uturn -> spacing at 0.25 s, no cut), so the run stays 13.30 s",
        "maxS": 1
      },
      {
        "scene": "spacing",
        "why": "the 0.4 s every scene ends with (tests storyboard: a scene’s lines end 0.4 s before its end), heard 0.51 s with the takes’ quiet edges (0.50 in d27; d28’s frame snap moved it)",
        "maxS": 0.56
      },
      {
        "scene": "close",
        "why": "d28: the closing stitch’s tape run is drawn at the one-tape test’s limit (d27 19.5 mm a frame, at most 20), so the knot is sped x1.02 only; the hold waits for the last lockstitch tied at the breakout, the camera moving along it (clock work)",
        "maxS": 2.48
      },
      {
        "scene": "seal",
        "why": "d28: the two half hitches sped x1.25 (faster, the half-hitches callout’s dot changes speed more than the callouts test’s 10 px a frame); the hold waits for the hitches laid round the tape behind it and pulled",
        "maxS": 0.93
      },
      {
        "scene": "tie",
        "why": "the hold after the half hitches is the tie-off end’s cut and swipe (draft 9: one end, NASA Fig. 9-3); d28: the pull sped x1.21 so the swipe comes ~0.25 s after the line, and the scene ends once the offcut has fallen, before the dip (draft11 test)",
        "maxS": 0.92
      },
      {
        "scene": "done",
        "why": "d27: the core travelling out after \"now watch the core travel\" (the hose, cord and sleeve flexing together) before the tip",
        "maxS": 1.2
      },
      {
        "scene": "done",
        "why": "d27: the finale’s camera finishing round the bundle and back to the whole machine after its tip (the finale pinned at draft 10’s 15.74 s)",
        "maxS": 2.2
      },
      {
        "scene": "done",
        "why": "the credits after the finale’s tip: music only (draft 11); the plan reads the tail above and the credits as one silence",
        "maxS": 13.2
      }
    ],
    "allowedRates": [
      {
        "line": "goal_fix",
        "why": "d29 default (the owner may reverse it): at the 1.20 tempo cap (tighten.ts); slower than 160 wpm only by re-voicing, which the owner ruled out (2026-11-14)",
        "min": 150
      },
      {
        "line": "lock",
        "why": "d29 default (the owner may reverse it): at the 1.20 tempo cap (tighten.ts); slower than 160 wpm only by re-voicing, which the owner ruled out (2026-11-14)",
        "min": 140
      },
      {
        "line": "seal",
        "why": "d29 default (the owner may reverse it): the take is fast (202 wpm raw, 220 tightened; tighten never slows a line); slower only by re-voicing",
        "max": 225
      }
    ],
    "music": {
      "file": "E:/proj-med/make-trim-reaper/The Reaper.wav",
      "credit": "\"The Reaper\" by Jacob Lizotte",
      "note": "royalty-free track bought by the maintainer (2026-11-09: their word); the file is not committed",
      "intro": {
        "from": 0,
        "hitInS": 2.02,
        "ringS": 0.6,
        "gainDb": -11,
        "duckDb": -26,
        "duckS": 0.5,
        "fadeAfter": "goal_why",
        "fadeS": 2
      },
      "outro": {
        "from": 286,
        "gainDb": -3,
        "fadeInS": 0.4,
        "fadeOutS": 3
      }
    },
    "loudness": {
      "I": -14,
      "TP": -1.5,
      "LRA": 11,
      "why": "practice youtube-videos SD-1 (-14 LUFS, peaks at -1 dBTP or below): the mix normalised in two passes, linear (media-anim audio/mix.ts --loudnorm; TP -1.5 keeps 0.5 dB for the AAC encode)"
    },
    "credits": {
      "title": "Lacing the LowRider 4's cables",
      "holdS": 11,
      "items": [
        {
          "role": "Code and 3D sandbox",
          "text": "LR4 Sandbox",
          "url": "https://github.com/jeyeager65/lr4-sandbox"
        },
        {
          "role": "Lacing method",
          "text": "NASA-STD-8739.4A (Change 4) §9.2, NASA Technical Standards System",
          "url": "https://standards.nasa.gov/sites/default/files/standards/NASA/A/4/nasa-std-87394a_w_change_4_0.pdf"
        },
        {
          "role": "Also drawn on",
          "text": "NAVSHIPS 900171 · US Navy rate-training manual 14160 · WireCare · Wikipedia: Cable lacing"
        },
        {
          "role": "Machine",
          "text": "V1 Engineering LowRider 4, modelled from V1E's parts",
          "url": "https://www.v1e.com"
        },
        {
          "role": "Built with",
          "text": "FreeCAD · three.js · Node.js · ffmpeg"
        },
        {
          "role": "Voice",
          "text": "Narration is a synthetic voice cloned from the creator's own voice, with his consent (Chatterbox TTS) · word timing: faster-whisper"
        },
        {
          "role": "Music",
          "text": "\"The Reaper\" by Jacob Lizotte (royalty-free licence)"
        },
        {
          "role": "Made with",
          "text": "Claude Code"
        }
      ]
    }
  };
  // </storyboard>
  // = docs/specs/lacing-tutorial.shots.json (the same `node tools/lacing_voice.js sync` writes it here; the test keeps them
  // equal; the page reads the file itself when it is served, and the tweak panel edits it): each scene's camera keys,
  // its layers' opacity tracks, the colours
  // <shots>
  const SHOTS = {
    "about": "The lacing tutorial's cameras, layer opacities and colours, read by web/js/lacing/frame.js frameAt (its copy in web/js/lacing/data.js between the <shots> markers: node tools/lacing_voice.js sync; the live preview reads this file when served). Edit with the live preview's tweak panel (index.html?anim=lacing&play=1&tweak=1) or by hand. Spec: docs/specs/lacing-tutorial.md 'Shots and knots as data'.",
    "defaults": {"lead":0.6,"layers":{"ghost":0.3,"tape":1,"hose":1,"cord":1,"sleeve":1,"context":1,"base":1}},
    "colours": {"tape":"#e01b2b","left":"#7a0812","end":"#76b900","tip":"#76b900","backdrop":null,"blade":"#eef3f7","trail":"#ffffff"},
    "tip": {"r":2.2,"minPx":40,"slide":0.2},
    "head": {"on":true,"scale":2,"maxPx":120,"seed":7,"moods":{"start":"enthusiastic","clove":"curious","square":"thinking","wrap":"neutral","tuck":"curious","tight":"serious","lock":"happy","uturn":"thinking","spacing":"concerned","close":"serious","seal":"neutral","tie":"happy","done":"happy"}},
    "rider": {"on":true,"character":"jensen","pose":"rodeo","anchor":"seat","scale":2,"maxPx":120,"push":[0.4,0.7],"onTop":false,"ghost":0.28,"lod":{"detail":false,"cover":false,"tail":false,"margin":6,"pad":0.4,"gap":1.5,"fade":0.3},"gestures":{"start":[{"gesture":"point","callout":"starting-stitch"}],"spacing":[{"gesture":"facepalm","from":0.03,"to":0.17},{"gesture":"point","callout":"stitch-spacing"}],"tie":[{"gesture":"cheer","from":0.7,"to":1}]}},
    "jensenCam": {"on":true,"corner":"tr","riderPx":200,"dist":40,"el":12,"behind":20,"lift":4,"hz":1,"fov":35,"scenes":null,"background":null,"tipMin":0.5,"onTop":true},
    "blade": {"keep":3,"r":12,"lift":3,"speed":5,"from":-1.5,"to":0.75,"trail":0.15,"width":1.5,"fade":0.6,"fall":0.6,"sfxLead":0.25,"cuts":{"square":[{"w":0.96,"end":"short"}],"tie":[{"w":0.8,"end":"tie-off"}]}},
    "knots": {"clove":{"detail":"start","w0":32,"loose":15,"draw":[0,0.7],"steps":[{"op":"start","a":-4,"w":16,"h":0.4,"loose":true},{"op":"to","pts":[[-2.6,7],[-2.33,2],[-6.4,-5.2],[-7,-6]],"loose":true},{"op":"wrap","turns":-0.875,"loose":true},{"op":"to","pts":[[-7,"-C+6"],[0,"-C"],[7,"-C-6"]],"loose":true},{"op":"wrap","turns":-0.875,"loose":true},{"op":"to","pts":[[7,"-2C+6"],[2.33,"-2C-2"],[2.6,"-2C-7"],[4,"-2C-16",0.4]],"loose":true,"under":true},{"op":"pull","from":0.7,"to":1}]},"closing":{"detail":"close","from":"tape","scenes":["close","seal","tie"],"loose":22,"win":0.35,"tighten":{"iters":200,"k":0.25,"passes":4},"focus":{"close":[-4,0],"seal":[-15,2],"tie":[-24,10]},"sequence":[{"do":"lockstitch","n":8,"what":"lockstitch 8, shown tied as the model left it","until":0,"context":true,"steps":[{"op":"start","a":-50,"w":0},{"op":"to","pts":[[-44,0],[-36.5,0],[-33.5,1],[-32,4],[-31,9]],"what":"lockstitch 8: the tape on along the bundle to it"},{"op":"wrap","to":"C-9","a":-29,"what":"lockstitch 8: one turn round the bundle"},{"op":"to","pts":[[-29,"C-5"],[-32,"C-4.5"],[-36,"C-3"],[-37.5,"C"],[-37,"C+3.5"]],"what":"lockstitch 8: the end over its standing part"},{"op":"to","pts":[[-34.5,"C+6.5"],[-32,"C+7"],[-29.5,"C+6"]],"under":true,"what":"lockstitch 8: under the turn's start"}]},{"do":"pull","what":"lockstitch 8 pulled snug","from":0,"to":0.005},{"do":"lockstitch","n":9,"what":"lockstitch 9, the last: on along H, one turn laid loose, the end over H, then under the turn's start","steps":[{"op":"to","pts":[[-20,"C"],[-10,"C"],[-3,"C"],[0,"C+1"],[1.5,"C+4"],[2.5,"C+9"]],"until":0.2,"what":"lockstitch 9: the tape on along the bundle (H)","from":0.005},{"op":"wrap","to":"2C-9","a":4.5,"loose":true,"until":0.5,"what":"lockstitch 9: one turn round the bundle (loose)"},{"op":"to","pts":[[4.5,"2C-5",0,0.8],[1.5,"2C-4.5",0,0.5],[-2.5,"2C-3",0,0.3],[-4,"2C",0,0.25],[-3.5,"2C+3.5",0,0.1]],"loose":true,"until":0.6,"what":"lockstitch 9: the end over the standing part"},{"op":"to","pts":[[-1,"2C+6.5"],[1.5,"2C+7"],[4,"2C+6"]],"under":true,"until":0.7,"what":"lockstitch 9: under the turn's start (the lock)"}]},{"do":"pull","what":"lockstitch 9 pulled snug","from":0.72,"to":0.95},{"do":"bight","what":"a bight back over lockstitch 9","steps":[{"op":"to","pts":[[6,"2C+9"],[5.5,"2C+16"],[1,"2C+22"],[-4,"2C+19"],[-6,"2C+12"]],"loose":5,"from":1,"until":1.021,"what":"a bight back over the lockstitch"}]},{"do":"halfHitch","n":1,"what":"half hitch 1, tied first, nearer the stitch: down over H, round under H, up over its own leg","steps":[{"op":"to","pts":[[-7,"2C+11",0,0.8],[-9.5,"2C+6",0,0.5],[-12.5,"2C",0,0.3],[-13.5,"2C-7",0,0]],"snug":[[-6.8,"2C+6.8"],[-9.1,"2C+3.4"],[-11.3,"2C"],[-11.7,"2C-3"]],"loose":5,"until":1.084,"what":"half hitch 1: down over H"},{"op":"to","pts":[[-11.5,"2C-10.5"],[-7.5,"2C-8"],[-6.5,"2C"],[-7,"2C+3.5"]],"snug":[[-8.7,"2C-4.5"],[-7.2,"2C-2.6"],[-7,"2C"],[-7.2,"2C+1.5"]],"under":true,"until":1.179,"what":"half hitch 1: round under H"},{"op":"to","pts":[[-7.8,"2C+5.2"],[-9.5,"2C+8.5"],[-13.5,"2C+12"]],"snug":[[-7.6,"2C+2.3"],[-9.1,"2C+3.8"],[-10.9,"2C+6"]],"until":1.329,"what":"half hitch 1: up over its own leg"}]},{"do":"halfHitch","n":2,"what":"half hitch 2, 10 mm further along H","steps":[{"op":"to","pts":[[-16,"2C+14",0,0.8],[-18,"2C+10.5",0,0.6],[-20,"2C+6",0,0.45],[-22.5,"2C",0,0.3],[-23.5,"2C-7",0,0]],"snug":[[-15.9,"2C+7.5"],[-17.8,"2C+6.4"],[-19.3,"2C+3.4"],[-21.2,"2C"],[-21.6,"2C-3"]],"loose":5,"from":1.458,"until":1.718,"what":"half hitch 2: down over H"},{"op":"to","pts":[[-21.5,"2C-10.5"],[-17.5,"2C-8"],[-16.5,"2C"],[-17,"2C+3.5"]],"snug":[[-18.6,"2C-4.5"],[-17.1,"2C-2.6"],[-16.8,"2C"],[-17.1,"2C+1.5"]],"under":true,"until":1.852,"what":"half hitch 2: round under H"},{"op":"to","pts":[[-17.8,"2C+5.2"],[-19.5,"2C+8.5"],[-24,"2C+11.5"]],"snug":[[-17.4,"2C+2.3"],[-18.9,"2C+3.8"],[-21.2,"2C+5.3"]],"until":1.935,"what":"half hitch 2: up over its own leg"}]},{"do":"tieOff","what":"the tie-off end","steps":[{"op":"to","pts":[[-25.5,"2C+13.5",0.5],[-26,"2C+18",1.5],[-26,"2C+25",2.5]],"snug":[[-24.5,"2C+10"],[-25,"2C+16"],[-25,"2C+24"]],"loose":5,"end":"tie-off","from":1.963,"until":1.993,"what":"the tie-off end"}]},{"do":"pull","what":"the half hitches pulled snug, with the bight","from":2.05,"to":2.55,"out":3},{"do":"trim","what":"the tie-off end trimmed","end":"tie-off"}]},"square":{"use":"reef","detail":"start","unit":2.4,"h0":1.6,"sx":"screen","strands":[{"steps":[{"op":"start","a":-2.4,"w":0.45},{"op":"to","pts":[[-1.2,0.56],[-0.3,0.72],[1,1]]},{"op":"arc","c":[1,0],"r":1,"from":90,"sweep":-180},{"op":"to","pts":[[1,-1],[-0.3,-0.72],[-1.2,-0.56],[-2.4,-0.45]]}]},{"alternate":"under","steps":[{"op":"start","a":2.4,"w":0.45},{"op":"to","pts":[[1.2,0.56],[0.3,0.72],[-1,1]]},{"op":"arc","c":[-1,0],"r":1,"from":90,"sweep":180},{"op":"to","pts":[[-1,-1],[0.3,-0.72],[1.2,-0.56],[2.4,-0.45]]}]}]}},
    "scenes": {
      "goal": {"camera":{"clock":"share","path":"spline","keys":[{"x":0,"focus":{"point":[800,760,240]},"frame":"world","az":140,"el":28,"dist":640},{"x":0.25,"focus":{"point":[810,760,240]},"frame":"world","az":114,"el":54,"dist":620},{"x":0.5,"focus":{"point":[800,760,245]},"frame":"world","az":96,"el":50,"dist":600},{"x":0.7,"focus":{"point":[740,755,252]},"frame":"world","az":88,"el":54,"dist":560},{"x":0.88,"focus":{"point":[680,750,258]},"frame":"world","az":81,"el":59,"dist":510},{"x":1,"focus":{"point":[643,749,261]},"frame":"world","az":76,"el":63,"dist":470}]},"layers":{"ghost":0.7}},
      "start": {"camera":{"keys":[{"x":0,"focus":{"stitch":0},"frame":"world","az":74.054604,"el":69.998216,"dist":240}]},"layers":{"ghost":[[0.6,0.7],[1.2,0.3,"out"]]}},
      "clove": {"camera":{"keys":[{"x":0,"focus":{"surface":"start","a":0,"w":32,"lift":3},"frame":"surface","az":16.699244,"el":23.317097,"fit":40}]},"layers":{"hose":0.45}},
      "square": {"lead":1.2,"camera":{"keys":[{"x":0,"focus":{"surface":"start","a":0,"w":0,"lift":3},"frame":"surface","az":0,"el":0,"fit":14}]},"layers":{"hose":0.45,"context":[[0,1],[0.6,0.3,"out"]],"base":[[0,1],[0.6,0.3,"out"]]}},
      "wrap": {"camera":{"keys":[{"x":0,"focus":{"detail":"lock","aim":0.5},"frame":"detail:lock","az":24.227745,"el":26.636366,"fit":60}]}},
      "tuck": {"camera":{"keys":[{"x":0,"focus":"cross","frame":"detail:lock","az":24.227745,"el":26.636366,"fit":36}]}},
      "tight": {"camera":{"keys":[{"x":0,"focus":{"detail":"lock","aim":0.2},"frame":"detail:lock","az":26.565051,"el":56.145485,"fit":60}]}},
      "lock": {"camera":{"keys":[{"x":0,"focus":{"tape":0.6},"frame":"world","az":74.054604,"el":69.998216,"dist":250}]},"layers":{"ghost":[[0,0.3],[0.6,0.1,"out"]]}},
      "uturn": {"camera":{"keys":[{"x":0,"focus":{"tape":0.6},"frame":"world","az":74.054604,"el":69.998216,"dist":250}]},"layers":{"ghost":0.1}},
      "spacing": {"camera":{"keys":[{"x":0,"focus":"bracket","frame":"world","az":74.054604,"el":69.998216,"dist":300}]},"layers":{"ghost":[[0,0.1],[0.6,0.3,"out"]]}},
      "close": {"camera":{"clock":"work","dist":"log","keys":[{"x":0,"focus":{"surface":"close","a":-10,"w":7,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":52},{"x":0.3,"focus":{"surface":"close","a":-2,"w":7,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":52,"ease":"smooth"},{"x":0.72,"focus":{"surface":"close","a":-1,"w":10,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":24,"ease":"smooth"}]}},
      "seal": {"camera":{"clock":"work","dist":"log","keys":[{"x":0,"focus":{"surface":"close","a":-10,"w":9,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":34},{"x":0.021,"focus":{"surface":"close","a":-10,"w":1.5,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":21,"ease":"smooth"},{"x":0.329,"focus":{"surface":"close","a":-10,"w":1.5,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":21,"ease":"smooth"},{"x":0.55,"focus":{"surface":"close","a":-20,"w":1.5,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":21,"ease":"smooth"},{"x":0.96,"focus":{"surface":"close","a":-20,"w":1.5,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":21,"ease":"smooth"},{"x":0.993,"focus":{"surface":"close","a":-16,"w":11,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":24,"ease":"smooth"}]},"layers":{"hose":[[0,1],[0.6,0.45,"out"]],"context":[[0,1],[0.6,0.2,"out"]]}},
      "tie": {"camera":{"keys":[{"x":0,"focus":{"surface":"close","a":-16,"w":11,"lift":3},"frame":"surface","az":11.309932,"el":16.392523,"fit":24}]},"layers":{"hose":0.45,"context":0.2}},
      "done": {"camera":{"clock":"share","time":"smooth","path":"spline","keys":[{"x":0,"focus":{"uturn":{"back":40,"r":110}},"frame":"world","az":-60,"el":38,"fit":140},{"x":0.18,"focus":{"uturn":{"back":40,"r":110}},"frame":"world","az":20,"el":14,"fit":120},{"x":0.38,"focus":{"uturn":{"back":40,"r":110}},"frame":"world","az":100,"el":10,"fit":150},{"x":0.55,"focus":{"uturn":{"back":50,"r":130}},"frame":"world","az":180,"el":8,"fit":170},{"x":0.78,"focus":{"point":[600,500,-250]},"frame":"world","az":250,"el":3,"fit":620},{"x":1,"focus":"machine","frame":"world","az":282,"el":6,"fitFocus":0.85}]},"layers":{"tape":0,"ghost":0}}
    }
  };
  // </shots>
  // = docs/specs/lacing-tutorial.words.json's lines (d29: each voice line's words, s into the wav the video plays, for
  // the face rig's lip sync; tools/lacing_words.js), written here by `node tools/lacing_voice.js sync`
  // <words>
  const WORDS = {
    "goal": [{"w":"loose","t0":0.35,"t1":0.967},{"w":"cables","t0":0.967,"t1":1.237},{"w":"on","t0":1.237,"t1":1.449},{"w":"a","t0":1.449,"t1":1.545},{"w":"low","t0":1.545,"t1":1.699},{"w":"rider","t0":1.699,"t1":1.912},{"w":"flat","t0":1.912,"t1":2.22},{"w":"snag","t0":2.33,"t1":2.434},{"w":"and","t0":2.434,"t1":2.745},{"w":"chafe","t0":2.745,"t1":3.47},{"w":"and","t0":3.55,"t1":3.622},{"w":"can","t0":3.622,"t1":3.766},{"w":"yank","t0":3.766,"t1":4.03},{"w":"a","t0":4.03,"t1":4.198},{"w":"plug","t0":4.198,"t1":4.51},{"w":"mid","t0":4.51,"t1":4.798},{"w":"cut","t0":4.798,"t1":5.11}],
    "goal_fix": [{"w":"the","t0":0.03,"t1":0.255},{"w":"fix","t0":0.255,"t1":0.62},{"w":"cable","t0":0.92,"t1":1.179},{"w":"lacing","t0":1.179,"t1":1.75},{"w":"the","t0":1.84,"t1":1.877},{"w":"method","t0":1.877,"t1":2.176},{"w":"nasa","t0":2.176,"t1":2.474},{"w":"specifies","t0":2.474,"t1":3.052},{"w":"for","t0":3.052,"t1":3.5},{"w":"its","t0":3.59,"t1":3.711},{"w":"mission","t0":3.711,"t1":4.049},{"w":"hardware","t0":4.049,"t1":4.58}],
    "goal_why": [{"w":"tight","t0":0.05,"t1":0.44},{"w":"tidy","t0":0.73,"t1":1.17},{"w":"tough","t0":1.39,"t1":1.74},{"w":"one","t0":2.01,"t1":2.251},{"w":"tape","t0":2.251,"t1":2.58},{"w":"no","t0":2.73,"t1":2.847},{"w":"sharp","t0":2.847,"t1":3.15},{"w":"zip","t0":3.15,"t1":3.36},{"w":"tie","t0":3.36,"t1":3.64},{"w":"tails","t0":3.64,"t1":4.06},{"w":"and","t0":4.14,"t1":4.282},{"w":"one","t0":4.282,"t1":4.448},{"w":"cut","t0":4.448,"t1":4.66},{"w":"stitch","t0":4.66,"t1":5.086},{"w":"wont","t0":5.086,"t1":5.607},{"w":"unravel","t0":5.607,"t1":5.914},{"w":"the","t0":5.914,"t1":6.127},{"w":"rest","t0":6.127,"t1":6.34}],
    "start": [{"w":"following","t0":0.05,"t1":0.408},{"w":"nasas","t0":0.408,"t1":0.865},{"w":"lacing","t0":0.865,"t1":1.223},{"w":"standard","t0":1.223,"t1":1.76},{"w":"start","t0":2.05,"t1":2.29},{"w":"beside","t0":2.29,"t1":2.622},{"w":"the","t0":2.622,"t1":2.825},{"w":"cores","t0":2.825,"t1":3.176},{"w":"last","t0":3.176,"t1":3.398},{"w":"zip","t0":3.398,"t1":3.619},{"w":"tie","t0":3.619,"t1":3.896},{"w":"with","t0":3.896,"t1":4.21},{"w":"a","t0":4.3,"t1":4.466},{"w":"spot","t0":4.466,"t1":4.679},{"w":"tie","t0":4.679,"t1":5.011},{"w":"around","t0":5.011,"t1":5.295},{"w":"all","t0":5.295,"t1":5.651},{"w":"three","t0":5.651,"t1":6.03}],
    "clove": [{"w":"two","t0":0.05,"t1":0.307},{"w":"turns","t0":0.307,"t1":0.64},{"w":"the","t0":0.91,"t1":1.012},{"w":"second","t0":1.012,"t1":1.319},{"w":"crossing","t0":1.319,"t1":1.78},{"w":"over","t0":2.01,"t1":2.196},{"w":"the","t0":2.196,"t1":2.358},{"w":"first","t0":2.358,"t1":2.73},{"w":"ends","t0":3.02,"t1":3.45},{"w":"tucked","t0":3.71,"t1":3.971},{"w":"under","t0":3.971,"t1":4.319},{"w":"the","t0":4.319,"t1":4.471},{"w":"cross","t0":4.471,"t1":4.71},{"w":"a","t0":4.82,"t1":4.896},{"w":"clove","t0":4.896,"t1":5.183},{"w":"hitch","t0":5.183,"t1":5.374},{"w":"grips","t0":5.374,"t1":5.87},{"w":"without","t0":6.01,"t1":6.623},{"w":"slipping","t0":6.623,"t1":7.06}],
    "square": [{"w":"secure","t0":0.07,"t1":0.573},{"w":"it","t0":0.573,"t1":0.755},{"w":"with","t0":0.755,"t1":0.916},{"w":"a","t0":0.916,"t1":1.016},{"w":"square","t0":1.016,"t1":1.258},{"w":"knot","t0":1.258,"t1":1.54},{"w":"right","t0":1.78,"t1":2.166},{"w":"over","t0":2.166,"t1":2.407},{"w":"left","t0":2.407,"t1":2.68},{"w":"then","t0":3.03,"t1":3.418},{"w":"left","t0":3.418,"t1":3.571},{"w":"over","t0":3.571,"t1":3.779},{"w":"right","t0":3.779,"t1":4.07},{"w":"pull","t0":4.35,"t1":4.685},{"w":"snug","t0":4.685,"t1":4.894},{"w":"and","t0":4.894,"t1":5.25},{"w":"trim","t0":5.69,"t1":5.898},{"w":"the","t0":5.898,"t1":6.106},{"w":"short","t0":6.106,"t1":6.337},{"w":"end","t0":6.337,"t1":6.73}],
    "wrap": [{"w":"each","t0":0.05,"t1":0.47},{"w":"lock","t0":0.55,"t1":0.897},{"w":"stitch","t0":0.897,"t1":1.211},{"w":"begins","t0":1.211,"t1":1.491},{"w":"with","t0":1.491,"t1":1.706},{"w":"one","t0":1.706,"t1":1.921},{"w":"loose","t0":1.921,"t1":2.119},{"w":"turn","t0":2.119,"t1":2.317},{"w":"of","t0":2.317,"t1":2.449},{"w":"tape","t0":2.449,"t1":2.664},{"w":"around","t0":2.664,"t1":2.945},{"w":"the","t0":2.945,"t1":3.06},{"w":"hose","t0":3.06,"t1":3.292},{"w":"and","t0":3.292,"t1":3.82},{"w":"both","t0":4.19,"t1":4.497},{"w":"cables","t0":4.497,"t1":5.11}],
    "tuck": [{"w":"bring","t0":0.05,"t1":0.237},{"w":"the","t0":0.237,"t1":0.382},{"w":"end","t0":0.382,"t1":0.506},{"w":"back","t0":0.506,"t1":0.88},{"w":"over","t0":0.97,"t1":1.314},{"w":"its","t0":1.314,"t1":1.495},{"w":"standing","t0":1.495,"t1":1.82},{"w":"part","t0":1.82,"t1":2.2},{"w":"then","t0":2.55,"t1":2.734},{"w":"under","t0":2.734,"t1":2.959},{"w":"the","t0":2.959,"t1":3.122},{"w":"turn","t0":3.122,"t1":3.49},{"w":"one","t0":3.71,"t1":3.953},{"w":"cut","t0":3.953,"t1":4.218},{"w":"stitch","t0":4.218,"t1":4.638},{"w":"wont","t0":4.638,"t1":5.102},{"w":"unravel","t0":5.102,"t1":5.478},{"w":"the","t0":5.478,"t1":5.765},{"w":"rest","t0":5.765,"t1":6.03}],
    "tight": [{"w":"pull","t0":0.05,"t1":0.297},{"w":"the","t0":0.297,"t1":0.499},{"w":"end","t0":0.499,"t1":0.701},{"w":"along","t0":0.701,"t1":0.993},{"w":"the","t0":0.993,"t1":1.173},{"w":"hose","t0":1.173,"t1":1.51},{"w":"the","t0":1.87,"t1":1.932},{"w":"loop","t0":1.932,"t1":2.041},{"w":"closes","t0":2.041,"t1":2.368},{"w":"down","t0":2.368,"t1":2.711},{"w":"and","t0":2.711,"t1":3.24},{"w":"grips","t0":3.55,"t1":3.854},{"w":"the","t0":3.854,"t1":4.131},{"w":"bundle","t0":4.131,"t1":4.49}],
    "lock": [{"w":"repeat","t0":0.05,"t1":0.375},{"w":"along","t0":0.375,"t1":0.635},{"w":"the","t0":0.635,"t1":0.787},{"w":"hose","t0":0.787,"t1":1.09},{"w":"one","t0":1.43,"t1":1.693},{"w":"lock","t0":1.693,"t1":1.913},{"w":"stitch","t0":1.913,"t1":2.33},{"w":"every","t0":2.48,"t1":2.995},{"w":"68mm","t0":2.995,"t1":3.84},{"w":"each","t0":4.03,"t1":4.351},{"w":"pulled","t0":4.351,"t1":4.672},{"w":"snug","t0":4.672,"t1":5.13},{"w":"before","t0":5.35,"t1":5.756},{"w":"the","t0":5.756,"t1":5.886},{"w":"next","t0":5.886,"t1":6.13}],
    "uturn": [{"w":"keep","t0":0.05,"t1":0.274},{"w":"the","t0":0.274,"t1":0.476},{"w":"same","t0":0.476,"t1":0.767},{"w":"spacing","t0":0.767,"t1":1.35},{"w":"round","t0":1.68,"t1":1.822},{"w":"the","t0":1.822,"t1":1.936},{"w":"u","t0":1.936,"t1":2.063},{"w":"turn","t0":2.063,"t1":2.291},{"w":"and","t0":2.291,"t1":2.66},{"w":"back","t0":2.9,"t1":3.206},{"w":"along","t0":3.206,"t1":3.511},{"w":"the","t0":3.511,"t1":3.723},{"w":"lower","t0":3.723,"t1":3.934},{"w":"run","t0":3.934,"t1":4.31},{"w":"the","t0":4.67,"t1":4.776},{"w":"tape","t0":4.776,"t1":5.031},{"w":"flat","t0":5.031,"t1":5.308},{"w":"on","t0":5.308,"t1":5.563},{"w":"top","t0":5.563,"t1":5.86}],
    "spacing": [{"w":"never","t0":0.03,"t1":0.303},{"w":"leave","t0":0.303,"t1":0.597},{"w":"more","t0":0.597,"t1":0.828},{"w":"than","t0":0.828,"t1":1.016},{"w":"76mm","t0":1.016,"t1":2.171},{"w":"between","t0":2.171,"t1":2.737},{"w":"stitches","t0":2.737,"t1":3.22},{"w":"or","t0":3.51,"t1":3.775},{"w":"the","t0":3.775,"t1":3.918},{"w":"cables","t0":3.918,"t1":4.225},{"w":"sag","t0":4.225,"t1":4.654},{"w":"away","t0":4.654,"t1":4.878},{"w":"from","t0":4.878,"t1":5.103},{"w":"the","t0":5.103,"t1":5.225},{"w":"hose","t0":5.225,"t1":5.45}],
    "close": [{"w":"just","t0":0.05,"t1":0.288},{"w":"before","t0":0.288,"t1":0.634},{"w":"the","t0":0.634,"t1":0.807},{"w":"sleeve","t0":0.807,"t1":1.131},{"w":"leaves","t0":1.131,"t1":1.434},{"w":"the","t0":1.434,"t1":1.629},{"w":"hose","t0":1.629,"t1":1.91},{"w":"the","t0":2.12,"t1":2.189},{"w":"breakout","t0":2.189,"t1":2.88},{"w":"tie","t0":2.95,"t1":3.079},{"w":"one","t0":3.079,"t1":3.414},{"w":"last","t0":3.414,"t1":3.775},{"w":"lock","t0":3.775,"t1":4.059},{"w":"stitch","t0":4.059,"t1":4.42}],
    "seal": [{"w":"then","t0":0.05,"t1":0.232},{"w":"two","t0":0.232,"t1":0.495},{"w":"half","t0":0.495,"t1":0.737},{"w":"hitches","t0":0.737,"t1":1.162},{"w":"round","t0":1.162,"t1":1.364},{"w":"the","t0":1.364,"t1":1.525},{"w":"tape","t0":1.525,"t1":1.768},{"w":"behind","t0":1.768,"t1":2.091},{"w":"it","t0":2.091,"t1":2.273},{"w":"lock","t0":2.273,"t1":2.455},{"w":"the","t0":2.455,"t1":2.697},{"w":"end","t0":2.697,"t1":2.94},{"w":"so","t0":3.22,"t1":3.434},{"w":"the","t0":3.434,"t1":3.585},{"w":"lacing","t0":3.585,"t1":3.928},{"w":"cant","t0":3.928,"t1":4.4},{"w":"work","t0":4.4,"t1":4.55},{"w":"loose","t0":4.55,"t1":4.85}],
    "tie": [{"w":"pull","t0":0.05,"t1":0.203},{"w":"him","t0":0.203,"t1":0.326},{"w":"snug","t0":0.326,"t1":0.524},{"w":"and","t0":0.524,"t1":0.8},{"w":"trim","t0":0.9,"t1":1.171},{"w":"the","t0":1.171,"t1":1.467},{"w":"single","t0":1.467,"t1":1.91},{"w":"tie","t0":2.04,"t1":2.381},{"w":"off","t0":2.381,"t1":2.536},{"w":"end","t0":2.536,"t1":2.83},{"w":"short","t0":2.98,"t1":3.45}],
    "done": [{"w":"now","t0":0.05,"t1":0.417},{"w":"watch","t0":0.417,"t1":0.741},{"w":"the","t0":0.741,"t1":1.021},{"w":"core","t0":1.021,"t1":1.258},{"w":"travel","t0":1.258,"t1":1.69},{"w":"the","t0":1.95,"t1":2.037},{"w":"hose","t0":2.037,"t1":2.59},{"w":"cord","t0":2.84,"t1":2.884},{"w":"and","t0":2.884,"t1":3.213},{"w":"sleeve","t0":3.213,"t1":3.519},{"w":"flex","t0":3.519,"t1":3.826},{"w":"together","t0":3.826,"t1":4.418},{"w":"held","t0":4.703,"t1":4.834},{"w":"by","t0":4.834,"t1":5.053},{"w":"every","t0":5.053,"t1":5.382},{"w":"stitch","t0":5.382,"t1":5.755},{"w":"along","t0":5.755,"t1":6.039},{"w":"the","t0":6.039,"t1":6.193},{"w":"run","t0":6.193,"t1":6.39}],
    "done_tip": [{"w":"one","t0":0.05,"t1":0.259},{"w":"last","t0":0.259,"t1":0.449},{"w":"tip","t0":0.449,"t1":0.81},{"w":"lace","t0":1.16,"t1":1.318},{"w":"with","t0":1.318,"t1":1.61},{"w":"the","t0":1.61,"t1":1.723},{"w":"hose","t0":1.723,"t1":2.083},{"w":"already","t0":2.083,"t1":2.489},{"w":"in","t0":2.489,"t1":2.737},{"w":"its","t0":2.737,"t1":2.872},{"w":"working","t0":2.872,"t1":3.277},{"w":"bend","t0":3.277,"t1":3.75},{"w":"and","t0":3.89,"t1":4.27},{"w":"keep","t0":4.27,"t1":4.442},{"w":"the","t0":4.442,"t1":4.598},{"w":"tape","t0":4.598,"t1":4.788},{"w":"flat","t0":4.788,"t1":5.15},{"w":"never","t0":5.47,"t1":5.687},{"w":"twisted","t0":5.687,"t1":6.37}]
  };
  // </words>
  const api = { STORYBOARD, SHOTS, WORDS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LR4Lacing = root.LR4Lacing || {}).data = api;
})(typeof self !== "undefined" ? self : this);
