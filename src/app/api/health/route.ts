import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/health - diagnostic endpoint that checks env vars + DB connection.
// Returns 200 if everything is OK, 500 if something is wrong.
// This is intentionally public (no auth) so you can debug Vercel deployment
// issues without logging in.
export async function GET() {
  const checks: Record<string, { ok: boolean; value?: string; error?: string }> = {};

  // 1. Check critical env vars (never show actual values, just whether set)
  const envVars = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXTAUTH_URL",
    "APP_URL",
  ];
  for (const v of envVars) {
    checks[`env_${v}`] = {
      ok: !!process.env[v] && process.env[v]!.length > 0,
      value: process.env[v]
        ? v === "DATABASE_URL"
          ? maskDbUrl(process.env[v]!)
          : v.includes("SECRET")
            ? "(set, hidden)"
            : process.env[v]
        : "(not set)",
    };
  }

  // 2. Check Stripe env vars
  const stripeVars = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_STARTER_MONTHLY",
    "STRIPE_PRICE_STARTER_YEARLY",
    "STRIPE_PRICE_PRO_MONTHLY",
    "STRIPE_PRICE_PRO_YEARLY",
    "STRIPE_PRICE_BUSINESS_MONTHLY",
    "STRIPE_PRICE_BUSINESS_YEARLY",
  ];
  for (const v of stripeVars) {
    checks[`env_${v}`] = {
      ok: !!process.env[v],
      value: process.env[v] ? "(set)" : "(not set)",
    };
  }

  // 3. Check SMTP env vars
  const smtpVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
  for (const v of smtpVars) {
    checks[`env_${v}`] = {
      ok: !!process.env[v],
      value: process.env[v] ? "(set)" : "(not set)",
    };
  }

  // 4. Check DB connection
  try {
    await db.$queryRaw`SELECT 1`;
    checks.db_connection = { ok: true, value: "connected" };
  } catch (err: any) {
    checks.db_connection = {
      ok: false,
      error: String(err?.message ?? err).slice(0, 300),
    };
  }

  // 5. Check if Prisma client is loaded
  try {
    checks.prisma_client = {
      ok: !!db.user,
      value: typeof db.user,
    };
  } catch (err: any) {
    checks.prisma_client = { ok: false, error: String(err).slice(0, 200) };
  }

  // Overall status
  const allOk = Object.values(checks).every((c) => c.ok);
  // Critical checks: DATABASE_URL, AUTH_SECRET, and db_connection
  const criticalOk =
    checks.env_DATABASE_URL?.ok &&
    checks.env_AUTH_SECRET?.ok &&
    checks.db_connection?.ok;

  return NextResponse.json(
    {
      status: criticalOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      checks,
      hint:
        !checks.env_DATABASE_URL?.ok
          ? "DATABASE_URL is NOT SET. Do this now: 1) Go to https://neon.tech and sign up (free). 2) Create a new project. 3) Copy the connection string (looks like postgresql://neondb:xxx@ep-xxx.neon.tech/neondb?sslmode=require). 4) In Vercel: Project Settings -> Environment Variables -> add DATABASE_URL with that connection string. 5) Redeploy."
          : process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("file:")
            ? "DATABASE_URL is set to a SQLite file path (file:...) but the schema requires Postgres. Vercel serverless can't use SQLite files. Create a Postgres database at https://neon.tech (free) and update DATABASE_URL in Vercel env vars to the Postgres connection string."
            : !checks.env_AUTH_SECRET?.ok
              ? "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32 and add it to Vercel env vars."
              : !checks.db_connection?.ok
                ? `DB connection failed: ${checks.db_connection?.error}. Make sure DATABASE_URL is a valid Postgres connection string (postgresql://user:pass@host:port/db) and the database is accessible from Vercel. Also run 'npx prisma db push' with your DATABASE_URL to create the tables.`
                : "All critical checks passed. If signup still fails, run 'npx prisma db push --url=YOUR_DATABASE_URL' locally to create the database tables.",
    },
    { status: criticalOk ? 200 : 500 },
  );
}

function maskDbUrl(url: string): string {
  // Mask password in connection string for display
  try {
    return url.replace(/(:\/\/[^:]+:)([^@]+)(@)/, "$1****$3");
  } catch {
    return "(set, but could not mask)";
  }
}
