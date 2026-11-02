# STRIPE SETUP — Go Live with Real Payments on Vercel

This guide shows you exactly how to configure Stripe in your Vercel environment variables so ReplyForge starts charging real customers.

## Step 1: Create Stripe Products + Prices

Log into your [Stripe Dashboard](https://dashboard.stripe.com) (use **Live mode** toggle, not Test mode).

### 1.1 Create 4 Products

Go to **Products → Add product** and create each of these:

| Product name | Description | Pricing |
|---|---|---|
| ReplyForge Starter | 3 seats, 15 projects/mo, 1,000 AI drafts | **Recurring**: $99.00/month, USD |
| ReplyForge Pro | 10 seats, 75 projects/mo, 10,000 AI drafts | **Recurring**: $299.00/month, USD |
| ReplyForge Business | 50 seats, unlimited, SSO, SLA | **Recurring**: $799.00/month, USD |

For each product, add **two prices** (monthly + yearly):

| Price label | Billing period | Amount |
|---|---|---|
| Starter Monthly | Every 1 month | $99.00 |
| Starter Yearly | Every 12 months | $990.00 |
| Pro Monthly | Every 1 month | $299.00 |
| Pro Yearly | Every 12 months | $2,990.00 |
| Business Monthly | Every 1 month | $799.00 |
| Business Yearly | Every 12 months | $7,990.00 |

You'll end up with **6 price IDs** (the Free plan doesn't need a Stripe price). Each looks like `price_1QxY...`.

### 1.2 Copy all 6 Price IDs

From each price's detail page, copy the `price_...` ID. You'll paste these into Vercel env vars in Step 3.

## Step 2: Get Your API Keys + Webhook Secret

### 2.1 API Keys

Go to **Developers → API keys**:
- **Publishable key**: `pk_live_...` (not needed in env vars — Stripe Checkout handles it server-side)
- **Secret key**: `sk_live_...` ← copy this

### 2.2 Webhook Endpoint

Go to **Developers → Webhooks → Add endpoint**:
- **Endpoint URL**: `https://your-domain.com/api/stripe/webhook` (replace `your-domain.com` with your actual Vercel URL)
- **Description**: `ReplyForge production webhook`
- **Events to send** (select each one):
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_succeeded`

After creating the endpoint, click **Signing secret → Reveal**:
- Copy the `whsec_...` value

## Step 3: Configure Vercel Environment Variables

In your Vercel project: **Settings → Environment Variables**. Add each of these (apply to **Production** environment at minimum):

| Name | Value | Sensitive? |
|---|---|---|
| `DATABASE_URL` | Your Postgres connection string (e.g. from Neon/Supabase) | Yes |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` | Yes |
| `APP_URL` | `https://your-domain.com` | No |
| `NEXTAUTH_URL` | `https://your-domain.com` | No |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Yes |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Yes |
| `STRIPE_PRICE_STARTER_MONTHLY` | `price_...` | No |
| `STRIPE_PRICE_STARTER_YEARLY` | `price_...` | No |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` | No |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` | No |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | `price_...` | No |
| `STRIPE_PRICE_BUSINESS_YEARLY` | `price_...` | No |
| `SMTP_HOST` | e.g. `smtp.resend.com` | No |
| `SMTP_PORT` | e.g. `465` | No |
| `SMTP_USER` | e.g. `resend` | No |
| `SMTP_PASS` | Your SMTP/API key | Yes |
| `EMAIL_FROM` | `ReplyForge <noreply@your-domain.com>` | No |

### 3.1 Change the database provider to Postgres

Before deploying, edit `prisma/schema.prisma`:

```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then push the schema to your Postgres:

```bash
# From your local machine, with DATABASE_URL set to your production Postgres
bun run db:push
```

### 3.2 Deploy

Push to GitHub → Vercel auto-deploys. After the first deploy:

1. Visit `https://your-domain.com` → landing page loads
2. Sign up → verification email arrives (SMTP is live)
3. Go to Billing → click "Upgrade" on Starter → Stripe Checkout opens
4. Pay with a real card
5. Stripe webhook fires → subscription activates in DB
6. You have a paying customer

## Step 4: Test the Webhook (after first deploy)

Stripe Dashboard → Developers → Webhooks → your endpoint → **Send test webhook**:
- Pick `checkout.session.completed`
- Click **Send test webhook**
- Verify the event shows as `200 OK` in Stripe's webhook log

If you see `400` or `500`:
- Check Vercel function logs for `/api/stripe/webhook` errors
- Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret from Step 2.2
- Verify the raw body is being read (the code uses `req.arrayBuffer()`, not `req.json()`)

## Step 5: Local Testing with Stripe CLI (optional but recommended)

To test webhooks locally without deploying:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe   # macOS
# or: https://github.com/stripe/stripe-cli/releases

# Login (opens browser)
stripe login

# Forward webhooks to your local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# In a separate terminal, trigger a test event
stripe trigger checkout.session.completed
```

The CLI prints a `whsec_...` value — set that as `STRIPE_WEBHOOK_SECRET` in your local `.env` file.

## What the Code Does (verification)

The Stripe integration is already fully built in the codebase:

| File | What it does |
|---|---|
| `src/lib/stripe.ts` | Stripe client init, `startCheckout()` (creates Checkout Session), `cancelAtPeriodEnd()`, `handleWebhookEvent()` (idempotent, event-id deduplication via audit log) |
| `src/app/api/billing/checkout/route.ts` | POST handler: validates role, calls `startCheckout()`, returns Stripe Checkout URL |
| `src/app/api/billing/cancel/route.ts` | POST handler: calls `cancelAtPeriodEnd()` |
| `src/app/api/stripe/webhook/route.ts` | Reads raw body, verifies signature, calls `handleWebhookEvent()` |
| `src/lib/plans.ts` | 4 plans with limits + `canDo()` entitlement enforcement (checks DB before every create action) |

### Dev Mode vs. Live Mode

The code auto-detects which mode to run in:

```typescript
export const stripeMode: "live" | "dev" =
  process.env.STRIPE_SECRET_KEY ? "live" : "dev";
```

- **`STRIPE_SECRET_KEY` not set** → Dev mode: clicking "Upgrade" instantly activates the plan without charging (clearly disclosed in the billing UI). Used for local testing.
- **`STRIPE_SECRET_KEY` set** → Live mode: clicking "Upgrade" redirects to real Stripe Checkout. Real card. Real charge. Real webhook.

When you deploy to Vercel with the env vars from Step 3, the app automatically runs in **live mode**. No code changes needed.

## Checklist Before You Launch

- [ ] 6 Stripe prices created (3 products × 2 intervals)
- [ ] Stripe webhook endpoint created with correct URL + 6 event types
- [ ] All 17 env vars set in Vercel (Production environment)
- [ ] `prisma/schema.prisma` changed to `postgresql`
- [ ] `bun run db:push` run against production Postgres
- [ ] Deployed to Vercel
- [ ] Sign-up flow works → verification email arrives
- [ ] Billing page shows "Live mode" (not "Dev mode")
- [ ] Test upgrade with real card → checkout succeeds
- [ ] Stripe webhook received (check Stripe Dashboard → Webhooks → your endpoint)
- [ ] Subscription plan updated in app (check billing page after checkout redirect)
- [ ] Cancel at period end works

You're live. Start sending cold emails.
