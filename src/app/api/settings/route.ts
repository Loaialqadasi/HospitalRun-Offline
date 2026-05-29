import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    settings.forEach(s => {
      settingsMap[s.key] = s.value
    })
    return NextResponse.json({ settings: settingsMap })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { settings, updatedBy } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required.' }, { status: 400 })
    }

    for (const [key, value] of Object.entries(settings)) {
      await db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'update_settings',
        entity: 'settings',
        details: `Settings updated: ${Object.keys(settings).join(', ')}`,
        userId: updatedBy || null,
      }
    })

    // Check if low stock threshold changed - retroactive alert check
    if (settings.lowStockThreshold) {
      const newThreshold = parseInt(settings.lowStockThreshold)
      const medications = await db.medication.findMany()
      for (const med of medications) {
        // Update threshold
        await db.medication.update({
          where: { id: med.id },
          data: { threshold: newThreshold }
        })
        // Check if medication is now below new threshold
        if (med.quantity <= newThreshold && med.quantity > med.threshold) {
          await db.auditLog.create({
            data: {
              action: 'low_stock_alert',
              entity: 'medication',
              entityId: med.id,
              details: `Alert: ${med.name} has reached low stock after threshold change. Quantity: ${med.quantity}, New Threshold: ${newThreshold}`,
            }
          })
        }
      }
    }

    const updatedSettings = await db.setting.findMany()
    const settingsMap: Record<string, string> = {}
    updatedSettings.forEach(s => {
      settingsMap[s.key] = s.value
    })

    return NextResponse.json({ settings: settingsMap })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
