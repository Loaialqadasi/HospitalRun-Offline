'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Edit, Trash2, Download, Save } from 'lucide-react'

interface Patient {
  id: string
  patientId: string
  name: string
  dateOfBirth: string
  gender: string
  contact: string
  email?: string | null
  nationalId?: string | null
  bloodType?: string | null
  phone?: string | null
  address?: string | null
  assignedDoctor?: string | null
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export default function PatientDetail() {
  const { selectedPatientId, setView, currentUser, selectPatient } = useAppStore()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Record<string, string>>({})
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatient()
    }
  }, [selectedPatientId])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}`)
      const data = await res.json()
      setPatient(data.patient)
      setEditData({
        name: data.patient.name,
        dateOfBirth: data.patient.dateOfBirth,
        gender: data.patient.gender,
        contact: data.patient.contact,
        email: data.patient.email || '',
        nationalId: data.patient.nationalId || '',
        bloodType: data.patient.bloodType || '',
        phone: data.patient.phone || '',
        address: data.patient.address || '',
        assignedDoctor: data.patient.assignedDoctor || '',
      })
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const canEdit = () => {
    if (!currentUser || !patient) return false
    if (currentUser.role === 'admin' || currentUser.role === 'nurse') return true
    if (currentUser.role === 'clinician') {
      return patient.assignedDoctor === currentUser.username || 
             (currentUser.assignedPatientIds && currentUser.assignedPatientIds.split(',').includes(patient.patientId))
    }
    return false
  }

  const canDelete = currentUser?.role === 'admin'

  const handleSave = async () => {
    if (!patient) return
    
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          updatedBy: currentUser?.username,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPatient(data.patient)
        setEditing(false)
        setSaveMessage('Patient updated successfully.')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        const data = await res.json()
        if (data.errors) {
          alert(Object.values(data.errors).join('\n'))
        }
      }
    } catch {
      alert('Failed to update patient')
    }
  }

  const handleDelete = async () => {
    if (!patient) return
    
    try {
      const res = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        setView('patients')
        selectPatient(null)
      }
    } catch {
      alert('Delete failed')
    }
  }

  const handleExportPdf = async () => {
    try {
      const res = await fetch(`/api/patients/export?format=pdf&exportedBy=${currentUser?.username || 'unknown'}`)
      const data = await res.json()
      
      if (data.message === 'No Patient Records Available') {
        alert('No Patient Records Available')
        return
      }

      const blob = new Blob([data.data], { type: data.contentType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Button onClick={() => setView('patients')} className="mt-4">Back to Patients</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setView('patients'); selectPatient(null) }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
            <p className="text-gray-500">{patient.patientId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit() && (
            <Button
              onClick={() => setEditing(!editing)}
              variant={editing ? 'default' : 'outline'}
              className={editing ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'border-teal-600 text-teal-700'}
              disabled={editing ? false : !canEdit()}
            >
              {editing ? <><Save className="w-4 h-4 mr-2" /> Save</> : <><Edit className="w-4 h-4 mr-2" /> Edit Profile</>}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Patient
            </Button>
          )}
          <Button variant="outline" onClick={handleExportPdf}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
          {saveMessage}
        </div>
      )}

      {!canEdit() && !editing && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
          You do not have permission to edit this patient&apos;s profile.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={editData.dateOfBirth} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Input value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input value={editData.contact} onChange={(e) => setEditData({ ...editData, contact: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>National ID</Label>
                <Input value={editData.nationalId} onChange={(e) => setEditData({ ...editData, nationalId: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Input value={editData.bloodType} onChange={(e) => setEditData({ ...editData, bloodType: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Assigned Doctor</Label>
                <Input value={editData.assignedDoctor} onChange={(e) => setEditData({ ...editData, assignedDoctor: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><p className="text-sm text-gray-500">Patient ID</p><p className="font-medium text-teal-700">{patient.patientId}</p></div>
              <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{patient.name}</p></div>
              <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{patient.dateOfBirth}</p></div>
              <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{patient.gender}</p></div>
              <div><p className="text-sm text-gray-500">Contact</p><p className="font-medium">{patient.contact}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{patient.email || '—'}</p></div>
              <div><p className="text-sm text-gray-500">National ID</p><p className="font-medium">{patient.nationalId || '—'}</p></div>
              <div><p className="text-sm text-gray-500">Blood Type</p><p className="font-medium">{patient.bloodType || '—'}</p></div>
              <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{patient.phone || '—'}</p></div>
              <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{patient.address || '—'}</p></div>
              <div><p className="text-sm text-gray-500">Assigned Doctor</p><p className="font-medium">{patient.assignedDoctor || '—'}</p></div>
              <div><p className="text-sm text-gray-500">Created By</p><p className="font-medium">{patient.createdBy || '—'}</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete patient <strong>{patient.patientId}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
