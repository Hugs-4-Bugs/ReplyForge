import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource, TenantError } from "@/lib/tenant";
import { audit } from "@/lib/audit";
import { z } from "zod";

const PatchSchema = z.object({
  final: z.string().optional(),
  status: z.enum(["draft", "needs_review", "approved", "flagged"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; answerId: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId, answerId } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, projectId, "project");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify the answer belongs to this project + tenant
  const answer = await db.answer.findUnique({
    where: { id: answerId },
    include: { question: { select: { projectId: true } } },
  });
  if (!answer || answer.question.projectId !== projectId || answer.organizationId !== s.tenantId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (parsed.data.status === "approved" && !answer.approvedAt) {
    data.approvedAt = new Date();
  }

  const updated = await db.answer.update({ where: { id: answerId }, data });

  if (parsed.data.status === "approved") {
    await audit({
      organizationId: s.tenantId,
      userId: s.id,
      action: "answer.approve",
      targetType: "answer",
      targetId: answerId,
      metadata: { projectId },
      ip: req.headers.get("x-forwarded-for") ?? undefined,
    });
  }

  return NextResponse.json({ answer: updated });
}
