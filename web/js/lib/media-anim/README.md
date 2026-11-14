# media-anim (vendored bundles)

`media-anim-runtime.min.js` and `media-anim-characters.min.js`: the built, minified files of media-anim 0.1.0 (commit b7d5298f), from the sibling's build (E:\git\media-anim\dist).
`SOURCE.json` lists the sha256 of each built file; `node tools/sync_media.js --check` (npm test) compares them.

These files are not under this repository's MIT license: the notice at the head of each, and `LICENSE-BUNDLE.md`, say what is allowed
(copy them unmodified as part of this product and its forks). Do not edit them: change media-anim, release it, then run `node tools/sync_media.js`.

In a page: `<script src="js/lib/media-anim/media-anim-runtime.min.js">` (`MediaAnim.timeline .camera .reveal .swing .tube .halo .callout .credits .occluder .player .tweak`),
and `media-anim-characters.min.js` (`MediaAnim.faceRig`, `MediaAnim.faceOverlay`; they draw `jensen-head-only.svg`, fetched beside them).
