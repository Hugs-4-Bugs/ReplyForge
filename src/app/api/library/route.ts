import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canDo } from "@/lib/plans";
import { audit } from "@/lib/audit";

const CreateSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(20000),
  category: z.string().max(200).nullish(),
  tags: z.string().max(500).default(""),
  confidence: z.number().min(0).max(1).default(1.0),
});

export async function GET() {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await db.contentEntry.findMany({
    where: { organizationId: s.tenantId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  const sub = await db.subscription.findUnique({ where: { organizationId: s.tenantId } });
  const planId = sub?.plan ?? "free";
  const allowed = await canDo(s.tenantId, planId, "addContent");
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.reason }, { status: 402 });
  }
  const entry = await db.contentEntry.create({
    data: {
      organizationId: s.tenantId,
      authorId: s.id,
      question: parsed.data.question,
      answer: parsed.data.answer,
      category: parsed.data.category ?? null,
      tags: parsed.data.tags,
      confidence: parsed.data.confidence,
      status: "approved",
    },
    include: { author: { select: { name: true, email: true } } },
  });
  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "library.create", targetType: "content", targetId: entry.id,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });
  return NextResponse.json({ entry: serialize(entry) });
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
