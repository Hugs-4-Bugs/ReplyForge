import { NextRequest, NextResponse } from "next/server";
import { parseQuestionnaire } from "@/lib/parsing";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await parseQuestionnaire({
    filename: file.name,
    mime: file.type,
    bytes,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ questions: result.questions });
}
