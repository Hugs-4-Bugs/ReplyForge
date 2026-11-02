# TESTING — ReplyForge

## Testing strategy

ReplyForge v1 uses an end-to-end smoke test as the primary test layer, supplemented by manual QA. The reason: for a small team shipping v1, a single e2e test that exercises the full customer workflow catches more real bugs than 100 isolated unit tests would. As the codebase grows, we'll add unit tests for individual library modules and integration tests for individual API routes.

## Test pyramid (current)

```
        ┌─────────────┐
        │  E2E (1)    │  ← scripts/e2e_test.py
        └─────────────┘
       ┌───────────────┐
       │ Manual QA (1) │  ← per-release checklist
       └───────────────┘
     ┌───────────────────┐
     │ Integration (0)   │  ← deferred to v1.1
     └───────────────────┘
   ┌───────────────────────┐
   │ Unit tests (0)        │  ← deferred to v1.1
   └───────────────────────┘
```

This is intentional. We invest in the layer that catches the most real bugs per minute of effort.

## End-to-end smoke test

**Location**: `scripts/e2e_test.py`
**Run**: `python3 scripts/e2e_test.py` (against a running dev server on `localhost:3000`)

### What it verifies

1. **Signup** — POST `/api/signup` with email, password, name, org name. Verifies: 200 response, user + org + membership + free subscription created in DB.
2. **Login** — NextAuth credentials flow via `/api/auth/callback/credentials`. Verifies: session cookie set, `/api/auth/session` returns user with `tenantId`.
3. **Content library CRUD** — POST `/api/library` with question/answer/category/tags/confidence. Verifies: 200 response, entry created.
4. **Document upload** — POST `/api/documents` with FormData containing a text file. Verifies: 200, document record created with extracted text + summary.
5. **Project creation** — POST `/api/projects` with 5 questions. Verifies: 200, project + 5 questions created.
6. **AI drafting** — POST `/api/projects/{id}/draft` (all undrafted). Verifies: 200, all 5 questions drafted with:
   - Confidence score (0–1) on each
   - Source citations array (non-empty for grounded answers, empty for ungrounded)
   - Model identifier (zai-glm or fallback:reason)
   - Status: `needs_review` (confidence ≥ 0.7) or `flagged` (confidence < 0.7)
   - One expected fallback answer ("We will provide this information on request.") for the question with no matching content
7. **Project state verification** — GET `/api/projects/{id}`. Verifies: all 5 questions have answers, sources parsed correctly from JSON.
8. **Answer approval** — PATCH `/api/projects/{id}/answers/{answerId}` with status=approved. Verifies: 200, `approvedAt` timestamp set.
9. **Export** — GET `/api/projects/{id}/export?format=xlsx` and `format=csv`. Verifies: 200, content-type correct, byte size > 1000 (XLSX) or > 100 (CSV), CSV has expected headers.
10. **Entitlement enforcement** — Try to create 4 additional projects on Free plan (limit: 2/month). Verifies: first 2 succeed (200), next 2 fail with 402 + plan-limit error message.
11. **Tenant isolation** — GET `/api/projects/nonexistent_id`. Verifies: 404 (not 403, to avoid leaking existence).

### Test results — last run

```
=== 1. Sign up ===              ✓ status 200
=== 2. Log in ===                ✓ session.user.id, session.tenantId set
=== 3. Create content library === ✓ entry created
=== 4. Upload reference document === ✓ document uploaded with text extracted
=== 5. Create project with questions === ✓ project + 5 questions created
=== 6. AI draft all questions ===
    drafted: 5, skipped: 0
    q1 (encryption):           ✓ conf=1.00, drawn from library
    q2 (access review):        ✓ conf=1.00, drawn from library
    q3 (incident response):    ✓ conf=0.80, drawn from uploaded document
    q4 (customer notif.):      ✓ conf=0.20, partial info
    q5 (sub-processors):       ✓ conf=0.20, "We will provide this information on request."
=== 7. Verify project state ===  ✓ 5 drafted, 0 approved, 2 flagged, sources present
=== 8. Approve first answer ===  ✓ approvedAt set
=== 9. Export project ===        ✓ XLSX 19,274 bytes; CSV 1,782 bytes with headers
=== 10. Entitlement enforcement ===
    attempt 1: 200 OK
    attempt 2: 402 Plan limit reached: 2 projects / month on Free.
    attempt 3: 402 Plan limit reached: 2 projects / month on Free.
    attempt 4: 402 Plan limit reached: 2 projects / month on Free.
=== 11. Tenant isolation ===     ✓ nonexistent project: 404
=== ALL TESTS PASSED ===
```

## Manual QA checklist (per release)

Run before every release to production:

### Landing page
- [ ] Loads at `/` with all sections visible (hero, problem, how it works, features, comparison, pricing, FAQ, CTA, footer)
- [ ] "Start free" button → navigates to `/signup`
- [ ] "Log in" button → navigates to `/login`
- [ ] Pricing section shows all 4 plans with correct prices + features
- [ ] Comparison table shows correct Loopio/Responsive/Conveyor pricing
- [ ] FAQ accordion expands/collapses
- [ ] Mobile responsive (test at 375px width)

### Auth flow
- [ ] Signup with valid data → success message + verification email sent
- [ ] Signup with existing email → "already exists" error
- [ ] Signup with short password → validation error
- [ ] Email verification link works → redirects to `/login?verified=ok`
- [ ] Email verification expired link → redirects to `/login?verified=expired`
- [ ] Login with correct credentials → redirect to `/app/dashboard`
- [ ] Login with wrong password → "Invalid email or password" error
- [ ] Logout → redirect to `/`

### Dashboard
- [ ] Empty state shows when no projects
- [ ] Stats show correct counts (seats, projects this month, library, documents)
- [ ] Recent projects list shows up to 5 most recent
- [ ] Recent activity shows up to 8 most recent audit entries

### Library
- [ ] New entry dialog creates entry
- [ ] Search filters by question + answer
- [ ] Category filter works
- [ ] Edit entry updates values
- [ ] Delete entry removes from list (soft delete)
- [ ] Confidence shown as percentage

### Documents
- [ ] Upload .xlsx, .docx, .pdf, .txt — all succeed
- [ ] Upload > 10MB file → rejected with clear error
- [ ] Upload .exe / .js → rejected (extension allowlist)
- [ ] Document text extracted (verify summary field)
- [ ] Delete document removes from list

### Projects
- [ ] New project wizard: details → upload → review → create
- [ ] File upload parses questions correctly (test xlsx, csv, docx, pdf, txt)
- [ ] Pasted text parses correctly (numbered, Q-prefixed, paragraph)
- [ ] Project list shows status + progress bar
- [ ] Project workspace: question list, filter, search all work
- [ ] "Draft all" drafts undrafted questions only
- [ ] "Draft one" drafts single question
- [ ] Draft shows confidence + sources + status
- [ ] Edit answer text → Save → status becomes "needs_review"
- [ ] Approve answer → status becomes "approved", approvedAt set
- [ ] Flag answer → status becomes "flagged"
- [ ] Export XLSX → downloads file, opens in Excel, has all columns
- [ ] Export CSV → downloads file, has all columns
- [ ] Prev/Next navigation works
- [ ] Filter by status (undrafted, flagged, needs_review, approved) works

### Billing
- [ ] Shows current plan + usage
- [ ] Upgrade button → Stripe checkout (or dev-mode activation)
- [ ] Plan grid shows all 4 plans with "Current" badge on active plan
- [ ] Cancel at period end works (test mode)
- [ ] Invoices list populates after Stripe webhook
- [ ] Non-admin member cannot access billing (redirected or shown "Admins only")

### Members
- [ ] Owner can invite member + admin
- [ ] Invitee receives email with accept link
- [ ] Accept link creates account (if new) or links membership (if existing)
- [ ] Owner can change member role (member ↔ admin)
- [ ] Owner can remove member (cannot remove owner)
- [ ] Seat limit enforced on invite
- [ ] Non-admin member cannot access member management

### Settings
- [ ] Org name editable (admin+)
- [ ] Slug read-only
- [ ] Changes persist across page reloads

### Audit log
- [ ] Every meaningful action creates audit entry
- [ ] Dashboard activity widget shows recent entries

### Tenant isolation (CRITICAL)
- [ ] Sign up two separate orgs (different emails)
- [ ] From org A, try to access org B's project by ID → 404
- [ ] From org A, try to access org B's library entry by ID → 404
- [ ] From org A, try to access org B's document by ID → 404

### Mobile responsive
- [ ] All app pages usable at 375px width
- [ ] Sidebar collapses on mobile (or hidden, with menu)
- [ ] Project workspace question list + editor stack vertically
- [ ] Forms are scrollable

## What's NOT tested in v1 (and why)

### Unit tests
- The lib modules (`auth.ts`, `tenant.ts`, `plans.ts`, `ai.ts`, `stripe.ts`, `parsing.ts`, `email.ts`, `audit.ts`) are tested implicitly via the e2e test. Direct unit tests would catch edge cases but add maintenance burden.
- **Planned for v1.1**: jest test suite for `parsing.ts` (most likely to have edge cases — different file formats) and `ai.ts` (LLM response parsing).

### Integration tests
- Each API route is tested via the e2e test (one full flow exercises most routes). Individual route tests would catch route-specific regressions faster.
- **Planned for v1.1**: vitest + supertest integration tests for each API route.

### Performance tests
- Not tested in v1. Acceptable because: (a) SQLite + single-tenant e2e is not representative of production load, (b) Vercel handles scaling.
- **Planned when**: a customer reports slowness, OR when we hit 100 paying customers.

### Visual regression tests
- Not tested in v1.
- **Planned for v2.0**: Playwright + Chromatic for visual regression.

### Load tests
- Not tested in v1.
- **Planned when**: pre-launch with k6 + a staging database matching production size.

## Bug-tracking

- v1: GitHub Issues on the replyforge repo (private until launch)
- v1.1: Linear (when team grows past 2)

## Test data

- The e2e test creates disposable test users (`test_*@replyforge-test.com`) with random 8-char suffixes
- The test cleans up by NOT cleaning up — each run creates new users, leaving orphan DB rows. Acceptable for dev; on staging, periodic `DELETE FROM "User" WHERE email LIKE 'test_%@replyforge-test.com'` resets.
- For production: never run e2e test against production database (use staging).

## Continuous integration

- v1: `bun run lint` runs locally before commit; e2e test runs manually before release
- v1.1: GitHub Actions workflow:
  - On PR: lint + type check + e2e test against ephemeral DB
  - On main: deploy to staging → run e2e → if pass, deploy to production
