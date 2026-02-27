import { prisma } from './prisma';

export async function logAudit(params: {
  userId?: number | null;
  action: string;
  model: string;
  modelId?: number | null;
  oldValues?: any;
  newValues?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        model: params.model,
        modelId: params.modelId ?? null,
        oldValues: params.oldValues ?? undefined,
        newValues: params.newValues ?? undefined,
      },
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
