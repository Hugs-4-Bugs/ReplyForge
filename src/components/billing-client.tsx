"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  currentPlanId: PlanId;
  usage: { seats: number; projectsThisMonth: number; contentCount: number; docCount: number };
  cancelAtPeriodEnd: boolean;
  invoices: Array<{
    id: string;
    amountDue: number;
    amountPaid: number;
    currency: string;
    status: string;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
    periodStart: string;
    periodEnd: string;
  }>;
};

export function BillingClient({ currentPlanId, usage, cancelAtPeriodEnd, invoices }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | "cancel" | null>(null);

  async function choosePlan(planId: PlanId, interval: "monthly" | "yearly") {
    if (planId === currentPlanId) return;
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        return;
      }
      if (data.devMode) {
        toast.success(data.message);
        setTimeout(() => window.location.reload(), 1200);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingPlan(null);
    }
  }

  async function cancel() {
    if (!confirm("Cancel subscription? You'll drop to the Free plan at period end.")) return;
    setLoadingPlan("cancel");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Cancel failed"); return; }
      toast.success("Subscription canceled");
      setTimeout(() => window.location.reload(), 1000);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Plan grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id];
          const isCurrent = id === currentPlanId;
          const isDowngrade = PLAN_ORDER.indexOf(id) < PLAN_ORDER.indexOf(currentPlanId);
          const highlight = id === "pro";
          return (
            <Card
              key={id}
              className={cn(
                "relative flex flex-col",
                highlight && "border-primary shadow-md",
                isCurrent && "ring-2 ring-primary",
              )}
            >
              <CardHeader className="pb-2">
                {isCurrent && <Badge className="absolute -top-2 right-4">Current</Badge>}
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.tagline}</CardDescription>
                <div className="mt-2">
                  <span className="text-2xl font-bold">${p.priceMonthly}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 text-xs text-muted-foreground">
                <ul className="space-y-1">
                  {p.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex gap-1">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      variant={highlight ? "default" : "outline"}
                      onClick={() => choosePlan(id, "monthly")}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                      {isDowngrade ? "Downgrade" : "Upgrade"} · ${p.priceMonthly}/mo
                    </Button>
                    <Button
                      className="w-full"
                      variant="ghost"
                      size="sm"
                      onClick={() => choosePlan(id, "yearly")}
                      disabled={loadingPlan !== null}
                    >
                      ${p.priceYearly}/yr (2 months free)
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current usage</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Usage label="Seats" value={usage.seats} limit={PLANS[currentPlanId].limits.seats} />
          <Usage label="Projects this month" value={usage.projectsThisMonth} limit={PLANS[currentPlanId].limits.projectsPerMonth} />
          <Usage label="Library entries" value={usage.contentCount} limit={PLANS[currentPlanId].limits.contentEntries} />
          <Usage label="Documents" value={usage.docCount} limit={PLANS[currentPlanId].limits.documents} />
        </CardContent>
      </Card>

      {/* Cancel */}
      {currentPlanId !== "free" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancel subscription</CardTitle>
            <CardDescription>
              {cancelAtPeriodEnd
                ? "Your subscription is already scheduled to cancel at period end."
                : "Cancel at period end. Your data stays accessible on the Free plan."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={cancel} disabled={loadingPlan === "cancel" || cancelAtPeriodEnd}>
              {loadingPlan === "cancel" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {cancelAtPeriodEnd ? "Already scheduled" : "Cancel at period end"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">
                      {new Date(inv.periodStart).toLocaleDateString()} - {new Date(inv.periodEnd).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(inv.amountPaid / 100).toFixed(2)} {inv.currency.toUpperCase()} · {inv.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {inv.hostedInvoiceUrl && (
                      <a href={inv.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">View</Button>
                      </a>
                    )}
                    {inv.invoicePdf && (
                      <a href={inv.invoicePdf} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="ghost">PDF</Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Usage({ label, value, limit }: { label: string; value: number; limit: number }) {
  const pct = limit === 999999 ? 0 : Math.min(100, (value / limit) * 100);
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">
        {value}<span className="text-sm font-normal text-muted-foreground"> / {limit === 999999 ? "∞" : limit}</span>
      </div>
      {pct > 0 && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
          <div className={cn("h-full", pct > 80 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
