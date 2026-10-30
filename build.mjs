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
const SITE_NAME = CONFIG.siteName || "Bharat Startup OS";
const TAGLINE = CONFIG.tagline || "The Unified Operating System & Government Schemes Intelligence Engine for Indian Founders.";
const SITE_BASE = CONFIG.siteBase || "https://aayush-rajaji.github.io/bharat-startup-os/";
const PATH_PREFIX = CONFIG.pathPrefix ?? "/startup-india-os/";
const REPO_URL = CONFIG.repo || "https://github.com/Aayush-Rajaji/venture-stack-india";

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
    title: "⚡ Interactive Web Apps",
    items: [
      { href: "app.html", label: "💻 Full Web Terminal App" },
      { href: "calculator.html", label: "🧮 Unit Economics Simulator" },
      { href: "finder.html", label: "🧭 Scheme Finder (5 Qs)" },
      { href: "compare.html", label: "⚖️ Scheme Compare Matrix" },
      { href: "walkable-map.html", label: "🗺️ 3D Walkable India Map" }
    ]
  },
  {
    title: "🏛️ Government Schemes",
    items: [
      { href: "index.html", label: "Playbook Overview" },
      { href: "directory.html", label: "📋 All 69 Central Schemes" },
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
    <span class="brand-name">Venture Stack <span class="thin">India</span></span><span class="brand-edition-pill">Bharat OS</span>
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
<footer class="founder-dock" id="founder-dock" role="contentinfo" aria-label="Founder & Platform Dossier">
  <div class="founder-dock-inner">
    <!-- Left: Founder Identity & Verified Ventures Line -->
    <div class="dock-identity">
      <a href="${root}about.html" class="dock-avatar-link" title="Aayush Rajaji — Co-Founder @ wescaleo.in">
        <img class="dock-avatar" src="${root}assets/aayush.png" alt="Aayush Rajaji" width="32" height="32" loading="lazy">
        <span class="dock-live-pulse" title="System Online 24/7"></span>
      </a>
      <div class="dock-founder-text">
        <div class="dock-brand-flow">
          <span class="dock-founder-name">Aayush Rajaji</span>
          <span class="dock-founder-pill"><span class="badge-dot"></span> Founder</span>
          <span class="dock-credentials-flow">
            <span class="flow-sep">·</span>
            <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="cred-link cred-wescaleo" title="WeScaleo — Sovereign Enterprise AI &amp; FinTech Infrastructure">Co-Founder @ <strong class="brand-ws-text">wescaleo.in ↗</strong></a>
          </span>
        </div>
      </div>
    </div>

    <!-- Right: Verified Connect & Navigation Actions -->
    <div class="dock-actions">
      <div class="dock-connect-pills">
        <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="dock-action-pill dock-action-ws" title="Visit WeScaleo (wescaleo.in)">
          <span class="ws-dot"></span> <span>wescaleo.in ↗</span>
        </a>
        <a href="https://github.com/Aayush-Rajaji" target="_blank" rel="noopener" class="dock-action-pill" title="GitHub (@Aayush-Rajaji)">
          ${ICONS.github} <span>GitHub</span>
        </a>
        <a href="https://www.linkedin.com/in/aayushrajaji/" target="_blank" rel="noopener" class="dock-action-pill dock-action-linkedin" title="Connect on LinkedIn">
          ${ICONS.linkedin} <span>LinkedIn</span>
        </a>
      </div>
      <div class="dock-nav-links">
        <a href="${root}about.html" class="dock-text-nav">About &amp; Dossier</a>
        <a href="${root}assets/${PDF_NAME}" download class="dock-text-nav">PDF</a>
      </div>
      <button class="dock-collapse-toggle" id="dock-collapse-toggle" type="button" aria-label="Toggle Founder Dock view" title="Minimize / expand founder dock">
        <svg class="dock-icon-caret" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>
  </div>

  <!-- Minimized Floating Capsule -->
  <button class="dock-floating-capsule" id="dock-floating-capsule" type="button" aria-label="Expand Founder Dock">
    <img src="${root}assets/aayush.png" alt="Aayush Rajaji" width="22" height="22" class="capsule-avatar">
    <span class="capsule-label"><strong>Aayush Rajaji</strong> · Co-Founder @ wescaleo.in</span>
    <span class="capsule-arrow">⌃</span>
  </button>
</footer>

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
try { rmSync(OUT, { recursive: true, force: true }); } catch (e) {}
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
    <div class="kicker">Sovereign Startup Intelligence · 2026 Edition</div>
    <h1>Venture Stack India</h1>
    <div class="hero-subhead">Unified Bharat Startup Operating System &amp; Government Schemes Intelligence Engine 🇮🇳</div>
    <p class="lede">Every Central Government scheme, state grant, and incubator directory — fused with an AI-native company knowledge stack, 19 execution prompts, and 10 actionable worksheets.</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="app.html">💻 Launch Full Web App</a>
      <a class="btn btn-secondary" href="calculator.html">🧮 Unit Economics Simulator</a>
      <a class="btn btn-secondary" href="finder.html">🧭 Scheme Finder (5 Qs)</a>
      <a class="btn btn-secondary" href="walkable-map.html">🗺️ Explore 3D Map</a>
      <a class="btn btn-secondary" href="stack.html">⚡ Founder Operating Stack</a>
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
    <h2>Explore Core Modules &amp; Web Apps</h2>
    <p class="muted">Navigate between government funding intelligence, interactive financial models, and execution tools.</p>
  </div>
  <div class="modules-grid">
    <a class="module-card" href="app.html">
      <div class="m-icon">💻</div>
      <h3>Full Web Terminal App</h3>
      <p>All-in-one Single Page Application workspace with instant reactive search, scheme comparator, and prompt runner.</p>
      <span class="m-link">Launch Web Terminal →</span>
    </a>
    <a class="module-card" href="calculator.html">
      <div class="m-icon">🧮</div>
      <h3>Unit Economics &amp; Runway Simulator</h3>
      <p>Interactive burn rate &amp; runway stress-tester with 18% GST and 2.36% PG fee friction models.</p>
      <span class="m-link">Calculate runway →</span>
    </a>
    <a class="module-card" href="finder.html">
      <div class="m-icon">🧭</div>
      <h3>Scheme Finder Wizard</h3>
      <p>5-question decision tree matching your stage, sector, and entity type with eligible Central &amp; State funding.</p>
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
    <a class="module-card" href="state-schemes.html">
      <div class="m-icon">🏢</div>
      <h3>320+ State/UT Grants</h3>
      <p>State-specific startup policy seed funds, lease rentals, patent reimbursements, and tax exemptions.</p>
      <span class="m-link">Explore states →</span>
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

    const founderCardHTML = `
  <!-- Founder & Architect Dossier Spotlight -->
  <div class="home-founder-card">
    <div class="home-founder-inner">
      <div class="home-founder-avatar-wrap">
        <img src="assets/aayush.png" alt="Aayush Rajaji" class="home-founder-avatar" width="84" height="84" loading="lazy">
        <span class="home-founder-badge">Founder &amp; Architect</span>
      </div>
      <div class="home-founder-content">
        <div class="home-founder-heading">
          <h2>Aayush Rajaji</h2>
          <span class="home-founder-lead">Co-Founder @ <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="founder-lead-link">wescaleo.in</a> · Venture Architect &amp; Sovereign AI Systems Builder</span>
        </div>
        <div class="home-founder-tags">
          <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="founder-tag founder-tag-wescaleo"><span class="ws-indicator-dot"></span> Co-Founder @ <strong class="brand-ws-text">wescaleo.in ↗</strong></a>
        </div>
        <p class="home-founder-desc">
          Building sovereign enterprise AI infrastructure, deterministic business operating systems, and financial intelligence tools. Venture Stack India synthesizes verified central schemes and venture frameworks into an open, hallucination-resistant knowledge base for Indian founders.
        </p>
        <div class="home-founder-actions">
          <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Visit wescaleo.in ↗</a>
          <a href="https://github.com/Aayush-Rajaji" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">${ICONS.github} GitHub (@Aayush-Rajaji)</a>
          <a href="https://www.linkedin.com/in/aayushrajaji/" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">${ICONS.linkedin} Connect on LinkedIn</a>
          <a href="about.html" class="btn btn-secondary btn-sm">Read Full Dossier &amp; Architecture →</a>
        </div>
      </div>
    </div>
  </div>`;

  write("index.html", shell({ root: "", active: "index.html", title: "Home", body: heroHTML + cardsHTML + founderCardHTML }));
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
write("about.html", shell({
  root: "",
  active: "about.html",
  title: "About & Disclaimer · Platform Dossier",
  body: `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>About &amp; Method</span></nav>
  <div class="page-head">
    <div class="kicker">Platform Dossier &amp; Architecture</div>
    <h1>About Venture Stack India</h1>
    <p class="lede">The Unified Operating System &amp; Government Schemes Intelligence Engine for Indian Founders.</p>
  </div>

  <!-- Founder Spotlight Dossier Card -->
  <div class="founder-spotlight-card">
    <div class="spotlight-header">
      <div class="spotlight-avatar-wrap">
        <img src="assets/aayush.png" alt="Aayush Rajaji" class="spotlight-avatar" width="76" height="76">
        <span class="spotlight-badge">Founder &amp; Architect</span>
      </div>
      <div class="spotlight-title-group">
        <h2>Aayush Rajaji</h2>
        <div class="spotlight-roles">
          <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="spotlight-chip spotlight-chip-wescaleo"><span class="ws-indicator-dot"></span> Co-Founder @ <strong>wescaleo.in</strong> ↗</a>
        </div>
        <div class="spotlight-links">
          <a href="https://wescaleo.in/" target="_blank" rel="noopener" class="spotlight-link-pill spotlight-link-ws">wescaleo.in ↗</a>
          <a href="https://github.com/Aayush-Rajaji" target="_blank" rel="noopener" class="spotlight-link-pill">${ICONS.github} GitHub (@Aayush-Rajaji)</a>
          <a href="https://www.linkedin.com/in/aayushrajaji/" target="_blank" rel="noopener" class="spotlight-link-pill">${ICONS.linkedin} LinkedIn Profile</a>
        </div>
      </div>
    </div>
    <p class="spotlight-bio">
      Architecting sovereign enterprise AI systems, venture frameworks, and financial operations. Venture Stack India synthesizes 69 verified Central Government schemes, 320+ state grants, and 220+ incubators into a hallucination-resistant 10-section company operating stack for high-growth Indian startups.
    </p>
  </div>

  <div class="doc-body">
    <h2>🎯 Platform Objective</h2>
    <p>${esc(about.objective)}</p>

    <h2>👥 Who It Is For</h2>
    <div class="tags-row" style="display:flex; flex-wrap:wrap; gap:8px; margin: 14px 0 24px;">
      ${about.whoItIsFor.map(w => `<span class="tag tag-stage" style="padding: 4px 12px; background: var(--surface-alt); border: 1px solid var(--border); border-radius: var(--radius-pill); font-size: 0.82rem; font-weight: 600;">${esc(w)}</span>`).join("")}
    </div>

    <h2>🧭 How to Navigate</h2>
    <p>${esc(about.howToUse)}</p>

    <h2>📜 Statutory Disclaimer &amp; Open Knowledge Protocol</h2>
    <blockquote>
      ${about.disclaimer.split("\n\n").map(p => `<p>${esc(p)}</p>`).join("")}
    </blockquote>
  </div>`
}));
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

/* ================= 4B. UNIT ECONOMICS & RUNWAY CALCULATOR ================= */
{
  const body = `
  <nav class="crumbs"><a href="index.html">Home</a> / <span>Unit Economics Simulator</span></nav>
  <div class="page-head">
    <div class="kicker">Financial Stress-Tester · India Compliant</div>
    <h1>Unit Economics &amp; Runway Simulator</h1>
    <p class="lede">Calculate real net contribution margins, payment gateway friction (2% + 18% GST), break-even MRR, and 3-scenario runway projections.</p>
  </div>

  <div class="calc-grid">
    <div class="calc-card">
      <h2 style="font-size:1.2rem; margin:0 0 10px;">📊 Operating &amp; Revenue Inputs</h2>
      
      <div class="calc-group">
        <div class="calc-label-row">
          <span>Current Cash in Bank (₹)</span>
          <span class="calc-val-display" id="val_cash">₹25,00,000</span>
        </div>
        <input class="calc-slider" id="in_cash" type="range" min="0" max="20000000" step="50000" value="2500000">
      </div>

      <div class="calc-group">
        <div class="calc-label-row">
          <span>Monthly Operating Burn (₹)</span>
          <span class="calc-val-display" id="val_burn">₹3,50,000</span>
        </div>
        <input class="calc-slider" id="in_burn" type="range" min="20000" max="3000000" step="10000" value="350000">
      </div>

      <div class="calc-group">
        <div class="calc-label-row">
          <span>Monthly Revenue / MRR (₹)</span>
          <span class="calc-val-display" id="val_rev">₹1,50,000</span>
        </div>
        <input class="calc-slider" id="in_rev" type="range" min="0" max="3000000" step="10000" value="150000">
      </div>

      <div class="calc-group">
        <div class="calc-label-row">
          <span>Gross Margin (%)</span>
          <span class="calc-val-display" id="val_margin">75%</span>
        </div>
        <input class="calc-slider" id="in_margin" type="range" min="10" max="100" step="1" value="75">
      </div>

      <div class="calc-toggle-row">
        <label for="in_pg">💳 Deduct Payment Gateway Friction (2.36%)</label>
        <input type="checkbox" id="in_pg" checked style="width:18px;height:18px;cursor:pointer;">
      </div>

      <div class="calc-toggle-row">
        <label for="in_gst">🏛️ Apply 18% GST Outflow Friction</label>
        <input type="checkbox" id="in_gst" checked style="width:18px;height:18px;cursor:pointer;">
      </div>
    </div>

    <div class="calc-card">
      <h2 style="font-size:1.2rem; margin:0 0 10px;">⚡ Real-Time Runway &amp; Health KPIs</h2>
      
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-title">Runway Projection</div>
          <div class="kpi-value" id="kpi_runway">10.4 mo</div>
          <div class="kpi-sub" id="kpi_status">🟡 Warning (&lt; 12 mo)</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">Net Monthly Burn</div>
          <div class="kpi-value" id="kpi_net_burn">₹2,40,750</div>
          <div class="kpi-sub">Actual monthly cash drain</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">Break-Even MRR</div>
          <div class="kpi-value" id="kpi_breakeven">₹4,80,769</div>
          <div class="kpi-sub">Target for Default Alive</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-title">Net Margin (Post-Friction)</div>
          <div class="kpi-value" id="kpi_net_margin">72.6%</div>
          <div class="kpi-sub">After PG fees &amp; GST</div>
        </div>
      </div>

      <div style="background:var(--surface-alt); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border);">
        <h3 style="font-size:0.95rem; margin-bottom:8px;">🎯 3-Scenario Stress-Test</h3>
        <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
          <tr style="border-bottom:1px solid var(--border);"><th style="padding:6px 0;">Scenario</th><th style="text-align:right;">Net Burn</th><th style="text-align:right;">Runway</th></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 0;">🟢 Base Case</td><td id="sc_base_burn" style="text-align:right;">₹2,40,750</td><td id="sc_base_run" style="text-align:right;">10.4 mo</td></tr>
          <tr style="border-bottom:1px solid var(--border);"><td style="padding:6px 0;">🟡 Bear Case (-30% Rev)</td><td id="sc_bear_burn" style="text-align:right;">₹2,73,525</td><td id="sc_bear_run" style="text-align:right;">9.1 mo</td></tr>
          <tr><td style="padding:6px 0;">🔴 Zero Revenue (Pure Burn)</td><td id="sc_zero_burn" style="text-align:right;">₹3,50,000</td><td id="sc_zero_run" style="text-align:right;">7.1 mo</td></tr>
        </table>
      </div>

      <button class="copy-btn-action" id="btn_copy_calc" style="align-self:flex-start;">📋 Copy Financial Summary</button>
    </div>
  </div>

  <script>
  (function(){
    const inCash = document.getElementById('in_cash');
    const inBurn = document.getElementById('in_burn');
    const inRev = document.getElementById('in_rev');
    const inMargin = document.getElementById('in_margin');
    const inPg = document.getElementById('in_pg');
    const inGst = document.getElementById('in_gst');

    const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

    function update() {
      const cash = parseFloat(inCash.value);
      const burn = parseFloat(inBurn.value);
      const rev = parseFloat(inRev.value);
      const marginPct = parseFloat(inMargin.value);
      const pgActive = inPg.checked;
      const gstActive = inGst.checked;

      document.getElementById('val_cash').innerText = fmt(cash);
      document.getElementById('val_burn').innerText = fmt(burn);
      document.getElementById('val_rev').innerText = fmt(rev);
      document.getElementById('val_margin').innerText = marginPct + '%';

      let effectiveMargin = (marginPct / 100);
      if (pgActive) effectiveMargin -= 0.0236; // 2% + 18% GST = 2.36%
      if (effectiveMargin < 0.05) effectiveMargin = 0.05;

      const netRev = rev * effectiveMargin;
      const netBurn = burn - netRev;

      document.getElementById('kpi_net_margin').innerText = (effectiveMargin * 100).toFixed(1) + '%';
      document.getElementById('kpi_breakeven').innerText = fmt(burn / effectiveMargin);

      if (netBurn <= 0) {
        document.getElementById('kpi_runway').innerText = '∞ Alive';
        document.getElementById('kpi_runway').className = 'kpi-value healthy';
        document.getElementById('kpi_status').innerText = '🟢 Default Alive (Profitable)';
        document.getElementById('kpi_net_burn').innerText = '+ ' + fmt(Math.abs(netBurn));
      } else {
        const runwayMonths = cash / netBurn;
        document.getElementById('kpi_net_burn').innerText = fmt(netBurn);
        document.getElementById('kpi_runway').innerText = runwayMonths.toFixed(1) + ' mo';
        if (runwayMonths >= 18) {
          document.getElementById('kpi_runway').className = 'kpi-value healthy';
          document.getElementById('kpi_status').innerText = '🟢 Healthy (> 18 mo)';
        } else if (runwayMonths >= 9) {
          document.getElementById('kpi_runway').className = 'kpi-value warning';
          document.getElementById('kpi_status').innerText = '🟡 Moderate (9-18 mo)';
        } else {
          document.getElementById('kpi_runway').className = 'kpi-value danger';
          document.getElementById('kpi_status').innerText = '🔴 Critical (< 9 mo)';
        }
      }

      // 3 Scenarios
      const bearNetBurn = burn - (rev * 0.7 * effectiveMargin);
      document.getElementById('sc_base_burn').innerText = fmt(Math.max(0, netBurn));
      document.getElementById('sc_base_run').innerText = netBurn > 0 ? (cash / netBurn).toFixed(1) + ' mo' : '∞ Alive';
      
      document.getElementById('sc_bear_burn').innerText = fmt(Math.max(0, bearNetBurn));
      document.getElementById('sc_bear_run').innerText = bearNetBurn > 0 ? (cash / bearNetBurn).toFixed(1) + ' mo' : '∞ Alive';

      document.getElementById('sc_zero_burn').innerText = fmt(burn);
      document.getElementById('sc_zero_run').innerText = (cash / burn).toFixed(1) + ' mo';
    }

    [inCash, inBurn, inRev, inMargin, inPg, inGst].forEach(el => el.addEventListener('input', update));
    update();

    document.getElementById('btn_copy_calc').addEventListener('click', function(){
      const text = "=== BHARAT STARTUP OS · RUNWAY SUMMARY ===\\n" +
        "Cash in Bank: " + document.getElementById('val_cash').innerText + "\\n" +
        "Monthly Burn: " + document.getElementById('val_burn').innerText + "\\n" +
        "MRR: " + document.getElementById('val_rev').innerText + "\\n" +
        "Runway Projection: " + document.getElementById('kpi_runway').innerText + " (" + document.getElementById('kpi_status').innerText + ")\\n" +
        "Break-Even MRR: " + document.getElementById('kpi_breakeven').innerText + "\\n" +
        "Net Margin (Post-Friction): " + document.getElementById('kpi_net_margin').innerText;
      navigator.clipboard.writeText(text).then(()=>{
        this.innerText = '✓ Copied to Clipboard!';
        setTimeout(()=> this.innerText = '📋 Copy Financial Summary', 2000);
      });
    });
  })();
  </script>`;

  write("calculator.html", shell({ root: "", active: "calculator.html", title: "Unit Economics & Runway Simulator", body }));
}

/* ================= 4C. ALL-IN-ONE WEB TERMINAL APP ================= */
{
  const schemesMin = schemes.map(s => ({
    slug: s.slug, name: s.name, short: s.shortName, ministry: s.ministry,
    tagline: s.tagline, cap: s.fundingCap, type: s.supportType, cat: s.category,
    stage: s.stage, sector: s.sector, applyUrl: s.applyUrl
  }));

  const promptsMin = promptFiles.map(f => {
    const src = readText(join(PROMPTS, f));
    const [fm, mdBody] = frontmatter(src);
    const titleMatch = mdBody.match(/^#\s+(.*)$/m);
    return {
      file: f, num: f.slice(0, 2), title: titleMatch ? titleMatch[1] : f,
      summary: fm.summary || "", content: mdBody
    };
  });

  const body = `
  <div class="app-terminal-wrap">
    <div class="app-terminal-header">
      <div class="app-brand-zone">
        <span style="font-size:1.8rem;">🇮🇳</span>
        <div>
          <div class="app-brand-title">Bharat Startup OS · Web Terminal</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">Unified Operating System &amp; Government Schemes Intelligence Engine</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span class="app-spec-badge">⚡ Web Terminal | OLED Pitch Black | [Nodes: 157]</span>
        <a class="btn btn-secondary" style="font-size:0.82rem; padding:6px 12px;" href="walkable-map.html">🗺️ 3D India Map</a>
        <a class="btn btn-primary" style="font-size:0.82rem; padding:6px 12px;" href="${REPO_URL}" target="_blank" rel="noopener">GitHub Repo ↗</a>
      </div>
    </div>

    <div class="app-tab-nav">
      <button class="app-tab-btn active" data-tab="tab-schemes">📋 Central Schemes (69)</button>
      <button class="app-tab-btn" data-tab="tab-finder">🧭 Scheme Finder Wizard</button>
      <button class="app-tab-btn" data-tab="tab-compare">⚖️ Compare Schemes</button>
      <button class="app-tab-btn" data-tab="tab-calc">🧮 Unit Economics Simulator</button>
      <button class="app-tab-btn" data-tab="tab-states">🏢 320+ State Grants</button>
      <button class="app-tab-btn" data-tab="tab-incubators">🔬 220+ Incubators</button>
      <button class="app-tab-btn" data-tab="tab-stack">⚡ Knowledge Stack (01-10)</button>
      <button class="app-tab-btn" data-tab="tab-prompts">🤖 19 AI Prompts</button>
      <button class="app-tab-btn" data-tab="tab-worksheets">📝 10 Worksheets</button>
    </div>

    <!-- Tab 1: Schemes Directory -->
    <div class="tab-pane active" id="tab-schemes">
      <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
        <input id="app_scheme_search" type="text" placeholder="Search 69 central schemes (e.g. SISFS, BIG, TIDE, PRISM)..." style="flex:1; min-width:240px; padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface); color:var(--text);">
        <select id="app_scheme_cat" style="padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface); color:var(--text);">
          <option value="">All Categories</option>
          <option value="grant">Grants</option>
          <option value="equity">Equity</option>
          <option value="loan-credit">Loans / Credit</option>
          <option value="incubation">Incubation</option>
        </select>
      </div>
      <div class="modules-grid" id="app_schemes_list"></div>
    </div>

    <!-- Tab 2: Scheme Finder Wizard -->
    <div class="tab-pane" id="tab-finder">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">🧭 Interactive 5-Question Scheme Finder</h2>
        <p class="muted">Answer 5 simple questions to get matched with eligible Government of India grants.</p>
        
        <div style="display:flex; flex-direction:column; gap:16px; margin:16px 0;">
          <div>
            <strong>1. What is your startup stage?</strong>
            <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
              <label><input type="radio" name="w_stage" value="ideation" checked> Ideation / Concept</label>
              <label><input type="radio" name="w_stage" value="validation"> Validation / PoC</label>
              <label><input type="radio" name="w_stage" value="seed"> Seed / Early Traction</label>
              <label><input type="radio" name="w_stage" value="scaling"> Scaling / Growth</label>
            </div>
          </div>

          <div>
            <strong>2. What type of support do you need most?</strong>
            <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
              <label><input type="radio" name="w_need" value="grant" checked> Non-Dilutive Grant</label>
              <label><input type="radio" name="w_need" value="equity"> Seed Equity</label>
              <label><input type="radio" name="w_need" value="loan-credit"> Collateral-Free Loan</label>
              <label><input type="radio" name="w_need" value="incubation"> Lab Access &amp; Incubation</label>
            </div>
          </div>

          <div>
            <strong>3. What sector does your product belong to?</strong>
            <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
              <label><input type="radio" name="w_sector" value="general" checked> Sector Agnostic / Tech</label>
              <label><input type="radio" name="w_sector" value="deeptech"> DeepTech / AI / Hardware</label>
              <label><input type="radio" name="w_sector" value="biotech"> Biotech / MedTech</label>
              <label><input type="radio" name="w_sector" value="agritech"> AgriTech / Food</label>
              <label><input type="radio" name="w_sector" value="defence"> Defence / Aerospace</label>
            </div>
          </div>

          <div>
            <strong>4. Is your company DPIIT-Recognized?</strong>
            <div style="display:flex; gap:10px; margin-top:6px;">
              <label><input type="radio" name="w_dpiit" value="yes" checked> Yes (DPIIT Recognized)</label>
              <label><input type="radio" name="w_dpiit" value="no"> No / Individual Innovator</label>
            </div>
          </div>
        </div>

        <button class="btn btn-primary" id="btn_run_wizard" style="align-self:flex-start;">Find Matching Schemes →</button>
        
        <div style="margin-top:20px;">
          <h3 style="font-size:1.1rem; margin-bottom:12px;">Matched Schemes Recommendations</h3>
          <div class="modules-grid" id="wizard_results"></div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Scheme Compare -->
    <div class="tab-pane" id="tab-compare">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">⚖️ Side-by-Side Scheme Compare</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin:14px 0;">
          <select id="cmp_scheme_1" style="padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface); color:var(--text);"></select>
          <select id="cmp_scheme_2" style="padding:10px; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--surface); color:var(--text);"></select>
        </div>
        <div class="table-wrap">
          <table style="width:100%;">
            <thead><tr><th>Attribute</th><th id="cmp_head_1">Scheme 1</th><th id="cmp_head_2">Scheme 2</th></tr></thead>
            <tbody id="cmp_table_body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Tab 4: Unit Economics Calculator -->
    <div class="tab-pane" id="tab-calc">
      <div style="padding:10px 0;">
        <h2 style="font-size:1.4rem;">🧮 Interactive Unit Economics &amp; Runway Simulator</h2>
        <p class="muted">Use live range sliders to stress-test your monthly burn, revenue, and runway.</p>
        <div id="embedded_calc_container"></div>
      </div>
    </div>

    <!-- Tab 5: State Schemes -->
    <div class="tab-pane" id="tab-states">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">🏢 320+ State Startup Policy Grants</h2>
        <p class="muted">Access state-specific seed capital, lease rentals, patent reimbursements, and electricity duty subsidies.</p>
        <div style="margin-top:16px;">
          <a class="btn btn-primary" href="state-schemes.html">Open Full State Schemes Directory →</a>
        </div>
      </div>
    </div>

    <!-- Tab 6: Incubators -->
    <div class="tab-pane" id="tab-incubators">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">🔬 220+ Technology Business Incubators &amp; AICs</h2>
        <p class="muted">Search verified TBIs and Atal Incubation Centres across all major Tier-1, Tier-2, and Tier-3 Indian cities.</p>
        <div style="margin-top:16px;">
          <a class="btn btn-primary" href="incubators.html">Open Interactive Incubator Map &amp; Directory →</a>
        </div>
      </div>
    </div>

    <!-- Tab 7: Knowledge Stack -->
    <div class="tab-pane" id="tab-stack">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">⚡ Founder Knowledge Stack (01-10)</h2>
        <p class="muted">10 structured markdown sections establishing single source-of-truth venture context.</p>
        <div class="stack-sections-grid" style="margin-top:16px;">
          <a class="stack-card" href="stack/01-company.html"><span class="s-num">01</span><h3>Company</h3><p>Legal entity, cap table, founding thesis.</p></a>
          <a class="stack-card" href="stack/02-customer.html"><span class="s-num">02</span><h3>Customer</h3><p>ICP persona, quantified pain points.</p></a>
          <a class="stack-card" href="stack/03-market.html"><span class="s-num">03</span><h3>Market</h3><p>TAM/SAM/SOM, market drivers.</p></a>
          <a class="stack-card" href="stack/04-product.html"><span class="s-num">04</span><h3>Product</h3><p>Architecture, core roadmap.</p></a>
          <a class="stack-card" href="stack/05-gtm.html"><span class="s-num">05</span><h3>GTM</h3><p>Distribution channels, CAC payback.</p></a>
          <a class="stack-card" href="stack/06-operations.html"><span class="s-num">06</span><h3>Operations</h3><p>Team structure, compliance checklist.</p></a>
          <a class="stack-card" href="stack/07-money.html"><span class="s-num">07</span><h3>Money</h3><p>Unit economics, gross margins, runway.</p></a>
          <a class="stack-card" href="stack/08-capital.html"><span class="s-num">08</span><h3>Capital</h3><p>Govt schemes, dilution strategy.</p></a>
          <a class="stack-card" href="stack/09-brand.html"><span class="s-num">09</span><h3>Brand</h3><p>Voice guidelines, positioning pillars.</p></a>
          <a class="stack-card" href="stack/10-pulse.html"><span class="s-num">10</span><h3>Pulse</h3><p>Weekly metrics cadence, OKRs.</p></a>
        </div>
      </div>
    </div>

    <!-- Tab 8: AI Prompts -->
    <div class="tab-pane" id="tab-prompts">
      <div style="margin-bottom:14px;">
        <h2 style="font-size:1.3rem;">🤖 19 Battle-Tested Founder AI Prompts</h2>
        <p class="muted">Click any prompt to copy its complete markdown system prompt to your clipboard.</p>
      </div>
      <div class="prompts-grid" id="app_prompts_list"></div>
    </div>

    <!-- Tab 9: Worksheets -->
    <div class="tab-pane" id="tab-worksheets">
      <div class="calc-card">
        <h2 style="font-size:1.3rem;">📝 10 Actionable Founder Worksheets</h2>
        <p class="muted">Structured fill-in templates for customer interviews, competitor teardowns, and sprint recaps.</p>
        <div style="margin-top:16px;">
          <a class="btn btn-primary" href="worksheets/index.html">View All 10 Worksheets →</a>
        </div>
      </div>
    </div>
  </div>

  <script>
  window.APP_DATA = {
    schemes: ${JSON.stringify(schemesMin)},
    prompts: ${JSON.stringify(promptsMin)}
  };

  (function(){
    // Tab switching
    const tabBtns = document.querySelectorAll('.app-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        document.getElementById(target).classList.add('active');
      });
    });

    // Render Schemes in Tab 1
    const schemesList = document.getElementById('app_schemes_list');
    const searchIn = document.getElementById('app_scheme_search');
    const catSelect = document.getElementById('app_scheme_cat');

    function renderSchemes() {
      const q = searchIn.value.toLowerCase();
      const cat = catSelect.value;
      const filtered = window.APP_DATA.schemes.filter(s => {
        const matchQ = s.name.toLowerCase().includes(q) || (s.short && s.short.toLowerCase().includes(q)) || s.tagline.toLowerCase().includes(q);
        const matchCat = !cat || s.cat === cat;
        return matchQ && matchCat;
      });

      schemesList.innerHTML = filtered.map(s => \`
        <div class="module-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span class="badge b-grant">\${s.type || s.cat}</span>
            <span style="font-family:var(--font-mono); font-weight:700; color:var(--primary); font-size:0.9rem;">\${s.cap || ''}</span>
          </div>
          <h3 style="margin-top:8px;">\${s.name}</h3>
          <p>\${s.tagline}</p>
          <div style="display:flex; gap:10px; margin-top:8px;">
            <a class="btn btn-secondary" style="font-size:0.78rem; padding:4px 8px;" href="schemes/\${s.slug}.html">Full Scheme Page →</a>
            \${s.applyUrl ? \`<a class="btn btn-primary" style="font-size:0.78rem; padding:4px 8px;" href="\${s.applyUrl}" target="_blank" rel="noopener">Official Apply ↗</a>\` : ''}
          </div>
        </div>
      \`).join('');
    }
    searchIn.addEventListener('input', renderSchemes);
    catSelect.addEventListener('change', renderSchemes);
    renderSchemes();

    // Scheme Compare in Tab 3
    const s1 = document.getElementById('cmp_scheme_1');
    const s2 = document.getElementById('cmp_scheme_2');
    window.APP_DATA.schemes.forEach((s, i) => {
      s1.add(new Option(s.short ? s.short + ' - ' + s.name : s.name, i));
      s2.add(new Option(s.short ? s.short + ' - ' + s.name : s.name, (i + 1) % window.APP_DATA.schemes.length));
    });
    s2.selectedIndex = 1;

    function renderCompare() {
      const a = window.APP_DATA.schemes[s1.value];
      const b = window.APP_DATA.schemes[s2.value];
      document.getElementById('cmp_head_1').innerText = a.name;
      document.getElementById('cmp_head_2').innerText = b.name;

      const rows = [
        ['Nodal Ministry / Agency', a.ministry, b.ministry],
        ['Funding Cap / Ceilings', a.cap, b.cap],
        ['Support Type', a.type || a.cat, b.type || b.cat],
        ['Eligible Stage', a.stage || 'All Stages', b.stage || 'All Stages'],
        ['Focus Sector', a.sector || 'Agnostic', b.sector || 'Agnostic'],
        ['Official Application Portal', \`<a href="\${a.applyUrl || '#'}" target="_blank">Direct Portal ↗</a>\`, \`<a href="\${b.applyUrl || '#'}" target="_blank">Direct Portal ↗</a>\`]
      ];

      document.getElementById('cmp_table_body').innerHTML = rows.map(r => \`
        <tr><td style="font-weight:600; width:25%;">\${r[0]}</td><td style="width:37%;">\${r[1]}</td><td style="width:37%;">\${r[2]}</td></tr>
      \`).join('');
    }
    s1.addEventListener('change', renderCompare);
    s2.addEventListener('change', renderCompare);
    renderCompare();

    // Prompts in Tab 8
    const promptsList = document.getElementById('app_prompts_list');
    promptsList.innerHTML = window.APP_DATA.prompts.map(p => \`
      <div class="prompt-card">
        <span class="p-num">Prompt \${p.num}</span>
        <h3>\${p.title}</h3>
        <p>\${p.summary}</p>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button class="copy-btn-action" data-prompt-file="\${p.file}">📋 Copy Prompt</button>
          <a class="btn btn-secondary" style="font-size:0.78rem; padding:4px 8px;" href="prompts/\${p.file.replace('.md', '.html')}">Open Page →</a>
        </div>
      </div>
    \`).join('');

    promptsList.querySelectorAll('.copy-btn-action').forEach(btn => {
      btn.addEventListener('click', function(){
        const file = this.getAttribute('data-prompt-file');
        const item = window.APP_DATA.prompts.find(x => x.file === file);
        if (item) {
          navigator.clipboard.writeText(item.content).then(() => {
            this.innerText = '✓ Copied!';
            this.style.background = '#10b981';
            this.style.color = '#fff';
            setTimeout(() => {
              this.innerText = '📋 Copy Prompt';
              this.style.background = '';
              this.style.color = '';
            }, 2000);
          });
        }
      });
    });

    // Scheme Finder Wizard
    document.getElementById('btn_run_wizard').addEventListener('click', function(){
      const stage = document.querySelector('input[name="w_stage"]:checked').value;
      const need = document.querySelector('input[name="w_need"]:checked').value;
      const sector = document.querySelector('input[name="w_sector"]:checked').value;

      const matches = window.APP_DATA.schemes.filter(s => {
        let score = 0;
        if (s.cat === need || s.type === need) score += 2;
        if (s.stage && (s.stage.includes(stage) || s.stage === 'general')) score += 1;
        if (s.sector && (s.sector.includes(sector) || s.sector === 'general')) score += 1;
        return score >= 2;
      });

      const resList = document.getElementById('wizard_results');
      if (matches.length === 0) {
        resList.innerHTML = '<p class="muted">No direct matches found. Try selecting Sector Agnostic or Grants.</p>';
      } else {
        resList.innerHTML = matches.slice(0, 6).map(s => \`
          <div class="module-card">
            <span class="badge b-grant">\${s.type || s.cat}</span>
            <h3 style="margin-top:8px;">\${s.name}</h3>
            <p>\${s.tagline}</p>
            <div style="display:flex; gap:10px; margin-top:8px;">
              <a class="btn btn-secondary" style="font-size:0.78rem; padding:4px 8px;" href="schemes/\${s.slug}.html">Details →</a>
              \${s.applyUrl ? \`<a class="btn btn-primary" style="font-size:0.78rem; padding:4px 8px;" href="\${s.applyUrl}" target="_blank" rel="noopener">Apply ↗</a>\` : ''}
            </div>
          </div>
        \`).join('');
      }
    });

  })();
  </script>`;

  write("app.html", shell({ root: "", active: "app.html", title: "Web Terminal App", body, immersive: false }));
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
