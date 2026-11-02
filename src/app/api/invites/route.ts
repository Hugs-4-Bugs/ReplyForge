import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, canManageMembers } from "@/lib/session";
import { canDo } from "@/lib/plans";
import { sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";
import { randomToken } from "@/lib/auth";

const InviteSchema = z.object({
  email: z.string().email().max(120),
  role: z.enum(["member", "admin"]).default("member"),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId: s.id, organizationId: s.tenantId } },
  });
  if (!m || !canManageMembers(m.role)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Seat-limit check
  const sub = await db.subscription.findUnique({ where: { organizationId: s.tenantId } });
  const allowed = await canDo(s.tenantId, sub?.plan ?? "free", "addSeat");
  if (!allowed.ok) {
    return NextResponse.json({ error: allowed.reason }, { status: 402 });
  }

  // Don't re-invite if already a member
  const existing = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { memberships: { where: { organizationId: s.tenantId } } },
  });
  if (existing && existing.memberships.length > 0) {
    return NextResponse.json({ error: "That user is already a member." }, { status: 400 });
  }

  // Don't duplicate pending invite
  const existingInvite = await db.invite.findFirst({
    where: {
      organizationId: s.tenantId,
      email: parsed.data.email.toLowerCase(),
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "An invite is already pending for this email." }, { status: 400 });
  }

  const token = randomToken(16);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const org = await db.organization.findUnique({ where: { id: s.tenantId } });

  await db.invite.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      organizationId: s.tenantId,
      role: parsed.data.role,
      token,
      invitedBy: s.id,
      expiresAt,
    },
  });

  const acceptUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/accept-invite?token=${token}`;
  await sendEmail({
    to: parsed.data.email.toLowerCase(),
    subject: `${org?.name ?? "Someone"} invited you to ReplyForge`,
    text: `You've been invited to join ${org?.name ?? "a team"} on ReplyForge.\n\nClick this link to accept:\n${acceptUrl}\n\nThis link expires in 7 days.`,
    html: `<p>You've been invited to join <strong>${org?.name ?? "a team"}</strong> on ReplyForge.</p><p><a href="${acceptUrl}">Click here to accept</a></p><p>This link expires in 7 days.</p>`,
  });

  await audit({
    organizationId: s.tenantId, userId: s.id,
    action: "member.invite", targetType: "invite",
    metadata: { email: parsed.data.email, role: parsed.data.role },
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true, devMode: process.env.SMTP_HOST ? false : true });
}
