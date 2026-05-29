'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Pill, AlertTriangle, Package } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  quantity: number
  threshold: number
  unit: string
  createdAt: string
  updatedAt: string
}

export default function MedicationList() {
  const { setView, selectMedication } = useAppStore()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([])

  useEffect(() => {
    fetchMedications()
  }, [])

  const fetchMedications = async () => {
    try {
      const res = await fetch('/api/medications')
      const data = await res.json()
      setMedications(data.medications || [])
      
      // Check for low stock
      const alerts = (data.medications || [])
        .filter((m: Medication) => m.quantity <= m.threshold)
        .map((m: Medication) => `Alert: ${m.name} has reached low stock.`)
      setLowStockAlerts(alerts)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (med: Medication) => {
    if (med.quantity === 0) return { label: 'Out of Stock', color: 'bg-gray-200 text-gray-600', textColor: 'text-gray-400' }
    if (med.quantity <= med.threshold) return { label: 'Low Stock', color: 'bg-red-100 text-red-700', textColor: 'text-red-600' }
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', textColor: 'text-green-600' }
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
          <h1 className="text-2xl font-bold text-gray-900">Medication Inventory</h1>
          <p className="text-gray-500 mt-1">{medications.length} medications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setView('medications-dispense')} variant="outline" className="border-teal-600 text-teal-700">
            <Pill className="w-4 h-4 mr-2" /> Dispense
          </Button>
          <Button onClick={() => setView('medications-restock')} variant="outline" className="border-teal-600 text-teal-700">
            <Package className="w-4 h-4 mr-2" /> Restock
          </Button>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.map((alert, i) => (
                <p key={i} className="text-sm text-amber-700 font-medium">{alert}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medication Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No medications found
                    </TableCell>
                  </TableRow>
                ) : (
                  medications.map(med => {
                    const status = getStockStatus(med)
                    return (
                      <TableRow key={med.id} className={`hover:bg-gray-50 ${med.quantity === 0 ? 'opacity-60' : ''}`}>
                        <TableCell className="font-medium">
                          {med.name}
                          {med.quantity === 0 && (
                            <span className="ml-2 text-gray-400 text-xs">(Out of Stock)</span>
                          )}
                        </TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell className={status.textColor}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{med.quantity}</span>
                            <span className="text-xs">{med.unit}</span>
                          </div>
                          {/* Stock level bar */}
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                med.quantity === 0 ? 'bg-gray-300' :
                                med.quantity <= med.threshold ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((med.quantity / (med.threshold * 3)) * 100, 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>{med.threshold} {med.unit}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
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
