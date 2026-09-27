# Todo — www.civics.au

## Site status

- [ ] Dedicated www.civics.au human-contact / “does this look right?” form (interim: link to [dev.civics.au EOI](https://dev.civics.au/eoi.html))
- [x] **In development** banner + `/in-development.html` (AI-assisted work, failure modes, nominal budget)

## Articles / writing

- [x] Home Writing section listing articles
- [x] Per-article page (`article.html?slug=…`)
- [x] **SoT:** `application/yaml-ld-q42` HCF `HypermediaDocument` under `articles/*.yaml-ld-q42` (QualiaDB `docs/manuals/standards/yaml-ld-q42-specification.md` + `hypermedia-content-format-hcf.md`)
- [x] Markdown `articles/*.md` kept as optional projector (not the authoring language)
- [x] `manifest.json` points at yaml-ld-q42 `source` + md `projector`
- [ ] Optional: generate `manifest.json` from yaml-ld-q42 front matter at build time
- [ ] Richer Markdown projector (blockquotes, tables, fenced code) if needed
- [ ] RSS / Atom feed from the manifest

## QualiaDB / webcivics-wasm (0.0.40-dev)

Profile: **`webizen-lite-wasm`** (`qualia-core-db` feature `wasm-ontology`) on branch `0.0.40-dev`.

Tracked gaps / follow-ups:

1. **[in flight]** Expose `load_yaml_ld_q42` / HCF ingest on webizen-lite-wasm (compile workspace + HypermediaDocument → session Quins) — Neo tip on `civics-yaml-ld-q42` when green.
2. **Pin the artifact** — vendor digest-pinned `webizen_lite_wasm` pkg for Pages (CC BY-NC-ND binary; keep MIT/site chrome separate; document in README).
3. **Client index** — optional in-browser Qualia index (tag/date/full-text) via WASM; static manifest remains the live list until then.
4. **Offline / installable** — optional PWA + local store for reading packs.
5. **Capability profile** — Pages stays ontology-lite; do not pull portal/GPU/LLM into the public marketing site.

Until WASM is vendored, the static yaml-ld-q42 + Markdown-projector path is the live Writing surface.
