# UpForge OS — Setup guide (written for a first-time builder)

You will create three free accounts, paste five values into one file, run two commands, and you are in.
Budget 45 minutes the first time. Nothing here costs money until you add a Claude API key.

## 0. What you are setting up

| Piece | What it does | Cost |
|---|---|---|
| **Supabase** | Your database and the magic-link sign-in | Free tier is fine to start; Pro ($25/mo) when it matters |
| **Vercel** | Hosts the app on the internet | Hobby is free for personal use; Pro ($20/mo) for commercial use |
| **Claude Console** | The API key the app uses for research, scoring and copy | Pay as you go, from your $1,500 credit balance |

Until you add a Claude key, the app runs in **mock mode**: every "generate" button returns a realistic sample instantly, at zero cost, so you can learn the app safely.

## 1. Run it on your computer

1. Install Node.js 22 from https://nodejs.org (the "LTS" button).
2. Install pnpm: open Terminal and run `npm install -g pnpm`.
3. Get the code: `git clone https://github.com/Tjcodeiimb/lead-gen.git` then `cd lead-gen` then `pnpm install`.
4. Copy the example settings file: `cp .env.example .env.local` (on Windows: `copy .env.example .env.local`).

## 2. Create the database (Supabase)

1. Go to https://supabase.com, sign up, click **New project**. Name it `upforge-os`, choose the region closest to you (Mumbai or Singapore), set a strong database password and **save it in your password manager**.
2. When the project is ready, open **Project Settings → API**. Copy:
   - **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open **Project Settings → Database → Connection string**. Choose **URI**.
   - With **Transaction** mode (port 6543) selected, copy the string → `DATABASE_URL`
   - With **Session** mode (port 5432) selected, copy the string → `DATABASE_URL_DIRECT`
   - In both, replace `[YOUR-PASSWORD]` with the password from step 1.
4. Open **Authentication → URL Configuration**. Set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to Redirect URLs. (Later, add your Vercel URL the same way.)
5. In `.env.local`, set `ALLOWED_EMAILS` to your email. Only addresses on this list can sign in.
6. Create the tables: `pnpm db:migrate`
7. Optional demo data: `pnpm db:seed`

## 3. Start the app

```
pnpm dev
```
Open http://localhost:3000 and sign in with the email and password you created in Supabase (Authentication → Users → Add user → Create new user, with **Auto Confirm User** ticked). Then change the password under Settings.

Things to try in mock mode:
- **Campaigns → New campaign**: pick a persona, corridor and offer. Claude drafts the plan.
- **Leads → Import CSV**: any spreadsheet with name + company columns. Or **Add lead** by hand.
- Open a lead → **Research, qualify and draft**. Watch the score bars fill, then find the drafts in **Review Queue**.
- **Settings**: the kill switch and monthly budget.

## 4. Go live with Claude

1. Go to https://platform.claude.com → **API keys** → create a key in a workspace named `upforge-prod`. Set a monthly **spend limit** on that workspace (start with $200).
2. If you are on Max: Settings → Billing → **API credits → Link organization**, so your monthly Max credits pay first.
3. In `.env.local` set `ANTHROPIC_API_KEY=sk-ant-...` and `CLAUDE_MODE=live`. Restart `pnpm dev`.
4. Also make sure web search is enabled for your organisation in Console → Settings → Capabilities.

What a lead costs live (list prices, Oct 2026): research with 5 web searches ≈ $0.15, qualification ≈ $0.03, copy on Opus ≈ $0.20. About $0.40 per lead end to end; research is cached per company for 30 days.

## 5. Put it on the internet (Vercel)

1. Go to https://vercel.com, sign up with GitHub, click **Add New → Project**, pick `Tjcodeiimb/lead-gen`, and import. Framework is detected automatically.
2. Under **Environment Variables**, add every line from your `.env.local` (except `NEXT_PUBLIC_APP_URL`, which becomes your Vercel URL).
3. Deploy. Then in Supabase **Authentication → URL Configuration** add `https://YOUR-APP.vercel.app` as Site URL and `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs.
4. Every `git push` to `main` redeploys automatically.

## 6. Editing the knowledge base

Claude reads the markdown files in `/kb` on every call:
- `offers.md` — **confirm the prices**. Until you do, copy says "fixed fee" instead of a number.
- `voice.md` — how you write.
- `case_studies.md` — set each entry's permission to `anonymised-external`, `named-external` or `internal-only`.
- `corridor_facts.md` — sourced facts with K-ids; verify dated items before use.
- `compliance.md`, `banned_phrases.md`.

Edit, commit, push. Vercel redeploys.

## 7. If something breaks

- "DATABASE_URL is not set": `.env.local` is missing or has a typo. Restart `pnpm dev` after editing it.
- Sign-in link opens but you land on login with "not on the allowlist": add your exact email to `ALLOWED_EMAILS`.
- "LLM jobs are paused": Settings → turn off the kill switch.
- Anything else: paste the error into Claude Code in this repo. `CLAUDE.md` tells it how the project works.
