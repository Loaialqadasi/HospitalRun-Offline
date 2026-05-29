'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Plus, Clock, Globe } from 'lucide-react'

interface Appointment {
  id: string
  patientId: string
  patientName: string
  providerName: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export default function AppointmentList() {
  const { setView, isOffline } = useAppStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments')
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', updatedBy: useAppStore.getState().currentUser?.username }),
      })
      if (res.ok) {
        fetchAppointments()
      }
    } catch {
      // Handle error
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-green-100 text-green-700">Scheduled</Badge>
      case 'completed': return <Badge className="bg-teal-100 text-teal-700">Completed</Badge>
      case 'cancelled': return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  // Convert date string to display format
  const formatDate = (dateStr: string) => {
    if (dateStr.includes('/')) return dateStr
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  // Convert time to local timezone display and UTC
  const formatTimeDisplay = (date: string, time: string) => {
    try {
      // Create a date-time string for UTC
      const dateParts = date.includes('/') ? date.split('/') : null
      let isoStr: string
      if (dateParts) {
        // DD/MM/YYYY format
        isoStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${time}:00Z`
      } else {
        isoStr = `${date}T${time}:00Z`
      }
      
      const utcDate = new Date(isoStr)
      const localTime = utcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const utcTime = `${time} UTC`
      
      return { localTime, utcTime }
    } catch {
      return { localTime: time, utcTime: `${time} UTC` }
    }
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 mt-1">{appointments.length} appointments</p>
        </div>
        <Button onClick={() => setView('appointments-add')} className="bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> New Booking
        </Button>
      </div>

      {/* Appointment reminders simulation */}
      <Card className="border-teal-200 bg-teal-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-teal-700">
            <Clock className="w-4 h-4" /> Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments
            .filter(a => a.status === 'scheduled')
            .slice(0, 3)
            .map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-2 text-sm">
                <span className="text-teal-700">
                  📋 Reminder: Appointment for {apt.patientName} with {apt.providerName} on {formatDate(apt.date)} at {apt.startTime}
                </span>
                <span className="text-xs text-teal-500">24hr / 1hr before</span>
              </div>
            ))
          }
        </CardContent>
      </Card>

      {/* Appointment Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Local Time</TableHead>
                  <TableHead>Stored Time (UTC)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No appointments found
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map(apt => {
                    const timeDisplay = formatTimeDisplay(apt.date, apt.startTime)
                    return (
                      <TableRow key={apt.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {apt.patientName}
                          {isOffline && apt.status === 'scheduled' && (
                            <span className="ml-2 text-xs text-yellow-600">(Pending Sync)</span>
                          )}
                        </TableCell>
                        <TableCell>{apt.providerName}</TableCell>
                        <TableCell>{formatDate(apt.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {apt.startTime} - {apt.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Globe className="w-3 h-3" />
                            {timeDisplay.utcTime}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell className="text-right">
                          {apt.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancel(apt.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
