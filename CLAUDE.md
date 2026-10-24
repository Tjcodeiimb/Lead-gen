# UpForge OS — project memory for Claude Code

@AGENTS.md

## What this is
Internal web app for UpForge Consulting (Shardul Singh, solo founder, tech beginner). It creates lead-gen
campaigns, imports leads, researches and scores them with Claude, drafts outreach, and holds every draft in
a review queue. Nothing is sent automatically. Read docs/research/00_synthesis_and_decisions.md for the why.

## Stack (do not swap without asking)
Next.js 16 App Router (cacheComponents OFF) · TypeScript strict · Tailwind v4 with custom Apple-style tokens
in src/app/globals.css (no shadcn) · Supabase (Postgres + email/password Auth) · Drizzle ORM · @anthropic-ai/sdk
with structured outputs · pnpm · Vitest.

## Commands
pnpm dev · pnpm typecheck · pnpm lint · pnpm test · pnpm build
pnpm db:generate (after editing src/db/schema.ts) · pnpm db:migrate · pnpm db:seed

## Architecture rules
- Every Claude call goes through src/lib/claude/runner.ts (runJob) or the research function in
  src/lib/jobs/qualify.ts. Both record agent_runs with cost. Never call the SDK elsewhere.
- Structured outputs only (zodOutputFormat + messages.parse). Schemas in src/lib/claude/schemas. No min/max
  or length constraints in those schemas; validate in code.
- Models are pinned in src/lib/claude/models.ts.
- Mock mode (CLAUDE_MODE=mock or no key) must keep working: add a fixture in src/lib/jobs/mocks.ts for any new job.
- The model picks rubric LEVELS; src/lib/claude/scoring.ts computes points, tier and gates. Never let a model output a score.
- Evidence ids come only from API citation objects (harvestFindings). Uncited findings are dropped.
- Server actions: "use server", requireUser() first, write audit_log for user-visible changes, revalidatePath.
- Pages under src/app/(app) are dynamic (force-dynamic on the layout). Auth gate is src/proxy.ts.
- Knowledge base lives in /kb (markdown), loaded by src/lib/kb.ts into cached system prompts.
- Never automate LinkedIn. Never send email from the app. Suppression list is checked on import and approval.

## Style
Keep the Apple-like restraint: one accent colour, pill buttons, cards, generous whitespace, system font stack.
Use the primitives in src/components/ui. Explain the AI's "why" (score reasons, evidence, cost) on every AI artifact.

## Before saying done
pnpm typecheck && pnpm lint && pnpm test && pnpm build must pass. Explain changes in plain language; the owner is a beginner.
