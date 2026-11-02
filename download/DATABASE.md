# DATABASE — ReplyForge

## Schema overview

Multi-tenant B2B SaaS schema. Every tenant-scoped table has `organizationId` for strict isolation. Soft delete on ContentEntry (status: archived) and Subscription (status: canceled). Audit log is append-only.

## Entities + relationships

```
User ─┬─< Account
      ├─< Session
      ├─< Membership >─ Organization ─┬─< ContentEntry
      ├─< Organization (owner)         ├─< Document
      ├─< ContentEntry (author)        ├─< Project ─< Question ─1 Answer
      ├─< Project (creator)            ├─< Subscription
      ├─< Answer (assignee)            ├─< Invoice
      └─< AuditLog                     ├─< AuditLog
                                        ├─< ApiKey
                                        └─< Invite

VerificationToken (standalone, no FK)
```

## Tables

### User
- `id` (cuid, PK)
- `email` (unique, indexed)
- `name` (nullable)
- `passwordHash` (bcrypt cost 12)
- `emailVerified` (nullable DateTime)
- `image` (nullable)
- `createdAt`, `updatedAt`

### Account (NextAuth OAuth — unused in v1, present for future OAuth)
- `id` (cuid, PK)
- `userId` (FK → User)
- `type`, `provider`, `providerAccountId`
- `refresh_token`, `access_token`, `expires_at`, `token_type`, `scope`, `id_token` (all nullable)
- Unique on `(provider, providerAccountId)`
- Indexed on `userId`

### Session (NextAuth DB sessions — unused in v1, JWT-only)
- `id` (cuid, PK)
- `sessionToken` (unique)
- `userId` (FK → User)
- `expires`

### VerificationToken
- `identifier` (email string)
- `token` (unique)
- `expires`
- Indexed on `identifier`
- **Note**: standalone (no FK to User) so we can issue tokens for emails that may not yet have a User row.

### Organization (TENANT)
- `id` (cuid, PK)
- `name`
- `slug` (unique — used as public identifier)
- `ownerId` (FK → User)
- `createdAt`, `updatedAt`

### Membership (join: User ↔ Organization with role)
- `id` (cuid, PK)
- `userId` (FK → User)
- `organizationId` (FK → Organization)
- `role` (owner | admin | member)
- `createdAt`
- Unique on `(userId, organizationId)` — prevents duplicate memberships
- Indexed on `organizationId`

### Invite
- `id` (cuid, PK)
- `email`
- `organizationId` (FK → Organization)
- `role` (member | admin)
- `token` (unique, cuid)
- `invitedBy` (FK → User)
- `expiresAt` (7 days)
- `acceptedAt` (nullable)
- `createdAt`
- Indexed on `(organizationId, email)`

### ContentEntry (tenant-scoped)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `question`
- `answer`
- `category` (nullable)
- `tags` (comma-separated string; SQLite has no array)
- `sourceDocument` (nullable, human-readable source label)
- `status` (draft | approved | archived)
- `confidence` (Float, 0–1, default 1.0)
- `authorId` (FK → User, nullable)
- `createdAt`, `updatedAt`
- Indexed on `(organizationId, status)` — for listing approved entries
- Indexed on `(organizationId, category)` — for category filter
- **Soft delete**: status=archived preserves audit trail

### Document (tenant-scoped)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `filename`
- `mime`
- `sizeBytes`
- `textContent` (extracted plain text, truncated to 200K chars)
- `summary` (first 280 chars)
- `status` (processing | ready | failed)
- `createdAt`
- Indexed on `(organizationId, status)`
- **Note**: raw file bytes NOT stored (text only). For S3-backed v2, add `storageKey` column.

### Project (tenant-scoped)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `name`
- `client` (nullable)
- `type` (security_questionnaire | rfp | rfi | ddq)
- `status` (draft | in_progress | in_review | submitted | archived)
- `dueDate` (nullable)
- `notes` (nullable)
- `createdById` (FK → User)
- `createdAt`, `updatedAt`
- Indexed on `(organizationId, status)`

### Question (child of Project)
- `id` (cuid, PK)
- `projectId` (FK → Project, cascade delete)
- `externalId` (nullable — question number/label from source, e.g. "1.2", "Q15")
- `text`
- `category` (nullable)
- Indexed on `projectId`

### Answer (1:1 with Question, denormalized tenant for fast filtering)
- `id` (cuid, PK)
- `questionId` (FK → Question, unique, cascade delete)
- `organizationId` (FK → Organization, cascade delete) — denormalized from Question.Project.Organization for fast tenant filtering
- `draft` (AI-generated draft text)
- `final` (nullable — reviewed/edited answer; null = still in draft)
- `confidence` (Float, 0–1, default 0)
- `status` (draft | needs_review | approved | flagged)
- `sources` (JSON string: `[{type, id, label, snippet?}]`)
- `assigneeId` (FK → User, nullable)
- `aiModel` (nullable — e.g. "zai-glm" or "fallback:empty-llm-response")
- `generatedAt` (nullable)
- `approvedAt` (nullable)
- `createdAt`, `updatedAt`
- Indexed on `(organizationId, status)`

### Subscription (1:1 with Organization)
- `id` (cuid, PK)
- `organizationId` (FK → Organization, unique)
- `plan` (free | starter | pro | business)
- `status` (active | trialing | past_due | canceled | incomplete)
- `stripeCustomerId` (unique, nullable)
- `stripeSubscriptionId` (unique, nullable)
- `stripePriceId` (nullable)
- `currentPeriodEnd` (nullable)
- `cancelAtPeriodEnd` (Boolean, default false)
- `seatsUsed` (Int, default 1 — informational; actual seat count derived from Membership)
- `createdAt`, `updatedAt`

### Invoice (tenant-scoped, cached from Stripe webhooks)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `stripeInvoiceId` (unique)
- `amountDue`, `amountPaid` (Int — cents)
- `currency` (default "usd")
- `status` (draft | open | paid | uncollectible | void)
- `hostedInvoiceUrl` (nullable)
- `invoicePdf` (nullable)
- `periodStart`, `periodEnd`
- `createdAt`
- Indexed on `organizationId`

### AuditLog (tenant-scoped, append-only)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `userId` (FK → User, nullable — null for system actions like Stripe webhooks)
- `action` (string — e.g. "project.create", "answer.approve", "billing.upgrade", "stripe.webhook")
- `targetType` (nullable)
- `targetId` (nullable)
- `metadata` (JSON string)
- `ip` (nullable)
- `createdAt`
- Indexed on `(organizationId, createdAt)` — for dashboard activity widget
- **Note**: also used for Stripe webhook idempotency — `action: "stripe.webhook"`, `targetId: <stripe event id>`, deduplication check before processing

### ApiKey (tenant-scoped, deferred to v1.1)
- `id` (cuid, PK)
- `organizationId` (FK → Organization)
- `label`
- `keyPrefix` (first 8 chars of actual key, for display)
- `hashedKey` (unique — bcrypt hash of full API key)
- `lastUsedAt` (nullable)
- `revokedAt` (nullable)
- `createdAt`
- Indexed on `organizationId`

## Indexes

All tenant-scoped queries filter by `organizationId` first, so every tenant-scoped table has an index that starts with `organizationId`. Critical for performance at scale (10K+ rows per table per tenant).

Composite indexes:
- `(organizationId, status)` on ContentEntry, Document, Project, Answer
- `(organizationId, category)` on ContentEntry
- `(organizationId, createdAt)` on AuditLog

## Constraints

### Unique
- `User.email`
- `Organization.slug`
- `Membership(userId, organizationId)`
- `VerificationToken.token`
- `Subscription.organizationId`
- `Subscription.stripeCustomerId`
- `Subscription.stripeSubscriptionId`
- `Invoice.stripeInvoiceId`
- `ApiKey.hashedKey`
- `Answer.questionId` (1:1 with Question)

### Foreign keys (with cascade behavior)
- All child tables cascade on parent delete (e.g. deleting Organization deletes all Projects, Questions, Answers, etc.)
- `AuditLog.user` uses `onDelete: SetNull` (preserve audit log even if user deleted)
- `Question.project` uses `onDelete: Cascade` (delete project → delete questions)
- `Answer.question` uses `onDelete: Cascade` (delete question → delete answer)

## Migrations

- v1: `bun run db:push` (Prisma's "push" mode — syncs schema to DB without migration history)
- v1.1+: switch to `bun run db:migrate` (Prisma Migrate — generates migration files, reviewable, reversible)
- **Migration principles**:
  - All v1 migrations are additive (no destructive changes)
  - Destructive migrations: take DB backup first, document rollback SQL, test on staging
  - Never run `db:push --accept-data-loss` on production without explicit confirmation

## Multi-tenancy enforcement

The schema enables tenant isolation, but enforcement is at the **application layer**:

1. Every API route that takes `:id` for a tenant-scoped resource calls `requireTenantResource(orgId, id, model)` from `src/lib/tenant.ts`.
2. Every list endpoint filters by `where: { organizationId: <caller's tenantId> }`.
3. Every create endpoint sets `organizationId: <caller's tenantId>` from the JWT (not from the request body).
4. Cross-tenant access returns 404 (not 403, to avoid leaking resource existence).

## SQLite → Postgres migration

The Prisma schema is portable. To migrate:

1. Change `datasource db` provider from `sqlite` to `postgresql` in `prisma/schema.prisma`
2. Set `DATABASE_URL` to Postgres connection string
3. Run `bun run db:push` (creates tables in Postgres)
4. (Optional) Migrate existing data: export from SQLite as JSON, import to Postgres via script

**Differences to expect**:
- SQLite stores `Json` type as TEXT; Postgres has native `jsonb`. Our schema uses `String` for JSON fields (e.g. `Answer.sources`, `AuditLog.metadata`) so no change needed.
- SQLite has no native array; we use comma-separated strings (e.g. `ContentEntry.tags`). Postgres has `text[]` but we don't use it for portability.
- SQLite `@default(now())` and `@updatedAt` work the same in Postgres.

## Data retention + deletion

- **Customer cancels subscription**: data preserved (drops to Free plan; customer can re-subscribe without losing work)
- **Customer requests deletion** (email from owner's email): `DELETE FROM "Organization" WHERE id = 'xxx'` cascades to all tenant tables. Stripe customer record deleted via Stripe API. Completed within 5 business days.
- **Audit log retention**: indefinite (legal + SOC 2 evidence). Not deleted on customer deletion (anonymized: `userId` set to null via SetNull).

## Backup

- **Neon**: automatic daily backups + 7-day point-in-time recovery (free tier)
- **Supabase**: daily backups (7 days free, 30 days paid)
- **Self-hosted Postgres**: configure `pg_dump` cron + offsite copy
- **Restore drill**: monthly, restore to staging, verify app works against restored data
