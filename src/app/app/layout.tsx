import { redirect } from "next/navigation";
import Link from "next/link";
import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { AppUserMenu } from "@/components/app-user-menu";
import { Sparkles } from "lucide-react";
import { getPlan } from "@/lib/plans";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org, role } = await requireTenant();

  // Pull counts for the sidebar badges + current plan
  const [projectCount, libraryCount, docCount] = await Promise.all([
    db.project.count({ where: { organizationId: org.id, status: { not: "archived" } } }),
    db.contentEntry.count({ where: { organizationId: org.id, status: "approved" } }),
    db.document.count({ where: { organizationId: org.id } }),
  ]);
  const sub = await db.subscription.findUnique({ where: { organizationId: org.id } });
  const plan = getPlan(sub?.plan ?? "free");

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar
        orgName={org.name}
        planName={plan.name}
        role={role}
        counts={{ projects: projectCount, library: libraryCount, documents: docCount }}
      />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
            </div>
            <span className="font-semibold">{org.name}</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <Link
              href="/app/billing"
              className="hidden rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground md:inline-block"
            >
              {plan.name} plan
            </Link>
            <AppUserMenu user={user} org={org} role={role} />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
