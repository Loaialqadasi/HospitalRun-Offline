import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    // Create audit log for logout
    if (username) {
      const user = await db.user.findUnique({ where: { username } })
      if (user) {
        await db.auditLog.create({
          data: {
            action: 'logout',
            entity: 'user',
            entityId: user.id,
            details: `User ${username} logged out`,
            userId: user.id,
          }
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
