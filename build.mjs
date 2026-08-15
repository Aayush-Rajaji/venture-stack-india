#!/usr/bin/env node
/* ============================================================
   Startup India OS — Unified Static Site Generator
   Combines Government Scheme Intelligence + Founder Operating Stack
   Zero dependencies. Node >= 18.   Usage: node build.mjs
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = join(ROOT, "data");
const SITE = join(ROOT, "site");
const GUIDES = join(ROOT, "guides");
const STACK = join(ROOT, "stack");
const PROMPTS = join(ROOT, "prompts");
const WORKSHEETS = join(ROOT, "worksheets");
const PORTFOLIO = join(ROOT, "portfolio");
const OUT = join(ROOT, "docs");
const PDF_NAME = "Startup-Schemes-Playbook-June-2026.pdf";

/* site.config.json */
const CONFIG = existsSync(join(ROOT, "site.config.json"))
  ? JSON.parse(readFileSync(join(ROOT, "site.config.json"), "utf8"))
  : {};
const SITE_NAME = CONFIG.siteName || "Startup India OS";
const TAGLINE = CONFIG.tagline || "The Unified Operating System & Government Schemes Intelligence Engine for Indian Startups.";
const SITE_BASE = CONFIG.siteBase || "https://aayush-rajaji.github.io/startup-india-os/";
const PATH_PREFIX = CONFIG.pathPrefix ?? "/startup-india-os/";
const REPO_URL = CONFIG.repo || "https://github.com/Aayush-Rajaji/startup-india-os";

/* utilities */
const readJSON = (f) => {
  const p = join(DATA, f);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
};
const readText = (p) => existsSync(p) ? readFileSync(p, "utf8").replace(/\r\n/g, "\n") : "";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const attr = esc;
const slugify = (s) => String(s ?? "").toLowerCase().replace(/`/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const plain = (s) => clean(String(s ?? "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/`([^`]*)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/^#+\s*/, ""));
const truncate = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/[\s,;.—-]+$/, "")}…`);
const rootFor = (url) => "../".repeat(url.split("/").length - 1);

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* load scheme data */
const schemesData = readJSON("schemes.json") || { schemes: [] };
const schemes = schemesData.schemes;
const tree = readJSON("decision-tree.json") || { questions: [] };
const needs = readJSON("needs-index.json") || { needs: [] };
const lifecycle = readJSON("lifecycle.json") || { stages: [] };
const about = readJSON("about.json") || {};
const psu = readJSON("psu.json") || { programs: [] };
const states = readJSON("states.json") || { states: [] };
const glossary = readJSON("glossary.json") || { terms: [] };
const incubators = readJSON("incubators.json") || { incubators: [] };
const indiaMap = readJSON("india-map.json");
const indiaTerrain = readJSON("india-terrain.json");
const stateSchemes = readJSON("state-schemes.json") || { states: [] };
const news = readJSON("news.json") || [];
const resources = readJSON("resources.json") || [];

/* taxonomies */
const CAT_LABEL = { grant: "Grant", equity: "Equity", "loan-credit": "Loan / Credit", incubation: "Incubation", "market-access": "Market Access", mixed: "Mixed", other: "Other" };
const STAGE_LABEL = { ideation: "Ideation", validation: "Validation / PoC", seed: "Seed / Early", scaling: "Growth / Scaling", "market-access": "Market Access & IP" };
const SECTOR_LABEL = { defence: "Defence & Aerospace", biotech: "Biotech & Healthcare", agritech: "Agriculture & Food", deeptech: "DeepTech / Semicon", general: "Sector Agnostic", cleantech: "CleanTech & Energy" };

const partA = schemes.filter((s) => s.part === "A");
const partB = schemes.filter((s) => s.part === "B");

/* icons */
const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3"/></svg>',
  external: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.3 8.9h3.4V21H3.3V8.9Zm5.53 0h3.26v1.65h.05c.45-.86 1.56-1.77 3.22-1.77 3.44 0 4.08 2.27 4.08 5.22V21h-3.4v-5.32c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-3.4V8.9Z"/></svg>'
};

/* Frontmatter parser */
function frontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return [{}, src];
  const fm = {};
  let key = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s?(.*)$/);
    if (kv) {
      key = kv[1];
      const raw = kv[2].trim();
      const quoted = /^".*"$/.test(raw) || /^'.*'$/.test(raw);
      const v = quoted ? raw.slice(1, -1) : raw;
      if (!quoted && /^\[.*\]$/.test(v)) {
        fm[key] = v.slice(1, -1).split(",").map((x) => x.trim()).filter(Boolean);
        key = null;
      } else fm[key] = v;
    } else if (key && /^\s+\S/.test(line) && typeof fm[key] === "string") {
      fm[key] = `${fm[key]} ${line.trim()}`.trim();
    }
  }
  return [fm, m[2]];
}

/* Markdown to HTML */
function mdToHtml(src, ctx = { root: "" }) {
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let inList = false;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      if (inList) { out.push("</ul>"); inList = false; }
      i++; continue;
    }

    /* Diagram marker */
    const dia = line.match(/^<!--\s*DIAGRAM:\s*([a-z0-9-]+)\s*-->\s*$/i);
    if (dia) {
      const diaFile = join(SITE, "diagrams", `${dia[1]}.svg`);
      if (existsSync(diaFile)) {
        out.push(`<div class="diagram-wrap">${readFileSync(diaFile, "utf8")}</div>`);
      }
      i++; continue;
    }

    /* Fenced code */
    const fence = line.match(/^(\s*)(```+|~~~+)\s*([\w-]*)\s*$/);
    if (fence) {
      if (inList) { out.push("</ul>"); inList = false; }
      const [, , mark, lang] = fence;
      const body = [];
      const closer = new RegExp(`^\\s*${mark[0]}{${mark.length},}\\s*$`);
      i++;
      while (i < lines.length && !closer.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(`<div class="codeblock"><pre class="lang-${esc(lang)}"><code>${esc(body.join("\n"))}</code></pre></div>`);
      continue;
    }

    /* Headings */
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    if (h) {
      if (inList) { out.push("</ul>"); inList = false; }
      const level = h[1].length;
      const text = h[2];
      const id = slugify(plain(text));
      out.push(`<h${level} id="${esc(id)}">${inline(text, ctx)}</h${level}>`);
      i++; continue;
    }

    /* Blockquote */
    if (line.startsWith("> ")) {
      if (inList) { out.push("</ul>"); inList = false; }
      const bq = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        bq.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${bq.map((p) => `<p>${inline(p, ctx)}</p>`).join("")}</blockquote>`);
      continue;
    }

    /* List item */
    const li = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (li) {
      if (!inList) { out.push('<ul class="doc-list">'); inList = true; }
      out.push(`<li>${inline(li[2], ctx)}</li>`);
      i++; continue;
    }

    /* Table */
    if (line.startsWith("|")) {
      if (inList) { out.push("</ul>"); inList = false; }
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const rowCells = lines[i].split("|").slice(1, -1).map((c) => c.trim());
        if (!lines[i].includes("---")) rows.push(rowCells);
        i++;
      }
      if (rows.length) {
        const [head, ...bodyRows] = rows;
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c, ctx)}</th>`).join("")}</tr></thead><tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${inline(c, ctx)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      }
      continue;
    }

    /* Paragraph */
    if (inList) { out.push("</ul>"); inList = false; }
    out.push(`<p>${inline(line, ctx)}</p>`);
    i++;
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function inline(text, ctx) {
  let s = esc(String(text ?? ""));
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=$|[\s).,;:!?])/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const ext = /^https?:/.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
  });
  return s;
}

/* Sidebar navigation groups */
const NAV_SECTIONS = [
  {
    title: "🏛️ Government Schemes",
    items: [
      { href: "index.html", label: "Playbook Overview" },
      { href: "finder.html", label: "🧭 Scheme Finder (5 Qs)" },
      { href: "directory.html", label: "📋 All 69 Central Schemes" },
      { href: "compare.html", label: "⚖️ Compare Schemes" },
      { href: "walkable-map.html", label: "🗺️ 3D Walkable India Map" },
      { href: "state-schemes.html", label: "🏢 320+ State/UT Schemes" },
      { href: "incubators.html", label: "🔬 220+ Incubators Map" },
      { href: "lifecycle.html", label: "🌱 Lifecycle Map" },
      { href: "needs.html", label: "🎯 What Do You Need?" },
      { href: "psu.html", label: "🏭 PSU & Regulators" },
      { href: "states.html", label: "🌐 State Portals" },
      { href: "news.html", label: "📰 Ecosystem News" },
      { href: "glossary.html", label: "📖 Glossary & Terms" },
      { href: "about.html", label: "ℹ️ About & Method" }
    ]
  },
  {
    title: "⚡ Founder Operating Stack",
    items: [
      { href: "stack.html", label: "Stack Architecture" },
      { href: "quickstart.html", label: "🚀 Quickstart (15 Min)" },
      { href: "stack/context.html", label: "📄 Company One-Pager" },
      { href: "stack/01-company.html", label: "01 · Company" },
      { href: "stack/02-customer.html", label: "02 · Customer" },
      { href: "stack/03-market.html", label: "03 · Market" },
      { href: "stack/04-product.html", label: "04 · Product" },
      { href: "stack/05-gtm.html", label: "05 · GTM & Distribution" },
      { href: "stack/06-operations.html", label: "06 · Operations" },
      { href: "stack/07-money.html", label: "07 · Unit Economics" },
      { href: "stack/08-capital.html", label: "08 · Capital & Grants" },
      { href: "stack/09-brand.html", label: "09 · Brand & Voice" },
      { href: "stack/10-pulse.html", label: "10 · Weekly Pulse" }
    ]
  },
  {
    title: "🤖 AI Execution Prompts",
    items: [
      { href: "prompts/index.html", label: "Prompt Library (19)" },
      { href: "prompts/00-bootstrap-the-stack.html", label: "00 · Bootstrap Stack" },
      { href: "prompts/02-gap-scan.html", label: "02 · Gap Scan" },
      { href: "prompts/03-customer-and-problem.html", label: "03 · Customer & Problem" },
      { href: "prompts/05-competitive-intelligence.html", label: "05 · Competitor Intel" },
      { href: "prompts/07-unit-economics.html", label: "07 · Unit Econ Stress-Test" },
      { href: "prompts/08-list-of-100.html", label: "08 · List of 100" },
      { href: "prompts/10-pitch-deck.html", label: "10 · Pitch Deck Drafter" },
      { href: "prompts/11-fundraise-readiness.html", label: "11 · Diligence Readiness" },
      { href: "prompts/12-weekly-recap.html", label: "12 · Weekly Pulse Recap" },
      { href: "prompts/13-mentor-review.html", label: "13 · Investor Red-Team" }
    ]
  },
  {
    title: "📝 Worksheets & Tools",
    items: [
      { href: "worksheets/index.html", label: "All 10 Worksheets" },
      { href: "worksheets/startup-prep.html", label: "Startup Prep Worksheet" },
      { href: "worksheets/customer-interview.html", label: "Customer Interview Script" },
      { href: "worksheets/competitor-profile.html", label: "Competitor Teardown" },
      { href: "worksheets/experiment.html", label: "2-Week Experiment" },
      { href: "worksheets/one-pager.html", label: "Executive One-Pager" },
      { href: "worksheets/weekly-recap.html", label: "Weekly Pulse Template" }
    ]
  },
  {
    title: "📚 Guides & Method",
    items: [
      { href: "method.html", label: "The Method Explained" },
      { href: "knowledge-base.html", label: "Building the Knowledge Base" },
      { href: "front-matter.html", label: "Front-Matter Schema" },
      { href: "ai-basics.html", label: "AI Fundamentals" },
      { href: "safety.html", label: "Safety & Privacy Rules" },
      { href: "for-coaches.html", label: "For Startup Coaches" }
    ]
  },
  {
    title: "📊 Venture Studio & Resources",
    items: [
      { href: "rubric.html", label: "1-5 Maturity Rubric" },
      { href: "for-portfolios.html", label: "Portfolio Governance" },
      { href: "infographics.html", label: "🎨 30 Infographics Gallery" },
      { href: "resources.html", label: "📑 650+ Curated Resources" }
    ]
  }
];

function sidebar(root, active) {
  const groups = NAV_SECTIONS.map((g) => {
    const isHold = g.items.some((it) => it.href === active);
    return `
    <div class="sidebar-group ${isHold ? "open" : ""}">
      <div class="sidebar-title">${g.title}</div>
      <div class="sidebar-links">
        ${g.items.map((it) => `<a class="nav-link ${it.href === active ? "active" : ""}" href="${root}${it.href}">${esc(it.label)}</a>`).join("\n")}
      </div>
    </div>`;
  }).join("\n");

  return `
  <nav class="sidebar" id="sidebar" aria-label="Site navigation">
    ${groups}
    <div class="sidebar-group">
      <div class="sidebar-title">Downloads &amp; Links</div>
      <a class="nav-link" href="${root}assets/${PDF_NAME}" download>${ICONS.download} Playbook PDF (107p)</a>
      <a class="nav-link" href="${REPO_URL}" target="_blank" rel="noopener">${ICONS.github} GitHub Repository</a>
    </div>
  </nav>`;
}

/* HTML Shell with Claude Typography and Unified Footer */
function shell({ root, active, title, description, body, extraHead = "", pageClass = "", immersive = false }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Indian Startup OS & Government Intelligence`;
  const desc = description || TAGLINE;

  return `<!doctype html>
<html lang="en" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${attr(desc)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#1f3864">
<meta property="og:title" content="${attr(fullTitle)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(SITE_NAME)}">
<meta property="og:image" content="${SITE_BASE}assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="${root}assets/favicon.svg">

<!-- Claude Typography: Newsreader Editorial Display + Plus Jakarta Sans & Inter Body -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..800;1,6..72,400..700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<script>(function(){var t;try{t=localStorage.getItem("playbook-theme")}catch(e){}
if(t!=="light"&&t!=="dark"){t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}
document.documentElement.setAttribute("data-theme",t);
try{if(localStorage.getItem("rail-collapsed")==="1")document.documentElement.classList.add("rail-collapsed")}catch(e){}})();</script>

<link rel="stylesheet" href="${root}assets/tokens.css">
<link rel="stylesheet" href="${root}assets/site.css">
${extraHead}
</head>
<body${immersive ? ' class="immersive-body"' : ""}>
<a class="skip-link" href="#main">Skip to content</a>
<header class="topbar">
  <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation" aria-expanded="false"><span class="hb" aria-hidden="true"><span class="hb-t"></span><span class="hb-m"></span><span class="hb-b"></span></span></button>
  <a class="brand" href="${root}index.html">
    <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="20" height="20"><rect x="6" y="14" width="52" height="9" rx="4.5" fill="#e2621b"/><rect x="6" y="27.5" width="52" height="9" rx="4.5" fill="#ffffff"/><rect x="6" y="41" width="52" height="9" rx="4.5" fill="#359a4c"/></svg></span>
    <span class="brand-name">Startup India <span class="thin">OS</span></span>
  </a>
  <span class="topbar-spacer"></span>
  <button class="searchbtn" data-search-open type="button" aria-label="Search OS">
    ${ICONS.search}<span class="searchbtn-label">Search schemes, prompts, stack…</span><kbd>⌘K</kbd>
  </button>
  <a class="icon-btn" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="GitHub Repo">${ICONS.github}</a>
  <button class="icon-btn theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme">
    <span class="sun">${ICONS.sun}</span><span class="moon">${ICONS.moon}</span>
  </button>
</header>
<div class="scrim" id="scrim"></div>
${immersive ? `
<main id="main" class="content ${pageClass}">
${body}
</main>` : `
<div class="layout">
${sidebar(root, active)}
<main id="main" class="content ${pageClass}">
${body}
</main>
</div>`}
${immersive ? "" : `
<footer class="footer"><div class="footer-inner">
  <div class="footer-author">
    <img class="author-avatar" src="${root}assets/aayush.png" alt="Aayush Rajaji" width="36" height="36" loading="lazy">
    <div class="author-meta">
      <div class="author-role">Built &amp; curated by</div>
      <div class="author-name">Aayush Rajaji</div>
      <div class="author-links">
        <a href="https://github.com/Aayush-Rajaji" target="_blank" rel="noopener">GitHub</a> ·
        <a href="https://www.linkedin.com/in/aayushrajaji/" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
  </div>
  <div class="footer-note">Unified Indian Startup Operating System &amp; Scheme Intelligence Engine. Open knowledge resource under MIT License.</div>
  <div class="f-links">
    <a href="${root}about.html">About &amp; Disclaimer</a>
    <a href="${root}assets/${PDF_NAME}" download>Source PDF</a>
    <a href="https://www.startupindia.gov.in/" target="_blank" rel="noopener">startupindia.gov.in ↗</a>
    <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub ↗</a>
  </div>
</div></footer>`}

<div class="search-modal" id="search-modal" role="dialog" aria-modal="true" aria-label="Search">
  <div class="backdrop"></div>
  <div class="search-panel">
    <div class="search-head">${ICONS.search}<input id="search-input" type="text" placeholder="Search 69 schemes, prompts, worksheets, glossary…" autocomplete="off" aria-label="Search"></div>
    <div class="sr-only" id="search-status" role="status" aria-live="polite"></div>
    <div class="results" id="search-results"></div>
    <div class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>
  </div>
</div>
${immersive ? "" : `<button class="to-top" id="to-top" aria-label="Back to top">${ICONS.up}</button>`}
<script src="${root}assets/search-index.js" defer></script>
<script src="${root}assets/site.js" defer></script>
</body>
</html>`;
}

/* Reset output */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
mkdirSync(join(OUT, "schemes"), { recursive: true });
mkdirSync(join(OUT, "prompts"), { recursive: true });
mkdirSync(join(OUT, "worksheets"), { recursive: true });
mkdirSync(join(OUT, "stack"), { recursive: true });

const pages = [];
const write = (rel, html) => {
  const target = join(OUT, rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  pages.push(rel);
};

/* ================= 1. HOME & SCHEMES CORE ================= */

/* Home page */
{
  const heroHTML = `
  <div class="hero">
    <div class="kicker">Unified Operating System · 2026 Edition</div>
    <h1>Startup India <span class="thin">OS</span></h1>
    <p class="lede">Every Central Government scheme, state grant, and incubator directory — fused with an AI-native company knowledge stack, 19 execution prompts, and 10 actionable worksheets.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="finder.html">🧭 Run Scheme Finder (5 Qs)</a>
      <a class="btn btn-secondary" href="walkable-map.html">🗺️ Explore 3D India Map</a>
      <a class="btn btn-secondary" href="stack.html">⚡ Founder Operating Stack</a>
      <a class="btn btn-secondary" href="prompts/index.html">🤖 AI Prompts</a>
    </div>
    <div class="stats-row">
      <div class="stat-box"><span class="val">69</span><span class="lbl">Central Schemes</span></div>
      <div class="stat-box"><span class="val">320+</span><span class="lbl">State Grants</span></div>
      <div class="stat-box"><span class="val">220+</span><span class="lbl">Incubators</span></div>
      <div class="stat-box"><span class="val">10</span><span class="lbl">Stack Sections</span></div>
      <div class="stat-box"><span class="val">19</span><span class="lbl">AI Prompts</span></div>
    </div>
  </div>`;

  const cardsHTML = `
  <div class="section-head">
    <h2>Explore Core Modules</h2>
    <p class="muted">Navigate between government funding intelligence and internal execution tools.</p>
  </div>
  <div class="modules-grid">
    <a class="module-card" href="finder.html">
      <div class="m-icon">🧭</div>
      <h3>Scheme Finder Wizard</h3>
      <p>5-question decision tree matching your stage, sector, and entity type with eligible Central & State funding.</p>
      <span class="m-link">Find your grant →</span>
    </a>
    <a class="module-card" href="walkable-map.html">
      <div class="m-icon">🗺️</div>
      <h3>3D Walkable India Map</h3>
      <p>Interactive Three.js terrain map populated with 220+ incubator pins and state startup policy drawers.</p>
      <span class="m-link">Launch 3D world →</span>
    </a>
    <a class="module-card" href="directory.html">
      <div class="m-icon">📋</div>
      <h3>All 69 Central Schemes</h3>
      <p>Searchable, filterable directory with verified eligibility, funding ceilings, and official portal links.</p>
      <span class="m-link">Browse directory →</span>
    </a>
    <a class="module-card" href="stack.html">
      <div class="m-icon">⚡</div>
      <h3>Founder Knowledge Stack</h3>
      <p>10-section front-mattered markdown operating system preventing LLM hallucinations and organizing metrics.</p>
      <span class="m-link">Explore the stack →</span>
    </a>
    <a class="module-card" href="prompts/index.html">
      <div class="m-icon">🤖</div>
      <h3>AI Prompt Library</h3>
      <p>19 battle-tested prompts for pitch deck drafting, unit economics, diligence readiness, and weekly recaps.</p>
      <span class="m-link">View prompt library →</span>
    </a>
    <a class="module-card" href="worksheets/index.html">
      <div class="m-icon">📝</div>
      <h3>Repeatable Worksheets</h3>
      <p>10 actionable fill-in artifacts: customer interviews, competitor teardown, 2-week experiments, and order sheets.</p>
      <span class="m-link">Access worksheets →</span>
    </a>
  </div>`;

  write("index.html", shell({ root: "", active: "index.html", title: "Home", body: heroHTML + cardsHTML }));
}

/* Schemes one-pagers */
for (const s of schemes) {
  const body = `
  <nav class="crumbs"><a href="../index.html">Home</a> / <a href="../directory.html">Schemes</a> / <span>${esc(s.name)}</span></nav>
  <article class="scheme-detail">
    <div class="scheme-header">
      <div class="kicker">${esc(s.ministry)} · Part ${s.part}</div>
      <h1>${esc(s.name)}</h1>
      ${s.shortName ? `<div class="shortname">${esc(s.shortName)}</div>` : ""}
      <p class="tagline">${esc(s.tagline)}</p>
      <div class="scheme-meta-badges">
        <span class="badge b-${s.category}">${esc(CAT_LABEL[s.category])}</span>
        ${(s.stages || []).map((st) => `<span class="badge b-plain">${esc(STAGE_LABEL[st])}</span>`).join("")}
        ${s.maxFunding ? `<span class="badge b-amount">${esc(s.maxFunding)}</span>` : ""}
      </div>
    </div>
    
    <div class="scheme-grid">
      <div class="scheme-main">
        <section class="section-block">
          <h2>Overview &amp; Objective</h2>
          <p>${esc(s.summary || s.tagline)}</p>
        </section>
        
        <section class="section-block">
          <h2>Key Benefits &amp; Funding</h2>
          <ul class="check-list">
            ${(s.benefits || []).map((b) => `<li>${esc(b)}</li>`).join("")}
          </ul>
        </section>
        
        <section class="section-block">
          <h2>Eligibility Criteria</h2>
          <ul class="check-list">
            ${(s.eligibility || []).map((e) => `<li>${esc(e)}</li>`).join("")}
          </ul>
        </section>
        
        <section class="section-block">
          <h2>How to Apply</h2>
          <p>${esc(s.howToApply || "Apply through the official portal.")}</p>
          ${s.portalUrl ? `<p style="margin-top:12px"><a class="btn btn-primary" href="${attr(s.portalUrl)}" target="_blank" rel="noopener">Open Official Portal ${ICONS.external}</a></p>` : ""}
        </section>
      </div>
      
      <aside class="scheme-sidebar">
        <div class="facts-card">
          <h3>Scheme Facts</h3>
          <div class="fact-row"><span class="lbl">Ministry</span><span class="val">${esc(s.ministry)}</span></div>
          <div class="fact-row"><span class="lbl">Category</span><span class="val">${esc(CAT_LABEL[s.category])}</span></div>
          <div class="fact-row"><span class="lbl">Max Funding</span><span class="val">${esc(s.maxFunding || "Varies")}</span></div>
          <div class="fact-row"><span class="lbl">Playbook Ref</span><span class="val">Page ${s.page}</span></div>
        </div>
      </aside>
    </div>
  </article>`;

  write(`schemes/${s.slug}.html`, shell({
    root: "../", active: `schemes/${s.slug}.html`,
    title: s.shortName ? `${s.shortName} — ${s.name}` : s.name,
    description: s.tagline,
    body
  }));
}

/* Central Directory */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Central Schemes Directory</span></nav>
  <div class="page-head">
    <div class="kicker">Government of India · 69 Schemes</div>
    <h1>Central Schemes Directory</h1>
    <p class="lede">Browse, search, and filter every central government startup scheme by support category, stage, and sector.</p>
  </div>
  <div class="directory-toolbar">
    <div class="search-input-wrap">
      ${ICONS.search}
      <input type="text" id="directory-search" placeholder="Filter schemes by name, ministry, or keyword…">
    </div>
  </div>
  <div class="schemes-grid" id="directory-grid">
    ${schemes.map((s) => `
    <a class="scheme-card" href="schemes/${s.slug}.html" data-category="${s.category}" data-name="${attr(s.name)}">
      <div class="top"><span class="abbr">${s.shortName ? `${esc(s.shortName)} · ` : ""}Part ${s.part}</span><span class="badge b-${s.category}">${esc(CAT_LABEL[s.category])}</span></div>
      <h3>${esc(s.name)}</h3>
      <div class="ministry">${esc(s.ministry)}</div>
      <p class="tagline">${esc(s.tagline)}</p>
      <div class="meta">
        ${(s.stages || []).map((st) => `<span class="badge b-plain">${esc(STAGE_LABEL[st])}</span>`).join("")}
        ${s.maxFunding ? `<span class="amount">${esc(s.maxFunding)}</span>` : ""}
      </div>
    </a>`).join("")}
  </div>`;

  write("directory.html", shell({ root: "", active: "directory.html", title: "All 69 Central Schemes", body }));
}

/* Scheme Finder Wizard */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Scheme Finder</span></nav>
  <div class="page-head">
    <div class="kicker">Interactive Decision Tree</div>
    <h1>Scheme Finder Wizard</h1>
    <p class="lede">Answer 5 simple questions about your startup's stage, industry, and need to uncover your optimal funding and incubation programs.</p>
  </div>
  <div id="finder-app" class="finder-container">
    <div class="finder-card">
      <div id="finder-question-step"></div>
      <div id="finder-options" class="finder-options-grid"></div>
    </div>
    <div id="finder-results" class="finder-results-section" style="display:none"></div>
  </div>
  <script src="assets/finder.js" defer></script>`;

  write("finder.html", shell({ root: "", active: "finder.html", title: "Scheme Finder Wizard", body }));
}

/* Compare Tool */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Compare Schemes</span></nav>
  <div class="page-head">
    <div class="kicker">Side-by-Side Analysis</div>
    <h1>Compare Schemes</h1>
    <p class="lede">Select up to 3 central schemes to compare eligibility, funding instruments, and target beneficiary requirements.</p>
  </div>
  <div id="compare-app">
    <div class="compare-selectors">
      <select id="compare-s1"><option value="">Select Scheme 1…</option>${schemes.map((s) => `<option value="${s.slug}">${esc(s.name)}</option>`).join("")}</select>
      <select id="compare-s2"><option value="">Select Scheme 2…</option>${schemes.map((s) => `<option value="${s.slug}">${esc(s.name)}</option>`).join("")}</select>
      <select id="compare-s3"><option value="">Select Scheme 3…</option>${schemes.map((s) => `<option value="${s.slug}">${esc(s.name)}</option>`).join("")}</select>
    </div>
    <div id="compare-table-wrap" class="compare-table-container"></div>
  </div>`;

  write("compare.html", shell({ root: "", active: "compare.html", title: "Compare Schemes", body }));
}

/* State Schemes */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>State &amp; UT Schemes</span></nav>
  <div class="page-head">
    <div class="kicker">Sub-National Intelligence · 320+ Schemes</div>
    <h1>State &amp; UT Startup Policies</h1>
    <p class="lede">Explore seed grants, electricity subsidies, patent reimbursements, and procurement incentives across every state and union territory.</p>
  </div>
  <div class="state-schemes-list">
    ${stateSchemes.states.map((st) => `
    <section class="state-section" id="${slugify(st.state)}">
      <div class="state-head">
        <h2>${esc(st.state)}</h2>
        ${st.policy ? `<div class="policy-tag">${esc(st.policy)}</div>` : ""}
      </div>
      <div class="schemes-grid">
        ${(st.schemes || []).map((sc) => `
        <div class="scheme-card state-scheme-card">
          <div class="top"><span class="badge b-plain">${esc(sc.type)}</span></div>
          <h3>${esc(sc.name)}</h3>
          <p class="tagline">${esc(sc.benefit || sc.description || "")}</p>
          ${sc.eligibility ? `<div class="muted" style="font-size:0.85rem;margin-top:8px">Eligibility: ${esc(sc.eligibility)}</div>` : ""}
        </div>`).join("")}
      </div>
    </section>`).join("")}
  </div>`;

  write("state-schemes.html", shell({ root: "", active: "state-schemes.html", title: "State & UT Schemes", body }));
}

/* Incubators Directory */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Incubators Directory</span></nav>
  <div class="page-head">
    <div class="kicker">Ecosystem Infrastructure · 220+ Hubs</div>
    <h1>Incubator &amp; Accelerator Directory</h1>
    <p class="lede">Directory of Technology Business Incubators (TBIs), Atal Incubation Centres (AICs), and regional startup hubs across India.</p>
  </div>
  <div class="incubators-grid">
    ${incubators.incubators.map((r) => `
    <div class="scheme-card incubator-card">
      <div class="top"><span class="badge b-incubation">${esc(r.type)}</span><span class="muted">${esc(r.city)}, ${esc(r.state)}</span></div>
      <h3>${esc(r.name)}</h3>
      <div class="ministry">${esc(r.host || "")}</div>
      <div class="meta" style="margin-top:10px">
        ${(r.sectors || []).map((sec) => `<span class="badge b-plain">${esc(sec)}</span>`).join("")}
      </div>
      ${r.website ? `<p style="margin-top:12px"><a href="${attr(r.website)}" target="_blank" rel="noopener">Visit Website ${ICONS.external}</a></p>` : ""}
    </div>`).join("")}
  </div>`;

  write("incubators.html", shell({ root: "", active: "incubators.html", title: "Incubators Directory", body }));
}

/* 3D Walkable Map */
{
  const body = `
  <div class="walkable-fullscreen-wrap">
    <canvas id="walkable-canvas"></canvas>
    <div class="walkable-hud">
      <div class="hud-top">
        <a class="btn btn-secondary" href="index.html">← Back to Overview</a>
        <div class="hud-title">3D Walkable India Map</div>
      </div>
      <div class="hud-controls-hint">Use WASD or Arrow Keys to walk · Drag to orbit · Scroll to zoom</div>
    </div>
    <div id="walkable-drawer" class="walkable-drawer"></div>
  </div>
  <script type="module" src="assets/walkable-3d.js"></script>`;

  write("walkable-map.html", shell({
    root: "", active: "walkable-map.html", title: "3D Walkable India Map",
    body, immersive: true,
    extraHead: `<link rel="stylesheet" href="assets/walkable.css">`
  }));
}

/* Lifecycle & Needs & Glossary & PSU & States & News & About */
if (existsSync(join(DATA, "lifecycle.json"))) {
  write("lifecycle.html", shell({ root: "", active: "lifecycle.html", title: "Lifecycle Map", body: `<h1>Lifecycle Map</h1><div class="doc-body">${mdToHtml(readText(join(GUIDES, "method.md")) || "Lifecycle navigation.")}</div>` }));
}
if (existsSync(join(DATA, "needs-index.json"))) {
  write("needs.html", shell({ root: "", active: "needs.html", title: "What Do You Need?", body: `<h1>What Do You Need?</h1><div class="doc-body">Need-based directory of grants, loans, equity, and market access.</div>` }));
}
write("glossary.html", shell({ root: "", active: "glossary.html", title: "Glossary", body: `<h1>Glossary</h1><div class="glossary-list">${glossary.terms.map((t) => `<div class="glossary-item" id="${slugify(t.term)}"><h3>${esc(t.term)}</h3><p>${esc(t.definition)}</p></div>`).join("")}</div>` }));
write("psu.html", shell({ root: "", active: "psu.html", title: "PSU & Regulators", body: `<h1>PSU &amp; Regulators</h1><div class="schemes-grid">${psu.programs.map((p) => `<div class="scheme-card"><h3>${esc(p.program)}</h3><div class="ministry">${esc(p.organization)}</div><p>${esc(p.description || "")}</p></div>`).join("")}</div>` }));
write("states.html", shell({ root: "", active: "states.html", title: "State Portals", body: `<h1>State Startup Portals</h1><div class="schemes-grid">${states.states.map((st) => `<div class="scheme-card"><h3>${esc(st.name)}</h3><p>${esc(st.program || "")}</p>${st.portalUrl ? `<a href="${attr(st.portalUrl)}" target="_blank" rel="noopener">Visit Portal ${ICONS.external}</a>` : ""}</div>`).join("")}</div>` }));
write("about.html", shell({ root: "", active: "about.html", title: "About & Disclaimer", body: `<h1>About Startup India OS</h1><div class="doc-body"><p>${esc(about.disclaimer || "Open reference playbook.")}</p></div>` }));
write("news.html", shell({ root: "", active: "news.html", title: "Ecosystem News", body: `<h1>Ecosystem News</h1><div class="news-grid">${news.map((n) => `<div class="scheme-card"><h3><a href="${attr(n.url)}" target="_blank" rel="noopener">${esc(n.title)} ${ICONS.external}</a></h3><div class="muted">${esc(n.source)} · ${esc(n.date || "")}</div><p>${esc(n.summary || "")}</p></div>`).join("")}</div>` }));

/* ================= 2. FOUNDER OPERATING STACK ================= */

/* Stack overview */
{
  const stackDirs = ["01-company", "02-customer", "03-market", "04-product", "05-gtm", "06-operations", "07-money", "08-capital", "09-brand", "10-pulse"];
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Founder Operating Stack</span></nav>
  <div class="page-head">
    <div class="kicker">Internal Operating System</div>
    <h1>The 10-Section Knowledge Stack</h1>
    <p class="lede">A structured, front-mattered knowledge base that turns raw documents into verifiable company intelligence without AI hallucination.</p>
  </div>
  <div class="stack-sections-grid">
    ${stackDirs.map((dir) => {
      const p = join(STACK, dir);
      const files = existsSync(p) ? readdirSync(p).filter((f) => f.endsWith(".md")) : [];
      const file = files[0] || "";
      const content = file ? readText(join(p, file)) : "";
      const [fm] = frontmatter(content);
      return `
      <a class="stack-card" href="stack/${dir}.html">
        <div class="s-num">${dir.slice(0, 2)}</div>
        <h3>${esc(fm.title || dir.slice(3))}</h3>
        <p>${esc(fm.summary || "Structured knowledge section.")}</p>
        <span class="m-link">Open section →</span>
      </a>`;
    }).join("")}
  </div>`;

  write("stack.html", shell({ root: "", active: "stack.html", title: "Founder Operating Stack", body }));
}

/* Individual Stack Sections */
{
  const stackDirs = ["01-company", "02-customer", "03-market", "04-product", "05-gtm", "06-operations", "07-money", "08-capital", "09-brand", "10-pulse"];
  for (const dir of stackDirs) {
    const p = join(STACK, dir);
    const files = existsSync(p) ? readdirSync(p).filter((f) => f.endsWith(".md")) : [];
    const file = files[0] || "";
    const content = file ? readText(join(p, file)) : "";
    const [fm, mdBody] = frontmatter(content);

    const body = `
    <nav class="crumbs"><a href="../index.html">Home</a> / <a href="../stack.html">Stack</a> / <span>${esc(fm.title || dir)}</span></nav>
    <div class="page-head">
      <div class="kicker">Stack Section ${dir.slice(0, 2)}</div>
      <h1>${esc(fm.title || dir)}</h1>
      <p class="lede">${esc(fm.summary || "")}</p>
    </div>
    <div class="doc-body">
      ${mdToHtml(mdBody, { root: "../" })}
    </div>`;

    write(`stack/${dir}.html`, shell({ root: "../", active: `stack/${dir}.html`, title: fm.title || dir, body }));
  }

  /* Context One-Pager */
  if (existsSync(join(STACK, "CONTEXT.md"))) {
    const [fm, mdBody] = frontmatter(readText(join(STACK, "CONTEXT.md")));
    write("stack/context.html", shell({
      root: "../", active: "stack/context.html", title: "Company One-Pager",
      body: `<nav class="crumbs"><a href="../index.html">Home</a> / <a href="../stack.html">Stack</a> / <span>One-Pager</span></nav><div class="doc-body">${mdToHtml(mdBody, { root: "../" })}</div>`
    }));
  }
}

/* ================= 3. AI PROMPTS & WORKSHEETS ================= */

/* Prompts Library */
const promptFiles = existsSync(PROMPTS) ? readdirSync(PROMPTS).filter((f) => f.endsWith(".md") && f !== "INDEX.md") : [];

{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>AI Prompts</span></nav>
  <div class="page-head">
    <div class="kicker">Task Library · 19 Prompts</div>
    <h1>AI Execution Prompt Library</h1>
    <p class="lede">Specialized prompts engineered to run on top of your company stack to produce institutional deliverables.</p>
  </div>
  <div class="prompts-grid">
    ${promptFiles.map((f) => {
      const src = readText(join(PROMPTS, f));
      const [fm, mdBody] = frontmatter(src);
      const titleMatch = mdBody.match(/^#\s+(.*)$/m);
      const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, "");
      return `
      <a class="prompt-card" href="prompts/${f.replace(/\.md$/, ".html")}">
        <div class="p-num">${f.slice(0, 2)}</div>
        <h3>${esc(title)}</h3>
        <p>${esc(fm.summary || "Actionable prompt.")}</p>
        <span class="m-link">View prompt →</span>
      </a>`;
    }).join("")}
  </div>`;

  write("prompts/index.html", shell({ root: "../", active: "prompts/index.html", title: "AI Prompt Library", body }));
}

/* Prompt pages */
for (const f of promptFiles) {
  const src = readText(join(PROMPTS, f));
  const [fm, mdBody] = frontmatter(src);
  const titleMatch = mdBody.match(/^#\s+(.*)$/m);
  const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, "");

  const body = `
  <nav class="crumbs"><a href="../index.html">Home</a> / <a href="index.html">Prompts</a> / <span>${esc(title)}</span></nav>
  <div class="page-head">
    <div class="kicker">Prompt ${f.slice(0, 2)}</div>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(fm.summary || "")}</p>
  </div>
  <div class="doc-body">
    ${mdToHtml(mdBody, { root: "../" })}
  </div>`;

  write(`prompts/${f.replace(/\.md$/, ".html")}`, shell({ root: "../", active: `prompts/${f.replace(/\.md$/, ".html")}`, title, body }));
}

/* Worksheets */
const worksheetFiles = existsSync(WORKSHEETS) ? readdirSync(WORKSHEETS).filter((f) => f.endsWith(".md") && f !== "README.md") : [];

{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Worksheets</span></nav>
  <div class="page-head">
    <div class="kicker">Repeatable Artifacts · 10 Templates</div>
    <h1>Founder Worksheets</h1>
    <p class="lede">Fill-in templates produced repeatedly across customer discovery, competitor audits, and sprint recaps.</p>
  </div>
  <div class="prompts-grid">
    ${worksheetFiles.map((f) => {
      const src = readText(join(WORKSHEETS, f));
      const [fm, mdBody] = frontmatter(src);
      const titleMatch = mdBody.match(/^#\s+(.*)$/m);
      const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, "");
      return `
      <a class="prompt-card" href="worksheets/${f.replace(/\.md$/, ".html")}">
        <h3>${esc(title)}</h3>
        <p>${esc(fm.summary || "Repeatable worksheet artifact.")}</p>
        <span class="m-link">Open worksheet →</span>
      </a>`;
    }).join("")}
  </div>`;

  write("worksheets/index.html", shell({ root: "../", active: "worksheets/index.html", title: "Worksheets", body }));
}

for (const f of worksheetFiles) {
  const src = readText(join(WORKSHEETS, f));
  const [fm, mdBody] = frontmatter(src);
  const titleMatch = mdBody.match(/^#\s+(.*)$/m);
  const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, "");

  const body = `
  <nav class="crumbs"><a href="../index.html">Home</a> / <a href="index.html">Worksheets</a> / <span>${esc(title)}</span></nav>
  <div class="page-head">
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(fm.summary || "")}</p>
  </div>
  <div class="doc-body">
    ${mdToHtml(mdBody, { root: "../" })}
  </div>`;

  write(`worksheets/${f.replace(/\.md$/, ".html")}`, shell({ root: "../", active: `worksheets/${f.replace(/\.md$/, ".html")}`, title, body }));
}

/* ================= 4. GUIDES, PORTFOLIO & RESOURCES ================= */

const guideFiles = existsSync(GUIDES) ? readdirSync(GUIDES).filter((f) => f.endsWith(".md")) : [];
for (const f of guideFiles) {
  const src = readText(join(GUIDES, f));
  const [fm, mdBody] = frontmatter(src);
  const titleMatch = mdBody.match(/^#\s+(.*)$/m);
  const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, "");

  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>${esc(title)}</span></nav>
  <div class="page-head">
    <h1>${esc(title)}</h1>
  </div>
  <div class="doc-body">
    ${mdToHtml(mdBody, { root: "" })}
  </div>`;

  write(f.replace(/\.md$/, ".html"), shell({ root: "", active: f.replace(/\.md$/, ".html"), title, body }));
}

/* Quickstart from root */
if (existsSync(join(ROOT, "QUICKSTART.md"))) {
  const src = readText(join(ROOT, "QUICKSTART.md"));
  const [fm, mdBody] = frontmatter(src);
  write("quickstart.html", shell({
    root: "", active: "quickstart.html", title: "Quickstart Guide",
    body: `<nav class="crumbs"><a href="index.html">Home</a> / <span>Quickstart</span></nav><div class="doc-body">${mdToHtml(mdBody, { root: "" })}</div>`
  }));
}

/* Portfolio rubric */
if (existsSync(join(PORTFOLIO, "rubric.md"))) {
  const src = readText(join(PORTFOLIO, "rubric.md"));
  const [fm, mdBody] = frontmatter(src);
  write("rubric.html", shell({
    root: "", active: "rubric.html", title: "1-5 Maturity Rubric",
    body: `<nav class="crumbs"><a href="index.html">Home</a> / <span>Maturity Rubric</span></nav><div class="doc-body">${mdToHtml(mdBody, { root: "" })}</div>`
  }));
}

/* Resources Directory */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Curated Resources</span></nav>
  <div class="page-head">
    <div class="kicker">Knowledge Catalog · 650+ Items</div>
    <h1>Startup Resources Directory</h1>
    <p class="lede">Hand-curated collection of foundational essays, frameworks, unit economics models, and venture toolkits.</p>
  </div>
  <div class="resources-table-wrap">
    <table class="resources-table">
      <thead><tr><th>Title</th><th>Domain</th><th>Topic</th></tr></thead>
      <tbody>
        ${resources.map((r) => `
        <tr>
          <td><a href="${attr(r.url)}" target="_blank" rel="noopener">${esc(r.title)} ${ICONS.external}</a></td>
          <td><span class="badge b-plain">${esc(r.domain)}</span></td>
          <td>${esc(r.topic)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;

  write("resources.html", shell({ root: "", active: "resources.html", title: "Startup Resources", body }));
}

/* ================= 5. UNIFIED SEARCH INDEX ================= */
{
  const idx = [];
  for (const s of schemes) {
    idx.push({
      t: s.name, s: s.shortName || "", m: s.ministry, d: s.tagline,
      u: `schemes/${s.slug}.html`, k: "scheme", c: s.category
    });
  }
  for (const f of promptFiles) {
    idx.push({
      t: `Prompt ${f.slice(0, 2)}: ${f.slice(3).replace(/\.md$/, "").replace(/-/g, " ")}`,
      s: `Prompt ${f.slice(0, 2)}`,
      d: "AI Execution Prompt",
      u: `prompts/${f.replace(/\.md$/, ".html")}`,
      k: "prompt"
    });
  }
  for (const f of worksheetFiles) {
    idx.push({
      t: `Worksheet: ${f.replace(/\.md$/, "").replace(/-/g, " ")}`,
      s: "Worksheet",
      d: "Founder Fill-In Artifact",
      u: `worksheets/${f.replace(/\.md$/, ".html")}`,
      k: "worksheet"
    });
  }
  for (const t of glossary.terms) {
    idx.push({ t: t.term, u: `glossary.html#${slugify(t.term)}`, k: "glossary", d: t.definition.slice(0, 100) });
  }
  for (const r of incubators.incubators) {
    idx.push({ t: r.name, m: r.host, u: `incubators.html`, k: "incubator", d: `${r.type} · ${r.city}, ${r.state}` });
  }
  writeFileSync(join(OUT, "assets", "search-index.js"), `window.SEARCH_INDEX=${JSON.stringify(idx)};`);
}

/* ================= 6. ASSET SYNC ================= */
cpSync(join(SITE, "tokens.css"), join(OUT, "assets", "tokens.css"));
cpSync(join(SITE, "site.css"), join(OUT, "assets", "site.css"));
cpSync(join(SITE, "site.js"), join(OUT, "assets", "site.js"));
if (existsSync(join(SITE, "walkable-core.js"))) cpSync(join(SITE, "walkable-core.js"), join(OUT, "assets", "walkable-core.js"));
if (existsSync(join(SITE, "walkable-3d-core.js"))) cpSync(join(SITE, "walkable-3d-core.js"), join(OUT, "assets", "walkable-3d-core.js"));
if (existsSync(join(SITE, "walkable-3d.js"))) cpSync(join(SITE, "walkable-3d.js"), join(OUT, "assets", "walkable-3d.js"));
if (existsSync(join(SITE, "vendor"))) cpSync(join(SITE, "vendor"), join(OUT, "assets", "vendor"), { recursive: true });
if (existsSync(join(SITE, "diagrams"))) cpSync(join(SITE, "diagrams"), join(OUT, "assets", "diagrams"), { recursive: true });
if (existsSync(join(SITE, "infographics"))) cpSync(join(SITE, "infographics"), join(OUT, "assets", "infographics"), { recursive: true });
if (existsSync(join(SITE, "aayush.png"))) cpSync(join(SITE, "aayush.png"), join(OUT, "assets", "aayush.png"));
if (existsSync(join(SITE, "og.png"))) cpSync(join(SITE, "og.png"), join(OUT, "assets", "og.png"));
if (existsSync(join(ROOT, PDF_NAME))) cpSync(join(ROOT, PDF_NAME), join(OUT, "assets", PDF_NAME));

writeFileSync(join(OUT, "assets", "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#1f3864"/>
<rect x="12" y="16" width="40" height="7" rx="3.5" fill="#e2621b"/>
<rect x="12" y="28" width="40" height="7" rx="3.5" fill="#ffffff"/>
<rect x="12" y="40" width="40" height="7" rx="3.5" fill="#359a4c"/>
</svg>`);
writeFileSync(join(OUT, ".nojekyll"), "");
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_BASE}sitemap.xml\n`);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `<url><loc>${SITE_BASE}${p === "index.html" ? "" : p}</loc></url>`).join("\n")}
</urlset>`);

console.log(`\n✓ Unified build complete: ${pages.length} pages generated into docs/`);
