import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource } from "@/lib/tenant";
import { audit } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "document");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.document.delete({ where: { id } });
  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "document.delete", targetType: "document", targetId: id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
