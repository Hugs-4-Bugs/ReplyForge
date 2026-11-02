# ARCHITECTURE — ReplyForge

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Browser (user)                                │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Marketing site  │  │  Auth pages      │  │  Authenticated app   │ │
│  │  /              │  │  /login /signup  │  │  /app/*              │ │
│  └─────────────────┘  └──────────────────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                  │
                  │ HTTPS (cookies: next-auth.session-token)
                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│              Next.js 16 (App Router) on port 3000                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  React Server Components (data fetching)                        │ │
│  │  - requireTenant() at top of every /app/* page                  │ │
│  │  - Direct Prisma reads (no API roundtrip for first paint)       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Client Components (interactivity)                              │ │
│  │  - project-workspace.tsx (draft, edit, approve, export)         │ │
│  │  - library-client.tsx, billing-client.tsx, etc.                 │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  API Routes (/api/*)                                            │ │
│  │  - /api/auth/[...nextauth] — NextAuth credentials               │ │
│  │  - /api/signup — org + user + subscription create               │ │
│  │  - /api/projects (POST/GET) + /api/projects/[id] + sub-routes   │ │
│  │  - /api/library, /api/documents                                 │ │
│  │  - /api/billing/checkout, /api/billing/cancel                   │ │
│  │  - /api/stripe/webhook (raw body, signature verified)           │ │
│  │  - /api/invites, /api/invites/[token], /api/invites/members/[id]│ │
│  │  - /api/organizations/[id]                                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌─────────┐    ┌──────────┐   ┌──────────┐   ┌─────────────┐
   │ Prisma  │    │  Stripe  │   │   AI     │   │  Email      │
   │ (SQLite │    │  API     │   │  SDK     │   │ (nodemailer │
   │  dev /  │    │          │   │ (z-ai-   │   │  + SMTP)    │
   │ Postgres│    │          │   │  web-dev-│   │             │
   │  prod)  │    │          │   │  sdk)    │   │             │
   └─────────┘    └──────────┘   └──────────┘   └─────────────┘
```

## Components

### Frontend
- **Framework**: Next.js 16 (App Router, RSC by default, `'use client'` only where interactivity requires it)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **State**: React hooks (local) + TanStack Query (server state, deferred — currently using fetch in effects)
- **Forms**: react-hook-form + zod (validation)
- **Icons**: lucide-react

### Backend
- **Runtime**: Node.js (via Next.js)
- **API**: Next.js Route Handlers (`/api/*`)
- **Auth**: NextAuth.js v4 with Credentials provider
- **DB**: Prisma 6 ORM
- **Validation**: zod
- **File parsing**: xlsx, mammoth, pdf-parse
- **AI**: z-ai-web-dev-sdk (LLM chat completions, OpenAI-compatible)
- **Billing**: Stripe SDK (v23)
- **Email**: nodemailer (SMTP)

### Database
- **Dev**: SQLite (file-based, zero-config)
- **Production**: Postgres (recommended; same Prisma schema, swap connection string)
- **Why not Postgres in dev**: SQLite is zero-config, perfect for sandbox testing. Schema is portable.

### Storage
- **Dev**: Database (document text stored inline in Document.textContent)
- **Production**: S3-compatible (Cloudflare R2 / AWS S3 / MinIO) for raw file blobs; DB stores path + extracted text
- **Why DB in v1**: Simpler deployment, easier tenant isolation, files are small (<10MB). Migrate to S3 when total stored data exceeds ~10GB.

### Authentication
- **Provider**: NextAuth.js v4 with Credentials (email + bcrypt-hashed password)
- **Session**: JWT-based (30-day expiry), signed with AUTH_SECRET
- **Token claims**: userId, email, name, tenantId, tenantRole
- **Why JWT not DB sessions**: Stateless, simpler horizontal scaling, no DB lookup per request
- **Multi-tenant**: tenantId stored in JWT; switched via dedicated route (deferred — for v1, user's first membership is the active tenant)

### Authorization
- **Roles**: owner, admin, member
- **Owner**: full control including billing, member management, org deletion
- **Admin**: everything except org deletion + ownership transfer
- **Member**: create/edit projects, library, documents; cannot manage billing or members
- **Enforcement**: role checked in API route handlers (canManageBilling, canManageMembers, canEditContent helpers in `src/lib/session.ts`)

### Queues / Workers
- **None in v1**: AI drafting is synchronous (within request). Acceptable because:
  - Typical questionnaire has 50–300 questions
  - Per-draft LLM call takes 1–3s
  - Total draft time 1–10 minutes — acceptable to wait
  - SSE/streaming deferred (would improve UX but not required for v1)
- **Deferred**: Redis-based queue (BullMQ) for: bulk imports, large document text extraction, scheduled email reminders

### External services
- **Stripe**: checkout sessions, customer management, subscription state, invoice cache
- **z-ai-web-dev-sdk**: LLM chat completions for answer drafting
- **SMTP provider** (any): Resend, Postmark, AWS SES, Mailgun — anything nodemailer supports
- **(Deferred) Slack**: incoming webhook for notifications
- **(Deferred) Salesforce/HubSpot**: API sync for CRM integration

### Integrations
- **Stripe webhook** (`/api/stripe/webhook`): reads raw body, verifies signature, idempotently processes events (checkout.session.completed, customer.subscription.updated/deleted, invoice.paid)
- **Email** (`src/lib/email.ts`): wraps nodemailer; if SMTP env vars absent, logs email + returns dev-mode preview
- **AI** (`src/lib/ai.ts`): wraps z-ai-web-dev-sdk; on failure, falls back to deterministic best-match from library

## Deployment

See DEPLOYMENT.md for full instructions. Summary:

- **Recommended**: Vercel (frontend) + Neon / Supabase (Postgres) + Cloudflare R2 (file storage)
- **Alternative**: Railway / Fly.io (single-host, simpler)
- **Self-hosted**: Docker on any VPS (render.com, Hetzner, DigitalOcean App Platform)
- **Env vars required for production**:
  - `DATABASE_URL` (Postgres connection string)
  - `AUTH_SECRET` (long random string)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_STARTER_MONTHLY/YEARLY`, `STRIPE_PRICE_PRO_*`, `STRIPE_PRICE_BUSINESS_*`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
  - `APP_URL`, `NEXTAUTH_URL`

## Observability

- **Audit log**: in-app, tenant-scoped, visible on dashboard
- **Console logs**: server-side, structured (action + target + user)
- **Stripe events**: stored in audit log with idempotency marker
- **AI fallbacks**: marked in Answer record (`aiModel: fallback:reason`, `fallback: true`)
- **Deferred**: Sentry (errors), PostHog (product analytics), Better Stack (logs)

## Scaling strategy

- **Vertical first**: single Next.js instance + Postgres handles ~1,000 concurrent users easily
- **Horizontal when needed**: stateless Next.js → deploy multiple replicas behind load balancer
- **DB read replicas**: when read QPS exceeds ~1,000/s
- **Queue**: when bulk operations (large document parsing, bulk imports) block request handlers
- **CDN**: Vercel/Cloudflare handles static assets automatically; document files via R2 + Cloudflare CDN
- **LLM cost**: monitor per-customer AI cost; raise prices or add usage-based overage if cost > 10% of revenue

## Security boundaries

1. **Tenant isolation**: enforced at application layer. Every tenant-scoped query MUST filter by `organizationId`. Helper: `requireTenantResource()` in `src/lib/tenant.ts`.
2. **Authentication**: NextAuth JWT cookie, signed with AUTH_SECRET, 30-day expiry.
3. **Authorization**: role checks in API route handlers (canManageBilling, canManageMembers).
4. **Input validation**: zod schemas on every API route body.
5. **SQL injection**: Prisma parameterized queries (no raw SQL).
6. **XSS**: React's default escaping; no dangerouslySetInnerHTML.
7. **CSRF**: NextAuth CSRF token for auth routes; SameSite=Lax cookies.
8. **File upload**: extension allowlist (xlsx, xls, csv, docx, pdf, txt) + 10MB size limit.
9. **Stripe webhook**: signature verification using STRIPE_WEBHOOK_SECRET.
10. **Secrets**: env vars only; `.env` file in `.gitignore` (verify).

## Failure handling

- **AI failure**: deterministic fallback (best-match content entry, confidence 0.4, marked `fallback: true`)
- **Stripe webhook failure**: log + 500; Stripe retries automatically
- **DB transaction failure**: rollback; user sees 500 with generic error
- **Email send failure**: log + return dev-mode preview; user still receives account (verification link in server log)
- **Document parse failure**: 400 with parse error excerpt; upload doesn't break UI
- **Plan limit hit**: 402 with clear error message naming the limit + plan
- **Tenant mismatch**: 404 (never 403, to avoid leaking existence)
- **Rate limiting**: (deferred) — implement on /api/projects/[id]/draft to prevent AI cost abuse

## Tech choices — rationale

| Choice | Why |
|---|---|
| Next.js 16 App Router | RSC for fast first paint; Route Handlers for API; single deploy |
| Prisma 6 | Type-safe ORM; portable across SQLite/Postgres; migrations built-in |
| NextAuth credentials | Simple email+password without third-party dependency; can add OAuth later |
| z-ai-web-dev-sdk | Pre-installed, works in sandbox, OpenAI-compatible (swappable) |
| Stripe | Industry standard; webhook model fits SaaS subscriptions |
| Tailwind 4 + shadcn/ui | Fast iteration; consistent design; accessible components out of the box |
| SQLite (dev) | Zero-config; perfect for sandbox testing |
| Postgres (prod) | Same Prisma schema; better concurrency + JSON support |

## What we deliberately did NOT use

- **No GraphQL**: REST + RSC is sufficient; GraphQL adds complexity without benefit at this scale
- **No microservices**: monolithic Next.js is correct for v1; split services only when forced
- **No Kafka/RabbitMQ**: in-process async is fine; add queue only when needed
- **No Kubernetes**: Vercel/Railway/Fly.io handle deployment; K8s is overkill
- **No custom vector DB**: keyword-overlap retrieval is good enough for v1; add pgvector + embeddings when library > 10K entries per tenant
- **No WebSocket**: SSE/streaming deferred; synchronous AI draft is acceptable for v1
