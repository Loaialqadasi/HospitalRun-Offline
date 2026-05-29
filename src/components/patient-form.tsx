'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertCircle, ArrowLeft } from 'lucide-react'

interface FormErrors {
  name?: string
  dateOfBirth?: string
  gender?: string
  contact?: string
  email?: string
}

export default function PatientForm() {
  const { setView } = useAppStore()
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    contact: '',
    email: '',
    nationalId: '',
    bloodType: '',
    phone: '',
    address: '',
    assignedDoctor: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<{ show: boolean; patient: Record<string, string> | null }>({ show: false, patient: null })

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!formData.name.trim()) errs.name = 'This field is required'
    if (!formData.dateOfBirth.trim()) errs.dateOfBirth = 'This field is required'
    else {
      const dob = new Date(formData.dateOfBirth)
      if (dob > new Date()) errs.dateOfBirth = 'Date of birth cannot be in the future.'
    }
    if (!formData.gender) errs.gender = 'This field is required'
    if (!formData.contact.trim()) errs.contact = 'This field is required'
    if (formData.email && !formData.email.includes('@')) errs.email = 'Invalid email format. Missing @ symbol.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) return

    setLoading(true)

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contact: formData.contact.replace(/\D/g, ''), // Strip non-numeric chars
          createdBy: useAppStore.getState().currentUser?.username,
        }),
      })

      const data = await res.json()

      if (res.status === 409) {
        // Duplicate detected
        setDuplicateWarning({ show: true, patient: data.duplicatePatient })
        return
      }

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors)
        }
        return
      }

      setSuccessMessage(data.message)
      setFormData({
        name: '',
        dateOfBirth: '',
        gender: '',
        contact: '',
        email: '',
        nationalId: '',
        bloodType: '',
        phone: '',
        address: '',
        assignedDoctor: '',
      })
      
      // Redirect to patient list after a short delay
      setTimeout(() => setView('patients'), 1500)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleForceCreate = async () => {
    setDuplicateWarning({ show: false, patient: null })
    setLoading(true)

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contact: formData.contact.replace(/\D/g, ''),
          createdBy: useAppStore.getState().currentUser?.username,
          forceCreate: true,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccessMessage(data.message)
        setTimeout(() => setView('patients'), 1500)
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setView('patients')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.dateOfBirth}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.gender}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact *</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value.replace(/[^\d+\-() ]/g, '') })}
                  placeholder="Phone number"
                />
                {errors.contact && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.contact}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationalId">National ID</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="e.g., 900101-14-5555"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">Blood Type</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                >
                  <SelectTrigger id="bloodType">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDoctor">Assigned Doctor</Label>
                <Input
                  id="assignedDoctor"
                  value={formData.assignedDoctor}
                  onChange={(e) => setFormData({ ...formData, assignedDoctor: e.target.value })}
                  placeholder="Doctor username"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
                {loading ? 'Registering...' : 'Register Patient'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setView('patients')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Duplicate Warning Dialog */}
      <Dialog open={duplicateWarning.show} onOpenChange={(open) => setDuplicateWarning({ show: open, patient: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Duplicate Patient Detected
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Possible duplicate patient detected. Review existing record.
          </p>
          {duplicateWarning.patient && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm space-y-1">
              <p><strong>Name:</strong> {duplicateWarning.patient.name}</p>
              <p><strong>DOB:</strong> {duplicateWarning.patient.dateOfBirth}</p>
              <p><strong>Contact:</strong> {duplicateWarning.patient.contact}</p>
              <p><strong>ID:</strong> {duplicateWarning.patient.patientId}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateWarning({ show: false, patient: null })}>
              Cancel
            </Button>
            <Button onClick={handleForceCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
              Create Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
