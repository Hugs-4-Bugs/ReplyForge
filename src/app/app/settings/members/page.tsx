import { requireTenant, canManageMembers } from "@/lib/session";
import { db } from "@/lib/db";
import { MembersClient } from "@/components/members-client";

export default async function MembersPage() {
  const { org, user, role } = await requireTenant();
  const [members, invites] = await Promise.all([
    db.membership.findMany({
      where: { organizationId: org.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invite.findMany({
      where: { organizationId: org.id, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          People with access to your organization. You can invite up to your plan's seat limit.
        </p>
      </div>
      <MembersClient
        canManage={canManageMembers(role)}
        currentUserId={user.id}
        members={members.map((m) => ({
          id: m.id,
          userId: m.user.id,
          name: m.user.name ?? m.user.email,
          email: m.user.email,
          role: m.role,
          createdAt: m.createdAt.toISOString(),
        }))}
        invites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
