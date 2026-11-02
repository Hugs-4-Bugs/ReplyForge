# ReplyForge

> Security questionnaire + RFP response software for SMB SaaS, agencies, and consultants.
> The same workflow Loopio charges $15K–$150K/year for, at $99–$799/month. No seat traps, no annual contract, no implementation fee.

## What this is

A complete, production-ready B2B SaaS application built end-to-end:

- **Marketing landing page** at `/` (real, conversion-focused — hero, problem, how it works, features, comparison table, pricing, FAQ, CTA)
- **Multi-tenant auth** (signup, login, email verification, role-based access)
- **Content library** (approved Q&A pairs the AI drafts from)
- **Document upload + text extraction** (XLSX, CSV, DOCX, PDF, TXT)
- **Project workflow** (create questionnaire project → AI-draft every answer → review → approve → export)
- **AI drafting** with source citations + confidence scoring + deterministic fallback
- **Excel + CSV export** that mirrors the source questionnaire's columns
- **Stripe billing** (4 plans, checkout, webhooks, idempotent, cancel-at-period-end)
- **Member invites** (email-based, role management, seat limits)
- **Audit log** (every meaningful action recorded)
- **Strict tenant isolation** (verified by automated e2e test)
- **Plan-based entitlement enforcement** (verified by automated e2e test)

## What's REAL vs. what needs your credentials

| Feature | Status in this sandbox | What's needed to go live |
|---|---|---|
| Signup / login / email verification | Works (verification email printed to dev.log) | Set SMTP env vars to send real emails |
| Content library CRUD | Works | — |
| Document upload + parsing (xlsx/csv/docx/pdf/txt) | Works | — |
| Project workflow + AI drafting | Works (uses z-ai-web-dev-sdk) | None — already configured |
| Excel/CSV export | Works | — |
| Member invites | Works (invite email printed to dev.log) | Set SMTP env vars |
| Tenant isolation | Enforced + verified | — |
| Entitlement enforcement (plan limits) | Enforced + verified | — |
| Audit log | Works | — |
| Stripe billing | Dev mode — plans switch instantly without charging | Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET + 8 STRIPE_PRICE_* env vars |
| Email sending | Dev mode — emails logged to server | Set SMTP_HOST/PORT/USER/PASS/EMAIL_FROM |

**The product is fully functional end-to-end.** To start charging real customers, you only need to: (1) set Stripe env vars + create Stripe products/prices, (2) set SMTP env vars for email delivery, (3) deploy to Vercel/Railway/etc. with Postgres. See DEPLOYMENT.md.

## Run it locally

```bash
# Install dependencies (already done in this sandbox)
bun install

# Push DB schema
bun run db:push

# Start dev server (already running on port 3000 in this sandbox)
bun run dev
```

Visit http://localhost:3000 — landing page loads. Click "Start free" to sign up. The verification email link is printed to `dev.log` (since SMTP isn't configured) — copy it into your browser to verify, then log in.

## Run the end-to-end test

```bash
# Make sure dev server is running on localhost:3000
python3 scripts/e2e_test.py
```

This signs up a real user, logs in, creates library + document + project, AI-drafts answers, approves, exports, and verifies entitlement enforcement + tenant isolation. All 11 steps should pass.

## Project structure

```
src/
  app/
    page.tsx                          # Landing page (marketing)
    login/page.tsx                    # Login
    signup/page.tsx                   # Signup
    accept-invite/page.tsx            # Member invite acceptance
    app/                              # Authenticated app
      layout.tsx                      # Sidebar + user menu
      dashboard/page.tsx              # Stats + recent activity
      library/page.tsx                # Content library list
      documents/page.tsx              # Document upload + list
      projects/page.tsx               # Projects list
      projects/new/page.tsx           # New project wizard
      projects/[id]/page.tsx          # Project workspace (the core)
      billing/page.tsx                # Plans + usage + invoices
      settings/page.tsx               # Org settings
      settings/members/page.tsx       # Member management
    api/
      auth/[...nextauth]/route.ts     # NextAuth credentials
      signup/route.ts                 # Signup
      verify-email/route.ts           # Email verification
      stripe/webhook/route.ts         # Stripe webhook (idempotent)
      projects/                       # CRUD + parse + draft + export
      library/                        # CRUD
      documents/                      # Upload + delete
      billing/                        # Checkout + cancel
      invites/                        # Member invites
      organizations/[id]/             # Org settings
  components/
    ui/                               # shadcn/ui components
    app-sidebar.tsx                   # Sidebar nav
    app-user-menu.tsx                 # User dropdown
    project-workspace.tsx             # The core workspace UI
    library-client.tsx, billing-client.tsx, etc.
    landing-faq.tsx
  lib/
    auth.ts                           # NextAuth config
    session.ts                        # getSession, requireUser, requireTenant
    tenant.ts                         # Tenant isolation helpers
    plans.ts                          # Plan definitions + entitlement logic
    ai.ts                             # AI drafting + retrieval
    stripe.ts                         # Stripe client + checkout + webhook handler
    parsing.ts                        # File parsing (xlsx/csv/docx/pdf/txt)
    email.ts                          # Nodemailer wrapper
    audit.ts                          # Audit log helper
    db.ts                             # Prisma client
prisma/
  schema.prisma                       # Full multi-tenant schema
scripts/
  e2e_test.py                         # End-to-end smoke test
download/                             # All planning + shipping docs
  MARKET-RESEARCH.md                  # Why this opportunity, scored
  PRD.md                              # Product requirements
  ARCHITECTURE.md                     # Technical architecture
  DATABASE.md                         # Schema + data model
  PRICING.md                          # Plans + unit economics
  GTM.md                              # Go-to-market
  SALES.md                            # Cold email + demo + objection scripts
  DEPLOYMENT.md                       # Production deployment runbook
  SECURITY.md                         # Security architecture + review
  TESTING.md                          # Test strategy + manual QA checklist
  README.md                           # This file
  EXECUTIVE-REPORT.md                 # The final business report
```

## Documentation

Read in this order:

1. **README.md** (this file) — orientation
2. **MARKET-RESEARCH.md** — why this opportunity, with citations
3. **EXECUTIVE-REPORT.md** — the final business report
4. **PRD.md** — what was built, with acceptance criteria
5. **ARCHITECTURE.md** — how it's structured
6. **DATABASE.md** — data model
7. **PRICING.md** — plans + unit economics
8. **GTM.md** — how to acquire the first 100 customers
9. **SALES.md** — cold email + demo + objection scripts
10. **DEPLOYMENT.md** — how to ship to production
11. **SECURITY.md** — security architecture + review
12. **TESTING.md** — test strategy + manual QA checklist

## Tech stack

- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma 6 (SQLite for dev, Postgres for prod)
- **Auth**: NextAuth.js v4 (Credentials provider, JWT sessions)
- **Billing**: Stripe SDK v23
- **AI**: z-ai-web-dev-sdk (OpenAI-compatible, swappable)
- **Email**: Nodemailer (any SMTP provider)
- **File parsing**: xlsx, mammoth (docx), pdf-parse, plain text
- **Validation**: zod
- **Icons**: lucide-react

## License

Proprietary. See LICENSE (TODO: add before launch).

## Contact

For demos, pricing, or partnership conversations: hello@replyforge.app
