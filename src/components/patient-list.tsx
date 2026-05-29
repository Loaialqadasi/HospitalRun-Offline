'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Download, Eye, Trash2, Edit } from 'lucide-react'

interface Patient {
  id: string
  patientId: string
  name: string
  dateOfBirth: string
  gender: string
  contact: string
  email?: string | null
  nationalId?: string | null
  assignedDoctor?: string | null
  createdBy?: string | null
}

export default function PatientList() {
  const { setView, selectPatient, currentUser } = useAppStore()
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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

  const handleExport = async (format: string) => {
    try {
      const res = await fetch(`/api/patients/export?format=${format}&exportedBy=${currentUser?.username || 'unknown'}`)
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

  const handleDelete = async (patient: Patient) => {
    if (!confirm(`Are you sure you want to delete patient ${patient.patientId}?`)) return
    
    try {
      const res = await fetch(`/api/patients/${patient.id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        alert(data.message)
        fetchPatients()
      }
    } catch {
      alert('Delete failed')
    }
  }

  const canDelete = currentUser?.role === 'admin'

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId.toLowerCase().includes(search.toLowerCase()) ||
    (p.assignedDoctor && p.assignedDoctor.toLowerCase().includes(search.toLowerCase()))
  )

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
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">{filteredPatients.length} patient records</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button onClick={() => setView('patients-add')} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Patient
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search patients by name, ID, or doctor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patient Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned Doctor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No patients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map(patient => (
                    <TableRow key={patient.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-teal-700">{patient.patientId}</TableCell>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell>{patient.dateOfBirth}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell>{patient.assignedDoctor || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              selectPatient(patient.id)
                              setView('patients-detail')
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              selectPatient(patient.id)
                              setView('patients-detail')
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(patient)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
