import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { org } = await requireTenant();
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id, organizationId: org.id },
    include: {
      questions: {
        orderBy: { externalId: "asc" },
        include: { answer: true },
      },
    },
  });
  if (!project) notFound();

  // Pre-compute summary stats
  const total = project.questions.length;
  const approved = project.questions.filter((q) => q.answer?.status === "approved").length;
  const flagged = project.questions.filter((q) => q.answer?.status === "flagged").length;
  const drafted = project.questions.filter((q) => q.answer).length;

  // Serialize for client
  const serialized = {
    id: project.id,
    name: project.name,
    client: project.client,
    type: project.type,
    status: project.status,
    dueDate: project.dueDate?.toISOString() ?? null,
    notes: project.notes,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    stats: { total, approved, flagged, drafted },
    questions: project.questions.map((q) => ({
      id: q.id,
      externalId: q.externalId,
      text: q.text,
      category: q.category,
      answer: q.answer
        ? {
            id: q.answer.id,
            draft: q.answer.draft,
            final: q.answer.final,
            confidence: q.answer.confidence,
            status: q.answer.status,
            sources: q.answer.sources,
            aiModel: q.answer.aiModel,
            fallback: q.answer.aiModel?.startsWith("fallback:") ?? false,
            assigneeId: q.answer.assigneeId,
            approvedAt: q.answer.approvedAt?.toISOString() ?? null,
            updatedAt: q.answer.updatedAt.toISOString(),
          }
        : null,
    })),
  };

  return <ProjectWorkspace project={serialized} />;
}
