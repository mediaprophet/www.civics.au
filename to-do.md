# Todo — www.civics.au

## Articles / writing (shipped v0)

- [x] Home Writing section listing YAML+MD articles
- [x] Per-article page (`article.html?slug=…`)
- [x] Convention: `articles/*.md` (YAML frontmatter) + `articles/manifest.json`
- [ ] Optional: generate `manifest.json` from frontmatter at build time (avoid dual edit)
- [ ] Richer Markdown (blockquotes, tables, fenced code) if content needs it
- [ ] RSS / Atom feed from the manifest

## QualiaDB / webcivics-wasm (gaps to improve)

Timothy noted a **webcivics-wasm** build of QualiaDB can help drive YAML/MD articles. Current site uses a **static Pages-safe path** (fetch MD + light client parse). It does **not** yet load QualiaDB WASM.

Tracked gaps / follow-ups:

1. **Locate & pin the artifact** — publish or vendor the licensed `wasm-webcivics` / portal profile build intended for browser Pages (`qualia_webcivics_bg.wasm` + glue, or `webizen-lite-wasm` / portal feature from `mediaprophet/qualiaDB`). Digest-pin like Solid-CSS-Databox does.
2. **Article ingest API** — WASM helpers to parse YAML frontmatter + Markdown (or N3/RDF equivalents) into quins/graph so Writing is queryable, not only listed.
3. **Client index** — replace or augment `manifest.json` with an in-browser Qualia index (tag/date/full-text) without a Node build on Pages.
4. **Offline / installable** — optional PWA + persistent local store for reading packs when network is poor (grounds / Walkabout contexts).
5. **Field-of-use licence boundary** — keep MIT/site chrome separate from proprietary wasm-webcivics binary; document load path in README before shipping WASM on www.civics.au.
6. **Capability profile** — confirm Pages needs `portal` vs ontology-lite; avoid pulling GPU/LLM features into the public marketing site.

Until those land, keep the static YAML+MD path as the live Writing surface.
