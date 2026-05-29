import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const medications = await db.medication.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ medications })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, dosage, quantity, threshold, unit } = body

    if (!name || !dosage || quantity === undefined) {
      return NextResponse.json({ error: 'Name, dosage, and quantity are required.' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await db.medication.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'Medication with this name already exists.' }, { status: 409 })
    }

    const medication = await db.medication.create({
      data: {
        name,
        dosage,
        quantity: parseInt(quantity),
        threshold: threshold ? parseInt(threshold) : 10,
        unit: unit || 'units',
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'medication',
        entityId: medication.id,
        details: `Medication ${medication.name} added with ${medication.quantity} units`,
      }
    })

    return NextResponse.json({ medication }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
