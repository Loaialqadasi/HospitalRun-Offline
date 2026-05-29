'use client'

import { useAppStore } from '@/lib/store'
import LoginForm from '@/components/login-form'
import Sidebar from '@/components/sidebar'
import Header from '@/components/header'
import Dashboard from '@/components/dashboard'
import PatientList from '@/components/patient-list'
import PatientForm from '@/components/patient-form'
import PatientDetail from '@/components/patient-detail'
import MedicationList from '@/components/medication-list'
import MedicationDispense from '@/components/medication-dispense'
import MedicationRestock from '@/components/medication-restock'
import AppointmentList from '@/components/appointment-list'
import AppointmentForm from '@/components/appointment-form'
import AnalyticsDashboard from '@/components/analytics-dashboard'
import AuditLog from '@/components/audit-log'
import SyncStatus from '@/components/sync-status'
import SettingsPanel from '@/components/settings-panel'

export default function HomePage() {
  const { currentView, currentUser } = useAppStore()

  // If not logged in, show login
  if (!currentUser || currentView === 'login') {
    return <LoginForm />
  }

  // Render main content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'patients':
        return <PatientList />
      case 'patients-add':
        return <PatientForm />
      case 'patients-detail':
        return <PatientDetail />
      case 'medications':
        return <MedicationList />
      case 'medications-dispense':
        return <MedicationDispense />
      case 'medications-restock':
        return <MedicationRestock />
      case 'appointments':
        return <AppointmentList />
      case 'appointments-add':
        return <AppointmentForm />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'audit-log':
        return <AuditLog />
      case 'sync-status':
        return <SyncStatus />
      case 'settings':
        return <SettingsPanel />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
