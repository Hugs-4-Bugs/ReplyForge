import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { DocumentsClient } from "@/components/documents-client";

export default async function DocumentsPage() {
  const { org } = await requireTenant();
  const docs = await db.document.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });
  const serialized = docs.map((d) => ({
    id: d.id,
    filename: d.filename,
    mime: d.mime,
    sizeBytes: d.sizeBytes,
    summary: d.summary,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }));
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reference documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload your SOC 2 report, security policies, whitepapers, or any document the AI should pull from when drafting.
        </p>
      </div>
      <DocumentsClient docs={serialized} />
    </div>
  );
}
