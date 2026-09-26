(function () {
  const MANIFEST = "/articles/manifest.json";
  function qs(sel, el) { return (el || document).querySelector(sel); }
  function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (v.startsWith("[") && v.endsWith("]")) {
        v = v.slice(1, -1).split(",").map(function (x) { return x.trim().replace(/^["']|["']$/g, ""); }).filter(Boolean);
      }
      meta[m[1]] = v;
    });
    return { meta: meta, body: body };
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
  async function loadArticle(slug) {
    const res = await fetch("/articles/" + encodeURIComponent(slug) + ".md", { cache: "no-cache" });
    if (!res.ok) throw new Error("Article not found");
    return parseFrontmatter(await res.text());
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
        const tags = (a.tags || []).map(function (t) { return '<span class="tag">' + escapeHtml(t) + "</span>"; }).join("");
        return (
          '<article class="article-card">' +
            '<div class="byline">' + escapeHtml(formatDate(a.date)) + (a.author ? " · " + escapeHtml(a.author) : "") + "</div>" +
            "<h3><a href=\"/article.html?slug=" + encodeURIComponent(a.slug) + "\">" + escapeHtml(a.title) + "</a></h3>" +
            (a.summary ? '<p class="excerpt">' + escapeHtml(a.summary) + "</p>" : "") +
            (tags ? '<div class="tags">' + tags + "</div>" : "") +
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
      const parsed = await loadArticle(slug);
      const meta = parsed.meta, body = parsed.body;
      const title = meta.title || slug;
      document.title = title + " — Civics.au";
      const tags = [].concat(meta.tags || []).map(function (t) { return '<span class="tag">' + escapeHtml(t) + "</span>"; }).join("");
      mount.innerHTML =
        "<header>" +
          '<p class="kicker">Writing</p>' +
          "<h1>" + escapeHtml(title) + "</h1>" +
          '<p class="byline">' + escapeHtml(formatDate(meta.date)) +
            (meta.author ? " · " + escapeHtml(meta.author) : "") + "</p>" +
          (tags ? '<div class="tags">' + tags + "</div>" : "") +
        "</header>" +
        '<div class="prose">' + renderMarkdown(body) + "</div>" +
        '<p style="margin-top:1.5rem"><a href="/#writing">← All writing</a></p>';
    } catch (err) {
      mount.innerHTML = '<p class="status">Could not open this article. <a href="/#writing">Back to writing</a>.</p>';
    }
  }
  window.CivicsArticles = { renderList: renderList, renderArticle: renderArticle };
})();
