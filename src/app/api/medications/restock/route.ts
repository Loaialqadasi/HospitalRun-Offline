import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { medicationId, quantity, restockedBy, isOffline } = body

    if (!medicationId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Medication ID and valid quantity are required.' }, { status: 400 })
    }

    const medication = await db.medication.findUnique({ where: { id: medicationId } })
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    // If offline, queue for sync
    if (isOffline) {
      const { addToSyncQueue } = await import('@/lib/sync')
      await addToSyncQueue('restock', 'medication', medicationId, { quantity, restockedBy })
      return NextResponse.json({ 
        message: 'Saved Locally / Queued for Sync',
        queued: true,
        localQuantity: medication.quantity + quantity
      })
    }

    // Restock
    const newQuantity = medication.quantity + quantity
    const updatedMedication = await db.medication.update({
      where: { id: medicationId },
      data: { quantity: newQuantity }
    })

    // Check if low stock alert should be cleared
    let lowStockCleared = false
    if (medication.quantity <= medication.threshold && newQuantity > medication.threshold) {
      lowStockCleared = true
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'restock',
        entity: 'medication',
        entityId: medicationId,
        details: `Restocked ${quantity} units of ${medication.name}. New total: ${newQuantity}`,
        userId: restockedBy || null,
      }
    })

    return NextResponse.json({ 
      medication: updatedMedication, 
      lowStockCleared,
      message: `Restocked ${quantity} units of ${medication.name}. New total: ${newQuantity}`
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
