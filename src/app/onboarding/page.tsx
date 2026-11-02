import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

// This page handles two cases:
// 1. A user with no organization (e.g. accepted an invite but had no account,
//    then somehow lost the membership). Prompt them to create one.
// 2. A user with multiple organizations - let them pick which to activate.
//
// In normal signup flow, an organization is created atomically with the user,
// so this page is rarely reached. But the route must exist so that
// `requireTenant()` redirect("/onboarding") doesn't 404.
export default async function OnboardingPage() {
  const user = await requireUser();

  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  });

  // If user already has memberships, default-redirect to the first one's
  // dashboard. (JWT already points there, but we refresh here for safety.)
  if (memberships.length > 0) {
    redirect("/app/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">ReplyForge</span>
          </div>
          <CardTitle className="text-2xl">Set up your workspace</CardTitle>
          <CardDescription>
            You're signed in but don't belong to an organization yet. Sign out and create a new account to start your free trial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If you reached this page after accepting an invite, your invitation may have expired or already been used. Ask your team owner to resend the invite.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/signup" className="w-full">
            <Button className="w-full">
              Create a new workspace <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">Log out and sign in as a different user</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
