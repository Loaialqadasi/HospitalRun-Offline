import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const appointments = await db.appointment.findMany({
      orderBy: { date: 'asc' }
    })
    return NextResponse.json({ appointments })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, patientName, providerName, date, startTime, endTime, notes, createdBy, isOffline } = body

    // Validation
    if (!patientId || !patientName || !providerName || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'All required fields must be provided.' }, { status: 400 })
    }

    // If offline, queue for sync
    if (isOffline) {
      const { addToSyncQueue } = await import('@/lib/sync')
      await addToSyncQueue('appointment', 'appointment', 'pending', { 
        patientId, patientName, providerName, date, startTime, endTime, notes, status: 'scheduled' 
      })
      return NextResponse.json({ 
        message: 'Saved Locally / Queued for Sync',
        queued: true,
        pendingSync: true
      })
    }

    // Check for conflicts - same provider, overlapping time
    const existingAppointments = await db.appointment.findMany({
      where: { 
        providerName,
        date,
        status: { not: 'cancelled' }
      }
    })

    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)

    const conflict = existingAppointments.find(apt => {
      const existStart = timeToMinutes(apt.startTime)
      const existEnd = timeToMinutes(apt.endTime)
      // Overlap: newStart < existEnd AND newEnd > existStart
      return newStart < existEnd && newEnd > existStart
    })

    if (conflict) {
      // Find suggested available time
      const sortedAppointments = existingAppointments
        .filter(a => a.status !== 'cancelled')
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

      let suggestedTime = findSuggestedTime(sortedAppointments, date, newStart, newEnd)

      return NextResponse.json({ 
        error: 'Conflict: Provider unavailable.',
        suggestedTime,
        conflictWith: conflict
      }, { status: 409 })
    }

    // Create appointment with UTC timestamp
    const appointment = await db.appointment.create({
      data: {
        patientId,
        patientName,
        providerName,
        date,
        startTime,
        endTime,
        status: 'scheduled',
        notes: notes || null,
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'create',
        entity: 'appointment',
        entityId: appointment.id,
        details: `Appointment created for ${patientName} with ${providerName} on ${date} ${startTime}-${endTime}`,
        userId: createdBy || null,
      }
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function timeToMinutes(time: string): number {
  const parts = time.split(':')
  return parseInt(parts[0]) * 60 + parseInt(parts[1])
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function findSuggestedTime(sortedAppointments: { startTime: string; endTime: string }[], date: string, _newStart: number, newEnd: number): { date: string; startTime: string; endTime: string } {
  const duration = newEnd - _newStart
  
  // Try to find a gap
  let lastEnd = 8 * 60 // Start at 8:00 AM
  for (const apt of sortedAppointments) {
    const aptStart = timeToMinutes(apt.startTime)
    const aptEnd = timeToMinutes(apt.endTime)
    
    if (aptStart - lastEnd >= duration) {
      return {
        date,
        startTime: minutesToTime(lastEnd),
        endTime: minutesToTime(lastEnd + duration)
      }
    }
    lastEnd = Math.max(lastEnd, aptEnd)
  }
  
  // If no gap found, schedule after the last appointment
  return {
    date,
    startTime: minutesToTime(lastEnd),
    endTime: minutesToTime(lastEnd + duration)
  }
}
