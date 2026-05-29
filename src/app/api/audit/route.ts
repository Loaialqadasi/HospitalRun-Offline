import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Prisma.AuditLogWhereInput = {}
    if (action) where.action = action
    if (entity) where.entity = entity

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, entity, entityId, details, userId } = body

    const log = await db.auditLog.create({
      data: {
        action: action || 'custom',
        entity: entity || 'unknown',
        entityId: entityId || null,
        details: details || null,
        userId: userId || null,
      }
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
