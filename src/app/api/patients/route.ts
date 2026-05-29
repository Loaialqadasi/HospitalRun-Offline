import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const patients = await db.patient.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ patients })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, dateOfBirth, gender, contact, email, nationalId, bloodType, phone, address, assignedDoctor, createdBy } = body

    // Validation
    const errors: Record<string, string> = {}

    if (!name || name.trim() === '') {
      errors.name = 'This field is required'
    }
    if (!dateOfBirth || dateOfBirth.trim() === '') {
      errors.dateOfBirth = 'This field is required'
    } else {
      // Check if DOB is in the future
      const dob = new Date(dateOfBirth)
      if (dob > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future.'
      }
    }
    if (!gender || gender.trim() === '') {
      errors.gender = 'This field is required'
    }
    if (!contact || contact.trim() === '') {
      errors.contact = 'This field is required'
    }
    if (email && !email.includes('@')) {
      errors.email = 'Invalid email format. Missing @ symbol.'
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 })
    }

    // Duplicate detection: match by Name + DOB + Contact (case-insensitive)
    const normalizedName = name.trim().toLowerCase()
    const normalizedContact = contact.replace(/\D/g, '').trim()
    
    const existingPatients = await db.patient.findMany()
    const duplicate = existingPatients.find(p => {
      const pName = p.name.trim().toLowerCase()
      const pContact = p.contact.replace(/\D/g, '').trim()
      return pName === normalizedName && p.dateOfBirth === dateOfBirth && pContact === normalizedContact
    })

    if (duplicate) {
      return NextResponse.json({ 
        warning: 'Possible duplicate patient detected. Review existing record.',
        duplicatePatient: duplicate
      }, { status: 409 })
    }

    // Generate patient ID
    const lastPatient = await db.patient.findFirst({
      orderBy: { patientId: 'desc' }
    })
    let nextNum = 100
    if (lastPatient && lastPatient.patientId) {
      const lastNum = parseInt(lastPatient.patientId.replace('PT-', ''))
      nextNum = lastNum + 1
    }
    const patientId = `PT-${nextNum}`

    const patient = await db.patient.create({
      data: {
        patientId,
        name: name.trim(),
        dateOfBirth,
        gender,
        contact: contact.replace(/\D/g, ''), // Strip non-numeric chars
        email: email || null,
        nationalId: nationalId || null,
        bloodType: bloodType || null,
        phone: phone || contact.replace(/\D/g, ''),
        address: address || null,
        assignedDoctor: assignedDoctor || null,
        createdBy: createdBy || null,
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'patient',
        entityId: patient.id,
        details: `Patient ${patient.name} (${patient.patientId}) registered`,
        userId: createdBy || null,
      }
    })

    return NextResponse.json({ patient, message: `Patient ${name} registered successfully.` }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
