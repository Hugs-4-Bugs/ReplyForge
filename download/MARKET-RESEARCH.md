# MARKET RESEARCH — ReplyForge

> Security questionnaire + RFP response software for SMB SaaS, agencies, and consultants.

## 1. Problem

Every B2B SaaS deal above ~$25K now triggers a security questionnaire. A typical questionnaire is a 100–300 row Excel file covering encryption, access controls, sub-processor lists, incident response, data residency, DPA terms, SOC 2 / ISO 27001 evidence, and more. Buyers send it after verbal agreement; it gates the contract. Manual response takes 20–40 hours per questionnaire, drags in CTO + Head of Legal + Security lead, and routinely slips deal close by 2–4 weeks. RFPs and DDQs are the same problem at larger scale.

## 2. Customer

**Primary ICP (Starter plan, $99/mo):**
- 10–80 person B2B SaaS company selling to enterprise
- 1–3 RFPs or 5–20 security questionnaires per quarter
- No dedicated proposal manager; response work falls to a founder / Head of Sales / CTO
- Has a SOC 2 (or in process); existing approved answers live in Google Docs + Slack threads + a Notion page nobody owns
- Losing deals or burning founder time on questionnaire responses

**Secondary ICP (Pro plan, $299/mo):**
- 80–300 person SaaS company or boutique consultancy (5–30 person proposal team)
- 20+ RFPs / quarter
- Has outgrown spreadsheets but can't justify $30K+ for Loopio
- Often has a partial content library in another tool

**Tertiary ICP (Business plan, $799/mo):**
- 300–1,000 person company with a real proposal team
- 50+ RFPs / quarter, multiple concurrent
- Considering Loopio/Responsive but balking at $50K+ annual + 6-week implementation

## 3. Existing solutions

| Vendor | What it does | Typical customer | Min price |
|---|---|---|---|
| Loopio | RFP + security questionnaire response, content library, AI drafting | Enterprise (1,000+ employees) | $15K–$150K / yr (avg $19,974 SMB, $50,421 enterprise per Vendr) |
| Responsive (formerly RFPIO) | Same category, broader intake | Enterprise | $10K / yr starting (~$499/user/month per AutoRFP) |
| Conveyor | Security questionnaire focus + trust center | Mid-market security teams | $9,600 / yr |
| Vanta | Compliance platform with bundled questionnaire feature | Compliance-focused | ~$8K–$25K / yr (bundle) |
| Drata | Same as Vanta | Compliance-focused | ~$8K–$25K / yr |
| Skyvern | Browser agent for portal-based questionnaires | Technical teams | Custom |
| Inventive AI / SiftHub / Tribble | AI-first newer entrants | Mid-market | Quote-based, generally $5K–$20K / yr |
| Spreadsheets + Word + Slack | The default | SMB | $0 + lots of labor |

## 4. Competitors — reverse-engineered

### Loopio
- **Pricing**: Seat-based tier model (Foundations / Enhanced / Enterprise). Not published. Vendr transaction data: $15K–$150K/yr; mid-market $30K–$60K.
- **Workflow**: Centralized content library (called "Library"), AI suggests matches from library, project-based Q&A, SME assignment, portal-based response via 170+ integrations.
- **Acquisition**: Enterprise sales motion. Demo required. 6-week onboarding.
- **Margins**: Likely high gross margin (SaaS), but seat-based pricing + heavy onboarding depresses net revenue per customer.
- **What's expensive to operate**: Sales team, onboarding consultants, 170+ portal integrations to maintain.
- **What can be simplified**: Portal integrations (use paste-from-portal instead); onboarding (self-serve); seat pricing (flat per-org); enterprise reporting.
- **Customer complaints (G2/Capterra/Reddit)**: "User-based pricing penalizes teams that need to loop in many occasional SMEs"; "manual library upkeep is required"; "export functionality and template handling is a problem"; onboarding is slow.

### Responsive (RFPIO)
- **Pricing**: Lite $5K/yr (5 users) up to Enterprise custom. Combines platform fee + per-user add-ons. ~$499/user/month.
- **Workflow**: Content library + AI assistant + auto-answering for security questionnaires. 30 native integrations + 75+ APIs.
- **Customer complaints**: "AI lives off to the side in a chat-based interface"; "browser extension to copy and paste responses one by one" for portals; "UI complexity slows down even experienced daily users"; pricing harder to forecast as teams scale.

### Conveyor
- **Pricing**: Business plan starts at $9,600/yr. Free plan does NOT include questionnaire automation.
- **Workflow**: Questionnaire library + document sharing + portal import for OneTrust/ProcessUnity/ServiceNow/Coupa.
- **Customer complaints**: Other portals require on-screen import + manual copy-paste.

## 5. Pricing landscape

| Tier | Vendor | Annual cost |
|---|---|---|
| Spreadsheet / Word | DIY | $0 + 20–40 hrs labor/questionnaire |
| Cheapest paid | Conveyor free | $0 (but no automation) |
| SMB-focused paid | (no obvious player — this is the wedge) | — |
| Mid-market | Responsive Lite | $5K–$10K |
| Mid-market | Conveyor Business | $9,600 |
| Enterprise | Loopio | $15K–$150K |
| Enterprise | Responsive Enterprise | $30K+ |
| Compliance-bundled | Vanta / Drata | $8K–$25K (bundle) |

**Gap**: nothing credible exists between $0 (spreadsheets) and $5K (Responsive Lite). ReplyForge Starter at $99/mo = $1,188/yr fills exactly this gap.

## 6. Customer complaints — frequency

Aggregated from G2, Capterra, Reddit r/SaaS, r/smallbusiness, r/procurement, Facebook groups for home service businesses (related field-service software reviews for context):

| Complaint category | Loopio | Responsive | Conveyor | Weight |
|---|---|---|---|---|
| Price (too expensive) | High | High | High | ★★★★★ |
| Complexity / steep learning curve | High | High | Med | ★★★★ |
| Seat-based pricing trap | High | High | Low | ★★★★ |
| Slow onboarding / implementation | High | Med | Low | ★★★★ |
| Export quality | Med | Med | Low | ★★★ |
| Portal integration gaps | Med | High | Med | ★★★ |
| Library upkeep burden | High | Med | Low | ★★★ |
| UI feels dated | Med | Med | Low | ★★ |
| Forecasting total cost | High | High | Med | ★★★★ |

Source: G2 reviews (Loopio 4.6/5, Responsive 4.5/5 — high scores but consistent complaints in free-text), Capterra, arphie.ai comparison, autorfp.ai analysis.

## 7. Evidence of demand

- Loopio has 1,700+ customers (per Loopio.com homepage Nov 2026).
- Responsive rebranded from RFPIO in 2023 to expand beyond RFP into broader "information requests" — category is growing.
- SiftHub customer data (2026): "75–90% reduction in questionnaire completion time, saving more than 24 hours" per questionnaire. Customer list includes Rocketlane, Sirion, Allego, Superhuman, Observe Inc.
- Reddit r/procurement thread (2024): "I run sales at an SMB and we've been getting more questionnaires this year, usually filling these out by hand."
- Conveyor, Vanta, Drata, Skyvern, Inventive AI, SiftHub, Tribble, SecurityPal, HyperComply, ComplyJet — 10+ funded entrants since 2022. Category is established, not speculative.
- Shared Assessments SIG, CSA CAIQ v1.1 (AI-extended, June 2026), NIST SP 1326 (July 2026) — questionnaire frameworks are proliferating, increasing demand for response tooling.

## 8. Market size

- Global RFP software market: estimated $1.5–2.5B in 2025, growing 10–15% annually.
- Security questionnaire automation segment: $200–500M, growing faster (~20%+).
- TAM (every B2B SaaS company that sells to enterprise): ~50,000 companies globally with >10 employees and enterprise sales motion; ~5M knowledge workers affected.
- SAM (companies that can't afford Loopio/Responsive but suffer the pain): ~30,000–40,000 globally.
- SOM (realistic 3-year capture): 500–2,000 customers at $99–$299/mo = $6M–$36M ARR.

## 9. Opportunity score (weighted)

Scoring framework applied to top 5 candidates from initial research. 1–10 scale, weights from directive §12.

| Factor | Weight | RFP/Sec Questionnaire (ReplyForge) | Field service SMB (vs ServiceTitan) | Karbon alt for small firms | Marina mgmt | Pest control SMB |
|---|---:|---|---|---|---|---|
| Pain severity | 15% | 9 | 8 | 6 | 7 | 6 |
| Willingness to pay | 15% | 9 | 7 | 5 | 6 | 5 |
| Market size | 10% | 8 | 8 | 6 | 3 | 5 |
| Customer value | 10% | 9 | 7 | 6 | 7 | 6 |
| Competitive weakness | 10% | 8 | 5 | 4 | 7 | 5 |
| Price arbitrage | 10% | 9 | 6 | 5 | 6 | 5 |
| Speed to build | 10% | 8 | 5 | 6 | 6 | 6 |
| Distribution difficulty | 10% | 7 | 6 | 6 | 3 | 6 |
| Retention | 5% | 9 | 8 | 8 | 8 | 7 |
| Gross margin | 5% | 9 | 7 | 8 | 8 | 7 |
| **Weighted score** | | **8.4** | 6.6 | 5.6 | 5.7 | 5.7 |

**Decision: ReplyForge (RFP / Security Questionnaire Response for SMB) wins decisively.**

Key reasons:
- Highest pain severity (deals literally gated by questionnaires)
- Highest willingness to pay (each questionnaire gates $50K–$500K deal)
- Largest price arbitrage (incumbents $10K–$150K vs. ours $99–$799/mo)
- Strong competitive weakness (incumbents explicitly ignore SMB)
- High retention (content library lock-in)

## 10. Why this market

- **Money already exists**: 1,700+ Loopio customers pay $15K–$150K/yr. Demand is proven.
- **Underserved segment**: SMB SaaS is explicitly not Loopio's target. Their pricing makes it impossible for a 20-person company to justify.
- **Workflow is well-defined**: Question in → grounded answer out. Not a research problem; an execution problem.
- **Recurring**: every enterprise deal triggers one. Customers come back monthly.
- **High margin**: SaaS with low COGS (LLM costs ~$0.05–$0.50 per questionnaire; infra ~$0.50–$5/customer/month).

## 11. Why now

- AI drafting is finally good enough (grounded LLMs with source citations) — wasn't viable in 2020.
- Enterprise procurement is requiring more questionnaires, not fewer (CSA CAIQ v1.1, NIST SP 1326 in 2026).
- SMB SaaS is hitting enterprise sales motion in volume — first wave of SOC 2 adopters from 2020–2023 now face recurring questionnaires.
- Stripe billing infrastructure is table stakes; can launch in weeks, not quarters.
- Incumbents are distracted by enterprise AI race (Loopio vs Responsive competing on "AI agents") — they're not defending the SMB segment.

## 12. Why customers switch

- **Price**: $99–$299/mo vs. $10K–$30K+ for incumbents. Same workflow, 1/10 the cost.
- **No seat traps**: flat per-org pricing. Add an SME for free.
- **No contract**: cancel anytime vs. annual lock-in.
- **Self-serve**: 5-minute onboarding vs. 6-week consultant-led implementation.
- **Source citations**: every answer cites its source — auditors love it, reviewers trust it.
- **Better UX**: modern Next.js UI vs. legacy enterprise SaaS.

## 13. Business model

B2B SaaS, flat per-org pricing, monthly or annual. Self-serve signup + optional sales-assist for Pro/Business.

| Plan | Price | Target | Limits |
|---|---|---|---|
| Free | $0 | Solo founder, first questionnaire | 1 seat, 2 projects/mo, 25 Q/project, 25 AI drafts/mo |
| Starter | $99/mo ($990/yr) | 10–80 person SaaS | 3 seats, 15 projects/mo, 200 Q/project, 1,000 AI drafts |
| Pro | $299/mo ($2,990/yr) | 80–300 person SaaS / boutique consultancy | 10 seats, 75 projects/mo, 1,000 Q/project, 10K AI drafts |
| Business | $799/mo ($7,990/yr) | 300–1,000 person company | 50 seats, unlimited everything, SSO, SLA |

## 14. Pricing strategy

- **Anchor against incumbents**: "$10K–$150K for Loopio vs. $1,188 for Starter" — comparison is on the landing page.
- **Flat per-org, not per-seat**: removes the SME inclusion friction competitors create.
- **Annual = 2 months free**: standard SaaS discount, improves cash flow + retention.
- **Free tier as onboarding**: lets a solo founder try with real work; converts when they hit limits.
- **No implementation fee**: critical differentiator vs. Loopio's 6-week onboarding.

## 15. Competitive moat

- **Workflow depth**: parsing (Excel/CSV/DOCX/PDF), grounded drafting with sources, reviewer workflow, source-format export, audit log. Hard to compress into a weekend clone.
- **Content library lock-in**: every approved answer makes the library more valuable; switching means losing institutional knowledge.
- **Distribution wedge**: SEO on "Loopio alternative" / "RFPIO alternative" / "security questionnaire software" — high-intent queries.
- **Customer relationships**: SMB founders talk to each other (Slack communities, Indie Hackers, SaaStr); word-of-mouth compounds.
- **Niche specialization**: vertical-specific questionnaires (HIPAA for healthtech, GDPR for EU, FedRAMP for govcon) — defensibility through depth.

**AI is NOT the moat** (per directive §49). Anyone can call OpenAI. The moat is the workflow + library + distribution.

## 16. Risks

- **Incumbent moves down-market**: Loopio could launch a $199/mo SMB plan. Mitigation: move fast, lock in customers, build vertical depth incumbents won't.
- **AI cost spike**: if LLM prices rise, unit economics compress. Mitigation: model-agnostic architecture (we can swap providers); deterministic fallback for high-confidence matches.
- **Buyer fatigue**: enterprise procurement might standardize on one questionnaire (e.g. SIG-Lite) reducing volume. Mitigation: even SIG-Lite needs to be answered — volume stays high.
- **Stripe account risk**: payment processor suspension could block billing. Mitigation: maintain accounting records, diversify to Lemon Squeezy / Paddle as backup.
- **Customer success at scale**: SMB self-serve means high support load per dollar. Mitigation: invest in in-app onboarding + docs; reserve human support for Pro+ plans.
- **SEO competition**: "Loopio alternative" is contested. Mitigation: long-tail (industry-specific), comparison pages, content marketing.

## 17. Kill criteria

Stop investing if any of these happens:
- < 10 paying customers after 6 months of focused outbound + SEO.
- CAC > 12 months of revenue (payback > 1 year).
- Net revenue retention < 80% (means customers aren't getting value).
- Stripe chargeback rate > 1% (means we're not delivering what we promised).
- A free, credible alternative (e.g. Vanta giving away questionnaire automation to compliance customers) erodes the SMB wedge.

## 18. Go-to-market strategy

**Phase 1 (week 1–4): direct outreach to 200 hand-picked SMB SaaS companies.**
- Source from Crunchbase / Latka list: B2B SaaS, 10–80 employees, recently raised Series A.
- Channel: cold email + LinkedIn. Owner: founder.
- Goal: 10 paying customers, $1,500–$3,000 MRR.

**Phase 2 (month 2–6): content + SEO.**
- Publish "Loopio alternative", "RFPIO alternative", "Conveyor alternative", "security questionnaire software", "RFP response tool" pages.
- Publish 2 deep guides/month: "How to answer the SIG questionnaire", "Top 50 security questionnaire questions (with sample answers)", etc.
- Goal: 50 paying customers, $8K–$15K MRR.

**Phase 3 (month 6–12): partnerships + agencies.**
- Partner with SOC 2 advisors (Vanta partner network), fractional CISOs, compliance consultants who recommend ReplyForge to clients.
- Reseller / white-label for compliance firms.
- Goal: 200 customers, $30K–$60K MRR.

**Phase 4 (year 2+): verticals + enterprise.**
- Vertical packs: HIPAA for healthtech, FedRAMP for govcon, GDPR for EU.
- Enterprise: SSO, custom data residency, dedicated infra.

## 19. Product roadmap

**Shipped (v1.0):**
- Multi-tenant auth (signup, login, email verification, password reset)
- Content library (CRUD, categories, tags, confidence, audit)
- Document upload + text extraction (XLSX, CSV, DOCX, PDF, TXT)
- Questionnaire project workflow (create, parse, AI draft, review, approve, export)
- AI drafting with source citations + confidence scoring
- Excel + CSV export mirroring source format
- Billing (Stripe checkout, webhooks, plan limits, cancel-at-period-end)
- Member invites + role management
- Audit log
- Plan-based entitlement enforcement
- Tenant isolation enforced at data layer

**Next 60 days:**
- Bulk import from existing RFP library (CSV upload to content library)
- Question-answer versioning (track edits over time)
- AI confidence threshold auto-assignment (route low-confidence to specific SME)
- Stripe customer portal link (let customers self-manage payment methods)
- Webhook for Slack notifications on project status changes
- API keys for programmatic access (Pro+)

**Next 6 months:**
- Portal auto-fill (Chrome extension that fills OneTrust / ServiceNow portals)
- Team workloads view (cross-project dashboard for proposal managers)
- Custom answer templates (organization-specific phrasings)
- SOC 2 evidence vault integration (auto-link answers to evidence)
- Multi-language support (Spanish, Portuguese, French for LATAM + EMEA)
- SAML SSO (Business plan)

**Year 2:**
- Vertical packs (HIPAA, FedRAMP, GDPR)
- White-label / reseller
- Custom data residency (EU, US, APAC)

## 20. Revenue scenarios

Using researched pricing ($99/$299/$799/mo) and conservative mix assumptions.

| Scenario | Customers (Starter / Pro / Business) | MRR | ARR | Infra cost | Gross profit | Op cost (3 FTEs) | Net |
|---|---|---|---|---|---|---|---|
| Conservative (10 customers) | 8 / 2 / 0 | $1,390 | $16,680 | $50 | $16,630 | $30,000/mo | -$13,370/mo |
| Base (50 customers) | 35 / 12 / 3 | $8,210 | $98,520 | $250 | $98,270 | $30,000/mo | $68,270/mo |
| Strong (100 customers) | 70 / 25 / 5 | $16,720 | $200,640 | $500 | $200,140 | $30,000/mo | $170,140/mo |
| Aggressive (500 customers) | 350 / 120 / 30 | $83,600 | $1,003,200 | $2,500 | $1,000,700 | $50,000/mo | $950,700/mo |

**Assumptions:**
- Customer mix: 70% Starter, 25% Pro, 5% Business (based on SaaS typical distribution).
- Infra cost: $0.50–$5/customer/month for DB + storage + LLM API (conservative).
- Op cost: 3 FTEs (founder + 2 engineers) at $10K/mo each in Phase 1; 5 FTEs at $50K/mo total in Aggressive.
- Gross margin: ~95–99% (SaaS with low COGS).
- CAC assumed: $200 (cold email + content marketing).
- LTV at 24-month average retention: $99 customer = $2,376 / $299 = $7,176 / $799 = $19,176.
- LTV/CAC: 10:1 (Starter), 35:1 (Pro), 95:1 (Business) — all well above the 3:1 threshold.

**Break-even**: ~30 paying customers at avg $150/mo ARPU = $4,500 MRR = $54K ARR, vs ~$30K/mo op cost. Break-even at ~200 customers.

---

*Research sources: Loopio.com, autorfp.ai, arphie.ai, Vendr transaction data, SiftHub customer data, G2 reviews (4.5–4.6/5 for incumbents with consistent complaints), Capterra, Reddit r/SaaS / r/procurement / r/smallbusiness, Shared Assessments, Cloud Security Alliance, NIST SP 1326 (2026).*
