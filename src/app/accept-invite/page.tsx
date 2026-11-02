"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

function AcceptInviteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [invite, setInvite] = useState<{ email: string; role: string; organizationName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) { setError(data.error); return; }
        setInvite(data);
      })
      .catch(() => { if (!cancelled) setError("Failed to load invite"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  // Missing token is derived, not stored as state
  const missingToken = !token;

  async function accept() {
    if (!token) return;
    setSubmitting(true);
    const res = await fetch(`/api/invites/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Failed to accept"); return; }
    // Auto-login by redirecting to /login
    router.push("/login?accepted=1");
  }

  if (loading && !missingToken) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">ReplyForge</span>
          </div>
          <CardTitle>Accept invitation</CardTitle>
          {invite && (
            <CardDescription>
              You've been invited to join <strong>{invite.organizationName}</strong> as <strong>{invite.role}</strong>.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {missingToken ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> Missing invite token
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          ) : invite ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email: <strong>{invite.email}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Set a password (min 8 chars)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {invite && (
            <Button className="w-full" onClick={accept} disabled={submitting || password.length < 8}>
              {submitting ? "Accepting…" : "Accept & create account"}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">Log in first</Link>
            {" "}then accept.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AcceptInviteInner />
    </Suspense>
  );
}
