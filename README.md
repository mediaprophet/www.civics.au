# www.civics.au

Public site for **Civics.au** — citizenship and citizen-led public-good work (WebCivics / Timothy Holborn).

**Not** a government or civic-agency portal.

- **civic** = government & related employees / institutions  
- **civics** = citizenship & citizen-led public-good work  

## Stack

Static GitHub Pages (`main` `/`). No build required for Writing.

## Add an article

1. Create `articles/your-slug.md` with YAML frontmatter:

```md
---
title: Your title
date: 2026-09-26
author: Name
summary: One-line excerpt
tags: [civics, example]
---

## Heading

Body in Markdown.
```

2. Append an entry to `articles/manifest.json` (`slug` must match the filename without `.md`).

3. Commit to `main`. Pages updates shortly after.

## QualiaDB WASM

See [to-do.md](./to-do.md) for webcivics-wasm / QualiaDB follow-ups. Live Writing does not depend on WASM yet.
