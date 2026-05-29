'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle, AlertCircle, Clock, Wifi, WifiOff, RotateCcw } from 'lucide-react'

interface SyncQueueItem {
  id: string
  action: string
  entity: string
  entityId: string
  data: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function SyncStatus() {
  const { isOffline, setIsOffline, syncStatus, setSyncStatus } = useAppStore()
  const [queue, setQueue] = useState<SyncQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchQueue()
  }, [])

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/sync')
      const data = await res.json()
      setQueue(data.queue || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    setSyncStatus('syncing')
    
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      
      // Check if any items failed
      const hasFailed = data.results?.some((r: { status: string }) => r.status === 'failed')
      if (hasFailed) {
        setSyncStatus('failed')
      } else {
        setSyncStatus(isOffline ? 'offline' : 'synced')
      }
      
      fetchQueue()
    } catch {
      setSyncStatus('failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleRetry = async (id: string) => {
    try {
      await fetch(`/api/sync/${id}`, { method: 'PUT' })
      fetchQueue()
    } catch {
      // Handle error
    }
  }

  const handleGoOnline = async () => {
    setIsOffline(false)
    setSyncStatus('syncing')
    
    // Auto-sync when going online
    setTimeout(async () => {
      await handleSyncAll()
      setSyncStatus('synced')
    }, 1000)
  }

  const handleGoOffline = () => {
    setIsOffline(true)
    setSyncStatus('offline')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'syncing': return <Badge className="bg-teal-100 text-teal-700">Syncing</Badge>
      case 'synced': return <Badge className="bg-green-100 text-green-700">Synced</Badge>
      case 'failed': return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'synced': return { icon: <CheckCircle className="w-6 h-6 text-green-500" />, label: '✅ All Synced', color: 'text-green-700' }
      case 'syncing': return { icon: <Clock className="w-6 h-6 text-yellow-500 animate-spin" />, label: '⏳ Syncing...', color: 'text-yellow-700' }
      case 'failed': return { icon: <AlertCircle className="w-6 h-6 text-red-500" />, label: '❌ Sync Failed', color: 'text-red-700' }
      case 'offline': return { icon: <WifiOff className="w-6 h-6 text-gray-400" />, label: '📴 Offline Mode', color: 'text-gray-500' }
    }
  }

  const statusDisplay = getSyncStatusDisplay()
  const pendingCount = queue.filter(q => q.status === 'pending').length
  const failedCount = queue.filter(q => q.status === 'failed').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Status</h1>
          <p className="text-gray-500 mt-1">Manage offline sync queue</p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusDisplay.icon}
              <div>
                <p className={`text-xl font-bold ${statusDisplay.color}`}>{statusDisplay.label}</p>
                {(pendingCount > 0 || failedCount > 0) && (
                  <p className="text-sm text-gray-500">
                    {pendingCount > 0 && `${pendingCount} item(s) pending`}
                    {pendingCount > 0 && failedCount > 0 && ' • '}
                    {failedCount > 0 && `${failedCount} item(s) failed`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {isOffline ? (
                <Button onClick={handleGoOnline} className="bg-green-600 hover:bg-green-700 text-white">
                  <Wifi className="w-4 h-4 mr-2" /> Go Online
                </Button>
              ) : (
                <Button onClick={handleGoOffline} variant="outline" className="border-gray-300">
                  <WifiOff className="w-4 h-4 mr-2" /> Go Offline
                </Button>
              )}
              <Button 
                onClick={handleSyncAll} 
                className="bg-teal-600 hover:bg-teal-700 text-white"
                disabled={syncing || isOffline}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync All'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offline banner */}
      {isOffline && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 font-medium">
          📴 You are in Offline Mode. All changes will be queued and synced when you go back online.
        </div>
      )}

      {/* Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No items in sync queue
                    </TableCell>
                  </TableRow>
                ) : (
                  queue.map(item => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="capitalize font-medium">{item.action}</TableCell>
                      <TableCell className="capitalize">{item.entity}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-teal-600"
                            onClick={() => handleRetry(item.id)}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
