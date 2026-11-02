import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canDo } from "@/lib/plans";
import { audit } from "@/lib/audit";
import type { ParsedQuestion } from "@/lib/parsing";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  client: z.string().nullish(),
  type: z.enum(["security_questionnaire", "rfp", "rfi", "ddq"]).default("security_questionnaire"),
  dueDate: z.string().nullish(),
  questions: z.array(
    z.object({
      externalId: z.string().optional(),
      text: z.string().min(1),
      category: z.string().optional(),
    }),
  ).default([]),
});

export async function GET() {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await db.project.findMany({
    where: { organizationId: s.tenantId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, name: true, client: true, type: true, status: true, dueDate: true,
      createdAt: true, updatedAt: true,
      _count: { select: { questions: true } },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  // Entitlement check
  const allowed = await canDo(s.tenantId, "free", "createProject"); // plan resolved inside canDo via DB
  const sub = await db.subscription.findUnique({ where: { organizationId: s.tenantId } });
  const planId = sub?.plan ?? "free";
  const allowedReal = await canDo(s.tenantId, planId, "createProject");
  if (!allowedReal.ok) {
    return NextResponse.json({ error: allowedReal.reason ?? "Plan limit reached" }, { status: 402 });
  }

  const data = parsed.data;
  const project = await db.project.create({
    data: {
      organizationId: s.tenantId,
      name: data.name,
      client: data.client ?? null,
      type: data.type,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdById: s.id,
      status: "in_progress",
      questions: {
        create: data.questions.map((q: ParsedQuestion) => ({
          externalId: q.externalId ?? null,
          text: q.text,
          category: q.category ?? null,
        })),
      },
    },
    include: { _count: { select: { questions: true } } },
  });

  await audit({
    organizationId: s.tenantId,
    userId: s.id,
    action: "project.create",
    targetType: "project",
    targetId: project.id,
    metadata: { name: project.name, questionCount: project._count.questions },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ id: project.id });
}
