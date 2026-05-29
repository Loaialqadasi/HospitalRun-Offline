import { NextResponse } from 'next/server'
import { retrySyncItem } from '@/lib/sync'

export async function PUT(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const results = await retrySyncItem(id)
    if (!results) {
      return NextResponse.json({ error: 'Sync item not found' }, { status: 404 })
    }
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
