import { requireTenant } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrgSettingsForm } from "@/components/org-settings-form";

export default async function SettingsPage() {
  const { org, user, role } = await requireTenant();
  const sub = await db.subscription.findUnique({ where: { organizationId: org.id } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Organization details and configuration.</p>
      </div>

      <OrgSettingsForm org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        role,
        subscriptionId: sub?.id ?? null,
      }} />

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danger zone</CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            To delete your organization and all associated data, email{" "}
            <a href="mailto:hello@replyforge.app" className="font-medium text-foreground hover:underline">
              hello@replyforge.app
            </a>{" "}
            from the owner's email address. We process deletion requests within 5 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
