# PRD — ReplyForge

## Personas

### P1 — Founder/Head of Sales at SMB SaaS (Primary)
- 10–80 person B2B SaaS company
- Closes enterprise deals personally; gets security questionnaires by email
- Currently responds manually using Google Docs + Slack + last quarter's SOC 2
- Pain: 20–40 hrs per questionnaire; deals slip; founder time is the bottleneck
- Wants: get a defensible draft in 30 minutes; have SMEs review in 1 hour; submit same day

### P2 — Proposal Manager at mid-size consultancy
- 80–300 person firm; 20+ RFPs per quarter
- Manages 2–5 SMEs who contribute answers
- Currently uses spreadsheets + email + maybe a partial content library
- Pain: tracking who answered what; keeping the library current; consistency across submissions
- Wants: project workflow with assignments, status tracking, library governance

### P3 — Security/Compliance Lead at growth-stage SaaS
- 30–150 person company that just got SOC 2
- Owns the security questionnaire response function across deals
- Pain: repeating the same answers; out-of-date library; CTO pulled into every deal
- Wants: a single source of truth for security answers; audit trail; defensible to enterprise buyers

## Jobs-to-be-done

1. **When an enterprise buyer sends a security questionnaire**, draft defensible answers in minutes from our approved content + reference documents.
2. **When a question is unfamiliar**, surface it for SME review with low-confidence flag, not silently invent an answer.
3. **When a deal closes**, export the completed questionnaire in the buyer's original format (Excel/CSV) so procurement can ingest it without rework.
4. **When the security posture changes**, update the content library once and have all future drafts use the new answer.
5. **When an auditor asks**, produce an audit trail of who approved what when.

## User journeys

### Signup → first draft (target: < 15 minutes)
1. Land on `/` (marketing page), click "Start free"
2. Sign up with email + password + company name
3. Receive verification email (or dev-mode: see link in server log)
4. Verify → log in → land on dashboard (empty state)
5. Click "New project" → enter project details → upload Excel questionnaire
6. Review parsed questions → click "Create project"
7. Click "Draft all" → wait ~30 seconds → see 5 answers with confidence + sources
8. Review each answer → approve or flag
9. Click "Export Excel" → download filled spreadsheet

### Library building (target: < 5 minutes per entry)
1. Navigate to Content library → "New entry"
2. Paste question + approved answer + category + tags
3. Save → entry immediately available for AI drafting

### Document upload (target: < 1 minute)
1. Navigate to Documents → upload PDF (SOC 2 report, security policy)
2. System extracts text, indexes for retrieval
3. Future drafts cite document snippets when relevant

### Team invite (target: < 2 minutes)
1. Owner navigates to Settings → Members
2. Enter email + role → click Invite
3. Teammate receives email → clicks link → sets password → joins org
4. Teammate sees same projects, library, documents

### Plan upgrade (target: < 1 minute, self-serve)
1. Owner hits plan limit (e.g. tries to create 3rd project on Free)
2. System returns clear error with plan limit name
3. Owner navigates to Billing → picks plan → Stripe checkout
4. Stripe webhook updates subscription → entitlements updated

## Functional requirements

### Authentication
- FR-A1: Signup with email + password (min 8 chars) + name + org name
- FR-A2: Email verification via token (24hr expiry)
- FR-A3: Login with email + password
- FR-A4: Logout
- FR-A5: Session via NextAuth JWT (30-day expiry)
- FR-A6: Password reset (deferred — email hello@replyforge.app for v1)
- FR-A7: Account creation creates Organization + Membership + Subscription(free) atomically

### Multi-tenancy
- FR-T1: Every tenant-scoped record (project, contentEntry, document, answer, apiKey) has `organizationId`
- FR-T2: Every API route that takes an `:id` for a tenant-scoped resource MUST verify `organizationId === caller.tenantId`
- FR-T3: Cross-tenant access returns 404 (never leak existence)
- FR-T4: Audit log is tenant-scoped

### Content library
- FR-L1: Create entry with question, answer, category (optional), tags (optional), confidence (0–1, default 1.0)
- FR-L2: List entries with search + category filter
- FR-L3: Edit entry
- FR-L4: Soft-delete (status: archived) — preserves audit trail
- FR-L5: Only `approved` entries are used for AI drafting

### Documents
- FR-D1: Upload file (xlsx, csv, docx, pdf, txt; max 10MB)
- FR-D2: Extract plain text from file (xlsx via sheet_to_json, docx via mammoth, pdf via pdf-parse, txt directly)
- FR-D3: Store extracted text in DB (truncated to 200K chars to prevent runaway rows)
- FR-D4: Auto-generate summary (first 280 chars)
- FR-D5: Delete document
- FR-D6: Only `ready` status documents are used for AI retrieval

### Projects
- FR-P1: Create project with name, client, type, due date, list of questions
- FR-P2: Parse questions from uploaded file (xlsx/csv/docx/pdf/txt) or pasted text
- FR-P3: Parsing preserves externalId, text, category from source
- FR-P4: List projects with status + progress
- FR-P5: Open project workspace → see all questions + current draft + status
- FR-P6: Filter questions by status (undrafted / flagged / needs_review / approved)
- FR-P7: Search questions by text
- FR-P8: AI-draft one question or all undrafted questions
- FR-P9: AI draft returns: draft text, confidence (0–1), sources (array), model identifier, fallback flag
- FR-P10: Edit answer text in-place
- FR-P11: Set answer status: draft / needs_review / approved / flagged
- FR-P12: Approving sets `approvedAt` timestamp
- FR-P13: Export project as XLSX (mirrors source columns: ID, Category, Question, Answer, Confidence, Status, Sources)
- FR-P14: Export project as CSV
- FR-P15: Navigate prev/next between questions
- FR-P16: Auto-advance to next undrafted question after approve (deferred — manual nav in v1)

### AI drafting
- FR-AI1: System prompt constrains AI to use ONLY provided approved content + reference snippets
- FR-AI2: AI returns "We will provide this information on request." when no grounded answer exists (never invents)
- FR-AI3: AI returns confidence score (0–1) reflecting how grounded the answer is
- FR-AI4: Every draft includes source citations (which content entry or document snippet it came from)
- FR-AI5: If LLM call fails, deterministic fallback uses best-match content entry with confidence 0.4 (clearly marked as fallback)
- FR-AI6: Retrieval: top-5 content entries by keyword overlap; top-3 document snippets by chunked keyword overlap
- FR-AI7: Plan-based monthly AI draft limit enforced

### Billing
- FR-B1: 4 plans (Free, Starter, Pro, Business) with explicit limits per plan
- FR-B2: Stripe Checkout for plan upgrades (monthly + yearly options)
- FR-B3: Stripe webhook handler (idempotent, event-id deduplication)
- FR-B4: Cancel at period end
- FR-B5: Plan limits enforced on: createProject, addContent, addDocument, addSeat, AI drafts/month
- FR-B6: When Stripe not configured, dev-mode: plan switch applies instantly without charging (clearly disclosed)
- FR-B7: Invoice history (cached from Stripe webhooks)
- FR-B8: Only owner/admin can manage billing

### Members
- FR-M1: Owner can invite by email (member or admin role)
- FR-M2: Invite token expires in 7 days
- FR-M3: Accept invite creates account (if new user) or links membership (if existing)
- FR-M4: Owner can change role (member ↔ admin)
- FR-M5: Owner can remove member (cannot remove owner)
- FR-M6: Seat limit enforced on invite
- FR-M7: Only owner/admin can manage members

### Audit log
- FR-AU1: Every meaningful action logged: signup, project.create, answer.draft, answer.approve, billing.upgrade, billing.cancel, library.create/update/delete, document.upload/delete, member.invite/role_change/remove, org.update
- FR-AU2: Log includes userId, organizationId, action, targetType, targetId, metadata (JSON), IP
- FR-AU3: Visible on dashboard (recent activity widget)
- FR-AU4: Stripe webhook events stored with idempotency marker

## Non-functional requirements

### Security
- NFR-S1: Passwords bcrypt-hashed (cost factor 12)
- NFR-S2: JWT session via NextAuth (AUTH_SECRET env var)
- NFR-S3: All tenant-scoped queries scoped by `organizationId`
- NFR-S4: SQL injection protection via Prisma parameterized queries
- NFR-S5: XSS protection via React's default escaping
- NFR-S6: CSRF protection via NextAuth CSRF token
- NFR-S7: File upload validation: extension allowlist + size limit (10MB)
- NFR-S8: Stripe webhook signature verification
- NFR-S9: Secrets only via env vars, never committed
- NFR-S10: Tenant isolation test: cross-tenant access returns 404 (verified by e2e test)

### Performance
- NFR-P1: Page load < 1s for all authenticated routes
- NFR-P2: AI draft of single question < 5s
- NFR-P3: AI draft of 50 questions < 60s
- NFR-P4: Export of 500-question project < 5s
- NFR-P5: Library list of 1000 entries < 500ms (DB index on organizationId + status)

### Reliability
- NFR-R1: Stripe webhook handler is idempotent (event-id deduplication via audit log)
- NFR-R2: AI draft failure → deterministic fallback (workflow never blocks)
- NFR-R3: Document text extraction failure → clear error, doesn't block upload UI
- NFR-R4: Soft delete preserves audit trail
- NFR-R5: Database transactions for multi-step writes (signup, checkout)

### Observability
- NFR-O1: Audit log for every meaningful action
- NFR-O2: Stripe webhook events logged
- NFR-O3: AI fallback events marked in answer record (`fallback: true`, `aiModel: fallback:reason`)
- NFR-O4: Console logs for dev-mode email (so developer can see verification links)

## Database requirements

See DATABASE.md for full schema. Key requirements:
- Multi-tenant: every tenant-scoped table has `organizationId` + index
- Soft delete on ContentEntry (status: archived) and Subscription (status: canceled)
- Audit log is append-only
- Stripe idempotency via unique audit log entry per event id
- Foreign keys with cascade on Organization delete (preserves referential integrity)

## API requirements

REST API, JSON, all under `/api/*`. Authenticated routes use NextAuth session cookie.
- All routes return JSON unless binary (export)
- Errors: `{ error: string }` with appropriate HTTP status (400, 401, 403, 404, 402, 500)
- Tenant-scoped routes verify `organizationId` matches caller's tenant
- Idempotent where applicable (Stripe webhook, checkout)

## Integration requirements

- Stripe: subscriptions, invoices, webhooks
- Email (nodemailer, SMTP): verification emails, member invites
- AI (z-ai-web-dev-sdk / OpenAI-compatible): answer drafting
- File parsers: xlsx, mammoth (docx), pdf-parse, plain text
- (Future) Slack: notifications
- (Future) Salesforce/HubSpot: project sync
- (Future) Chrome extension: portal auto-fill

## Billing requirements

- 4 plans with explicit limits
- Stripe Checkout for upgrades
- Stripe Billing Portal for self-manage payment methods (deferred)
- Cancel at period end (no immediate cancellation — preserves customer goodwill)
- Plan limits enforced server-side; never trust client

## Notification requirements

- Email verification on signup
- Member invite email
- (Deferred) Project assigned to reviewer
- (Deferred) Project status changed
- (Deferred) Plan limit approaching

## Analytics requirements

- Audit log is the primary analytics source (visible in-app)
- (Deferred) PostHog for product analytics
- (Deferred) Stripe for billing analytics
- (Deferred) Customer usage dashboard (projects/mo, AI drafts/mo, library size)

## Admin requirements

- (Deferred) Internal admin panel for customer status
- (Deferred) Impersonation for support
- (Deferred) System health dashboard

## Error states

- AI draft failure → fallback draft + clear in-UI "fallback" badge
- Stripe webhook signature invalid → 400, no state change
- Plan limit hit → 402 with clear error message naming the limit
- Tenant mismatch → 404 (not 403, to avoid leaking existence)
- File upload too large → 400 with size limit stated
- File parse failure → 400 with parse error excerpt
- Email send failure → log + return dev-mode preview so developer can debug

## Edge cases

- User uploads a spreadsheet with no "Question" column header → parse column A as ID, column B as question
- User pastes unstructured text (no numbering) → split on blank lines, treat each paragraph as a question
- User uploads a 0-byte file → reject with clear error
- User tries to create more projects than plan allows → 402 with plan upgrade prompt
- User tries to draft more questions than monthly AI limit allows → partial draft + clear "skipped N due to limit" message
- User deletes their last organization → redirect to onboarding (deferred — for v1, owner cannot delete own org via UI; email support)
- Stripe webhook arrives for unknown customer → log + ignore (not an error)
- AI returns empty response → fallback draft

## Acceptance criteria

The product is shippable when:
1. A brand-new user can sign up, verify email, log in, create a project, AI-draft answers, approve, and export — all without human intervention. (Verified by `scripts/e2e_test.py`.)
2. Cross-tenant access returns 404. (Verified by e2e test §11.)
3. Plan limits are enforced server-side. (Verified by e2e test §10.)
4. AI drafts return confidence + sources on every answer. (Verified by e2e test §6.)
5. XLSX export mirrors source format. (Verified by e2e test §9.)
6. Stripe webhook handler is idempotent. (Verified by code: audit log deduplication.)
7. Audit log records every meaningful action. (Verified by audit calls in every API route.)
8. Lint passes clean. (Verified: `bun run lint` exits 0.)
9. No placeholder content in shipped UI. (Verified by visual inspection.)
10. Documentation describes what actually exists, not aspirational features. (Verified by doc review.)
