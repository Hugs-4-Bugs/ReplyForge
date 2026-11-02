import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource } from "@/lib/tenant";
import { draftAnswer, retrieveRelevant, retrieveSnippets, type DraftResult } from "@/lib/ai";
import { getPlan } from "@/lib/plans";
import { audit } from "@/lib/audit";
import { z } from "zod";

const BodySchema = z.object({
  questionIds: z.array(z.string()).optional(), // undefined = draft all undrafted
});

// POST /api/projects/[id]/draft
// Body: { questionIds?: string[] }
// Returns: { results: { questionId, ok, draft?, confidence?, sources?, error? }[] }
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: projectId } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, projectId, "project");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Plan check: AI draft limits
  const sub = await db.subscription.findUnique({ where: { organizationId: s.tenantId } });
  const plan = getPlan(sub?.plan ?? "free");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const draftsThisMonth = await db.answer.count({
    where: {
      organizationId: s.tenantId,
      generatedAt: { gte: monthStart },
    },
  });

  // Load project + questions (+answers)
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      questions: {
        include: { answer: true },
        orderBy: { externalId: "asc" },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Pick the questions to draft: explicit list, else all without an answer
  const targets = parsed.data.questionIds
    ? project.questions.filter((q) => parsed.data.questionIds!.includes(q.id))
    : project.questions.filter((q) => !q.answer);

  if (targets.length === 0) {
    return NextResponse.json({ results: [], message: "Nothing to draft." });
  }

  // Check remaining AI quota
  const remaining = plan.limits.aiDraftsPerMonth - draftsThisMonth;
  if (remaining <= 0) {
    return NextResponse.json(
      { error: `Plan limit reached: ${plan.limits.aiDraftsPerMonth} AI drafts/month on ${plan.name}.` },
      { status: 402 },
    );
  }
  const toDraft = targets.slice(0, remaining);
  if (toDraft.length < targets.length) {
    // partial — note it in the response
  }

  // Load content library + documents once
  const [content, documents] = await Promise.all([
    db.contentEntry.findMany({
      where: { organizationId: s.tenantId, status: "approved" },
      select: { id: true, question: true, answer: true, category: true, tags: true },
    }),
    db.document.findMany({
      where: { organizationId: s.tenantId, status: "ready" },
      select: { id: true, filename: true, textContent: true },
    }),
  ]);

  const org = await db.organization.findUnique({ where: { id: s.tenantId } });
  const companyContext = org ? `Company name: ${org.name}.` : undefined;

  const results: Array<{
    questionId: string;
    ok: boolean;
    draft?: string;
    confidence?: number;
    sources?: any[];
    fallback?: boolean;
    error?: string;
  }> = [];

  // Draft each question. We do them sequentially to keep AI load predictable.
  for (const q of toDraft) {
    try {
      const relevantContent = retrieveRelevant(q.text, content, 5);
      const relevantSnippets = retrieveSnippets(q.text, documents, 3);
      const draft: DraftResult = await draftAnswer({
        question: q.text,
        category: q.category ?? undefined,
        relevantContent,
        relevantSnippets,
        companyContext,
      });

      // Upsert the answer
      const existing = q.answer;
      const sourcesJson = JSON.stringify(draft.sources);
      if (existing) {
        await db.answer.update({
          where: { questionId: q.id },
          data: {
            draft: draft.draft,
            final: draft.draft, // mirror draft into final for editing
            confidence: draft.confidence,
            status: draft.confidence >= 0.7 ? "needs_review" : "flagged",
            sources: sourcesJson,
            aiModel: draft.model,
            generatedAt: new Date(),
            organizationId: s.tenantId,
          },
        });
      } else {
        await db.answer.create({
          data: {
            questionId: q.id,
            organizationId: s.tenantId,
            draft: draft.draft,
            final: draft.draft,
            confidence: draft.confidence,
            status: draft.confidence >= 0.7 ? "needs_review" : "flagged",
            sources: sourcesJson,
            aiModel: draft.model,
            generatedAt: new Date(),
          },
        });
      }

      results.push({
        questionId: q.id,
        ok: true,
        draft: draft.draft,
        confidence: draft.confidence,
        sources: draft.sources,
        fallback: draft.fallback,
      });
    } catch (err: any) {
      results.push({
        questionId: q.id,
        ok: false,
        error: String(err?.message ?? err).slice(0, 200),
      });
    }
  }

  await audit({
    organizationId: s.tenantId,
    userId: s.id,
    action: "answer.draft",
    targetType: "project",
    targetId: projectId,
    metadata: { count: results.filter((r) => r.ok).length },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({
    results,
    drafted: results.filter((r) => r.ok).length,
    skipped: targets.length - toDraft.length,
    skippedReason:
      targets.length - toDraft.length > 0
        ? `Monthly AI draft limit (${plan.limits.aiDraftsPerMonth}) reached on ${plan.name}.`
        : undefined,
  });
}
