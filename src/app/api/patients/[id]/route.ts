import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await db.patient.findUnique({ where: { id } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }
    return NextResponse.json({ patient })
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
    const { name, dateOfBirth, gender, contact, email, nationalId, bloodType, phone, address, assignedDoctor, updatedBy } = body

    const patient = await db.patient.findUnique({ where: { id } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Validation
    const errors: Record<string, string> = {}
    if (email && !email.includes('@')) {
      errors.email = 'Invalid email format. Missing @ symbol.'
    }
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth)
      if (dob > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    const updatedPatient = await db.patient.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(dateOfBirth && { dateOfBirth }),
        ...(gender && { gender }),
        ...(contact && { contact: contact.replace(/\D/g, '') }),
        ...(email !== undefined && { email: email || null }),
        ...(nationalId !== undefined && { nationalId: nationalId || null }),
        ...(bloodType !== undefined && { bloodType: bloodType || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(assignedDoctor !== undefined && { assignedDoctor: assignedDoctor || null }),
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'edit',
        entity: 'patient',
        entityId: id,
        details: `Patient ${updatedPatient.name} (${updatedPatient.patientId}) updated`,
        userId: updatedBy || null,
      }
    })

    return NextResponse.json({ patient: updatedPatient })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const patient = await db.patient.findUnique({ where: { id } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    await db.patient.delete({ where: { id } })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'delete',
        entity: 'patient',
        entityId: id,
        details: `Patient ${patient.patientId} deleted`,
      }
    })

    return NextResponse.json({ message: `Patient ${patient.patientId} deleted.` })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
