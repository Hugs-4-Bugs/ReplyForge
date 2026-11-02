import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { LibraryClient } from "@/components/library-client";

export default async function LibraryPage() {
  const { org } = await requireTenant();
  const entries = await db.contentEntry.findMany({
    where: { organizationId: org.id, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });

  const serialized = entries.map((e) => ({
    id: e.id,
    question: e.question,
    answer: e.answer,
    category: e.category,
    tags: e.tags,
    status: e.status,
    confidence: e.confidence,
    authorName: e.author?.name ?? e.author?.email ?? "-",
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Content library</h1>
        <p className="text-sm text-muted-foreground">
          Approved Q&A pairs the AI drafts from. The richer your library, the better your drafts.
        </p>
      </div>
      <LibraryClient entries={serialized} />
    </div>
  );
}
