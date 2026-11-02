import Link from "next/link";
import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Library, FileText, Zap, Plus, ArrowRight, Clock, CheckCircle2 } from "lucide-react";
import { getPlan, getUsage } from "@/lib/plans";

export default async function DashboardPage() {
  const { user, org } = await requireTenant();

  const [recentProjects, sub, usage, recentActivity] = await Promise.all([
    db.project.findMany({
      where: { organizationId: org.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { questions: true } } },
    }),
    db.subscription.findUnique({ where: { organizationId: org.id } }),
    getUsage(org.id),
    db.auditLog.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const plan = getPlan(sub?.plan ?? "free");

  const stats = [
    { label: "Active projects", value: usage.projectsThisMonth, icon: FolderKanban, limit: plan.limits.projectsPerMonth },
    { label: "Library entries", value: usage.contentCount, icon: Library, limit: plan.limits.contentEntries },
    { label: "Documents", value: usage.docCount, icon: FileText, limit: plan.limits.documents },
    { label: "Seats", value: usage.seats, icon: Zap, limit: plan.limits.seats },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user.name ?? "there"}.</h1>
          <p className="text-muted-foreground">
            You're on the <strong>{plan.name}</strong> plan. {plan.id === "free" && "Upgrade to lift limits and unlock DOCX/PDF import."}
          </p>
        </div>
        <Link href="/app/projects/new">
          <Button><Plus className="mr-1 h-4 w-4" /> New project</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => {
          const pct = s.limit === 999999 ? 0 : Math.min(100, Math.round((s.value / s.limit) * 100));
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{s.label}</CardDescription>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-2xl">
                  {s.value}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    / {s.limit === 999999 ? "∞" : s.limit}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pct > 0 && (
                  <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                    <div
                      className={`h-full ${pct > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Recent projects */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent projects</span>
              <Link href="/app/projects" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <FolderKanban className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No projects yet. Start your first questionnaire.</p>
                <Link href="/app/projects/new" className="mt-3 inline-block">
                  <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" /> New project</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/projects/${p.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/30"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p._count.questions} questions · {p.client ?? "—"} · {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.status === "submitted" ? "default" : "secondary"}>{p.status.replace(/_/g, " ")}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-xs">{actionLabel(a.action)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {a.user?.name ?? a.user?.email ?? "System"} · {timeAgo(a.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "user.signup": "Account created",
    "project.create": "Created a project",
    "project.archive": "Archived a project",
    "answer.approve": "Approved an answer",
    "answer.draft": "Drafted an answer",
    "billing.upgrade": "Upgraded plan",
    "billing.cancel": "Canceled subscription",
    "library.create": "Added library entry",
    "library.update": "Updated library entry",
    "library.delete": "Deleted library entry",
    "document.upload": "Uploaded a document",
    "member.invite": "Invited a member",
  };
  return map[action] ?? action;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
