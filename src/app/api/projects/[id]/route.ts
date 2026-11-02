import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource, TenantError } from "@/lib/tenant";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "project");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await db.project.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { externalId: "asc" },
        include: { answer: true },
      },
    },
  });
  return NextResponse.json({ project });
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "in_progress", "in_review", "submitted", "archived"]).optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "project");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if (parsed.data.dueDate !== undefined) {
    data.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
  }
  const updated = await db.project.update({ where: { id }, data });
  return NextResponse.json({ project: updated });
}
