'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, RotateCcw, Filter } from 'lucide-react'

interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId?: string | null
  details?: string | null
  userId?: string | null
  timestamp: string
}

export default function AuditLog() {
  const { currentUser } = useAppStore()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [filterAction, filterEntity])

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (filterAction) params.set('action', filterAction)
      if (filterEntity) params.set('entity', filterEntity)
      params.set('limit', '200')

      const res = await fetch(`/api/audit?${params.toString()}`)
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async (log: AuditLogEntry) => {
    if (!confirm(`Revert to this version? This will attempt to undo the action: ${log.action}`)) return
    
    try {
      // For conflict resolution reverts - simplified implementation
      await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revert',
          entity: log.entity,
          entityId: log.entityId,
          details: `Reverted: ${log.details}`,
          userId: currentUser?.username,
        }),
      })
      
      alert('Conflict resolution reverted successfully.')
      fetchLogs()
    } catch {
      alert('Revert failed.')
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge className="bg-green-100 text-green-700">Create</Badge>
      case 'edit': return <Badge className="bg-teal-100 text-teal-700">Edit</Badge>
      case 'delete': return <Badge className="bg-red-100 text-red-700">Delete</Badge>
      case 'dispense': return <Badge className="bg-amber-100 text-amber-700">Dispense</Badge>
      case 'restock': return <Badge className="bg-emerald-100 text-emerald-700">Restock</Badge>
      case 'login': return <Badge className="bg-teal-100 text-teal-700">Login</Badge>
      case 'logout': return <Badge className="bg-gray-100 text-gray-700">Logout</Badge>
      case 'low_stock_alert': return <Badge className="bg-yellow-100 text-yellow-700">Alert</Badge>
      case 'conflict_resolution': return <Badge className="bg-orange-100 text-orange-700">Conflict</Badge>
      default: return <Badge>{action}</Badge>
    }
  }

  const isAdmin = currentUser?.role === 'admin'

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
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-gray-500 mt-1">{logs.length} entries</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Action Type</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="dispense">Dispense</SelectItem>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="low_stock_alert">Low Stock Alert</SelectItem>
                  <SelectItem value="conflict_resolution">Conflict Resolution</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Entity</label>
              <Select value={filterEntity} onValueChange={setFilterEntity}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="capitalize">{log.entity}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{log.details || '—'}</TableCell>
                      <TableCell className="text-sm">{log.userId || 'System'}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          {(log.action === 'conflict_resolution' || log.action === 'edit' || log.action === 'delete') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-teal-600"
                              onClick={() => handleRevert(log)}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Revert
                            </Button>
                          )}
                        </TableCell>
                      )}
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
