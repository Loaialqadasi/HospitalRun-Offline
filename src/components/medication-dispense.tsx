'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Pill } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  quantity: number
  threshold: number
  unit: string
}

export default function MedicationDispense() {
  const { setView, isOffline, setSyncStatus } = useAppStore()
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMedId, setSelectedMedId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    try {
      const res = await fetch('/api/medications')
      const data = await res.json()
      setMedications(data.medications || [])
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const selectedMed = medications.find(m => m.id === selectedMedId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMedId || !quantity) return

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/medications/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicationId: selectedMedId,
          quantity: parseInt(quantity),
          dispensedBy: useAppStore.getState().currentUser?.username,
          isOffline,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Dispense failed' })
        return
      }

      if (data.queued) {
        setMessage({ type: 'warning', text: data.message })
        setSyncStatus('syncing')
      } else {
        setMessage({ type: 'success', text: data.message })
      }

      if (data.lowStockAlert) {
        setMessage({ type: 'warning', text: `${data.message}\n${data.lowStockAlert}` })
      }

      setQuantity('')
      setSelectedMedId('')
      fetchMedications()
    } catch {
      setMessage({ type: 'error', text: 'Failed to dispense medication' })
    } finally {
      setSubmitting(false)
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
        <Button variant="ghost" onClick={() => setView('medications')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Dispense Medication</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" /> Dispense Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medication">Select Medication</Label>
              <Select value={selectedMedId} onValueChange={setSelectedMedId}>
                <SelectTrigger id="medication">
                  <SelectValue placeholder="Choose a medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map(med => (
                    <SelectItem key={med.id} value={med.id} disabled={med.quantity === 0}>
                      {med.name} ({med.dosage}) — {med.quantity} {med.unit} available
                      {med.quantity === 0 ? ' (Out of Stock)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMed && (
              <div className="p-3 bg-teal-50 rounded-lg text-sm">
                <p><strong>Current Stock:</strong> {selectedMed.quantity} {selectedMed.unit}</p>
                <p><strong>Threshold:</strong> {selectedMed.threshold} {selectedMed.unit}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Dispense</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !selectedMedId}>
              {submitting ? 'Dispensing...' : 'Dispense'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isOffline && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          You are offline. Dispensed medications will be queued for sync.
        </div>
      )}
    </div>
  )
}
