// File parsing - extract questions from uploaded questionnaires.
// Supports .xlsx, .xls, .csv, .docx, .pdf, .txt. Returns a normalized list
// of {externalId, text, category?} records.

import * as XLSX from "xlsx";
import mammoth from "mammoth";
// pdf-parse is imported dynamically because its top-level code requires a
// real file path on disk; we want to lazy-load it.

export type ParsedQuestion = {
  externalId?: string;
  text: string;
  category?: string;
};

export type ParseResult =
  | { ok: true; questions: ParsedQuestion[] }
  | { ok: false; error: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function parseQuestionnaire(opts: {
  filename: string;
  mime: string;
  bytes: Buffer;
}): Promise<ParseResult> {
  if (opts.bytes.length > MAX_FILE_BYTES) {
    return { ok: false, error: "File exceeds 10 MB limit." };
  }
  const lower = opts.filename.toLowerCase();
  try {
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
      return { ok: true, questions: parseSpreadsheet(opts.bytes, lower.endsWith(".csv")) };
    }
    if (lower.endsWith(".docx")) {
      return { ok: true, questions: await parseDocx(opts.bytes) };
    }
    if (lower.endsWith(".pdf")) {
      return { ok: true, questions: await parsePdf(opts.bytes) };
    }
    if (lower.endsWith(".txt")) {
      return { ok: true, questions: parseText(opts.bytes.toString("utf8")) };
    }
    return { ok: false, error: `Unsupported file type: ${opts.filename}` };
  } catch (err: any) {
    return { ok: false, error: `Parse error: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}

function parseSpreadsheet(bytes: Buffer, isCsv: boolean): ParsedQuestion[] {
  const wb = XLSX.read(bytes, { type: "buffer", raw: isCsv });
  const out: ParsedQuestion[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });
    if (rows.length === 0) continue;
    // Heuristic: find the header row that contains a "question" column.
    let qCol = -1, idCol = -1, catCol = -1;
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      const header = rows[r].map((c: any) => String(c ?? "").toLowerCase());
      qCol = header.findIndex((h: string) =>
        /question|item|requirement|control|criteria/.test(h),
      );
      idCol = header.findIndex((h: string) =>
        /^(id|#|ref|reference|q.?no|question.?no|item.?no)$/.test(h),
      );
      catCol = header.findIndex((h: string) =>
        /categor|section|domain|topic|area/.test(h),
      );
      if (qCol !== -1) break;
    }
    if (qCol === -1) {
      // No header found: treat column A as id, column B as question.
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = String(row[1] ?? row[0] ?? "").trim();
        if (text) out.push({ externalId: String(row[0] ?? i + 1), text });
      }
      continue;
    }
    const startRow = qCol !== -1 ? 1 : 0;
    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      const text = String(row[qCol] ?? "").trim();
      if (!text) continue;
      out.push({
        externalId: idCol >= 0 ? String(row[idCol] ?? "") || undefined : String(i),
        text,
        category: catCol >= 0 ? String(row[catCol] ?? "") || undefined : undefined,
      });
    }
  }
  return dedupe(out);
}

async function parseDocx(bytes: Buffer): Promise<ParsedQuestion[]> {
  const result = await mammoth.extractRawText({ buffer: bytes });
  return parseText(result.value);
}

async function parsePdf(bytes: Buffer): Promise<ParsedQuestion[]> {
  // Lazy-load to avoid loading pdf-parse when not needed (it can crash on
  // certain test PDFs in sandboxed environments).
  const mod: any = await import("pdf-parse");
  const pdfParse = mod.default ?? mod;
  const data = await pdfParse(bytes);
  return parseText(data.text);
}

// Generic text parser: split on common questionnaire patterns.
// 1. Numbered list: "1. ...", "1) ...", "1.2.3. ..."
// 2. Q-prefixed: "Q1: ...", "Question 1: ..."
// 3. Fallback: split on blank lines (each paragraph is a question)
function parseText(text: string): ParsedQuestion[] {
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
  if (!cleaned) return [];

  // Pattern 1: explicit numbering "1.", "1)", "1.2.3."
  const numbered = cleaned.match(
    /(?:^|\n)\s*((?:\d+\.)+\d+|\d+)[.)]\s+([^\n]+(?:\n(?!(?:\d+\.)+\d+|\d+[.)])\s+\S[^\n]*)*)/g,
  );
  if (numbered && numbered.length >= 2) {
    return dedupe(
      numbered.map((block) => {
        const m = block.match(/^\s*((?:\d+\.)+\d+|\d+)[.)]\s+([\s\S]+)$/);
        if (!m) return { text: block.trim() };
        return { externalId: m[1], text: m[2].trim() };
      }),
    );
  }

  // Pattern 2: Q1, Q2, Question 1, etc.
  const qPrefixed = cleaned.match(/(?:^|\n)\s*(Q(?:uestion)?\s*\d+)[:.)]?\s+([^\n]+)/gi);
  if (qPrefixed && qPrefixed.length >= 2) {
    return dedupe(
      qPrefixed.map((block) => {
        const m = block.match(/^\s*(Q(?:uestion)?\s*\d+)[:.)]?\s+([\s\S]+)$/i);
        if (!m) return { text: block.trim() };
        return { externalId: m[1], text: m[2].trim() };
      }),
    );
  }

  // Fallback: paragraphs separated by blank lines
  const paragraphs = cleaned.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return dedupe(paragraphs.map((p, i) => ({ externalId: String(i + 1), text: p })));
}

function dedupe(qs: ParsedQuestion[]): ParsedQuestion[] {
  const seen = new Set<string>();
  const out: ParsedQuestion[] = [];
  for (const q of qs) {
    const key = q.text.toLowerCase().slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

// Extract plain text from a reference document (for AI retrieval).
export async function extractDocumentText(opts: {
  filename: string;
  mime: string;
  bytes: Buffer;
}): Promise<ParseResult & { text?: string }> {
  const lower = opts.filename.toLowerCase();
  try {
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
      const wb = XLSX.read(opts.bytes, { type: "buffer" });
      const parts: string[] = [];
      for (const sn of wb.SheetNames) {
        const sheet = wb.Sheets[sn];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
        for (const r of rows) parts.push(r.map((c) => String(c ?? "")).join(" | "));
      }
      return { ok: true, questions: [], text: parts.join("\n") };
    }
    if (lower.endsWith(".docx")) {
      const r = await mammoth.extractRawText({ buffer: opts.bytes });
      return { ok: true, questions: [], text: r.value };
    }
    if (lower.endsWith(".pdf")) {
      const mod: any = await import("pdf-parse");
      const pdfParse = mod.default ?? mod;
      const d = await pdfParse(opts.bytes);
      return { ok: true, questions: [], text: d.text };
    }
    if (lower.endsWith(".txt") || opts.mime.startsWith("text/")) {
      return { ok: true, questions: [], text: opts.bytes.toString("utf8") };
    }
    return { ok: false, error: `Unsupported file type: ${opts.filename}` };
  } catch (err: any) {
    return { ok: false, error: `Extract error: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}
