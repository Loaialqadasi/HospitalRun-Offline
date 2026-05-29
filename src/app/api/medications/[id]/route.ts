import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const medication = await db.medication.findUnique({ where: { id } })
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }
    return NextResponse.json({ medication })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, dosage, quantity, threshold, unit } = body

    const medication = await db.medication.findUnique({ where: { id } })
    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 })
    }

    const updatedMedication = await db.medication.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(dosage && { dosage }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(threshold !== undefined && { threshold: parseInt(threshold) }),
        ...(unit && { unit }),
      }
    })

    // Check low stock after update
    if (updatedMedication.quantity <= updatedMedication.threshold) {
      await db.auditLog.create({
        data: {
          action: 'low_stock_alert',
          entity: 'medication',
          entityId: id,
          details: `Alert: ${updatedMedication.name} has reached low stock. Quantity: ${updatedMedication.quantity}, Threshold: ${updatedMedication.threshold}`,
        }
      })
    }

    return NextResponse.json({ medication: updatedMedication })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
