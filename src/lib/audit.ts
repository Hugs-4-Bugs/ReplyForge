import { db } from "@/lib/db";

// Append-only audit log. Every meaningful tenant action should call this.
export async function audit(opts: {
  organizationId: string;
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        organizationId: opts.organizationId,
        userId: opts.userId ?? null,
        action: opts.action,
        targetType: opts.targetType ?? null,
        targetId: opts.targetId ?? null,
        metadata: JSON.stringify(opts.metadata ?? {}),
        ip: opts.ip ?? null,
      },
    });
  } catch (err) {
    // Audit log failures must never break the main flow.
    console.error("[audit] failed to write log:", err);
  }
}
