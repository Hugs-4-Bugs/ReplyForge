import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource } from "@/lib/tenant";
import { audit } from "@/lib/audit";

const PatchSchema = z.object({
  question: z.string().min(1).max(2000).optional(),
  answer: z.string().min(1).max(20000).optional(),
  category: z.string().max(200).nullish(),
  tags: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: z.enum(["draft", "approved", "archived"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "contentEntry");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const entry = await db.contentEntry.update({
    where: { id },
    data: parsed.data,
    include: { author: { select: { name: true, email: true } } },
  });
  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "library.update", targetType: "content", targetId: id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ entry: serialize(entry) });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "contentEntry");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Soft delete by marking archived
  await db.contentEntry.update({ where: { id }, data: { status: "archived" } });
  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "library.delete", targetType: "content", targetId: id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ ok: true });
}

function serialize(e: any) {
  return {
    id: e.id,
    question: e.question,
    answer: e.answer,
    category: e.category,
    tags: e.tags,
    status: e.status,
    confidence: e.confidence,
    authorName: e.author?.name ?? e.author?.email ?? "-",
    updatedAt: e.updatedAt.toISOString(),
  };
}
