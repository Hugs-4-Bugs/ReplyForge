import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invites/[token] — preview invite (who invited you, what role)
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const invite = await db.invite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  return NextResponse.json({
    email: invite.email,
    role: invite.role,
    organizationName: invite.organization.name,
    expiresAt: invite.expiresAt.toISOString(),
  });
}

// POST /api/invites/[token] — accept the invite
// Body: { name?, password } — creates account if user doesn't exist, else links.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const invite = await db.invite.findUnique({
    where: { token },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  if (invite.acceptedAt) return NextResponse.json({ error: "Invite already used" }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invite expired" }, { status: 410 });

  const body = await req.json().catch(() => ({}));
  const email = invite.email;
  let user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Require password + name to create
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: "Password (min 8 chars) required" }, { status: 400 });
    }
    const { hashPassword } = await import("@/lib/auth");
    const passwordHash = await hashPassword(body.password);
    user = await db.user.create({
      data: {
        email,
        name: body.name || email.split("@")[0],
        passwordHash,
        emailVerified: new Date(),
      },
    });
  }

  // Create membership
  await db.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: invite.organization.id } },
    create: { userId: user.id, organizationId: invite.organization.id, role: invite.role },
    update: { role: invite.role },
  });
  await db.invite.update({ where: { token }, data: { acceptedAt: new Date() } });
  await audit({
    organizationId: invite.organization.id, userId: user.id,
    action: "member.join", targetType: "membership", targetId: user.id,
    metadata: { email },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true, organizationId: invite.organization.id });
}
