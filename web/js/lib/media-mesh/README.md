# media-mesh (vendored bundles)

`media-mesh-core.min.js` and `media-mesh-knots.min.js`: the built, minified files of media-mesh 0.1.0 (commit 98c9fdc6), from the sibling's build (E:\git\media-mesh\dist).
`SOURCE.json` lists the sha256 of each built file; `node tools/sync_media.js --check` (npm test) compares them.

These files are not under this repository's MIT license: the notice at the head of each, and `LICENSE-BUNDLE.md`, say what is allowed
(copy them unmodified as part of this product and its forks). Do not edit them: change media-mesh, release it, then run `node tools/sync_media.js`.

In a page: `<script src="js/lib/media-mesh/media-mesh-core.min.js">`, then `media-mesh-knots.min.js` (`MediaMesh.vec3 .curve`, then `.knot .bundle .body .rope .knotdet .clearance`).
In Node: `require("media-mesh-core.min.js").vec3`, `require("media-mesh-knots.min.js").rope` (the knots file requires the core file beside it).
