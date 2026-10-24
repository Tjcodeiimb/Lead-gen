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
| Campaign targeting: niche, sub-niche, company city, target city, size, roles | ✅ |
| Lead finders: Claude web research, Apollo (free search + 1-credit reveal), expansion signals (GDELT news, TheirStack jobs, Companies House), Hunter email finder | ✅ |
| Candidate holding area → tick and import; duplicates and suppressed skipped | ✅ |
| Claude writes the campaign plan: positioning, ICP, signals, subject lines, sequence, objections | ✅ |
| Lead import from CSV (auto column matching, dedupe, suppression check, lawful-basis capture) and manual add | ✅ |
| Research with Claude web search + fetch → evidence ledger with citations (cached 30 days per company) | ✅ |
| 8-criterion, 100-point qualification; tiers A/B/C/DQ/NEEDS_RESEARCH computed in code | ✅ |
| Opus-written 4-step sequence (day 0, 4, 9, 18) plus LinkedIn note, with cold-email QA flags | ✅ |
| Per-step sent tracking, follow-ups due on the dashboard, replied / meeting booked | ✅ |
| Gmail drafts via Google OAuth (compose scope only) | ✅ |
| Review queue: edit, approve, reject, copy, open in mail; J/K/A/X shortcuts | ✅ |
| Cost ledger, kill switch, monthly budget, audit log | ✅ |
| Mock mode (no API key) with realistic fixtures | ✅ |
| Automated sending, reply webhooks, scheduled signal watching, background jobs | planned (see docs/research/05 §9) |

## Stack
Next.js 16 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Drizzle ORM · Claude API (Opus/Sonnet/Haiku 5.5) · Vercel
