import { db } from '@/lib/db'

export async function logOperation(data: {
  action: string
  entityType?: string
  entityId?: string
  details?: string
  actor?: string
}) {
  try {
    await db.operationLog.create({
      data: {
        action: data.action,
        entityType: data.entityType || '',
        entityId: data.entityId || '',
        details: data.details || '',
        actor: data.actor || 'admin',
      },
    })
    // Keep only last 1000 logs
    const count = await db.operationLog.count()
    if (count > 1000) {
      const logs = await db.operationLog.findMany({
        orderBy: { createdAt: 'asc' },
        take: count - 1000,
        select: { id: true },
      })
      if (logs.length > 0) {
        await db.operationLog.deleteMany({
          where: { id: { in: logs.map(l => l.id) } },
        })
      }
    }
  } catch (error) {
    console.error('Failed to log operation:', error)
  }
}

/**
 * Log a failed operation / error. Captures the error message and stack in details.
 */
export async function logError(
  action: string,
  error: unknown,
  context?: {
    entityType?: string
    entityId?: string
    actor?: string
    details?: string
  }
) {
  const errMsg = error instanceof Error
    ? `${error.name}: ${error.message}`
    : String(error)
  const stack = error instanceof Error ? error.stack : ''
  const details = [
    context?.details ? context.details : '',
    `ERROR: ${errMsg}`,
    stack ? `\nSTACK:\n${stack}` : '',
  ].filter(Boolean).join('\n')

  return logOperation({
    action: `error:${action}`,
    entityType: context?.entityType || 'system',
    entityId: context?.entityId || '',
    details,
    actor: context?.actor || 'system',
  })
}
