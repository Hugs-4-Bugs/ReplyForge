# SECURITY — ReplyForge

This document describes the security architecture, threat model, and verification of ReplyForge v1. It is intended for: (a) the customer's security team reviewing the tool before purchase, (b) the founder preparing for SOC 2, (c) the engineer responding to a customer security questionnaire (yes — we use ReplyForge to answer questionnaires about ReplyForge).

## Threat model

### What we're protecting
1. **Customer content library**: institutional knowledge, security policies, approved answers — high sensitivity
2. **Customer documents**: SOC 2 reports, security whitepapers, DPAs — high sensitivity
3. **Customer questionnaire projects**: in-progress deal terms, client names, due dates — medium sensitivity
4. **User credentials + session tokens**: account takeover vector — critical
5. **Stripe customer IDs + subscription state**: financial data — critical
6. **Audit logs**: tamper-evidence for SOC 2 — critical

### Who we're protecting against
- **Other customers (tenant isolation)**: highest priority. Customer A must NEVER see Customer B's data, even with API abuse.
- **Anonymous attacker**: signup spam, credential stuffing, webhook spoofing, SSRF.
- **Insider threat (founder/engineer with DB access)**: we can see customer data; we minimize this by not accessing production DB unless required for support.
- **Compromised user account**: stolen password → attacker accesses one tenant; we limit blast radius.
- **Stripe webhook forgery**: attacker spoofs webhook to grant themselves a free upgrade.

### What we're NOT protecting against (out of scope for v1)
- Nation-state attacker with 0-day against Next.js / Postgres / Stripe — rely on vendor patching
- Customer putting sensitive data in a public GitHub repo — customer responsibility
- Customer sharing their password — customer responsibility (deferred: 2FA in v2)

## Security architecture

### 1. Multi-tenant isolation (CRITICAL)

**Enforcement**: every tenant-scoped query MUST filter by `organizationId`. Helper: `requireTenantResource()` in `src/lib/tenant.ts`.

**Verification**: cross-tenant access returns 404 (not 403, to avoid leaking resource existence). Verified by end-to-end test (`scripts/e2e_test.py` step 11: nonexistent project ID → 404).

**Every tenant-scoped table has `organizationId`**:
- Project, Question (via Project), Answer (denormalized for fast filtering)
- ContentEntry, Document
- Subscription, Invoice (via Organization)
- AuditLog, ApiKey, Invite

**Every API route that takes `:id` for a tenant-scoped resource calls `requireTenantResource()`**:
- `/api/projects/[id]` ✓
- `/api/projects/[id]/draft` ✓
- `/api/projects/[id]/answers/[answerId]` ✓ (also verifies answer.question.projectId === id)
- `/api/projects/[id]/export` ✓
- `/api/library/[id]` ✓
- `/api/documents/[id]` ✓

### 2. Authentication

- **Provider**: NextAuth.js v4 with Credentials
- **Password storage**: bcrypt with cost factor 12 (file: `src/lib/auth.ts:hashPassword`)
- **Session**: JWT signed with AUTH_SECRET, 30-day expiry
- **JWT claims**: userId, email, name, tenantId, tenantRole
- **CSRF**: NextAuth CSRF token on auth routes; SameSite=Lax cookies
- **Logout**: client-side `signOut()` clears JWT cookie

**Verification**: signup requires email + 8+ char password; login validates bcrypt hash; session cookie required on all `/api/*` routes (except `/api/signup`, `/api/auth/*`, `/api/verify-email`, `/api/stripe/webhook`).

### 3. Authorization

- **Roles**: owner, admin, member
- **Enforcement**: `canManageBilling(role)` and `canManageMembers(role)` helpers in `src/lib/session.ts`; called in billing/members API routes
- **Owner-only actions**: delete org, transfer ownership (deferred)
- **Admin+ actions**: manage billing, invite/remove members, change roles, update org settings
- **Member actions**: create/edit projects, library, documents

**Verification**: every billing route checks `canManageBilling(membership.role)`; every member-management route checks `canManageMembers(membership.role)`.

### 4. Input validation

- **Schema validation**: every API route body validated with zod schema
- **Type coercion**: zod rejects unknown fields, coerces types where safe
- **File upload validation**: extension allowlist (`.xlsx`, `.xls`, `.csv`, `.docx`, `.pdf`, `.txt`), size limit (10MB)
- **SQL injection**: Prisma parameterized queries (no raw SQL anywhere in the codebase)
- **XSS**: React's default escaping; no `dangerouslySetInnerHTML` anywhere
- **Path traversal**: file content stored in DB as text (no file system paths)

### 5. Stripe webhook security

- **Signature verification**: `stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)` — rejects forged webhooks with 400
- **Raw body**: webhook reads `req.arrayBuffer()` (not `req.json()`) to preserve signature
- **Idempotency**: each Stripe event id stored in audit log with `action: "stripe.webhook"`; handler checks for existing log entry and skips if found
- **Events handled**: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_succeeded`

**Verification**: test mode webhook with invalid signature → 400; same event sent twice → processed once (idempotent).

### 6. Secret management

- **Env vars only**: all secrets via `process.env`
- **`.env` in `.gitignore`**: verified (project default)
- **Never logged**: `console.log` calls do not include secrets, passwords, or tokens
- **Stripe secret key**: only used server-side (never exposed to client)
- **AUTH_SECRET**: 32+ random chars, set in production env vars
- **SMTP password**: only used server-side

### 7. Cookie security

- **Session cookie**: `__Secure-next-auth.session-token` in production (HTTPS-only)
- **HttpOnly**: yes (NextAuth default)
- **SameSite**: Lax (NextAuth default — prevents CSRF for top-level navigations)
- **Secure**: enforced in production via `NEXTAUTH_URL=https://...`

### 8. File upload security

- **Extension allowlist**: server-side check on filename extension
- **MIME type**: stored but not enforced (MIME can be spoofed; extension is the source of truth)
- **Size limit**: 10MB hard limit (server-side check via `file.size`)
- **Storage**: extracted text only — original file bytes not persisted (so no malicious file execution risk)
- **No path traversal**: no file system paths stored

### 9. SSRF protection

- **No outbound URL fetching from user input** in v1 (document upload is from user's local machine, not a URL)
- **AI SDK**: calls only the AI provider's API endpoint, not user-supplied URLs
- **Stripe SDK**: calls only Stripe's API

### 10. Rate limiting (DEFERRED)

- v1: no rate limiting
- Recommended for v1.1: rate limit `/api/signup` (5/hour per IP), `/api/auth/callback/credentials` (10/minute per IP), `/api/projects/[id]/draft` (60/minute per user)
- Implementation: Upstash Redis + `@upstash/ratelimit` (free tier sufficient)

## Security review — performed 2026-11-02

### Broken access control
- ✅ Every tenant-scoped route enforces `organizationId` match
- ✅ Billing/members routes enforce role check
- ✅ No "admin" backdoor routes

### IDOR (insecure direct object reference)
- ✅ All `:id` routes verify resource belongs to caller's tenant
- ✅ Cross-tenant access returns 404 (not 403)

### Tenant leakage
- ✅ No list endpoint returns cross-tenant records
- ✅ Error messages don't leak existence ("Not found" rather than "Forbidden")

### Exposed secrets
- ✅ No secrets in source code
- ✅ `.env` not committed
- ✅ Stripe secret key only used server-side

### Unsafe file uploads
- ✅ Extension allowlist
- ✅ Size limit
- ✅ No file system writes (text extracted to DB only)
- ⚠️ No virus scanning (deferred — for v1, content is text-only and not executed)

### SQL injection
- ✅ All queries via Prisma (parameterized)
- ✅ No raw SQL anywhere

### XSS
- ✅ React default escaping
- ✅ No `dangerouslySetInnerHTML`
- ✅ No user-supplied HTML rendered as HTML

### CSRF
- ✅ NextAuth CSRF token on auth routes
- ✅ SameSite=Lax cookies
- ⚠️ Custom API routes don't have CSRF tokens — acceptable for v1 because (a) all state-changing routes require auth cookie (SameSite=Lax protects against cross-origin POST), (b) no cookie-based auth bypass possible

### SSRF
- ✅ No outbound URL fetching from user input

### Insecure APIs
- ✅ All `/api/*` routes require auth (except public auth routes + Stripe webhook)
- ✅ Stripe webhook verifies signature

### Weak session handling
- ✅ JWT signed with AUTH_SECRET (32+ chars)
- ✅ HttpOnly cookie
- ✅ 30-day expiry (reasonable for B2B SaaS)
- ⚠️ No session rotation on privilege change (deferred — when user changes role, their JWT still has old role until they re-login)

### Privilege escalation
- ✅ Role checks server-side; client role display is informational only
- ✅ Owner role cannot be self-assigned (only via ownership transfer, deferred)

### Webhook spoofing
- ✅ Stripe webhook signature verification

### Replay attacks
- ✅ Stripe webhook idempotency (event-id deduplication)
- ⚠️ Email verification tokens don't have nonce — but they're single-use (deleted on click)

### Race conditions
- ✅ Plan limit checks use `count()` then create — small TOCTOU window acceptable for v1 (worst case: 1 extra project over limit)
- ⚠️ For v1.1: use DB-level constraint or transaction with lock for stricter enforcement

## Known security limitations (v1)

Be honest with customers about these:

1. **No 2FA / MFA** — password-only auth. Planned for v1.1 (TOTP).
2. **No SSO / SAML** — except on Business plan (configured manually). Planned for Pro plan in v1.2.
3. **No rate limiting** — vulnerable to credential stuffing. Planned for v1.1.
4. **No IP allowlisting** — planned for Business plan in v1.2.
5. **No audit log tamper-evidence** — audit log is in DB, technically editable by DB admin. For SOC 2 evidence, recommend exporting to external log service monthly.
6. **No data residency choice** — v1 runs wherever you deploy (Vercel + Neon = AWS US/EU). For specific residency, deploy to your own VPC.
7. **No DPA auto-sign** — email hello@replyforge.app for DPA.
8. **No penetration test yet** — planned within 6 months of first paying customer (or upon enterprise request).
9. **No SOC 2 yet** — planned within 12 months; ReplyForge is the tool we'll use to answer the SOC 2 questionnaire about ReplyForge.
10. **AI provider** — uses z-ai-web-dev-sdk (or your configured OpenAI-compatible provider). Customer content is sent to the AI provider for drafting. We do not store AI provider responses beyond the answer record in your tenant. AI provider's data retention policy applies.

## Customer-facing security answers

Use these in customer security questionnaires:

> **Do you encrypt data at rest?**
> Yes. Database (Postgres on Neon/AWS) is encrypted at rest with AES-256, managed by the cloud provider. Database backups are encrypted. (For self-hosted deployments, encryption depends on the customer's hosting provider.)

> **Do you encrypt data in transit?**
> Yes. All HTTP traffic is HTTPS-only (Vercel/Cloudflare auto-redirect HTTP to HTTPS). Database connections use SSL (sslmode=require). SMTP connections use TLS.

> **Describe your access control model.**
> Multi-tenant: every customer record is scoped to an `organizationId`. Every query filters by this ID. Three roles per organization: owner (full control), admin (no org deletion), member (no billing/member management). Roles enforced server-side on every API route.

> **How do you isolate customer data?**
> Tenant isolation enforced at the application layer. Every tenant-scoped API route verifies the resource's `organizationId` matches the caller's `tenantId` (stored in signed JWT). Cross-tenant access returns 404. Verified by automated end-to-end test.

> **Do you have an audit log?**
> Yes. Every meaningful action (signup, project create, answer draft/approve, billing change, member invite/role change, document upload) is recorded with userId, organizationId, action, target, metadata (JSON), IP, and timestamp. Audit log is exportable for SOC 2 evidence.

> **Describe your password storage.**
> Bcrypt with cost factor 12. Passwords never logged. Password reset requires email verification (deferred feature in v1 — currently requires email to hello@replyforge.app).

> **Describe your session management.**
> JWT-based, signed with AUTH_SECRET (32+ random chars), 30-day expiry. HttpOnly + SameSite=Lax cookies. Secure flag set in production.

> **How do you handle Stripe webhooks?**
> Stripe webhook signature verified using STRIPE_WEBHOOK_SECRET. Raw body preserved (not parsed as JSON) for signature check. Each Stripe event id is deduplicated via audit log entry — webhook is idempotent.

> **What is your data retention policy?**
> Customer data is retained for the life of the account. On cancellation, data is preserved on the Free plan (so customer can re-subscribe without losing work). On data deletion request (email hello@replyforge.app from owner's email): all tenant data deleted within 5 business days, including database rows + Stripe customer record.

> **Do you train AI models on customer data?**
> No. Customer content is used at request time only to generate draft answers for that customer's questionnaires. We do not train models on customer data. AI provider's data retention policy applies for the duration of the API request.

> **Where is customer data stored?**
> Default deployment: Postgres on Neon (AWS US East or EU Frankfurt, customer's choice) + Vercel (AWS US East or EU). For specific residency requirements, customer can self-host (DEPLOYMENT.md).

> **What is your incident response process?**
> P1 (data breach / service down): acknowledge within 15 minutes, post-mortem within 5 business days. Customer notification for P1/P2 incidents within 24 hours per DPA. (Yes — this is the same wording our AI uses when drafting incident response answers, grounded in our actual policy.)

> **List your sub-processors.**
> Hosting: Vercel (AWS). Database: Neon (AWS) or customer-chosen. Email: Resend (or customer-chosen). Billing: Stripe. AI: z-ai-web-dev-sdk provider (or customer-configured OpenAI-compatible provider). Full list maintained at hello@replyforge.app.

## Security roadmap

### v1.1 (within 30 days of launch)
- Rate limiting (Upstash Redis)
- Password reset flow (email-based)
- 2FA / TOTP for owner role

### v1.2 (within 90 days of launch)
- SAML SSO (Business plan, then Pro)
- IP allowlisting (Business plan)
- Audit log export to S3 (for SOC 2 evidence)
- Webhook for security events

### v2.0 (within 6 months)
- SOC 2 Type 1 audit
- External penetration test
- Data residency choice (US / EU / APAC)
- Customer-managed encryption keys (Business plan)
