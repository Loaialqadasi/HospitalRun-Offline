import { NextResponse } from 'next/server'
import { getSyncQueue, processSyncQueue } from '@/lib/sync'

export async function GET() {
  try {
    const queue = await getSyncQueue()
    return NextResponse.json({ queue })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const results = await processSyncQueue()
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
