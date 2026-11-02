"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Crown } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};
type Invite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
};

export function MembersClient({
  canManage, currentUserId, members, invites,
}: {
  canManage: boolean;
  currentUserId: string;
  members: Member[];
  invites: Invite[];
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  async function invite() {
    if (!email.trim()) return;
    setLoading(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Invite failed" }));
      toast.error(data.error ?? "Invite failed");
      return;
    }
    toast.success("Invitation sent");
    setEmail("");
    setTimeout(() => window.location.reload(), 1000);
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the organization?")) return;
    const res = await fetch(`/api/invites/members/${memberId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to remove"); return; }
    toast.success("Removed");
    setTimeout(() => window.location.reload(), 800);
  }

  async function changeRole(memberId: string, newRole: string) {
    const res = await fetch(`/api/invites/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) { toast.error("Failed to update role"); return; }
    toast.success("Role updated");
    setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite member</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="email" className="sr-only">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={invite} disabled={loading || !email.trim()}>
              {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
              Invite
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.name}</span>
                  {m.role === "owner" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                  <Badge variant="outline" className="text-[10px]">{m.role}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{m.email}</div>
              </div>
              {canManage && m.userId !== currentUserId && m.role !== "owner" && (
                <div className="flex gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(v) => changeRole(m.id, v)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending invites ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium">{i.email}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{i.role}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  expires {new Date(i.expiresAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
