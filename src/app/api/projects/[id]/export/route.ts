import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireTenantResource } from "@/lib/tenant";
import * as XLSX from "xlsx";

// GET /api/projects/[id]/export?format=xlsx|csv
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const guard = await requireTenantResource(s.tenantId, id, "project");
  if (!guard.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") ?? "xlsx";

  const project = await db.project.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { externalId: "asc" },
        include: { answer: true },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = project.questions.map((q, i) => ({
    "ID": q.externalId ?? String(i + 1),
    "Category": q.category ?? "",
    "Question": q.text,
    "Answer": q.answer?.final ?? q.answer?.draft ?? "",
    "Confidence": q.answer ? q.answer.confidence.toFixed(2) : "",
    "Status": q.answer?.status ?? "undrafted",
    "Sources": q.answer ? formatSources(q.answer.sources) : "",
  }));

  const safeName = project.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();

  if (format === "csv") {
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.csv"`,
      },
    });
  }

  // Default: xlsx
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 8 }, { wch: 18 }, { wch: 60 }, { wch: 80 }, { wch: 10 }, { wch: 14 }, { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeName}.xlsx"`,
    },
  });
}

function formatSources(json: string): string {
  try {
    const arr = JSON.parse(json) as any[];
    return arr.map((s, i) => `[${i + 1}] ${s.label ?? "source"}`).join("; ");
  } catch {
    return "";
  }
}

function toCsv(rows: Record<string, any>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}
