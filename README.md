# UpForge OS

Internal lead-generation workspace for UpForge Consulting. Create a campaign, import leads, let Claude
research, score and draft outreach, then approve every message yourself in a keyboard-driven review queue.

- **Setup for beginners:** [SETUP.md](./SETUP.md)
- **Why it is built this way:** [docs/research/00_synthesis_and_decisions.md](./docs/research/00_synthesis_and_decisions.md) and the five research reports in `docs/research/`
- **Rules for Claude Code when editing this repo:** [CLAUDE.md](./CLAUDE.md)

## What works today (v0)

| Area | Status |
|---|---|
| Email and password sign-in with an email allowlist, change password in Settings | ✅ |
| Campaign wizard → Claude writes positioning, ICP, signals, subject lines, 5-step sequence, LinkedIn note, objections | ✅ |
| Lead import from CSV (auto column matching, dedupe, suppression check, lawful-basis capture) and manual add | ✅ |
| Research with Claude web search + fetch → evidence ledger with citations (cached 30 days per company) | ✅ |
| 8-criterion, 100-point qualification; tiers A/B/C/DQ/NEEDS_RESEARCH computed in code | ✅ |
| Opus-written first email, follow-up and LinkedIn note with deterministic QA flags | ✅ |
| Review queue: edit, approve, reject, copy, open in mail; J/K/A/X shortcuts | ✅ |
| Cost ledger, kill switch, monthly budget, audit log | ✅ |
| Mock mode (no API key) with realistic fixtures | ✅ |
| Sending via Instantly / Gmail drafts, reply webhooks, signal collectors, background jobs | planned (see docs/research/05 §9) |

## Stack
Next.js 16 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Drizzle ORM · Claude API (Opus/Sonnet/Haiku 5.5) · Vercel
