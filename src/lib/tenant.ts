import { db } from "@/lib/db";

// Tenant isolation helpers. Every tenant-scoped query MUST go through one of
// these helpers or otherwise include `where: { organizationId }` against the
// caller's verified tenant id. The role of this file is to make the safe
// pattern obvious and uniform.

export class TenantError extends Error {
  constructor(message = "Forbidden: tenant mismatch") {
    super(message);
    this.name = "TenantError";
  }
}

// Verify the caller actually belongs to orgId. Throws TenantError otherwise.
export async function assertMembership(
  userId: string,
  orgId: string,
): Promise<{ role: string }> {
  const m = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true },
  });
  if (!m) throw new TenantError();
  return m;
}

// Find one tenant-scoped record by id, enforcing that organizationId matches.
// Returns null when not found OR when found but in a different tenant.
export async function findTenantScoped<T extends { organizationId: string }>(
  model: { findUnique: (args: { where: { id: string } }) => Promise<T | null> },
  id: string,
  orgId: string,
): Promise<T | null> {
  const rec = await model.findUnique({ where: { id } });
  if (!rec) return null;
  if (rec.organizationId !== orgId) return null;
  return rec;
}

// Convenience: a guard used at the top of every API route that takes an :id
// path param referencing a tenant-scoped resource.
export async function requireTenantResource(
  orgId: string,
  resourceId: string,
  model: "project" | "contentEntry" | "document" | "answer" | "apiKey",
): Promise<{ ok: true } | { ok: false; status: 404 }> {
  let rec: { organizationId: string } | null = null;
  switch (model) {
    case "project":
      rec = await db.project.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      });
      break;
    case "contentEntry":
      rec = await db.contentEntry.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      });
      break;
    case "document":
      rec = await db.document.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      });
      break;
    case "answer":
      rec = await db.answer.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      });
      break;
    case "apiKey":
      rec = await db.apiKey.findUnique({
        where: { id: resourceId },
        select: { organizationId: true },
      });
      break;
  }
  if (!rec || rec.organizationId !== orgId) return { ok: false, status: 404 };
  return { ok: true };
}
