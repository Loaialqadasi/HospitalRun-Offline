import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Check if data already exists
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    console.log('Database already seeded. Skipping...')
    return
  }

  // Create Users
  await prisma.user.createMany({
    data: [
      { username: 'admin_1', password: 'Admin123!', fullName: 'Admin One', role: 'admin', email: 'admin1@hospital.com' },
      { username: 'admin_2', password: 'Admin123!', fullName: 'Admin Two', role: 'admin', email: 'admin2@hospital.com' },
      { username: 'nurse_1', password: 'Nurse123!', fullName: 'Nurse Jane', role: 'nurse', email: 'nurse1@hospital.com' },
      { username: 'dr_smith', password: 'Doctor123!', fullName: 'Dr. Smith', role: 'clinician', assignedPatientIds: 'PT-102' },
      { username: 'dr_jones', password: 'Doctor123!', fullName: 'Dr. Jones', role: 'clinician', assignedPatientIds: '' },
      { username: 'dr_loai', password: 'Doctor123!', fullName: 'Dr. Loai', role: 'clinician' },
      { username: 'dr_ahmad', password: 'Doctor123!', fullName: 'Dr. Ahmad', role: 'clinician' },
      { username: 'dr_sarah', password: 'Doctor123!', fullName: 'Dr. Sarah', role: 'clinician' },
      { username: 'dr_rohayanti', password: 'Doctor123!', fullName: 'Dr. Rohayanti', role: 'clinician' },
      { username: 'executive_1', password: 'Exec123!', fullName: 'Executive One', role: 'executive', email: 'exec1@hospital.com' },
    ]
  })

  // Create Patients
  await prisma.patient.createMany({
    data: [
      { patientId: 'PT-100', name: 'John Doe', dateOfBirth: '01/01/1990', gender: 'Male', contact: '0123456789', nationalId: '900101-14-5555', phone: '0123456789', createdBy: 'admin_1' },
      { patientId: 'PT-101', name: 'Jane Smith', dateOfBirth: '05/15/1985', gender: 'Female', contact: '0198765432', phone: '0198765432', createdBy: 'admin_1' },
      { patientId: 'PT-102', name: 'Ali Ahmad', dateOfBirth: '03/20/1978', gender: 'Male', contact: '0112233445', assignedDoctor: 'dr_smith', phone: '0112233445', createdBy: 'admin_1' },
      { patientId: 'PT-103', name: 'Siti Aminah', dateOfBirth: '10/10/1995', gender: 'Female', contact: '0198765432', assignedDoctor: 'dr_jones', phone: '0198765432', createdBy: 'admin_1' },
      { patientId: 'PT-200', name: 'Bob Wilson', dateOfBirth: '02/28/1980', gender: 'Male', contact: '0167788990', nationalId: '800228-14-5555', phone: '0167788990', createdBy: 'admin_1' },
    ]
  })

  // Create Medications
  await prisma.medication.createMany({
    data: [
      { name: 'Amoxicillin 250mg', dosage: '250mg', quantity: 50, threshold: 10, unit: 'units' },
      { name: 'Ibuprofen 200mg', dosage: '200mg', quantity: 20, threshold: 10, unit: 'units' },
      { name: 'Aspirin 100mg', dosage: '100mg', quantity: 5, threshold: 10, unit: 'units' },
      { name: 'Paracetamol 500mg', dosage: '500mg', quantity: 12, threshold: 10, unit: 'units' },
      { name: 'Vitamin C 500mg', dosage: '500mg', quantity: 0, threshold: 10, unit: 'units' },
      { name: 'Cough Syrup 100ml', dosage: '100ml', quantity: 19, threshold: 10, unit: 'units' },
    ]
  })

  // Create Appointments
  const aliAhmad = await prisma.patient.findUnique({ where: { patientId: 'PT-102' } })
  if (aliAhmad) {
    await prisma.appointment.create({
      data: {
        patientId: aliAhmad.patientId,
        patientName: aliAhmad.name,
        providerName: 'Dr. Loai',
        date: '20/05/2026',
        startTime: '10:00',
        endTime: '10:30',
        status: 'scheduled',
        notes: 'Regular checkup',
      }
    })
  }

  // Create default settings
  await prisma.setting.createMany({
    data: [
      { key: 'lowStockThreshold', value: '10' },
      { key: 'sessionTimeout', value: '15' },
      { key: 'maxFailedAttempts', value: '5' },
      { key: 'timezone', value: 'UTC' },
    ]
  })

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
