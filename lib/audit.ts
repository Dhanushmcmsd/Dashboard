import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'UPLOAD_CREATED'
  | 'UPLOAD_DELETED'
  | 'SNAPSHOT_GENERATED'
  | 'ALERT_SENT'
  | 'PASSWORD_CHANGED'
  | 'ROLE_CHANGED';

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata ?? {},
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Audit log failures must never crash the main request
    console.error('[AuditLog] Failed to write audit log:', error);
  }
}
