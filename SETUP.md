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
6. The app creates its own tables the first time it starts, so there is nothing to run here.

## 3. Start the app

```
pnpm dev
```
Open http://localhost:3000. The first page load takes a little longer while the tables are created. Sign in with the email and password you created in Supabase (Authentication → Users → Add user → Create new user, with **Auto Confirm User** ticked). Then change the password under Settings.

Things to try in mock mode (everything returns samples until you add a Claude key):
- **Campaigns → New campaign**: pick a niche, where the companies are, which market they're entering, size and roles.
- On the campaign's **Find leads** tab, run a finder. Tick candidates and **Import**.
- Open a lead → **Research, qualify and draft**. Approve in **Review Queue**. Then on the lead's Sequence, send each step and mark it sent; the dashboard shows what's due.
- **Settings**: the kill switch and monthly budget.

## 4. Go live with Claude (in the browser, no files)

1. In the app, open **Integrations**. The first card is **Claude API key**; click **How to get this key** for the exact clicks.
2. Paste the key and click **Test**. A green "Key works" means you are live. The yellow mock banner disappears.
3. Set a monthly spend limit on the workspace in the Claude Console, and the matching budget under **Settings**.
4. Make sure web search is enabled for your organisation in Console → Settings → Capabilities.

What a lead costs live (list prices, Oct 2026): research with 5 web searches ≈ $0.15, qualification ≈ $0.03, copy on Opus ≈ $0.20. About $0.40 per lead end to end; research is cached per company for 30 days.

## 5. Put it on the internet (Vercel)

1. Go to https://vercel.com, sign up with GitHub, click **Add New → Project**, pick `Tjcodeiimb/lead-gen`, and import. Framework is detected automatically.
2. Under **Environment Variables**, add every line from your `.env.local` (except `NEXT_PUBLIC_APP_URL`, which becomes your Vercel URL).
3. Deploy. Then in Supabase **Authentication → URL Configuration** add `https://YOUR-APP.vercel.app` as Site URL and `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs.
4. Every `git push` to `main` redeploys automatically.

## 6. Connect the lead finders (all free)

Open **Integrations** in the app's sidebar. Each finder needs a free account and its key. Paste the key into the box and click Save.

Every card has a **How to get this key** section with the exact clicks. Summary:

| Service | What it does | Free plan |
|---|---|---|
| Claude web research | Finds companies and people on the web | Uses your Claude credits, no account needed |
| Hunter | Email finder and verifier | 25 finds, 50 checks a month |
| Anymailfinder | Email finder, charges only on success | Trial credits |
| Prospeo | Email finder | Monthly free credits |
| Apollo | People search (free) and email reveal | 75 reveals a month |
| Reoon | Email verifier | About 20 checks a day |
| TheirStack | Companies hiring in your target market | 200 credits a month |
| Companies House | New UK companies | Free |

**Auto-switch.** Email finders are tried in order (Hunter, Anymailfinder, Prospeo, Apollo). When one reaches its monthly limit or reports "quota exceeded", the app moves to the next one on its own and shows "limit reached, auto-switched" on its meter. You can change the order on the Integrations page. News signals need no key.

### Gmail drafts (optional, about 15 minutes once)

This lets the app put approved emails into your Gmail Drafts so you only press Send.

1. Go to https://console.cloud.google.com and sign in with your Google Workspace account. Click the project drop-down at the top, then **New project**, name it `upforge-os`, click Create, and select it.
2. In the left menu open **APIs & Services → Library**. Search **Gmail API** and click **Enable**.
3. Open **APIs & Services → OAuth consent screen**. Choose **Internal** if you have Google Workspace, otherwise **External**. App name `UpForge OS`, your email for both contact fields, Save. If External, click **Audience → Add users** and add your own email as a test user.
4. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**. Application type **Web application**, name `upforge-os`.
   - Under **Authorised redirect URIs** click Add and enter your app address followed by `/api/google/callback`. For local use: `http://localhost:3000/api/google/callback`. For Vercel: `https://YOUR-APP.vercel.app/api/google/callback`. You can add both.
   - Click Create. Copy the **Client ID** and **Client secret**.
5. In the app, open **Integrations**, paste both under Gmail drafts, Save each, then click **Connect Google** and approve. The scope is "compose" only: the app can create drafts but cannot read your mail or send.
6. Make sure `NEXT_PUBLIC_APP_URL` matches the address you are using (in `.env.local` locally, in Vercel's Environment Variables when live), or Google will reject the redirect.

## 7. Editing the knowledge base

Claude reads the markdown files in `/kb` on every call:
- `offers.md` — **confirm the prices**. Until you do, copy says "fixed fee" instead of a number.
- `voice.md` — how you write.
- `case_studies.md` — set each entry's permission to `anonymised-external`, `named-external` or `internal-only`.
- `corridor_facts.md` — sourced facts with K-ids; verify dated items before use.
- `compliance.md`, `banned_phrases.md`.

Edit, commit, push. Vercel redeploys.

## 8. If something breaks

- "DATABASE_URL is not set": `.env.local` is missing or has a typo. Restart `pnpm dev` after editing it.
- Sign-in link opens but you land on login with "not on the allowlist": add your exact email to `ALLOWED_EMAILS`.
- "LLM jobs are paused": Settings → turn off the kill switch.
- Anything else: paste the error into Claude Code in this repo. `CLAUDE.md` tells it how the project works.
