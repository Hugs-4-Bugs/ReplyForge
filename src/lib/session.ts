import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Organization, Membership } from "@prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  tenantId?: string;
  tenantRole?: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return null;
  return {
    id: s.user.id,
    email: s.user.email,
    name: s.user.name,
    tenantId: s.tenantId,
    tenantRole: s.tenantRole,
  };
}

// Returns the current user, redirecting to /login if unauthenticated.
export async function requireUser(): Promise<SessionUser> {
  const u = await getSession();
  if (!u) redirect("/login");
  return u;
}

// Returns the current user's active organization, redirecting to /onboarding
// if they have none (e.g. just signed up but haven't created an org yet).
export async function requireTenant(): Promise<{
  user: SessionUser;
  org: Organization;
  role: string;
}> {
  const user = await requireUser();
  if (!user.tenantId) redirect("/onboarding");
  const org = await db.organization.findUnique({
    where: { id: user.tenantId },
  });
  if (!org) redirect("/onboarding");
  return { user, org, role: user.tenantRole ?? "member" };
}

// Returns the active membership row for the current user. Use this when you
// need to verify the role against the DB rather than the JWT cache.
export async function getActiveMembership(
  userId: string,
  orgId: string,
): Promise<Membership | null> {
  return db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
  });
}

// Switch the active tenant in the JWT. Returns true on success.
export async function switchTenant(
  userId: string,
  orgId: string,
): Promise<boolean> {
  const m = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
  });
  if (!m) return false;
  // The actual JWT mutation happens in a route handler that calls
  // `signIn` with `updateSession`. This helper just validates the membership.
  return true;
}

// Role helpers
export function canManageBilling(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}
export function canManageMembers(role: string | undefined): boolean {
  return role === "owner" || role === "admin";
}
export function canEditContent(role: string | undefined): boolean {
  return role === "owner" || role === "admin" || role === "member";
}
