'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, AlertTriangle, RefreshCw, Plus, FileText } from 'lucide-react'

interface DashboardData {
  patientCount: number
  appointmentStats: { total: number; completed: number; scheduled: number; cancelled: number }
  medicationStats: { total: number; lowStock: number; outOfStock: number }
  syncStats: { pending: number; failed: number }
  lowStockMedications: { id: string; name: string; quantity: number; threshold: number }[]
}

export default function Dashboard() {
  const { setView, currentUser } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/analytics')
      const d = await res.json()
      setData(d)
    } catch {
      // Handle error silently
    } finally {
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {currentUser?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('patients-add')} className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Patient
          </Button>
          <Button onClick={() => setView('appointments-add')} variant="outline" className="border-teal-600 text-teal-700">
            <Calendar className="w-4 h-4 mr-2" /> New Appointment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{data?.patientCount || 0}</p>
              </div>
              <Users className="w-8 h-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{data?.appointmentStats.scheduled || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{data?.medicationStats.lowStock || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Syncs</p>
                <p className="text-2xl font-bold text-gray-900">{data?.syncStats.pending || 0}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data?.lowStockMedications && data.lowStockMedications.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.lowStockMedications.map(med => (
                <div key={med.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <p className="font-medium text-amber-900">Alert: {med.name} has reached low stock.</p>
                    <p className="text-sm text-amber-600">Quantity: {med.quantity} / Threshold: {med.threshold}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setView('medications-restock')} className="text-amber-700 border-amber-300">
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('patients')}>
          <CardContent className="p-6 text-center">
            <Users className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Manage Patients</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage patient records</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('medications')}>
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Medication Inventory</h3>
            <p className="text-sm text-gray-500 mt-1">Track and manage medications</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setView('analytics')}>
          <CardContent className="p-6 text-center">
            <Calendar className="w-10 h-10 text-teal-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-500 mt-1">View reports and analytics</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
