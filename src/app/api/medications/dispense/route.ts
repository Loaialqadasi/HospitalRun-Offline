import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { medicationId, quantity, dispensedBy, isOffline } = body

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
      await addToSyncQueue('dispense', 'medication', medicationId, { quantity, dispensedBy })
      return NextResponse.json({ 
        message: 'Saved Locally / Queued for Sync',
        queued: true,
        localQuantity: medication.quantity - quantity
      })
    }

    // Check stock
    if (medication.quantity < quantity) {
      return NextResponse.json({ 
        error: `Cannot dispense ${quantity} units. Only ${medication.quantity} ${medication.name} available.`
      }, { status: 400 })
    }

    // Dispense
    const newQuantity = medication.quantity - quantity
    const updatedMedication = await db.medication.update({
      where: { id: medicationId },
      data: { quantity: newQuantity }
    })

    // Create dispense log
    await db.dispenseLog.create({
      data: {
        medicationId,
        medicationName: medication.name,
        quantity,
        dispensedBy: dispensedBy || null,
      }
    })

    // Check low stock alert
    let lowStockAlert = null
    if (updatedMedication.quantity <= updatedMedication.threshold) {
      lowStockAlert = `Alert: ${updatedMedication.name} has reached low stock.`
      await db.auditLog.create({
        data: {
          action: 'low_stock_alert',
          entity: 'medication',
          entityId: medicationId,
          details: lowStockAlert + ` Quantity: ${updatedMedication.quantity}, Threshold: ${updatedMedication.threshold}`,
        }
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'dispense',
        entity: 'medication',
        entityId: medicationId,
        details: `Dispensed ${quantity} units of ${medication.name}. Remaining: ${newQuantity}`,
        userId: dispensedBy || null,
      }
    })

    return NextResponse.json({ 
      medication: updatedMedication, 
      lowStockAlert,
      message: `Dispensed ${quantity} units of ${medication.name}. Remaining: ${newQuantity}`
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
