"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    orgName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Sign up failed." }));
      // Show the API error + detail if available (helps debug DB/config issues)
      const errMsg = data.error ?? "Sign up failed.";
      const detail = data.detail ? ` (${data.detail})` : "";
      setError(errMsg + detail);
      return;
    }
    setSuccess(true);
  }

  function field(name: keyof typeof form, label: string, type = "text", autoComplete?: string) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          type={type}
          required
          autoComplete={autoComplete}
          value={form[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-semibold">ReplyForge</span>
          </div>
          <CardTitle className="text-2xl">Start free</CardTitle>
          <CardDescription>
            No credit card. 2 questionnaires/month, 25 questions each, 25 AI drafts.
          </CardDescription>
        </CardHeader>
        {success ? (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Account created. Check your email for a verification link.
            </div>
            <p className="text-sm text-muted-foreground">
              Once you verify your email, you can{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                log in
              </Link>
              .
            </p>
            <p className="text-xs text-muted-foreground">
              Dev mode: if SMTP isn't configured, the verification link was printed to the server log.
              Check <code className="bg-muted px-1 py-0.5 rounded">dev.log</code> for the URL.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={submit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              {field("name", "Your name", "text", "name")}
              {field("email", "Work email", "email", "email")}
              {field("password", "Password (min 8 chars)", "password", "new-password")}
              {field("orgName", "Company / team name", "text", "organization")}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-foreground hover:underline">
                  Log in
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground">
                By signing up you agree to our Terms and Privacy Policy.
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
