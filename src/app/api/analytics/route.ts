import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const department = searchParams.get('department')
    const provider = searchParams.get('provider')

    // Get patient count
    const patientCount = await db.patient.count()

    // Get appointment stats
    const appointments = await db.appointment.findMany()
    const completedAppointments = appointments.filter(a => a.status === 'completed')
    const scheduledAppointments = appointments.filter(a => a.status === 'scheduled')
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled')

    // Get medication stats
    const medications = await db.medication.findMany()
    const lowStockMedications = medications.filter(m => m.quantity <= m.threshold)
    const outOfStockMedications = medications.filter(m => m.quantity === 0)

    // Get dispense logs for trends
    const dispenseLogs = await db.dispenseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Appointment trends by month
    const appointmentTrends = appointments.reduce((acc: Record<string, { month: string; count: number }>, apt) => {
      // Parse date - handle both DD/MM/YYYY and other formats
      let month: string
      if (apt.date.includes('/')) {
        const parts = apt.date.split('/')
        month = `${parts[2]}-${parts[1]}`
      } else {
        const d = new Date(apt.date)
        month = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`
      }
      
      if (!acc[month]) {
        acc[month] = { month, count: 0 }
      }
      acc[month].count++
      return acc
    }, {})

    // Medication usage from dispense logs
    const medicationUsage = dispenseLogs.reduce((acc: Record<string, { name: string; dispensed: number }>, log) => {
      if (!acc[log.medicationName]) {
        acc[log.medicationName] = { name: log.medicationName, dispensed: 0 }
      }
      acc[log.medicationName].dispensed += log.quantity
      return acc
    }, {})

    // Apply filters
    let filteredAppointments = appointments
    if (startDate) {
      filteredAppointments = filteredAppointments.filter(a => a.date >= startDate)
    }
    if (endDate) {
      filteredAppointments = filteredAppointments.filter(a => a.date <= endDate)
    }
    if (department) {
      // Filter by provider specialty/department (simplified)
      filteredAppointments = filteredAppointments.filter(a => 
        a.providerName.toLowerCase().includes(department.toLowerCase())
      )
    }
    if (provider) {
      filteredAppointments = filteredAppointments.filter(a => 
        a.providerName.toLowerCase().includes(provider.toLowerCase())
      )
    }

    // Sync queue stats
    const pendingSyncs = await db.syncQueueItem.count({
      where: { status: 'pending' }
    })
    const failedSyncs = await db.syncQueueItem.count({
      where: { status: 'failed' }
    })

    return NextResponse.json({
      patientCount,
      appointmentStats: {
        total: appointments.length,
        completed: completedAppointments.length,
        scheduled: scheduledAppointments.length,
        cancelled: cancelledAppointments.length,
      },
      medicationStats: {
        total: medications.length,
        lowStock: lowStockMedications.length,
        outOfStock: outOfStockMedications.length,
      },
      appointmentTrends: Object.values(appointmentTrends).sort((a, b) => a.month.localeCompare(b.month)),
      medicationUsage: Object.values(medicationUsage).sort((a, b) => b.dispensed - a.dispensed),
      filteredAppointments,
      syncStats: {
        pending: pendingSyncs,
        failed: failedSyncs,
      },
      lowStockMedications: lowStockMedications.map(m => ({
        id: m.id,
        name: m.name,
        quantity: m.quantity,
        threshold: m.threshold,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
