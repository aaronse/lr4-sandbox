// Vendor the minified bundles of the two private paid sibling repos (media-mesh, media-anim) into this public repo, unmodified:
// the page loads them with script tags (web/js/lib/<repo>/), the Node tools require() them (tools/lib/media-anim/), and the
// public page can't reach the private siblings. Never their source (media-mesh docs/LAYOUT.md decisions 3-5, FORK.md F5): each
// bundle starts with a notice, LICENSE-BUNDLE.md and SOURCE.json (the version, the commit, the sha256 of every built file) come
// with them. Change a sibling, release it (or build it: npm run build there), then run this.
//   media-mesh   media-mesh-core.min.js, then media-mesh-knots.min.js: MediaMesh.vec3 .curve .knot .bundle .body .rope .knotdet .clearance
//   media-anim   media-anim-runtime.min.js: MediaAnim.timeline .camera .reveal .swing .tube .halo .callout .credits .occluder .player .tweak
//                .chase .inset
//                media-anim-characters.min.js: MediaAnim.faceRig .faceOverlay .body .bodyOverlay .cast (+ jensen-head-only.svg,
//                jensen-torso.svg: the art they draw)
//                tools/lib/media-anim/media-anim-browser.min.js: the browser lock, require() in Node
// A page's bundles come from a GitHub Release of the sibling (MEDIA_MESH_TAG, MEDIA_ANIM_TAG: fetched with gh), or, until it
// publishes one, from the sibling's own build (../<repo>/dist).
//   node tools/sync_media.js                   (writes; lists what changed)
//   node tools/sync_media.js --check           (exit 1 if a vendored file is not the sha256 its SOURCE.json lists; offline, so CI needs no sibling)
//   node tools/sync_media.js --release v0.1.0  (both repos from that release instead of their pinned tags)
//   node tools/sync_media.js --local           (both from the siblings' dist/ even when a tag is pinned)
// MEDIA_ROOT=<dir> overrides where the siblings are (default: this repo's parent).
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process"), crypto = require("crypto"), os = require("os");

const ROOT = path.join(__dirname, "..");
const MEDIA_ROOT = process.env.MEDIA_ROOT || path.join(ROOT, "..");
const MEDIA_MESH_TAG = "";                       // the pinned releases (v0.1.0 ...): set when one is published
const MEDIA_ANIM_TAG = "";

const check = process.argv.includes("--check");
const lf = (b) => b.toString("latin1").replace(/\r\n/g, "\n");
// (of the LF form, as SOURCE.json lists it: a Windows checkout with core.autocrlf has the copies in CRLF)
const sha256 = (b) => crypto.createHash("sha256").update(Buffer.from(lf(b), "latin1")).digest("hex");
const flag = (n) => { const i = process.argv.indexOf(n); return i < 0 ? undefined : process.argv[i + 1]; };
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const differs = [], missing = [];

// each vendored folder: the repo it comes from, and its files (the vendored name -> its key in the sibling's dist/ and SOURCE.json)
const COMMON = { "LICENSE-BUNDLE.md": "LICENSE-BUNDLE.md", "SOURCE.json": "SOURCE.json" };
const SETS = [
  { repo: "media-mesh", slug: "aaronse/media-mesh", tag: MEDIA_MESH_TAG, dst: "web/js/lib/media-mesh",
    files: { "media-mesh-core.min.js": "umd/media-mesh-core.min.js", "media-mesh-knots.min.js": "umd/media-mesh-knots.min.js", ...COMMON },
    how: ["In a page: `<script src=\"js/lib/media-mesh/media-mesh-core.min.js\">`, then `media-mesh-knots.min.js` (`MediaMesh.vec3 .curve`, then `.knot .bundle .body .rope .knotdet .clearance`).",
      "In Node: `require(\"media-mesh-core.min.js\").vec3`, `require(\"media-mesh-knots.min.js\").rope` (the knots file requires the core file beside it)."] },
  { repo: "media-anim", slug: "aaronse/media-anim", tag: MEDIA_ANIM_TAG, dst: "web/js/lib/media-anim",
    files: { "media-anim-runtime.min.js": "umd/media-anim-runtime.min.js", "media-anim-characters.min.js": "umd/media-anim-characters.min.js",
      "jensen-head-only.svg": "assets/jensen-head-only.svg", "jensen-torso.svg": "assets/jensen-torso.svg", ...COMMON },
    how: ["In a page: `<script src=\"js/lib/media-anim/media-anim-runtime.min.js\">` (`MediaAnim.timeline .camera .reveal .swing .tube .halo .callout .credits .occluder .player .tweak .chase .inset`),",
      "and `media-anim-characters.min.js` (`MediaAnim.faceRig .faceOverlay .body .bodyOverlay .cast`; they draw `jensen-head-only.svg` and `jensen-torso.svg`, fetched beside them)."] },
  { repo: "media-anim", slug: "aaronse/media-anim", tag: MEDIA_ANIM_TAG, dst: "tools/lib/media-anim",
    files: { "media-anim-browser.min.js": "umd/media-anim-browser.min.js", ...COMMON },
    how: ["In Node: `require(\"./lib/media-anim/media-anim-browser.min.js\").acquire(...)`: the browser lock (one headless browser at a time; the same lock file as media-anim's tools)."] },
];

// where a repo's files are: { from, file(key), dir? } (dir: a temp folder to remove), null when there is neither a release nor a build
const sources = new Map();
function sourceOf(set) {
  if (sources.has(set.repo)) return sources.get(set.repo);
  const tag = flag("--release") || (process.argv.includes("--local") ? "" : set.tag);
  let src = null;
  if (tag) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `${set.repo}-release-`));
    const r = cp.spawnSync("gh", ["release", "download", tag, "-R", set.slug, "-D", dir, "-p", `${set.repo}-*.min.js`, "-p", "jensen-head-only.svg", "-p", "jensen-torso.svg", "-p", "LICENSE-BUNDLE.md", "-p", "SOURCE.json"], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`gh release download ${tag} (${set.slug}) failed: ${(r.stderr || (r.error && r.error.message) || "").trim()}\n(needs read access to the repo, and gh auth login)`);
    src = { from: `release ${tag}`, file: (key) => path.join(dir, path.basename(key)), dir };
  } else {
    const dist = path.join(MEDIA_ROOT, set.repo, "dist");
    if (fs.existsSync(path.join(dist, "SOURCE.json"))) src = { from: `the sibling's build (${dist})`, file: (key) => path.join(dist, key) };
  }
  sources.set(set.repo, src);
  return src;
}

function syncSet(set) {
  const dst = path.join(ROOT, set.dst), files = set.files;
  if (check) {
    // offline: the vendored files against the vendored SOURCE.json (which came with them from a release)
    const sj = path.join(dst, "SOURCE.json");
    if (!fs.existsSync(sj)) return void differs.push(`${rel(sj)} (missing)`);
    const want = JSON.parse(fs.readFileSync(sj, "utf8")).files;
    for (const [n, key] of Object.entries(files)) {
      if (n === "SOURCE.json") continue;
      const f = path.join(dst, n);
      if (!fs.existsSync(f) || !want[key] || sha256(fs.readFileSync(f)) !== want[key].sha256) differs.push(`${rel(f)} (not the sha256 in SOURCE.json)`);
    }
    for (const n of fs.readdirSync(dst)) if (n !== "README.md" && !files[n]) differs.push(`${rel(path.join(dst, n))} (not listed)`);
    return;
  }
  const src = sourceOf(set);
  if (!src) return void (missing.includes(set.repo) || missing.push(`${set.repo} (no release pinned and no build at ${path.join(MEDIA_ROOT, set.repo, "dist")}: npm run build there)`));
  const sj = JSON.parse(fs.readFileSync(src.file("SOURCE.json"), "utf8"));
  for (const [n, key] of Object.entries(files)) {
    if (n !== "SOURCE.json" && (!sj.files[key] || sha256(fs.readFileSync(src.file(key))) !== sj.files[key].sha256)) throw new Error(`${n} does not match its sha256 in SOURCE.json: not copied`);
  }
  if (sj.dirty) console.log(`sync_media: that ${set.repo} build came from a dirty tree; a release is what to vendor`);
  fs.mkdirSync(dst, { recursive: true });
  for (const [n, key] of Object.entries(files)) {
    const s = fs.readFileSync(src.file(key)), d = path.join(dst, n);
    if (fs.existsSync(d) && lf(fs.readFileSync(d)) === lf(s)) continue;
    differs.push(rel(d));
    fs.writeFileSync(d, s);
  }
  // a vendored file the list no longer names (the flat copies of the source this replaced)
  for (const n of fs.readdirSync(dst)) if (n !== "README.md" && !files[n]) { differs.push(`${rel(path.join(dst, n))} (not listed)`); fs.unlinkSync(path.join(dst, n)); }
  const bundles = Object.keys(files).filter((n) => /\.min\.js$/.test(n));
  fs.writeFileSync(path.join(dst, "README.md"), [
    `# ${set.repo} (vendored bundles)`,
    "",
    `${bundles.map((n) => `\`${n}\``).join(" and ")}: the built, minified files of ${set.repo} ${sj.version} (commit ${sj.commit.slice(0, 8)}), from ${src.from}.`,
    "`SOURCE.json` lists the sha256 of each built file; `node tools/sync_media.js --check` (npm test) compares them.",
    "",
    "These files are not under this repository's MIT license: the notice at the head of each, and `LICENSE-BUNDLE.md`, say what is allowed",
    `(copy them unmodified as part of this product and its forks). Do not edit them: change ${set.repo}, release it, then run \`node tools/sync_media.js\`.`,
    "",
    ...set.how,
    "",
  ].join("\n"));
}

try { for (const set of SETS) syncSet(set); } finally { for (const s of sources.values()) if (s && s.dir) fs.rmSync(s.dir, { recursive: true, force: true }); }
if (missing.length) console.log(`sync_media: skipped ${missing.join(", ")}`);
console.log(`sync_media: ${check ? "differs" : "updated"}: ${differs.join(", ") || "nothing"}`);
process.exit(check && differs.length ? 1 : 0);
