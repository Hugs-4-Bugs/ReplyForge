"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function OrgSettingsForm({ org }: {
  org: {
    id: string;
    name: string;
    slug: string;
    role: string;
    subscriptionId: string | null;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [loading, setLoading] = useState(false);
  const canEdit = org.role === "owner" || org.role === "admin";

  async function save() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/organizations/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to update");
      return;
    }
    toast.success("Saved");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organization</CardTitle>
        <CardDescription>Visible to your team and on every project export.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={org.slug} disabled />
          <p className="text-xs text-muted-foreground">Used as a unique identifier. Cannot be changed.</p>
        </div>
        <Button onClick={save} disabled={loading || !canEdit}>
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
