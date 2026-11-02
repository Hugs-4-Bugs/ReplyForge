import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, canManageMembers } from "@/lib/session";
import { audit } from "@/lib/audit";

const PatchSchema = z.object({ role: z.enum(["member", "admin"]) });
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: s.tenantId } },
  });
  if (!m || !canManageMembers(m.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const target = await db.membership.findUnique({ where: { id } });
  if (!target || target.organizationId !== s.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot change owner role" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  await db.membership.update({ where: { id }, data: { role: parsed.data.role } });
  await audit({
    organizationId: s.tenantId, userId: s.id, action: "member.role_change",
    targetType: "membership", targetId: id, metadata: { role: parsed.data.role },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: s.tenantId } },
  });
  if (!m || !canManageMembers(m.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const target = await db.membership.findUnique({ where: { id } });
  if (!target || target.organizationId !== s.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
  }
  await db.membership.delete({ where: { id } });
  await audit({
    organizationId: s.tenantId, userId: s.id, action: "member.remove",
    targetType: "membership", targetId: id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ ok: true });
}
