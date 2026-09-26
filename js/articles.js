(function () {
  const MANIFEST = "/articles/manifest.json";

  function qs(sel, el) { return (el || document).querySelector(sel); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseFrontmatter(raw) {
    const text = raw.replace(/^\uFEFF/, "");
    if (!text.startsWith("---")) return { meta: {}, body: text };
    const end = text.indexOf("\n---", 3);
    if (end === -1) return { meta: {}, body: text };
    const yaml = text.slice(3, end).trim();
    const body = text.slice(end + 4).replace(/^\r?\n/, "");
    const meta = {};
    yaml.split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!m) return;
      var v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v.startsWith("[") && v.endsWith("]")) {
        v = v.slice(1, -1).split(",").map(function (x) {
          return x.trim().replace(/^["']|["']$/g, "");
        }).filter(Boolean);
      }
      meta[m[1]] = v;
    });
    return { meta: meta, body: body };
  }

  function unquote(s) {
    s = String(s).trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    return s;
  }

  /** Minimal projector: HCF yaml-ld-q42 HypermediaDocument → { meta, html } */
  function parseHcfYamlLd(raw) {
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    const meta = { format: "yaml-ld-q42" };
    const sections = [];
    var section = null;
    var i = 0;
    function peek() { return lines[i] || ""; }
    function indentOf(line) {
      var n = 0;
      while (n < line.length && line[n] === " ") n++;
      return n;
    }

    while (i < lines.length) {
      const line = peek();
      const t = line.trim();
      if (!t || t.startsWith("#")) { i++; continue; }

      if (/^"?@id"?\s*:/.test(t)) {
        meta.id = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/^"?@type"?\s*:/.test(t)) {
        meta.type = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/^"?title"?\s*:/.test(t)) {
        meta.title = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/schema:datePublished\s*:/.test(t) || /^"?date"?\s*:/.test(t)) {
        meta.date = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/schema:author\s*:/.test(t) || /^"?author"?\s*:/.test(t)) {
        meta.author = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/schema:description\s*:/.test(t) || /^"?summary"?\s*:/.test(t)) {
        meta.summary = unquote(t.split(":").slice(1).join(":"));
        i++; continue;
      }
      if (/civics:tags\s*:/.test(t) || /^"?tags"?\s*:/.test(t)) {
        meta.tags = [];
        i++;
        while (i < lines.length && /^\s*-\s+/.test(peek())) {
          meta.tags.push(unquote(peek().replace(/^\s*-\s+/, "")));
          i++;
        }
        continue;
      }

      if (/^"?content"?\s*:\s*$/.test(t)) {
        i++;
        while (i < lines.length) {
          const L = peek();
          if (!L.trim()) { i++; continue; }
          if (indentOf(L) === 0 && !/^\s*-\s+/.test(L) && !L.trim().startsWith("#")) break;
          if (/^\s*-\s+"?@type"?\s*:\s*"?Section"?/.test(L) || /^\s*-\s+@type:\s*Section/.test(L)) {
            section = { heading: "", paragraphs: [] };
            sections.push(section);
            i++;
            continue;
          }
          if (section && /^\s+"?heading"?\s*:/.test(L)) {
            section.heading = unquote(L.split(":").slice(1).join(":"));
            i++; continue;
          }
          if (section && /^\s+-\s+"?@type"?\s*:\s*"?Paragraph"?/.test(L)) {
            i++;
            while (i < lines.length && /^\s+"?text"?\s*:/.test(peek()) === false &&
                   !/^\s*-\s+"?@type"?/.test(peek()) && indentOf(peek()) > 2) {
              i++;
            }
            if (/^\s+"?text"?\s*:/.test(peek())) {
              section.paragraphs.push(unquote(peek().split(":").slice(1).join(":")));
              i++;
            }
            continue;
          }
          i++;
        }
        continue;
      }
      i++;
    }

    const html = sections.map(function (s) {
      return (
        (s.heading ? "<h2>" + escapeHtml(s.heading) + "</h2>" : "") +
        s.paragraphs.map(function (p) { return "<p>" + escapeHtml(p) + "</p>"; }).join("\n")
      );
    }).join("\n");

    return { meta: meta, html: html, sections: sections };
  }

  function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    const out = [];
    var i = 0, inList = false;
    function closeList() { if (inList) { out.push("</ul>"); inList = false; } }
    function inline(s) {
      return escapeHtml(s)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
    }
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { closeList(); i++; continue; }
      if (line.startsWith("### ")) { closeList(); out.push("<h3>" + inline(line.slice(4)) + "</h3>"); i++; continue; }
      if (line.startsWith("## ")) { closeList(); out.push("<h2>" + inline(line.slice(3)) + "</h2>"); i++; continue; }
      if (line.startsWith("# ")) { closeList(); out.push("<h2>" + inline(line.slice(2)) + "</h2>"); i++; continue; }
      if (/^[-*] /.test(line)) {
        if (!inList) { out.push("<ul>"); inList = true; }
        out.push("<li>" + inline(line.replace(/^[-*] /, "")) + "</li>");
        i++; continue;
      }
      closeList();
      const para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^#{1,3} /.test(lines[i]) && !/^[-*] /.test(lines[i])) {
        para.push(lines[i]); i++;
      }
      out.push("<p>" + inline(para.join(" ")) + "</p>");
    }
    closeList();
    return out.join("\n");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + (String(iso).length === 10 ? "T00:00:00" : ""));
    if (Number.isNaN(d.getTime())) return escapeHtml(iso);
    return d.toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
  }

  async function loadManifest() {
    const res = await fetch(MANIFEST, { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load articles manifest (" + res.status + ")");
    return res.json();
  }

  async function loadArticle(slug, entry) {
    const preferYaml = entry && entry.format === "yaml-ld-q42" && entry.source;
    const yamlPath = preferYaml
      ? "/" + String(entry.source).replace(/^\//, "")
      : "/articles/" + encodeURIComponent(slug) + ".yaml-ld-q42";
    const mdPath = entry && entry.projector
      ? "/" + String(entry.projector).replace(/^\//, "")
      : "/articles/" + encodeURIComponent(slug) + ".md";

    try {
      const res = await fetch(yamlPath, { cache: "no-cache" });
      if (res.ok) {
        const parsed = parseHcfYamlLd(await res.text());
        if (parsed.sections && parsed.sections.length) {
          return { kind: "hcf", meta: parsed.meta, html: parsed.html };
        }
      }
    } catch (_) { /* fall through */ }

    const res = await fetch(mdPath, { cache: "no-cache" });
    if (!res.ok) throw new Error("Article not found");
    const fm = parseFrontmatter(await res.text());
    return { kind: "md", meta: fm.meta, html: renderMarkdown(fm.body) };
  }

  async function renderList(target) {
    const el = typeof target === "string" ? qs(target) : target;
    if (!el) return;
    el.innerHTML = '<p class="status">Loading writing…</p>';
    try {
      const data = await loadManifest();
      const items = (data.articles || []).slice().sort(function (a, b) {
        return String(b.date || "").localeCompare(String(a.date || ""));
      });
      if (!items.length) { el.innerHTML = '<p class="status">No articles published yet.</p>'; return; }
      el.innerHTML = items.map(function (a) {
        const tags = (a.tags || []).map(function (t) {
          return '<span class="tag">' + escapeHtml(t) + "</span>";
        }).join("");
        const fmt = a.format === "yaml-ld-q42"
          ? '<span class="tag" title="Authoring SoT">yaml-ld-q42</span>'
          : "";
        return (
          '<article class="article-card soft-rise">' +
            '<div class="byline">' + escapeHtml(formatDate(a.date)) +
              (a.author ? " · " + escapeHtml(a.author) : "") + "</div>" +
            "<h3><a href=\"/article.html?slug=" + encodeURIComponent(a.slug) + "\">" +
              escapeHtml(a.title) + "</a></h3>" +
            (a.summary ? '<p class="excerpt">' + escapeHtml(a.summary) + "</p>" : "") +
            '<div class="tags">' + fmt + tags + "</div>" +
          "</article>"
        );
      }).join("");
    } catch (err) {
      el.innerHTML = '<p class="status">Articles could not be loaded. ' + escapeHtml(err.message) + "</p>";
    }
  }

  async function renderArticle() {
    const mount = qs("#article-mount");
    if (!mount) return;
    const slug = new URLSearchParams(location.search).get("slug");
    if (!slug) {
      mount.innerHTML = '<p class="status">No article selected. <a href="/#writing">Back to writing</a>.</p>';
      return;
    }
    mount.innerHTML = '<p class="status">Loading…</p>';
    try {
      const data = await loadManifest();
      const entry = (data.articles || []).find(function (a) { return a.slug === slug; });
      const parsed = await loadArticle(slug, entry);
      const meta = parsed.meta;
      const title = meta.title || (entry && entry.title) || slug;
      const date = meta.date || (entry && entry.date);
      const author = meta.author || (entry && entry.author);
      const tags = [].concat(meta.tags || (entry && entry.tags) || []).map(function (t) {
        return '<span class="tag">' + escapeHtml(t) + "</span>";
      }).join("");
      document.title = title + " — Civics.au";
      mount.innerHTML =
        "<header>" +
          '<p class="kicker">Writing · ' +
            (parsed.kind === "hcf" ? "yaml-ld-q42" : "markdown projector") + "</p>" +
          "<h1>" + escapeHtml(title) + "</h1>" +
          '<p class="byline">' + escapeHtml(formatDate(date)) +
            (author ? " · " + escapeHtml(author) : "") + "</p>" +
          (tags ? '<div class="tags">' + tags + "</div>" : "") +
        "</header>" +
        '<div class="prose">' + parsed.html + "</div>" +
        '<p style="margin-top:1.5rem"><a href="/#writing">← All writing</a></p>';
    } catch (err) {
      mount.innerHTML = '<p class="status">Could not open this article. <a href="/#writing">Back to writing</a>.</p>';
    }
  }

  window.CivicsArticles = { renderList: renderList, renderArticle: renderArticle };
})();
