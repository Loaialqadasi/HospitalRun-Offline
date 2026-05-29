import { create } from 'zustand'

export type AppView =
  | 'login'
  | 'dashboard'
  | 'patients'
  | 'patients-add'
  | 'patients-detail'
  | 'medications'
  | 'medications-dispense'
  | 'medications-restock'
  | 'appointments'
  | 'appointments-add'
  | 'analytics'
  | 'audit-log'
  | 'settings'
  | 'sync-status'

export interface CurrentUser {
  id: string
  username: string
  fullName: string
  role: string
  email?: string | null
  assignedPatientIds?: string | null
}

interface AppState {
  currentView: AppView
  selectedPatientId: string | null
  selectedMedicationId: string | null
  currentUser: CurrentUser | null
  syncStatus: 'synced' | 'syncing' | 'failed' | 'offline'
  isOffline: boolean
  setView: (view: AppView) => void
  selectPatient: (id: string | null) => void
  selectMedication: (id: string | null) => void
  setCurrentUser: (user: CurrentUser | null) => void
  setSyncStatus: (status: 'synced' | 'syncing' | 'failed' | 'offline') => void
  setIsOffline: (offline: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'login',
  selectedPatientId: null,
  selectedMedicationId: null,
  currentUser: null,
  syncStatus: 'synced',
  isOffline: false,
  setView: (view) => set({ currentView: view }),
  selectPatient: (id) => set({ selectedPatientId: id }),
  selectMedication: (id) => set({ selectedMedicationId: id }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setSyncStatus: (status) => set({ syncStatus: status }),
  setIsOffline: (offline) => set({ isOffline: offline }),
}))
