'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, Users, Calendar, Pill, Filter } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsData {
  patientCount: number
  appointmentStats: { total: number; completed: number; scheduled: number; cancelled: number }
  medicationStats: { total: number; lowStock: number; outOfStock: number }
  appointmentTrends: { month: string; count: number }[]
  medicationUsage: { name: string; dispensed: number }[]
  lowStockMedications: { id: string; name: string; quantity: number; threshold: number }[]
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    provider: '',
  })
  const [dateError, setDateError] = useState('')

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      if (filters.department) params.set('department', filters.department)
      if (filters.provider) params.set('provider', filters.provider)

      const res = await fetch(`/api/analytics?${params.toString()}`)
      const d = await res.json()
      setData(d)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleApplyFilters = () => {
    // Validate date range
    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      setDateError('End date must be after Start date.')
      return
    }
    setDateError('')
    setLoading(true)
    fetchAnalytics()
  }

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', department: '', provider: '' })
    setDateError('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  const hasNoData = !data || (data.appointmentTrends.length === 0 && data.medicationUsage.length === 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Hospital performance metrics</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Department</Label>
              <Select value={filters.department} onValueChange={(value) => setFilters({ ...filters, department: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="pediatrics">Pediatrics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Provider</Label>
              <Select value={filters.provider} onValueChange={(value) => setFilters({ ...filters, provider: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loai">Dr. Loai</SelectItem>
                  <SelectItem value="ahmad">Dr. Ahmad</SelectItem>
                  <SelectItem value="sarah">Dr. Sarah</SelectItem>
                  <SelectItem value="smith">Dr. Smith</SelectItem>
                  <SelectItem value="jones">Dr. Jones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {dateError && (
            <p className="text-sm text-red-600 mt-2">{dateError}</p>
          )}
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={handleApplyFilters}
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={!!dateError}
            >
              Apply
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Patients</p>
                <p className="text-2xl font-bold">{data?.patientCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Appointments</p>
                <p className="text-2xl font-bold">{data?.appointmentStats.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Low Stock</p>
                <p className="text-2xl font-bold">{data?.medicationStats.lowStock || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Out of Stock</p>
                <p className="text-2xl font-bold">{data?.medicationStats.outOfStock || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appointment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {hasNoData || !data?.appointmentTrends?.length ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.appointmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={{ fill: '#0d9488' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medication Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.medicationUsage?.length ? (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.medicationUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="dispensed" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{data?.appointmentStats.scheduled || 0}</p>
              <p className="text-sm text-green-600">Scheduled</p>
            </div>
            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-700">{data?.appointmentStats.completed || 0}</p>
              <p className="text-sm text-teal-600">Completed</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{data?.appointmentStats.cancelled || 0}</p>
              <p className="text-sm text-red-600">Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
