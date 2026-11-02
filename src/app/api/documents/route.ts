import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canDo } from "@/lib/plans";
import { extractDocumentText } from "@/lib/parsing";
import { audit } from "@/lib/audit";

const MAX_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const docs = await db.document.findMany({
    where: { organizationId: s.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await db.subscription.findUnique({ where: { organizationId: s.tenantId } });
  const planId = sub?.plan ?? "free";
  const allowed = await canDo(s.tenantId, planId, "addDocument");
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.reason }, { status: 402 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await extractDocumentText({ filename: file.name, mime: file.type, bytes });
  if (!result.ok || !result.text) {
    return NextResponse.json({ error: result.error ?? "Could not extract text" }, { status: 400 });
  }

  // Truncate to keep DB rows reasonable (SQLite + 10MB docs would explode the file)
  const text = result.text.slice(0, 200_000);
  const summary = text.slice(0, 280) + (text.length > 280 ? "…" : "");

  const doc = await db.document.create({
    data: {
      organizationId: s.tenantId,
      filename: file.name,
      mime: file.type || "application/octet-stream",
      sizeBytes: file.size,
      textContent: text,
      summary,
      status: "ready",
    },
  });

  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "document.upload", targetType: "document", targetId: doc.id,
    metadata: { filename: file.name, size: file.size },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({
    document: {
      id: doc.id,
      filename: doc.filename,
      mime: doc.mime,
      sizeBytes: doc.sizeBytes,
      summary: doc.summary,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
    },
  });
}
