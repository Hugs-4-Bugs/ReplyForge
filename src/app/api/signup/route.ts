import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { hashPassword, randomToken } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const SignupSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(200),
  name: z.string().min(1).max(120),
  orgName: z.string().min(1).max(120),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { email, password, name, orgName } = parsed.data;
  const emailLower = email.toLowerCase().trim();

  // Wrap DB operations in try/catch so the user sees a helpful error instead
  // of a generic "Sign up failed" when the DB is unreachable.
  let existing;
  try {
    existing = await db.user.findUnique({ where: { email: emailLower } });
  } catch (dbErr: any) {
    console.error("[signup] DB error on findUnique:", dbErr);
    return NextResponse.json(
      {
        error:
          "Database connection error. Check that DATABASE_URL is set to a valid Postgres connection string in your Vercel env vars.",
        detail: String(dbErr?.message ?? dbErr).slice(0, 200),
      },
      { status: 500 },
    );
  }
  if (existing) {
    // Don't leak existence - return generic message.
    return NextResponse.json(
      { error: "An account with this email already exists. Try logging in." },
      { status: 409 },
    );
  }

  // Create org slug from name
  const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "org";
  let slug = baseSlug;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = randomToken(16);
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let result;
  try {
    result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailLower,
          name,
          passwordHash,
          emailVerified: null, // verified on click
        },
      });
      // Verification token is a standalone table (no FK to User) so we can
      // issue tokens for emails that may not yet have a User row.
      await tx.verificationToken.create({
        data: { token: verifyToken, expires: verifyExpires, identifier: emailLower },
      });
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          ownerId: user.id,
          memberships: {
            create: { userId: user.id, role: "owner" },
          },
          subscription: {
            create: { plan: "free", status: "active" },
          },
        },
        include: { subscription: true },
      });
      return { user, org };
    });
  } catch (txErr: any) {
    console.error("[signup] transaction error:", txErr);
    return NextResponse.json(
      {
        error:
          "Could not create your account. The database may not be connected. Check DATABASE_URL in your Vercel env vars (must be a Postgres connection string, not a SQLite file path).",
        detail: String(txErr?.message ?? txErr).slice(0, 300),
      },
      { status: 500 },
    );
  }

  // Send verification email (or log it in dev mode)
  const verifyUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/api/verify-email?token=${verifyToken}`;
  await sendEmail({
    to: emailLower,
    subject: "Verify your ReplyForge account",
    text: `Welcome to ReplyForge.\n\nClick this link to verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>Welcome to ReplyForge.</p><p><a href="${verifyUrl}">Click here to verify your email</a></p><p>This link expires in 24 hours.</p>`,
  });

  await audit({
    organizationId: result.org.id,
    userId: result.user.id,
    action: "user.signup",
    targetType: "user",
    targetId: result.user.id,
    metadata: { email: emailLower },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true, organizationId: result.org.id });
}
