// Stripe integration. When STRIPE_SECRET_KEY is set, billing is REAL.
// When it's not, we run in DEV MODE: subscriptions are auto-activated on
// plan selection (no charge), so the rest of the workflow stays testable.
// This file never pretends to charge - it's explicit about which mode it's in.

import Stripe from "stripe";
import { db } from "@/lib/db";
import { PLANS, getPlan, isUpgrade, type PlanId } from "@/lib/plans";

export const stripeMode: "live" | "dev" =
  process.env.STRIPE_SECRET_KEY ? "live" : "dev";

export const stripe: Stripe | null = stripeMode === "live"
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any })
  : null;

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: true; devMode: true; message: string }
  | { ok: false; error: string };

// Start a checkout session for an upgrade. In dev mode, just flip the plan.
export async function startCheckout(opts: {
  orgId: string;
  plan: PlanId;
  interval: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const plan = getPlan(opts.plan);
  if (plan.id === "free") {
    return { ok: false, error: "Cannot check out the Free plan." };
  }
  if (stripeMode === "dev") {
    await db.subscription.upsert({
      where: { organizationId: opts.orgId },
      create: {
        organizationId: opts.orgId,
        plan: plan.id,
        status: "active",
        currentPeriodEnd: addMonths(new Date(), opts.interval === "yearly" ? 12 : 1),
      },
      update: {
        plan: plan.id,
        status: "active",
        currentPeriodEnd: addMonths(new Date(), opts.interval === "yearly" ? 12 : 1),
      },
    });
    return {
      ok: true,
      devMode: true,
      message: `DEV MODE: activated ${plan.name} (${opts.interval}) without charging. Set STRIPE_SECRET_KEY to go live.`,
    };
  }
  const priceId =
    opts.interval === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
  if (!priceId) {
    return { ok: false, error: `No Stripe price configured for ${plan.name} (${opts.interval}). Set STRIPE_PRICE_${plan.id.toUpperCase()}_${opts.interval.toUpperCase()}.` };
  }
  // Ensure a customer exists
  let sub = await db.subscription.findUnique({ where: { organizationId: opts.orgId } });
  let customerId = sub?.stripeCustomerId;
  const org = await db.organization.findUnique({ where: { id: opts.orgId } });
  if (!customerId && org) {
    const customer = await stripe!.customers.create({
      metadata: { organizationId: org.id, orgName: org.name },
      name: org.name,
    });
    customerId = customer.id;
  }
  const session = await stripe!.checkout.sessions.create({
    mode: "subscription",
    customer: customerId ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { organizationId: opts.orgId, plan: plan.id, interval: opts.interval },
  });
  return { ok: true, url: session.url! };
}

// Cancel at period end. In dev mode, just flip to free.
export async function cancelAtPeriodEnd(orgId: string): Promise<{ ok: boolean; error?: string }> {
  const sub = await db.subscription.findUnique({ where: { organizationId: orgId } });
  if (!sub) return { ok: false, error: "No subscription found." };
  if (stripeMode === "dev") {
    await db.subscription.update({
      where: { organizationId: orgId },
      data: { plan: "free", status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: null },
    });
    return { ok: true };
  }
  if (!sub.stripeSubscriptionId) return { ok: false, error: "No Stripe subscription id." };
  await stripe!.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  await db.subscription.update({
    where: { organizationId: orgId },
    data: { cancelAtPeriodEnd: true },
  });
  return { ok: true };
}

// Stripe webhook handler - must be idempotent. Called from /api/stripe/webhook.
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  // Idempotency: we use the Stripe event id as a unique key by storing it in
  // the audit log and checking for prior processing.
  const existing = await db.auditLog.findFirst({
    where: { action: "stripe.webhook", targetId: event.id },
  });
  if (existing) return; // already processed

  switch (event.type) {
    case "checkout.session.completed": {
      const sess = event.data.object as Stripe.Checkout.Session;
      const orgId = sess.metadata?.organizationId;
      const plan = sess.metadata?.plan as PlanId | undefined;
      if (!orgId || !plan) break;
      await db.subscription.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          plan,
          status: "active",
          stripeCustomerId: sess.customer as string,
          stripeSubscriptionId: sess.subscription as string,
        },
        update: {
          plan,
          status: "active",
          stripeCustomerId: sess.customer as string,
          stripeSubscriptionId: sess.subscription as string,
          cancelAtPeriodEnd: false,
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;
      const priceId = sub.items.data[0]?.price?.id;
      const plan = planFromPriceId(priceId) ?? (sub.metadata?.plan as PlanId | undefined) ?? "free";
      // Stripe SDK v23 removed `current_period_end` from the typed interface,
      // but the API still returns it. Access via cast.
      const raw = sub as unknown as { current_period_end?: number };
      const periodEnd = raw.current_period_end
        ? new Date(raw.current_period_end * 1000)
        : null;
      await db.subscription.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          plan,
          status: sub.status,
          stripeCustomerId: sub.customer as string,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          plan,
          status: sub.status,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata?.organizationId;
      if (!orgId) break;
      await db.subscription.update({
        where: { organizationId: orgId },
        data: { plan: "free", status: "canceled", cancelAtPeriodEnd: false },
      });
      break;
    }
    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const inv = event.data.object as Stripe.Invoice;
      const orgId = inv.metadata?.organizationId ?? (inv.customer as string | undefined);
      // Best-effort: find the org by customer id
      let resolvedOrgId = orgId;
      if (!resolvedOrgId && inv.customer) {
        const sub = await db.subscription.findUnique({
          where: { stripeCustomerId: inv.customer as string },
        });
        resolvedOrgId = sub?.organizationId;
      }
      if (!resolvedOrgId) break;
      await db.invoice.upsert({
        where: { stripeInvoiceId: inv.id },
        create: {
          organizationId: resolvedOrgId,
          stripeInvoiceId: inv.id,
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          currency: inv.currency,
          status: inv.status ?? "open",
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
          invoicePdf: inv.invoice_pdf ?? null,
          periodStart: new Date((inv.period_start ?? 0) * 1000),
          periodEnd: new Date((inv.period_end ?? 0) * 1000),
        },
        update: {
          amountDue: inv.amount_due,
          amountPaid: inv.amount_paid,
          status: inv.status ?? "open",
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
          invoicePdf: inv.invoice_pdf ?? null,
        },
      });
      break;
    }
    default:
      // We don't need to handle every event type for v1.
      break;
  }

  // Record idempotency marker
  await db.auditLog.create({
    data: {
      organizationId: "000000000000000000000000", // sentinel; see AuditLog model
      action: "stripe.webhook",
      targetId: event.id,
      targetType: "subscription",
      metadata: JSON.stringify({ type: event.type }),
    },
  });
}

function planFromPriceId(priceId?: string): PlanId | null {
  if (!priceId) return null;
  for (const id of Object.keys(PLANS) as PlanId[]) {
    const p = PLANS[id];
    if (p.stripePriceIdMonthly === priceId || p.stripePriceIdYearly === priceId) return id;
  }
  return null;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

// True if the org's current plan is at-or-above `required`.
export async function hasPlan(orgId: string, required: PlanId): Promise<boolean> {
  const sub = await db.subscription.findUnique({ where: { organizationId: orgId } });
  const current = sub?.plan ?? "free";
  return isUpgrade(required, current) ? false : true;
}
