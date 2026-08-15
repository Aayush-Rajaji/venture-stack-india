# Quickstart — Startup India OS

Get up and running with the unified operating system in under 15 minutes.

---

## 1. Explore Government Schemes & Grants
- **Live Interactive Finder**: Open the [Scheme Finder](finder.html) to answer 5 quick questions and find all matching central and state grants.
- **3D Walkable Ecosystem Map**: Open [walkable-map.html](walkable-map.html) to explore the 3D Indian startup geography, incubators, and state policy drawers.
- **Scheme Directory**: Browse all 69 Central Schemes and 320+ State Incentives in [directory.html](directory.html).

---

## 2. Initialize Your Company Knowledge Stack

```bash
# 1. Fill your inbox with company documents (pitch decks, transcripts, financials)
cp ~/Downloads/*.pdf _inbox/

# 2. Run Prompt 00 against your AI assistant
# Prompts live in prompts/00-bootstrap-the-stack.md
```

The AI reads `_inbox/` and populates the 10-section knowledge stack in `stack/`:
- `01-company/` · `02-customer/` · `03-market/` · `04-product/` · `05-gtm/`
- `06-operations/` · `07-money/` · `08-capital/` · `09-brand/` · `10-pulse/`

---

## 3. Run AI Execution Prompts
- **Prompt 07**: Unit Economics & Break-Even Stress-Tester
- **Prompt 10**: Institutional Pitch Deck Generator
- **Prompt 11**: Fundraise & Diligence Readiness Audit
- **Prompt 12**: Weekly Pulse & Investor Update Recap

---

## 4. Rebuild the Documentation Site Locally

```bash
node build.mjs
```
All static pages are compiled cleanly into `docs/` for instant local browsing or 100% free hosting on GitHub Pages.
