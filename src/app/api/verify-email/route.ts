import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  const rec = await db.verificationToken.findUnique({ where: { token } });
  if (!rec) return NextResponse.redirect(new URL("/login?verified=invalid", req.url));
  if (rec.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/login?verified=expired", req.url));
  }
  await db.$transaction([
    db.user.update({
      where: { email: rec.identifier },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.delete({ where: { token } }),
  ]);
  return NextResponse.redirect(new URL("/login?verified=ok", req.url));
}
