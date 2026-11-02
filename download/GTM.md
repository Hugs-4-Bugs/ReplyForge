# GO-TO-MARKET — ReplyForge

## ICP (Ideal Customer Profile)

### Primary (Starter plan, $99/mo)
- **Company size**: 10–80 employees
- **Industry**: B2B SaaS, digital agencies, boutique consultancies
- **Geography**: US, UK, Canada, Australia, EU (English-speaking first)
- **Job title of buyer**: Founder, Head of Sales, Head of RevOps, fractional CRO
- **User**: Same as buyer, plus CTO/security lead as occasional SME
- **Pain**: Closes enterprise deals manually; gets security questionnaires by email; founder time is the bottleneck
- **Budget**: $100–$300/mo for SaaS tools is unremarkable; doesn't require board approval
- **Trigger events**: enterprise deal enters procurement; SOC 2 just achieved; competitor evaluation; current spreadsheet process breaks

### Secondary (Pro plan, $299/mo)
- **Company size**: 80–300 employees
- **Industry**: B2B SaaS, IT consultancies, MSPs, accounting/audit firms
- **Job title of buyer**: Head of Sales, Sales Operations, Proposal Manager, fractional CISO
- **User**: Proposal team (2–5 people) + SMEs (5–15)
- **Pain**: 20+ RFPs/quarter; needs assignment + tracking + governance
- **Budget**: $300–$1,000/mo is normal SaaS spend; CFO approves

### Tertiary (Business plan, $799/mo)
- **Company size**: 300–1,000 employees
- **Industry**: Established SaaS, enterprise IT services, regulated industries
- **Job title of buyer**: VP Sales, Director of Proposals, CISO
- **User**: Proposal team (5–20) + multiple SME pools
- **Pain**: Considering Loopio/Responsive but balking at $50K+ contract; need SSO + audit trail
- **Budget**: $800–$3,000/mo requires vendor eval; ~$10K/yr is approval threshold

## Positioning

> **ReplyForge is the security questionnaire + RFP response tool for SMB SaaS companies that can't justify $30K/year for Loopio.**

### One-sentence pitch

> "We draft your security questionnaire answers from your approved content library in minutes, with source citations on every line — for $99/month instead of Loopio's $30,000."

### Value proposition

> You currently spend 20–40 hours per enterprise security questionnaire, pulling answers from Slack threads, last quarter's SOC 2, and a Notion page nobody owns. Every deal slips because the questionnaire sits in someone's inbox for a week. ReplyForge drafts defensible answers from your own approved content in minutes, with confidence scores and source citations, for $99–$799/month. The same workflow Loopio charges $15K–$150K/year for, at 1/30 the price. No seat traps, no annual contract, no 6-week implementation.

## Acquisition channels — ranked

### 1. Cold email (FASTEST — Phase 1)
**Why**: high-intent, direct to ICP, immediately measurable, founder-led
**Tactic**:
- Source list: Crunchbase (B2B SaaS, 10–80 employees, raised Series A in last 18 months)
- Volume: 200 hand-picked contacts in Phase 1
- Sender: founder's email (custom domain, warmed)
- Reply tracking: Mixmax / Apollo
- Cadence: 4-touch over 12 business days

**Sequence** (see SALES.md for full scripts):
- Day 0: Personalized email naming a recent trigger (Series A raise, SOC 2 announcement, enterprise deal)
- Day 3: Follow-up with case study
- Day 7: Follow-up with comparison (Loopio vs ReplyForge)
- Day 12: Breakup email

**Goal**: 5–10% reply rate, 1–2% meeting rate, 10 paying customers in 4 weeks.

### 2. SEO + content (SUSTAINED — Phase 2+)
**Why**: compounding, defensible, low marginal cost per acquisition
**Tactic**:
- **Anchor pages** (publish week 1):
  - `/loopio-alternative` — comparison page targeting "loopio alternative" (~480 searches/mo per Ahrefs)
  - `/rfpio-alternative` — targeting "rfpio alternative" / "responsive alternative"
  - `/conveyor-alternative` — targeting "conveyor alternative"
  - `/security-questionnaire-software` — category page
  - `/rfp-response-software` — category page
- **Long-tail content** (publish 2/month):
  - "How to answer the SIG questionnaire (with sample answers)"
  - "Top 50 security questionnaire questions and how to answer them"
  - "CAIQ v1.1 explained: what changed in 2026"
  - "NIST SP 1326 — what vendors need to know"
  - "Security questionnaire automation: build vs. buy"
  - "How [customer name] cut their questionnaire response time by 80%"
- **Backlinks**: guest posts on compliance blogs (Vanta blog, Drata blog, Secureframe blog — they accept contributor posts), Indie Hackers, SaaStr, HackerNoon

**Goal**: 50 organic visitors/day by month 6, 200+/day by month 12, 5–10% conversion to signup.

### 3. Partnerships + agencies (LEVERAGE — Phase 3+)
**Why**: trust transfer, recurring referrals, no marginal acquisition cost
**Tactic**:
- **Vanta partner network**: Vanta's compliance advisor partners (consultants who help companies get SOC 2) recommend ReplyForge to clients who just got certified and now face questionnaires. Revenue share: 20% recurring.
- **Fractional CISO community**: fractional CISOs often juggle questionnaire responses for multiple clients. White-label ReplyForge for them at 30% discount.
- **Accounting/audit firms**: mid-size firms (BPM, Aprio, EisnerAmper) have advisory practices that could resell ReplyForge to clients.
- **MSPs**: managed service providers responding to client security reviews.

**Goal**: 5 partners referring 5 customers each in month 6 = 25 customers, $5K–$10K MRR.

### 4. Communities (TRUST — ongoing)
**Why**: SMB founders talk to each other; word-of-mouth compounds
**Tactic**:
- Indie Hackers — share build-in-public posts
- SaaStr / Lenny's community / Pavilion — answer questions about RFP response
- Slack communities: SaaS Founders, Sales Operations, RevGenius
- Reddit: r/SaaS, r/smallbusiness, r/RevOps — answer questions, don't spam

**Goal**: 2–5 organic mentions/week by month 6.

### 5. Direct sales (PRO+ plans only — Phase 2+)
**Why**: high-ACV customers (Pro $299/mo, Business $799/mo) justify sales touch
**Tactic**:
- Outbound to companies showing buying signals: posted SOC 2 announcement, hiring "Proposal Manager", job postings mentioning "Loopio/Responsive"
- 30-min demo call → 14-day trial → close
- CRM: HubSpot Free

### Channels NOT prioritized for v1

- **Paid ads** (Google Ads, LinkedIn Ads): CAC too high ($300–$800) vs. cold email + SEO
- **Conference sponsorships**: too expensive for early stage
- **PR**: low ROI at this stage
- **App marketplaces** (Salesforce AppExchange, HubSpot): integration cost not justified at <100 customers
- **G2/Capterra listing**: do in Phase 2 (free listings; paid placement later)

## Acquisition list framework

For Phase 1 cold email, build target list of 200 SMB SaaS companies matching:

**Inclusion criteria:**
- B2B SaaS (not consumer)
- 10–80 employees (LinkedIn company size filter)
- Recent Series A or B (Crunchbase, raised within 18 months)
- US/UK/Canada/Australia/EU HQ
- Has job postings for sales or security roles
- Visible SOC 2 / ISO 27001 mention on website (indicator of enterprise sales motion)

**Exclusion criteria:**
- <10 employees (too small, will churn)
- >300 employees (will need Loopio/Responsive anyway)
- Consumer-only (no questionnaires)
- Direct competitor to ReplyForge

**Per-target research fields** (recorded in CRM):
- Company name + URL
- HQ city
- Employee count (LinkedIn)
- Recent funding event + date
- Likely buyer (CEO, Head of Sales, CTO — guess from team page)
- Likely trigger (funding announcement, SOC 2 blog post, enterprise deal press release)
- Existing solution (guess: "spreadsheets" if no proposal software in their stack)
- Outreach channel (LinkedIn vs. email)
- Personalization hook (specific thing to reference in cold email)

**We do NOT fabricate contact info.** We use LinkedIn Sales Navigator (free trial) + Apollo.io free tier for verified emails. If we can't find a verified email, we LinkedIn DM.

## Sales system

See SALES.md for full scripts. Summary:

- **Cold email sequence** (4 touches over 12 days)
- **LinkedIn DM** (1 touch, complementary to email)
- **Demo call script** (30 min: 5 min discovery, 15 min demo, 10 min pricing/Q&A)
- **Trial-to-paid sequence** (3 emails during 14-day trial)
- **Objection handling** (top 7 objections with responses)
- **Proposal structure** (1-page PDF, simple)
- **Pricing presentation** (transparent, plan comparison, no discounting in v1)
- **Onboarding flow** (5-minute self-serve; optional 30-min call for Pro+)

## Pricing presentation

See PRICING.md. In every sales conversation:
1. Lead with **value** (saved deal, saved hours, saved churn)
2. Anchor against **incumbent** ("Loopio would charge you $30K/yr for this")
3. Present **flat per-org** model explicitly: "No per-seat trap. Add SMEs for free."
4. Offer **annual** as default (2 months free)
5. Confirm **cancel anytime** removes risk

## Onboarding flow

### Self-serve (Free → Starter)
1. User signs up → lands on dashboard (empty state with CTA)
2. Click "New project" → guided wizard: details → upload → review → create
3. First project prompts: "Add a content library entry first" if library empty
4. After first draft approved: "Export to Excel" CTA
5. After 2nd project attempt on Free: "Upgrade to Starter for 15 projects/month"

### Sales-assisted (Pro / Business)
1. Demo call → buyer signs up same day
2. Founder does 30-min onboarding call: imports existing library, uploads SOC 2, walks through first real questionnaire
3. Day 7 check-in: usage review + answer any questions
4. Day 14: trial ends, conversion check

## Follow-up sequence (post-trial, post-close)

**Trial-to-paid** (sent during 14-day trial):
- Day 0: Welcome + getting started video (60s)
- Day 3: "How's your first questionnaire going?"
- Day 7: Case study email (similar customer)
- Day 11: "Trial ends in 3 days — here's how to upgrade"
- Day 14: "Your trial ended" + upgrade CTA

**Post-close** (paid customers):
- Week 1: Onboarding check-in
- Month 1: Usage review + NPS
- Month 3: Account review + upsell to higher plan if usage warrants
- Month 6: Annual renewal conversation
- Month 11: Renewal proposal

## Launch plan — first 100 customers

### Week 1–2: Soft launch
- 10 hand-picked design partners (free Pro for 6 months in exchange for feedback)
- Founder personally onboards each
- Fix top 5 UX issues per partner feedback
- Goal: 10 active users, 30+ questionnaires processed, first 3 case studies collected

### Week 3–6: Cold email launch
- 200 outbound contacts (per acquisition framework above)
- Goal: 10 paying customers ($1,500–$3,000 MRR)
- Publish comparison pages (Loopio alternative, RFPIO alternative, Conveyor alternative)
- Publish first 2 deep guides

### Month 2–3: SEO + community
- Publish 4 more guides (total 6 anchor + long-tail pages)
- Indie Hackers launch post
- Hacker News "Show HN" post
- Goal: 30 paying customers ($5K–$8K MRR)

### Month 4–6: Partnerships
- Sign 3 Vanta partner referrals
- Sign 2 fractional CISO white-label deals
- Goal: 60 paying customers ($10K–$15K MRR)

### Month 7–12: Scale
- Hire customer success (1 FTE)
- Hire SDR (1 FTE) to scale outbound
- Hit 100 customers ($18K–$25K MRR) by month 12

## Goals (12 months)

| Metric | Target |
|---|---|
| Paying customers | 100 |
| MRR | $20K–$25K |
| ARR | $240K–$300K |
| Customer mix | 70 Starter / 25 Pro / 5 Business |
| Monthly churn | < 5% |
| Net revenue retention | > 100% (expansion offsets churn) |
| CAC | $200 blended |
| LTV | $4,400+ blended |
| LTV/CAC | 20:1+ |
| Gross margin | 70%+ |
| Break-even | month 14–16 |

## Risks to GTM (from MARKET-RESEARCH.md §16)

- Incumbent moves down-market with $199 SMB plan → we move fast, build vertical depth
- SEO competition on "Loopio alternative" → long-tail, comparison pages, content velocity
- Customer success overhead at scale → invest in self-serve content; reserve human support for Pro+
- Stripe account suspension → maintain backup processor (Paddle / Lemon Squeezy)
