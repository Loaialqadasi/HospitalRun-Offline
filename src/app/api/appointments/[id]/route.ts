import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const appointment = await db.appointment.findUnique({ where: { id } })
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    return NextResponse.json({ appointment })
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
    const { patientId, patientName, providerName, date, startTime, endTime, status, notes, updatedBy } = body

    const appointment = await db.appointment.findUnique({ where: { id } })
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // If updating time, check for conflicts
    if ((date || startTime || endTime || providerName) && status !== 'cancelled') {
      const checkDate = date || appointment.date
      const checkStart = startTime || appointment.startTime
      const checkEnd = endTime || appointment.endTime
      const checkProvider = providerName || appointment.providerName

      const existingAppointments = await db.appointment.findMany({
        where: {
          providerName: checkProvider,
          date: checkDate,
          status: { not: 'cancelled' },
          id: { not: id }
        }
      })

      const newStart = timeToMinutes(checkStart)
      const newEnd = timeToMinutes(checkEnd)

      const conflict = existingAppointments.find(apt => {
        const existStart = timeToMinutes(apt.startTime)
        const existEnd = timeToMinutes(apt.endTime)
        return newStart < existEnd && newEnd > existStart
      })

      if (conflict) {
        return NextResponse.json({ error: 'Conflict: Provider unavailable.' }, { status: 409 })
      }
    }

    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: {
        ...(patientId && { patientId }),
        ...(patientName && { patientName }),
        ...(providerName && { providerName }),
        ...(date && { date }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: status === 'cancelled' ? 'cancel' : 'edit',
        entity: 'appointment',
        entityId: id,
        details: `Appointment ${status === 'cancelled' ? 'cancelled' : 'updated'} for ${updatedAppointment.patientName}`,
        userId: updatedBy || null,
      }
    })

    return NextResponse.json({ appointment: updatedAppointment })
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
    const appointment = await db.appointment.findUnique({ where: { id } })
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Cancel instead of delete
    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'cancel',
        entity: 'appointment',
        entityId: id,
        details: `Appointment cancelled for ${appointment.patientName}`,
      }
    })

    return NextResponse.json({ appointment: updatedAppointment, message: 'Appointment cancelled.' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}
