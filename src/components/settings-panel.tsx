'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function SettingsPanel() {
  const { currentUser } = useAppStore()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data.settings || {})
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          updatedBy: currentUser?.username,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
        setMessage('Settings saved successfully.')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch {
      setMessage('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You do not have permission to access Settings.</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">System configuration</p>
        </div>
        <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-teal-600" /> General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settings.lowStockThreshold || '10'}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })}
              />
              <p className="text-xs text-gray-500">Medications below this quantity will trigger a low stock alert</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout || '15'}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
              />
              <p className="text-xs text-gray-500">Auto-logout after this period of inactivity</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFailedAttempts">Max Failed Login Attempts</Label>
              <Input
                id="maxFailedAttempts"
                type="number"
                value={settings.maxFailedAttempts || '5'}
                onChange={(e) => setSettings({ ...settings, maxFailedAttempts: e.target.value })}
              />
              <p className="text-xs text-gray-500">Account will be locked after this many failed attempts</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone || 'UTC'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              />
              <p className="text-xs text-gray-500">Default timezone for appointment storage</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
