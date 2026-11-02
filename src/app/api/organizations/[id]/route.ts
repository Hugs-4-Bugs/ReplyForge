import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canManageBilling } from "@/lib/session";
import { audit } from "@/lib/audit";

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (id !== s.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: id } },
  });
  if (!m || !canManageBilling(m.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const updated = await db.organization.update({ where: { id }, data: parsed.data });
  await audit({
    organizationId: id, userId: s.id, action: "org.update",
    targetType: "organization", targetId: id, metadata: parsed.data,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ organization: updated });
}
