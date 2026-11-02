# PRICING — ReplyForge

## Strategy

**Flat per-org pricing, no per-seat traps.** This is the core differentiator vs. Loopio ($15K–$150K/yr, seat-based) and Responsive ($499/user/month). We charge for the workflow, not for the humans doing it.

## Plans

| Plan | Monthly | Annual (per year, paid up front) | Effective monthly (annual) | Savings |
|---|---|---|---|---|
| Free | $0 | $0 | $0 | — |
| Starter | $99 | $990 | $82.50 | 17% off |
| Pro | $299 | $2,990 | $249.17 | 17% off |
| Business | $799 | $7,990 | $665.83 | 17% off |

(Annual = 2 months free, standard SaaS convention.)

## Plan limits

| Limit | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Seats | 1 | 3 | 10 | 50 |
| Projects per month | 2 | 15 | 75 | Unlimited |
| Questions per project | 25 | 200 | 1,000 | Unlimited |
| Content library entries | 25 | 500 | 5,000 | Unlimited |
| Reference documents | 3 | 25 | 100 | Unlimited |
| AI drafts per month | 25 | 1,000 | 10,000 | Unlimited |
| Import formats | Excel, CSV, TXT | + DOCX, PDF | All | All |
| Source citations | ✓ | ✓ | ✓ | ✓ |
| Audit log | — | ✓ | ✓ | ✓ |
| Reviewer assignments | — | — | ✓ | ✓ |
| API access | — | — | ✓ | ✓ |
| SSO (SAML) | — | — | — | ✓ |
| Custom data residency | — | — | — | On request |
| SLA | — | — | Best-effort | 99.9% |
| Support | Community | Email | Priority email | Dedicated CSM |

## Why these prices

### Anchored against incumbents

| Vendor | Annual cost (typical) | Our equivalent | Our discount |
|---|---|---|---|
| Loopio (mid-market) | $30,000–$60,000 | Pro $2,990/yr | 90–95% cheaper |
| Loopio (enterprise) | $50,000–$150,000 | Business $7,990/yr | 84–95% cheaper |
| Responsive (RFPIO) | $10,000+ | Starter $990/yr | 90%+ cheaper |
| Conveyor | $9,600 | Starter $990/yr | 90% cheaper |
| Manual (founder time) | $2,000+ labor/questionnaire | Starter $99/mo | Pays for itself in 1 questionnaire |

### Aligned to value

- **Free**: lets solo founder try with real work. Converts when they hit limits.
- **Starter ($99/mo)**: 10–80 person SaaS, 5–20 questionnaires/quarter. One saved deal = $50K+; one saved founder-hour = $100+. Pays for itself in 1 hour.
- **Pro ($299/mo)**: 80–300 person SaaS, 20+ RFPs/quarter. Replaces a $60K/yr proposal coordinator or saves 20+ hours/week of senior time.
- **Business ($799/mo)**: 300+ person company, 50+ RFPs/quarter. Replaces $50K+ Loopio contract with 1/6 the cost.

### Why not per-seat

Incumbents use per-seat pricing because it lets them extract more from larger teams. But the customer HATES it: every SME they invite is a marginal cost decision, which means SMEs don't get invited, which means answers are worse. Flat per-org with seat caps aligns our incentive (get the customer successful) with theirs (invite everyone who should be involved).

### Why not usage-based

Pure usage-based pricing (per AI draft, per question) creates bill anxiety — customers don't know what their monthly cost will be. We use plan-tier limits with overage blocked (not charged) — predictable, defensible, no surprises.

## Unit economics

### Per-customer cost

| Cost component | Free | Starter | Pro | Business |
|---|---|---|---|---|
| Stripe fee (2.9% + $0.30) | $0 | $3.17 | $8.98 | $23.47 |
| LLM API (~$0.05/draft, peak usage) | $1.25 | $50 | $500 | $1,500 (capped) |
| DB + storage (Neon free tier → ~$0.50/cust at scale) | $0.50 | $0.50 | $1.00 | $2.00 |
| Email (Resend free tier → ~$0.01/cust) | $0.01 | $0.02 | $0.05 | $0.10 |
| **Total variable cost / customer / month** | $1.76 | $53.69 | $510.03 | $1,525.57 |
| Revenue / customer / month | $0 | $99 | $299 | $799 |
| **Gross margin** | N/A | 46% | -70% | -91% |

Wait — the Pro/Business LLM costs above assume **peak usage** (every single AI draft allowance consumed). In reality, customers use 10–30% of their allowance. Recompute with realistic usage:

| Plan | Realistic AI usage (% of cap) | Realistic LLM cost/mo | Realistic total cost/mo | Realistic gross margin |
|---|---|---|---|---|
| Free | 50% | $0.63 | $1.13 | N/A (free) |
| Starter | 30% | $15 | $18.17 | 82% |
| Pro | 25% | $125 | $134.03 | 55% |
| Business | 20% | $300 | $325.57 | 59% |

These are healthy SaaS gross margins. Pro and Business margins improve as we add cheaper model fallbacks (Haiku-tier for high-confidence matches).

### CAC assumptions

| Channel | CAC | Notes |
|---|---|---|
| Cold email (founder-led) | $50–$100 | Founder time @ $100/hr, 2 hours per acquired customer |
| SEO (content) | $200–$500 | Amortized writing cost |
| Partner referral | $0–$50 (revenue share 20%) | Compliance advisors referring clients |
| Paid ads | $300–$800 | Avoid for v1 — too expensive vs. alternatives |

**Blended CAC target: $200.**

### LTV assumptions

- Average customer lifetime: 24 months (conservative; SaaS average is 36+)
- Monthly churn: 4% (1/24)
- Plan mix: 70% Starter, 25% Pro, 5% Business
- Blended ARPU: $99 × 0.7 + $299 × 0.25 + $799 × 0.05 = $69.30 + $74.75 + $39.95 = **$184/mo**

### LTV/CAC

- LTV (Starter) = $99 × 24 × 0.82 (gross margin) = $1,945. CAC $200 → **LTV/CAC = 9.7:1**
- LTV (Pro) = $299 × 24 × 0.55 = $3,946. CAC $200 → **LTV/CAC = 19.7:1**
- LTV (Business) = $799 × 24 × 0.59 = $11,318. CAC $200 → **LTV/CAC = 56.6:1**

All well above the 3:1 minimum. Unit economics are very healthy.

### Payback period

- Starter: $200 CAC / $99 net revenue = ~2.5 months (excellent)
- Pro: $200 / $299 = <1 month
- Business: $200 / $799 = <1 month

## Revenue scenarios

| Scenario | Customers (Starter/Pro/Biz) | MRR | ARR | Infra + LLM cost | Gross profit | Op cost (3 FTE @ $30K/mo) | Net monthly |
|---|---|---|---|---|---|---|---|
| Conservative | 8 / 2 / 0 | $1,390 | $16,680 | $200 | $1,190 | $30,000 | -$28,810 |
| Base | 35 / 12 / 3 | $8,210 | $98,520 | $1,000 | $7,210 | $30,000 | -$22,790 |
| Strong | 70 / 25 / 5 | $16,720 | $200,640 | $2,000 | $14,720 | $30,000 | -$15,280 |
| Aggressive | 350 / 120 / 30 | $83,600 | $1,003,200 | $10,000 | $73,600 | $50,000 | $23,600 |

**Break-even**: ~200 paying customers at $184 blended ARPU = ~$37K MRR, vs $30K/mo op cost = ~200 customers.

(Conservative scenario is unprofitable because 3-FTE op cost is fixed; a solo founder could be break-even at 30 customers.)

## Pricing presentation on landing page

The pricing section on `/` presents:
1. All 4 plans side by side
2. "Most popular" badge on Pro
3. Monthly + annual toggle (annual = 2 months free)
4. Feature list per plan (top 5 visible, full list in plan details)
5. CTA per plan ("Start free" / "Start Starter" / etc.)
6. Honest note about dev mode if Stripe not configured

## Comparison table

The landing page includes a factual comparison table vs. Loopio, Responsive, Conveyor with:
- Starting price
- Pricing model (flat vs. seat-based)
- Per-seat trap
- Implementation time
- AI first drafts
- Source citations
- Import formats
- Export mirrors source
- Audit log
- Minimum contract
- Public pricing page

All facts sourced from public vendor pricing pages + G2/Capterra review patterns (cited in MARKET-RESEARCH.md §4-5).

## Discount policy

- **Annual**: 2 months free (built into pricing)
- **Nonprofit**: 50% off all paid plans (request via email)
- **Startup (< 2 years old, < $1M ARR)**: 50% off first year (request via email)
- **Annual prepay discount**: already 17%; no additional negotiation
- **Custom enterprise**: contact for volume discount above 100 seats

## Refund policy

- 14-day money-back guarantee on first paid month
- No refunds on annual prepay after 30 days (pro-rated)
- Cancellation at period end preserves access until period end

## What we will NOT do

- **No opaque "contact sales" pricing** for plans below Business
- **No implementation fees** (critical differentiator vs. Loopio)
- **No per-seat pricing** (the entire point of the product)
- **No usage overage charges** (predictable pricing only — block, don't bill)
- **No contract lock-in** for Free/Starter/Pro (cancel anytime)
- **No "free trial" of paid plans** (Free plan IS the trial; you can do real work on it)
