// Plan definitions + entitlement logic. Pricing is wired to Stripe price IDs
// via env vars; when those are absent, the plans still function in "dev mode"
// (everything allowed, billing simulated) - see src/lib/stripe.ts.

export type PlanId = "free" | "starter" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // USD
  priceYearly: number; // USD, per-year total (effectively 2 months free)
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  limits: {
    seats: number;
    projectsPerMonth: number;
    questionsPerProject: number;
    contentEntries: number;
    documents: number;
    aiDraftsPerMonth: number;
  };
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "For a solo founder answering their first questionnaires",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      seats: 1,
      projectsPerMonth: 2,
      questionsPerProject: 25,
      contentEntries: 25,
      documents: 3,
      aiDraftsPerMonth: 25,
    },
    features: [
      "1 user",
      "2 questionnaire projects / month",
      "Up to 25 questions per project",
      "25 content library entries",
      "3 reference documents",
      "AI-assisted first drafts (25 / month)",
      "Excel + CSV import/export",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "For small SaaS teams closing enterprise deals",
    priceMonthly: 99,
    priceYearly: 990,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    limits: {
      seats: 3,
      projectsPerMonth: 15,
      questionsPerProject: 200,
      contentEntries: 500,
      documents: 25,
      aiDraftsPerMonth: 1000,
    },
    features: [
      "Up to 3 seats",
      "15 questionnaire projects / month",
      "Up to 200 questions per project",
      "500 content library entries",
      "25 reference documents",
      "1,000 AI drafts / month",
      "Excel + CSV + DOCX + PDF import",
      "Source citations on every draft",
      "Audit log",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For agencies & consultancies responding to RFPs at scale",
    priceMonthly: 299,
    priceYearly: 2990,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    limits: {
      seats: 10,
      projectsPerMonth: 75,
      questionsPerProject: 1000,
      contentEntries: 5000,
      documents: 100,
      aiDraftsPerMonth: 10000,
    },
    features: [
      "Up to 10 seats",
      "75 questionnaire projects / month",
      "Up to 1,000 questions per project",
      "5,000 content library entries",
      "100 reference documents",
      "10,000 AI drafts / month",
      "All import formats + portal-paste",
      "Reviewer assignments + statuses",
      "Audit log + API access",
      "Priority email support",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "For proposal teams that need unlimited throughput",
    priceMonthly: 799,
    priceYearly: 7990,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY,
    limits: {
      seats: 50,
      projectsPerMonth: 999999,
      questionsPerProject: 999999,
      contentEntries: 999999,
      documents: 999999,
      aiDraftsPerMonth: 999999,
    },
    features: [
      "Up to 50 seats",
      "Unlimited projects & questions",
      "Unlimited content library",
      "Unlimited documents",
      "Unlimited AI drafts",
      "SSO (SAML) on request",
      "Custom data residency on request",
      "Dedicated onboarding",
      "99.9% SLA",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

export function getPlan(id: string): Plan {
  return PLANS[id as PlanId] ?? PLANS.free;
}

export function planRank(id: string): number {
  return PLAN_ORDER.indexOf((id as PlanId) ?? "free");
}

// True if `from` plan is strictly lower than `to` plan.
export function isUpgrade(from: string, to: string): boolean {
  return planRank(to) > planRank(from);
}

// Usage counter - read from DB. Used by entitlement enforcement.
export async function getUsage(orgId: string) {
  const [seats, projectsThisMonth, contentCount, docCount] = await Promise.all([
    db.membership.count({ where: { organizationId: orgId } }),
    db.project.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfMonth() },
      },
    }),
    db.contentEntry.count({
      where: { organizationId: orgId, status: { not: "archived" } },
    }),
    db.document.count({ where: { organizationId: orgId } }),
  ]);
  return { seats, projectsThisMonth, contentCount, docCount };
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Returns true if the org is within its plan limits for the given action.
export async function canDo(
  orgId: string,
  planId: string,
  action: "createProject" | "addContent" | "addDocument" | "addSeat",
): Promise<{ ok: boolean; reason?: string }> {
  const plan = getPlan(planId);
  const usage = await getUsage(orgId);
  switch (action) {
    case "createProject":
      if (usage.projectsThisMonth >= plan.limits.projectsPerMonth) {
        return {
          ok: false,
          reason: `Plan limit reached: ${plan.limits.projectsPerMonth} projects / month on ${plan.name}.`,
        };
      }
      return { ok: true };
    case "addContent":
      if (usage.contentCount >= plan.limits.contentEntries) {
        return {
          ok: false,
          reason: `Plan limit reached: ${plan.limits.contentEntries} content entries on ${plan.name}.`,
        };
      }
      return { ok: true };
    case "addDocument":
      if (usage.docCount >= plan.limits.documents) {
        return {
          ok: false,
          reason: `Plan limit reached: ${plan.limits.documents} documents on ${plan.name}.`,
        };
      }
      return { ok: true };
    case "addSeat":
      if (usage.seats >= plan.limits.seats) {
        return {
          ok: false,
          reason: `Plan limit reached: ${plan.limits.seats} seats on ${plan.name}.`,
        };
      }
      return { ok: true };
  }
}

// We import db lazily to avoid circular imports in some build setups.
import { db } from "@/lib/db";
