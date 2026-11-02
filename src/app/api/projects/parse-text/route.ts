import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseQuestionnaire } from "@/lib/parsing";

const Schema = z.object({ text: z.string().min(1).max(100_000) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const result = await parseQuestionnaire({
    filename: "pasted.txt",
    mime: "text/plain",
    bytes: Buffer.from(parsed.data.text, "utf8"),
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ questions: result.questions });
}
