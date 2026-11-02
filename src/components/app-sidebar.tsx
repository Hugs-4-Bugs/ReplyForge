"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Library,
  FileText,
  FolderKanban,
  Settings,
  CreditCard,
  Sparkles,
  Users,
  Plus,
} from "lucide-react";

type Counts = { projects: number; library: number; documents: number };

export function AppSidebar({
  orgName,
  planName,
  role,
  counts,
}: {
  orgName: string;
  planName: string;
  role: string;
  counts: Counts;
}) {
  const pathname = usePathname();
  const nav = [
    { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/app/projects", label: "Projects", icon: FolderKanban, count: counts.projects },
    { href: "/app/library", label: "Content library", icon: Library, count: counts.library },
    { href: "/app/documents", label: "Documents", icon: FileText, count: counts.documents },
  ];
  const adminNav = [
    { href: "/app/billing", label: "Billing", icon: CreditCard },
    { href: "/app/settings", label: "Settings", icon: Settings },
    { href: "/app/settings/members", label: "Members", icon: Users },
  ];

  return (
    <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
      <Link
        href="/"
        className="flex h-14 items-center gap-2 border-b px-4 transition-colors hover:bg-muted/50"
        title="Go to home"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{orgName}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {planName} plan · ← home
          </div>
        </div>
      </Link>

      <div className="p-3">
        <Link href="/app/projects/new">
          <Button className="w-full" size="sm">
            <Plus className="mr-1 h-4 w-4" /> New project
          </Button>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-1">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {typeof item.count === "number" && (
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <nav className="space-y-1 px-2 py-2">
        {adminNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const restricted = (item.href === "/app/billing" || item.href.startsWith("/app/settings")) && role === "member";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                restricted && "opacity-50",
              )}
              title={restricted ? "Admin only" : undefined}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
