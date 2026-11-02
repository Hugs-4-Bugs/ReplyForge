import { requireTenant, canManageBilling } from "@/lib/session";
import { db } from "@/lib/db";
import { PLANS, PLAN_ORDER, getPlan, getUsage } from "@/lib/plans";
import { stripeMode } from "@/lib/stripe";
import { BillingClient } from "@/components/billing-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function BillingPage() {
  const { user, org, role } = await requireTenant();
  if (!canManageBilling(role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="text-sm text-muted-foreground">Ask an owner or admin to manage billing.</p>
      </div>
    );
  }

  const [sub, usage, invoices] = await Promise.all([
    db.subscription.findUnique({ where: { organizationId: org.id } }),
    getUsage(org.id),
    db.invoice.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const currentPlanId = (sub?.plan ?? "free") as keyof typeof PLANS;
  const currentPlan = getPlan(currentPlanId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          You're on the <strong>{currentPlan.name}</strong> plan.
          {sub?.cancelAtPeriodEnd && " Cancellation scheduled for period end."}
          {sub?.currentPeriodEnd && !sub.cancelAtPeriodEnd && ` Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}.`}
        </p>
      </div>

      {stripeMode === "dev" && (
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dev mode - billing is not charging</AlertTitle>
          <AlertDescription>
            <code className="bg-amber-100 px-1 rounded">STRIPE_SECRET_KEY</code> is not set, so
            plan switches are applied instantly without charging. Set Stripe env vars and the
            matching price IDs (e.g. <code className="bg-amber-100 px-1 rounded">STRIPE_PRICE_STARTER_MONTHLY</code>)
            to go live.
          </AlertDescription>
        </Alert>
      )}

      <BillingClient
        currentPlanId={currentPlanId}
        usage={usage}
        cancelAtPeriodEnd={sub?.cancelAtPeriodEnd ?? false}
        invoices={invoices.map((i) => ({
          id: i.id,
          amountDue: i.amountDue,
          amountPaid: i.amountPaid,
          currency: i.currency,
          status: i.status,
          hostedInvoiceUrl: i.hostedInvoiceUrl,
          invoicePdf: i.invoicePdf,
          periodStart: i.periodStart.toISOString(),
          periodEnd: i.periodEnd.toISOString(),
        }))}
      />
    </div>
  );
}
