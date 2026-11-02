import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, canManageBilling } from "@/lib/session";
import { cancelAtPeriodEnd } from "@/lib/stripe";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: s.tenantId } },
  });
  if (!membership || !canManageBilling(membership.role)) {
    return NextResponse.json({ error: "Only owners/admins can cancel" }, { status: 403 });
  }
  const result = await cancelAtPeriodEnd(s.tenantId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "billing.cancel", targetType: "subscription",
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
