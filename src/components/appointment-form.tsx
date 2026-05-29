'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, CalendarPlus, AlertCircle } from 'lucide-react'

interface Patient {
  id: string
  patientId: string
  name: string
}

export default function AppointmentForm() {
  const { setView, isOffline, setSyncStatus } = useAppStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [suggestedTime, setSuggestedTime] = useState<{ date: string; startTime: string; endTime: string } | null>(null)
  
  const [formData, setFormData] = useState({
    patientId: '',
    providerName: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  })

  const providers = [
    'Dr. Loai', 'Dr. Ahmad', 'Dr. Sarah', 'Dr. Rohayanti',
    'Dr. Smith', 'Dr. Jones'
  ]

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      setPatients(data.patients || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const selectedPatient = patients.find(p => p.patientId === formData.patientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSuggestedTime(null)

    if (!formData.patientId || !formData.providerName || !formData.date || !formData.startTime || !formData.endTime) {
      setMessage({ type: 'error', text: 'All required fields must be filled.' })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          patientName: selectedPatient?.name || '',
          providerName: formData.providerName,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes,
          createdBy: useAppStore.getState().currentUser?.username,
          isOffline,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setMessage({ type: 'error', text: data.error })
          if (data.suggestedTime) {
            setSuggestedTime(data.suggestedTime)
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to create appointment' })
        }
        return
      }

      if (data.queued) {
        setMessage({ type: 'warning', text: data.message })
        setSyncStatus('syncing')
      } else {
        setMessage({ type: 'success', text: 'Appointment created successfully.' })
      }

      // Reset form
      setFormData({
        patientId: '',
        providerName: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: '',
      })
    } catch {
      setMessage({ type: 'error', text: 'Failed to create appointment' })
    } finally {
      setSubmitting(false)
    }
  }

  const applySuggestedTime = () => {
    if (suggestedTime) {
      setFormData({
        ...formData,
        date: suggestedTime.date,
        startTime: suggestedTime.startTime,
        endTime: suggestedTime.endTime,
      })
      setSuggestedTime(null)
      setMessage(null)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setView('appointments')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          <div className="flex items-start gap-2">
            {message.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <div>
              <p>{message.text}</p>
              {suggestedTime && (
                <button
                  onClick={applySuggestedTime}
                  className="mt-2 text-teal-700 underline hover:no-underline font-medium"
                >
                  Suggested available time: {suggestedTime.startTime} - {suggestedTime.endTime}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-teal-600" /> Booking Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                  <SelectTrigger id="patient">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.patientId}>
                        {p.name} ({p.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider *</Label>
                <Select value={formData.providerName} onValueChange={(value) => setFormData({ ...formData, providerName: value })}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting}>
                {submitting ? 'Creating...' : 'Book Appointment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setView('appointments')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isOffline && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          You are offline. New appointments will be queued for sync and marked as &quot;Pending Sync&quot;.
        </div>
      )}
    </div>
  )
}
