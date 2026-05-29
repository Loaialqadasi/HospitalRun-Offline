'use client'

import { useAppStore } from '@/lib/store'
import { Wifi, WifiOff, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export default function Header() {
  const { currentUser, syncStatus, isOffline, setIsOffline, setSyncStatus, setCurrentUser, setView } = useAppStore()
  const [sessionWarning, setSessionWarning] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  // Session timeout management
  useEffect(() => {
    if (!currentUser) return

    let timeoutId: ReturnType<typeof setTimeout>
    let warningId: ReturnType<typeof setTimeout>
    let lastActivity = Date.now()

    const resetTimer = () => {
      lastActivity = Date.now()
      setSessionWarning(false)
      clearTimeout(timeoutId)
      clearTimeout(warningId)

      // Warning at 14 minutes
      warningId = setTimeout(() => {
        setSessionWarning(true)
      }, 14 * 60 * 1000)

      // Auto-logout at 15 minutes
      timeoutId = setTimeout(() => {
        handleAutoLogout()
      }, 15 * 60 * 1000)
    }

    const handleAutoLogout = async () => {
      if (currentUser) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser.username }),
          })
        } catch {
          // Ignore
        }
      }
      setSessionExpired(true)
      // Show the expired message for 3 seconds, then redirect to login
      setTimeout(() => {
        setCurrentUser(null)
        setView('login')
        setIsOffline(false)
        setSessionExpired(false)
      }, 3000)
    }

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    const activityHandler = () => {
      const now = Date.now()
      // Any activity resets the timer
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      lastActivity = now
      setSessionWarning(false)
      
      warningId = setTimeout(() => {
        setSessionWarning(true)
      }, 14 * 60 * 1000)
      timeoutId = setTimeout(handleAutoLogout, 15 * 60 * 1000)
    }

    events.forEach(e => window.addEventListener(e, activityHandler))
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(warningId)
      events.forEach(e => window.removeEventListener(e, activityHandler))
    }
  }, [currentUser, setCurrentUser, setView, setIsOffline])

  const toggleOffline = useCallback(() => {
    const newOffline = !isOffline
    setIsOffline(newOffline)
    if (newOffline) {
      setSyncStatus('offline')
    } else {
      setSyncStatus('synced')
    }
  }, [isOffline, setIsOffline, setSyncStatus])

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'syncing': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'offline': return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getSyncLabel = () => {
    switch (syncStatus) {
      case 'synced': return 'Synced'
      case 'syncing': return 'Syncing...'
      case 'failed': return 'Failed'
      case 'offline': return 'Offline'
    }
  }

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="w-10" />
        </div>

        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1.5">
              <WifiOff className="w-3 h-3" />
              Offline Mode
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Sync status */}
          <div className="flex items-center gap-2 text-sm">
            {getSyncIcon()}
            <span className="text-gray-600 hidden sm:inline">{getSyncLabel()}</span>
          </div>

          {/* Offline toggle */}
          <button
            onClick={toggleOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isOffline 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isOffline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isOffline ? 'Go Online' : 'Go Offline'}
          </button>

          {/* Session warning */}
          {sessionWarning && (
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              Session expiring soon...
            </div>
          )}
        </div>
      </header>

      {/* Session expired overlay */}
      {sessionExpired && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
            <p className="text-gray-600">Session expired due to inactivity.</p>
          </div>
        </div>
      )}
    </>
  )
}
