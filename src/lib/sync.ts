import { db } from './db'

export interface SyncQueueEntry {
  id: string
  action: string
  entity: string
  entityId: string
  data: string
  status: string
}

export async function addToSyncQueue(action: string, entity: string, entityId: string, data: Record<string, unknown>) {
  return db.syncQueueItem.create({
    data: {
      action,
      entity,
      entityId,
      data: JSON.stringify(data),
      status: 'pending',
    }
  })
}

export async function processSyncQueue() {
  const pendingItems = await db.syncQueueItem.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' }
  })

  const results = []

  for (const item of pendingItems) {
    try {
      await db.syncQueueItem.update({
        where: { id: item.id },
        data: { status: 'syncing' }
      })

      const data = JSON.parse(item.data)

      switch (item.entity) {
        case 'patient':
          if (item.action === 'edit') {
            await db.patient.update({
              where: { id: item.entityId },
              data: { ...data, updatedAt: new Date() }
            })
          }
          break
        case 'medication':
          if (item.action === 'dispense') {
            const med = await db.medication.findUnique({ where: { id: item.entityId } })
            if (med && med.quantity >= (data.quantity as number)) {
              await db.medication.update({
                where: { id: item.entityId },
                data: { quantity: med.quantity - (data.quantity as number) }
              })
            }
          } else if (item.action === 'restock') {
            const med = await db.medication.findUnique({ where: { id: item.entityId } })
            if (med) {
              await db.medication.update({
                where: { id: item.entityId },
                data: { quantity: med.quantity + (data.quantity as number) }
              })
            }
          } else if (item.action === 'edit') {
            await db.medication.update({
              where: { id: item.entityId },
              data: { ...data, updatedAt: new Date() }
            })
          }
          break
        case 'appointment':
          if (item.action === 'appointment') {
            await db.appointment.create({
              data: {
                patientId: data.patientId as string,
                patientName: data.patientName as string,
                providerName: data.providerName as string,
                date: data.date as string,
                startTime: data.startTime as string,
                endTime: data.endTime as string,
                status: (data.status as string) || 'scheduled',
                notes: data.notes as string | null,
              }
            })
          } else if (item.action === 'edit') {
            await db.appointment.update({
              where: { id: item.entityId },
              data: { ...data, updatedAt: new Date() }
            })
          }
          break
      }

      await db.syncQueueItem.update({
        where: { id: item.id },
        data: { status: 'synced' }
      })

      results.push({ id: item.id, status: 'synced' })
    } catch {
      await db.syncQueueItem.update({
        where: { id: item.id },
        data: { status: 'failed' }
      })

      results.push({ id: item.id, status: 'failed' })
    }
  }

  return results
}

export async function retrySyncItem(id: string) {
  const item = await db.syncQueueItem.findUnique({ where: { id } })
  if (!item) return null

  await db.syncQueueItem.update({
    where: { id },
    data: { status: 'pending' }
  })

  return processSyncQueue()
}

export async function getSyncQueue() {
  return db.syncQueueItem.findMany({
    orderBy: { createdAt: 'desc' }
  })
}
