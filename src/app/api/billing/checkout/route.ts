import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, canManageBilling } from "@/lib/session";
import { startCheckout } from "@/lib/stripe";
import { audit } from "@/lib/audit";
import type { PlanId } from "@/lib/plans";

const BodySchema = z.object({
  plan: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify role
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: s.tenantId } },
  });
  if (!membership || !canManageBilling(membership.role)) {
    return NextResponse.json({ error: "Only owners/admins can manage billing" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
  const result = await startCheckout({
    orgId: s.tenantId,
    plan: parsed.data.plan as PlanId,
    interval: parsed.data.interval,
    successUrl: `${origin}/app/billing?upgraded=1`,
    cancelUrl: `${origin}/app/billing?canceled=1`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "billing.upgrade",
    targetType: "subscription",
    metadata: { plan: parsed.data.plan, interval: parsed.data.interval, devMode: "devMode" in result ? result.devMode : false },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  if ("devMode" in result) {
    return NextResponse.json({ ok: true, devMode: true, message: result.message });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
