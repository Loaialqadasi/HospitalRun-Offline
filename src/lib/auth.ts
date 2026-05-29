import { db } from './db'

export async function authenticateUser(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } })
  
  if (!user) {
    return { success: false, error: 'Invalid credentials.' }
  }

  if (user.locked) {
    return { success: false, error: 'Account Locked. 5 failed attempts reached.' }
  }

  if (user.password !== password) {
    const newAttempts = user.failedAttempts + 1
    
    if (newAttempts >= 5) {
      await db.user.update({
        where: { id: user.id },
        data: { failedAttempts: newAttempts, locked: true }
      })
      return { success: false, error: 'Account Locked. 5 failed attempts reached.' }
    }
    
    await db.user.update({
      where: { id: user.id },
      data: { failedAttempts: newAttempts }
    })
    
    return { success: false, error: 'Invalid credentials.' }
  }

  // Successful login - reset failed attempts and update last activity
  await db.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lastActivity: new Date() }
  })

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      assignedPatientIds: user.assignedPatientIds,
    }
  }
}

export async function updateLastActivity(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { lastActivity: new Date() }
  })
}

export async function checkSessionTimeout(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user || !user.lastActivity) return true
  
  const now = new Date()
  const lastActivity = new Date(user.lastActivity)
  const diffMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)
  
  return diffMinutes >= 15
}

export async function lockUserAccount(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { locked: true, failedAttempts: 5 }
  })
}

export function canEditPatient(user: { role: string; assignedPatientIds?: string | null }, patientAssignedDoctor?: string | null): boolean {
  if (user.role === 'admin') return true
  if (user.role === 'nurse') return true
  if (user.role === 'clinician') {
    if (!user.assignedPatientIds) return false
    // Check if the patient is assigned to this clinician
    const assignedIds = user.assignedPatientIds.split(',').map(id => id.trim()).filter(Boolean)
    return assignedIds.includes(patientAssignedDoctor || '') || 
           (patientAssignedDoctor === user.username)
  }
  return false
}

export function canDeletePatient(role: string): boolean {
  return role === 'admin'
}
