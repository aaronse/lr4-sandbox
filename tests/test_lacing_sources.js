// The cable-lacing tutorial's citations (docs/specs/lacing-tutorial.storyboard.json `references` and each scene's and
// later line's `sources` / `uncited`): every line cited or said to be the tutorial's own, every ref a reference, a
// standard cited by section, table or figure and page, no "marline" put in NASA's mouth (its text never uses the word),
// and the transcript carrying the storyboard's sources (node tools/lacing_voice.js transcript).
//   node tests/test_lacing_sources.js
"use strict";
const fs = require("fs"), path = require("path");
const { citeOf, hasMediaAnim, MEDIA_ANIM } = require("../tools/lacing_voice.js");
// (citeOf is media-anim tools/publish/exports.mjs's: without the sibling, as on CI, the sources' equality is skipped)
const MA = hasMediaAnim();
if (!MA) console.log(`(no media-anim at ${MEDIA_ANIM}: the transcript's sources = citeOf checks skipped)`);

const ROOT = path.join(__dirname, "..");
const sb = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.storyboard.json"), "utf8"));
const tr = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "specs", "lacing-tutorial.transcript.json"), "utf8"));
let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("FAIL " + msg); } };

// ---- the references: unique ids, each with a title, a revision, a url and a known kind ----
const refs = new Map((sb.references || []).map((r) => [r.id, r]));
ok(refs.size > 0 && refs.size === sb.references.length, "references: present, ids unique");
for (const r of sb.references || [])
  ok(r.title && r.revision && /^https?:\/\//.test(r.url) && ["standard", "manual", "guide", "wiki"].includes(r.kind), `reference ${r.id}: ${JSON.stringify(r)}`);

// ---- every scene and every later line: sources, or a reason none is cited ----
const lines = sb.scenes.flatMap((s) => [s, ...(s.more || [])]);
let n = 0;
for (const l of lines) {
  const src = l.sources || [];
  ok((Array.isArray(l.sources) && src.length > 0) || (typeof l.uncited === "string" && l.uncited.trim()), `${l.id}: no sources and no uncited`);
  for (const q of src) {
    n++;
    const r = refs.get(q.ref);
    ok(r, `${l.id}: ref "${q.ref}" is not in references`);
    ok(typeof q.where === "string" && q.where && typeof q.says === "string" && q.says, `${l.id}: ${q.ref} wants where and says`);
    // a standard: where names a section, table or figure, with its page
    if (r && r.kind === "standard") ok(/§\s*\d|Table \d|Fig\. \d/.test(q.where) && q.page, `${l.id}: ${q.ref} "${q.where}" p. ${q.page}: a standard wants §, Table or Fig. and a page`);
    // "marline" is Wikipedia's (citing BuWeps 1962) and the Navy manual's word, never NASA's
    ok(!(q.ref === "nasa-8739.4a" && /marline/i.test(q.says + " " + q.where)), `${l.id}: "marline" attributed to NASA`);
  }
}

// ---- the transcript carries the storyboard's sources (the same citeOf the transcript is made with) ----
ok(tr.entries.length === sb.scenes.length, "transcript: one entry a scene");
for (const [i, s] of sb.scenes.entries()) {
  const e = tr.entries[i] || {};
  ok(e.id === s.id && (!MA || JSON.stringify(e.sources) === JSON.stringify(citeOf(sb, s))), `transcript ${s.id}: its sources differ from the storyboard's (node tools/lacing_voice.js transcript)`);
  ok((e.uncited || null) === (s.uncited || null), `transcript ${s.id}: its uncited differs`);
  for (const m of s.more || []) {
    const em = (e.more || []).find((x) => x.id === m.id) || {};
    ok(!MA || JSON.stringify(em.sources) === JSON.stringify(citeOf(sb, m)), `transcript ${m.id}: its sources differ from the storyboard's`);
  }
  for (const q of e.sources || []) ok(q.url === (refs.get(q.ref) || {}).url, `transcript ${s.id}: ${q.ref} url`);
}

console.log(`${checks - fails}/${checks} checks passed (${lines.length} lines, ${n} sources, ${refs.size} references)`);
process.exit(fails ? 1 : 0);
