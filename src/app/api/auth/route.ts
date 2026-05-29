import { NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
    }

    const result = await authenticateUser(username, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'login',
        entity: 'user',
        entityId: result.user!.id,
        details: `User ${username} logged in`,
        userId: result.user!.id,
      }
    })

    return NextResponse.json({ user: result.user })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
