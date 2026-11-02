import Link from "next/link";
import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus } from "lucide-react";

export default async function ProjectsPage() {
  const { user, org } = await requireTenant();
  const projects = await db.project.findMany({
    where: { organizationId: org.id, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { questions: true } },
      questions: {
        where: { answer: { status: "approved" } },
        select: { id: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Every questionnaire or RFP you're working on.</p>
        </div>
        <Link href="/app/projects/new">
          <Button><Plus className="mr-1 h-4 w-4" /> New project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="font-medium">No projects yet</h3>
              <p className="text-sm text-muted-foreground">Upload your first questionnaire to get started.</p>
            </div>
            <Link href="/app/projects/new">
              <Button><Plus className="mr-1 h-4 w-4" /> New project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const total = p._count.questions;
            const approved = p.questions.length;
            const pct = total === 0 ? 0 : Math.round((approved / total) * 100);
            return (
              <Link key={p.id} href={`/app/projects/${p.id}`}>
                <Card className="h-full hover:border-primary hover:shadow-sm transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant={p.status === "submitted" ? "default" : "secondary"}>
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.client ?? "—"} · {p.type.replace(/_/g, " ")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{approved} / {total} approved</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    {p.dueDate && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Due: {new Date(p.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
