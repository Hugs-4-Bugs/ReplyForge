# DEPLOYMENT — ReplyForge

This document describes how to deploy ReplyForge to production with real customers and real billing. The product is built; this is the runbook for going live.

## Prerequisites

- A Stripe account with the ability to create products + prices
- A Postgres database (Neon, Supabase, Railway, Render, AWS RDS, or self-hosted)
- An SMTP provider (Resend, Postmark, AWS SES, Mailgun, or any SMTP-supporting service)
- A hosting platform (Vercel recommended; Railway / Fly.io / Render work)
- (Optional) A custom domain pointing at your hosting platform

## Step 1: Database

### Recommended: Neon (serverless Postgres, free tier)

1. Sign up at neon.tech
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.app/dbname?sslmode=require`)
4. Save it as `DATABASE_URL` — you'll set this as an env var in step 5

### Alternative: Supabase, Railway, Render

Same pattern — get a Postgres connection string. Make sure it supports SSL.

### Switch the Prisma datasource from SQLite to Postgres

Edit `prisma/schema.prisma`:

```diff
 datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
 }
```

Then run:

```bash
bun run db:push   # creates tables in Postgres
bun run db:generate
```

## Step 2: Stripe

### 2.1 Create products + prices

In your Stripe Dashboard (test mode first, then live):

1. **Products** → Add product:
   - Name: "ReplyForge Starter"
   - Description: "ReplyForge Starter plan — 3 seats, 15 projects/month"
   - Pricing: recurring, $99/month, USD
   - Save → copy the `price_xxx` ID
   - Add a second price: $990/year (recurring, yearly interval) → copy `price_xxx`
2. Repeat for "ReplyForge Pro" ($299/mo + $2,990/yr) and "ReplyForge Business" ($799/mo + $7,990/yr)

You should end up with 8 price IDs (4 plans × 2 intervals). Record them all.

### 2.2 Get API keys

- Stripe Dashboard → Developers → API keys
- Copy **Publishable key** (`pk_live_xxx` or `pk_test_xxx`)
- Copy **Secret key** (`sk_live_xxx` or `sk_test_xxx`)

### 2.3 Set up webhook

- Stripe Dashboard → Developers → Webhooks → Add endpoint
- Endpoint URL: `https://your-domain.com/api/stripe/webhook`
- Events to send:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_succeeded`
- Copy the **Signing secret** (`whsec_xxx`)

### 2.4 Set env vars

You'll set these in step 5:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx
```

## Step 3: Email (SMTP)

### Recommended: Resend (free 3,000 emails/month)

1. Sign up at resend.com
2. Verify your sending domain (e.g. `mail.yourdomain.com`)
3. Generate an API key
4. Resend's SMTP settings:
   - Host: `smtp.resend.com`
   - Port: `465` (SSL) or `587` (STARTTLS)
   - User: `resend`
   - Pass: `<your API key>`

### Alternative: AWS SES, Postmark, Mailgun

Get SMTP credentials from any provider. Set:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
EMAIL_FROM=ReplyForge <noreply@yourdomain.com>
```

## Step 4: Auth + App URLs

Generate a strong random string for `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Set:

```
AUTH_SECRET=<your generated string>
APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

## Step 5: Deploy to Vercel (recommended)

### 5.1 Push to GitHub

```bash
git init
git add -A
git commit -m "Initial commit: ReplyForge v1"
git branch -M main
git remote add origin git@github.com:yourname/replyforge.git
git push -u origin main
```

**Critical**: ensure `.env` is in `.gitignore` (it is by default in this project) — never commit secrets.

### 5.2 Import to Vercel

1. vercel.com → New Project → Import from GitHub
2. Select your repo
3. Vercel auto-detects Next.js — keep defaults
4. **Environment Variables** (Project Settings → Environment Variables):
   - Add all the env vars from steps 1–4 (DATABASE_URL, STRIPE_*, SMTP_*, AUTH_SECRET, APP_URL, NEXTAUTH_URL)
   - Mark `AUTH_SECRET` and `STRIPE_SECRET_KEY` as "Sensitive" (hidden)
   - Apply to all environments (Production, Preview, Development)
5. Deploy

### 5.3 Configure custom domain

1. Vercel Project Settings → Domains → Add your domain
2. Add the CNAME / A record to your DNS provider as Vercel instructs
3. Vercel auto-provisions SSL
4. Update `APP_URL` and `NEXTAUTH_URL` env vars to your custom domain
5. Redeploy

### 5.4 Run migrations on the production database

```bash
# Install vercel CLI
npm i -g vercel

# Link local project to vercel project
vercel link

# Pull production env vars locally
vercel env pull .env.production.local

# Run db:push against the production database
DATABASE_URL=<your-production-db-url> bun run db:push
```

### 5.5 Test the production deployment

1. Visit `https://your-domain.com` — landing page loads
2. Sign up → verify email arrives (Resend logs)
3. Log in → create library entry → upload document → create project → AI draft → export
4. Click Billing → upgrade to Starter (test card: `4242 4242 4242 4242`, any future date, any CVC)
5. Verify Stripe webhook received (Stripe Dashboard → Webhooks → your endpoint → events)
6. Verify subscription updated in DB (`SELECT plan, status FROM Subscription`)

## Step 6: Alternative deployment (Railway / Fly.io / Render)

If you prefer a single-host deployment over Vercel:

### Railway

1. railway.app → New Project → Deploy from GitHub repo
2. Add Postgres plugin → copy DATABASE_URL
3. Set all env vars (same as Vercel step 5.2)
4. Railway auto-detects Next.js → runs `next build` + `next start`
5. Custom domain: Railway Project Settings → Networking → Generate domain

### Fly.io

1. Install flyctl: `brew install flyctl`
2. `fly launch` (auto-detects Next.js, generates Dockerfile + fly.toml)
3. `fly postgres create` (or use existing)
4. Set env vars: `fly secrets set STRIPE_SECRET_KEY=sk_live_xxx ...`
5. `fly deploy`
6. Custom domain: `fly certs add your-domain.com`

### Render

1. render.com → New → Web Service → connect GitHub repo
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Add Postgres: Render Dashboard → New → PostgreSQL → copy internal connection string
5. Set env vars in Render web service settings
6. Custom domain: Render service settings → Custom Domains

## Step 7: Post-deployment checklist

- [ ] Landing page loads at `https://your-domain.com`
- [ ] SSL valid (lock icon in browser)
- [ ] Sign up flow works → verification email arrives within 60s
- [ ] Login works
- [ ] Library CRUD works
- [ ] Document upload works (test .xlsx, .docx, .pdf)
- [ ] Project create + parse works
- [ ] AI draft works (single + bulk)
- [ ] Export XLSX works
- [ ] Billing checkout works (test card)
- [ ] Stripe webhook received + processed (check Stripe Dashboard → Webhooks)
- [ ] Plan limit enforcement works (try creating more projects than plan allows)
- [ ] Member invite works → invitee receives email → accepts → joins org
- [ ] Tenant isolation works (sign up two separate orgs, verify they can't see each other's data)
- [ ] Audit log records all actions
- [ ] Logout works
- [ ] Mobile-responsive layout works (test on phone)

## Step 8: Monitoring + alerting

### Required
- **Vercel Analytics** (free, built-in): page views, Web Vitals, errors
- **Stripe Dashboard**: revenue, failed payments, disputes
- **Resend dashboard**: email delivery rate, bounces, spam complaints

### Recommended
- **Sentry** (free tier): error tracking
  - Add `@sentry/nextjs` package
  - Set `SENTRY_DSN` env var
  - Wrap `next.config.ts` with `withSentryConfig`
- **PostHog** (free tier): product analytics
  - Add `posthog-js` package
  - Set `NEXT_PUBLIC_POSTHOG_KEY` env var
  - Wrap app in `<PostHogProvider>`
- **Better Stack** (free tier): log aggregation + uptime monitoring
  - Uptime monitor on `https://your-domain.com/api/health` (returns 200)

### Health check endpoint

The `/api/auth/csrf` endpoint returns 200 + JSON. Stripe webhook is at `/api/stripe/webhook`. Either can serve as a basic uptime check.

## Step 9: Backup strategy

### Database
- **Neon**: automatic daily backups + point-in-time recovery (free tier: 7 days)
- **Supabase**: daily backups (free tier: 7 days; paid: 30 days)
- **Self-hosted Postgres**: configure `pg_dump` cron + offsite copy

### Documents (raw files)
- v1: stored in DB as text (no separate backup needed — DB backup covers it)
- v2 (when S3 added): enable S3 versioning + cross-region replication

### Restore drill
- Monthly: restore DB backup to staging, verify app works end-to-end against restored data

## Step 10: Rollback strategy

### Vercel
1. Vercel Dashboard → Deployments
2. Find the last known-good deployment
3. Click "Instant Rollback"
4. Verify the site loads correctly

### Database migrations
- All migrations are additive (no destructive changes in v1)
- If a migration breaks: revert the code deployment (Vercel rollback), DB stays on previous schema
- Destructive migrations (rare): take DB backup first, document rollback SQL

### Stripe
- Webhooks auto-retry for 3 days
- If webhook handler has a bug: fix + redeploy, Stripe will replay missed events on next webhook delivery
- If a customer was incorrectly charged: refund via Stripe Dashboard

## Operations runbook

### "Customer can't log in"
1. Check Vercel logs for /api/auth/callback/credentials errors
2. Verify AUTH_SECRET is set and matches the value used when user signed up (rotating AUTH_SECRET invalidates all sessions)
3. Verify the user exists in DB: `SELECT * FROM "User" WHERE email = 'xxx'`
4. Verify passwordHash is set (not null)
5. If user exists + password hash set + still failing: try resetting password (deferred feature — for v1, manually update DB)

### "Stripe webhook not received"
1. Stripe Dashboard → Developers → Webhooks → your endpoint → check "Last delivery" status
2. If 4xx/5xx: check Vercel logs for /api/stripe/webhook errors
3. If "No events sent": verify endpoint URL is correct + matches APP_URL
4. If signature fails: verify STRIPE_WEBHOOK_SECRET matches the signing secret from Stripe Dashboard
5. Test: Stripe Dashboard → Webhooks → Send test webhook → pick `checkout.session.completed`

### "AI drafts are slow / failing"
1. Check Vercel logs for /api/projects/[id]/draft errors
2. Verify the AI SDK is initialized (z-ai-web-dev-sdk should be in package.json)
3. If AI consistently fails: the deterministic fallback should kick in (check `answer.aiModel` for `fallback:reason`)
4. For v1: fallback drafts work but with lower confidence; investigate root cause when 5%+ drafts fall back

### "Customer hit plan limit unexpectedly"
1. Check DB: `SELECT plan, status FROM "Subscription" WHERE organizationId = 'xxx'`
2. Check Stripe: customer's subscription status
3. If Stripe shows active subscription but DB shows free: webhook missed; replay webhook from Stripe Dashboard
4. If webhook received but DB not updated: check audit log for `stripe.webhook` action with the event id; if missing, the handler failed

### "Tenant isolation suspected breach"
1. **Critical** — treat as security incident
2. Immediately check audit log for unusual cross-tenant access patterns
3. Check if any API route is missing `requireTenantResource()` call
4. If confirmed: notify affected customer, fix code, force-reset all sessions (rotate AUTH_SECRET — logs everyone out)
5. Post-mortem within 48 hours

## Production env vars — complete list

```
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=<32+ random chars>
APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Stripe (set to go live with billing)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER_MONTHLY=price_xxx
STRIPE_PRICE_STARTER_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxx
STRIPE_PRICE_BUSINESS_YEARLY=price_xxx

# Email (set to send real verification + invite emails)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxx
EMAIL_FROM=ReplyForge <noreply@your-domain.com>
```

## What's intentionally NOT in v1 deployment

- **No CDN configuration**: Vercel/Cloudflare handle this automatically
- **No load balancer**: Vercel handles this automatically; Railway/Fly scale vertically first
- **No Redis**: in-process caching is fine for v1
- **No queue workers**: AI drafting is synchronous
- **No log aggregation service**: Vercel logs are sufficient; add Better Stack when needed
- **No APM**: Vercel Analytics + Sentry cover the basics
- **No feature flags**: ship continuously, no flags needed at this scale
