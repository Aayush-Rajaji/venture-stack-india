# AGENTS.md — Unified Instructions for AI Agents in Startup India OS

You are working inside **Startup India OS**, the unified operating system and government scheme intelligence knowledge base for Indian founders and venture studios.

---

## 1. Core Architecture

The workspace consists of two integrated pillars:
1. **Government Schemes & Intelligence Engine (`data/`)**: 69 Central Government schemes, 320+ State/UT policies, 220+ Incubators, and interactive 3D terrain maps.
2. **Founder Operating Knowledge Stack (`stack/`)**: 10 numbered sections representing the company source-of-truth, 19 modular prompts in `prompts/`, and 10 repeatable artifacts in `worksheets/`.

---

## 2. Order of Reading

When assisting a founder:
1. **`stack/INDEX.md`** — The router. Check what exists and what is missing.
2. **`stack/CONTEXT.md`** — The one-page company summary.
3. **Only open the required sections** using `reads:` and `feeds:` frontmatter edges.
4. **When matching schemes**, consult `data/schemes.json`, `data/decision-tree.json`, and `data/state-schemes.json`.

---

## 3. Non-Negotiable Rules

### Rule 1: Never Invent a Number
Every figure (revenue, margin, CAC, grant amount, valuation, runway) must trace to a verified source:
- An inbox file (`_inbox/`)
- A founder statement in conversation
- An official government scheme document in `data/schemes.json`

If missing, write `[TBD — <what is needed and source>]`.

### Rule 2: Epistemic Tagging
Tag every extracted claim explicitly:
- `[SOURCE OF TRUTH]` — Personally verified by the founder. Only a human may apply this tag.
- `[NEEDS VERIFICATION]` — Extracted from a document or website, but unconfirmed.
- `[TBD]` — Missing information.
- `[CONFLICT]` — Discrepancy between two sources (show both).
- `[ASSESSMENT — name, date]` — Subjective qualitative judgement.

### Rule 3: Indian Market & Compliance Awareness
Default assumptions for Indian operations:
- Currency: Indian Rupee (₹ Lakhs / ₹ Crores)
- Taxes: GST (18% standard, 2%+GST payment gateway friction), TDS compliance
- Government Mechanisms: DPIIT Recognition, Section 80-IAC Tax Exemption, Startup India Seed Fund Scheme (SISFS), MeitY TIDE 2.0, BIRAC BIG, Gujarat SSIP 2.0.

### Rule 4: Sensitivity & Data Privacy
- `public`: Safe for decks, press releases, website.
- `internal`: For team and advisors (margins, salaries, cap table).
- `restricted`: Machine-local only (legal agreements, private keys).

---

## 4. Working with the Prompt Library (`prompts/`)
- When a prompt requires input that is missing from the stack, **stop and ask** rather than guessing.
- Format deliverables as clean, production-ready markdown or HTML documents.
