'use client'

import { useAppStore } from '@/lib/store'
import { CheckCircle, AlertCircle, Clock, WifiOff } from 'lucide-react'

export default function SyncIndicator() {
  const { syncStatus } = useAppStore()

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {syncStatus === 'synced' && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700">✅ Synced</span>
        </>
      )}
      {syncStatus === 'syncing' && (
        <>
          <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
          <span className="text-yellow-700">⏳ Syncing</span>
        </>
      )}
      {syncStatus === 'failed' && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700">❌ Failed</span>
        </>
      )}
      {syncStatus === 'offline' && (
        <>
          <WifiOff className="w-4 h-4 text-gray-400" />
          <span className="text-gray-500">Offline</span>
        </>
      )}
    </div>
  )
}
