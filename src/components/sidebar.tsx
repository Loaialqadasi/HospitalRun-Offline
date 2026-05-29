'use client'

import { useAppStore, type AppView } from '@/lib/store'
import { 
  Home, Users, UserPlus, Pill, FlaskConical, Package, 
  Calendar, CalendarPlus, BarChart3, FileText, 
  RefreshCw, Settings, LogOut, ChevronDown, ChevronRight, Heart
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  view: AppView
  icon: React.ElementType
  children?: { label: string; view: AppView; icon: React.ElementType }[]
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: Home },
  { 
    label: 'Patients', view: 'patients', icon: Users,
    children: [
      { label: 'Patient List', view: 'patients', icon: Users },
      { label: 'Add New Patient', view: 'patients-add', icon: UserPlus },
    ]
  },
  { 
    label: 'Medications', view: 'medications', icon: Pill,
    children: [
      { label: 'Inventory', view: 'medications', icon: FlaskConical },
      { label: 'Dispense', view: 'medications-dispense', icon: Pill },
      { label: 'Restock', view: 'medications-restock', icon: Package },
    ]
  },
  { 
    label: 'Appointments', view: 'appointments', icon: Calendar,
    children: [
      { label: 'Calendar', view: 'appointments', icon: Calendar },
      { label: 'New Booking', view: 'appointments-add', icon: CalendarPlus },
    ]
  },
  { label: 'Analytics', view: 'analytics', icon: BarChart3 },
  { label: 'Audit Log', view: 'audit-log', icon: FileText },
  { label: 'Sync Status', view: 'sync-status', icon: RefreshCw },
  { label: 'Settings', view: 'settings', icon: Settings, adminOnly: true },
]

export default function Sidebar() {
  const { currentView, setView, currentUser, setCurrentUser, setIsOffline } = useAppStore()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Patients: true,
    Medications: true,
    Appointments: true,
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username }),
        })
      } catch {
        // Ignore logout errors
      }
    }
    setCurrentUser(null)
    setIsOffline(false)
    setView('login')
  }

  const handleNavClick = (view: AppView) => {
    setView(view)
    setMobileOpen(false)
  }

  const renderNavItem = (item: NavItem) => {
    if (item.adminOnly && currentUser?.role !== 'admin') return null

    const isActive = currentView === item.view || 
      (item.children && item.children.some(c => c.view === currentView))
    const isExpanded = expandedItems[item.label]

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (item.children) {
              toggleExpand(item.label)
            } else {
              handleNavClick(item.view)
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive && !item.children
              ? 'bg-teal-100 text-teal-800'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.children && (
            isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        {item.children && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children.map(child => (
              <button
                key={child.label}
                onClick={() => handleNavClick(child.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  currentView === child.view
                    ? 'bg-teal-100 text-teal-800 font-medium'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                )}
              >
                <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{child.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border"
        aria-label="Toggle menu"
      >
        <Heart className="w-5 h-5 text-teal-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-teal-800 text-lg leading-tight">HospitalRun</h1>
              <p className="text-xs text-gray-400">HIS v2.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 max-h-[calc(100vh-180px)]">
          {navItems.map(renderNavItem)}
        </nav>

        {/* User info & Logout */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 px-3">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-medium text-sm">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
