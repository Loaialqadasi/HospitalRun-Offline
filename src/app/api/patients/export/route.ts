import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function maskNationalId(nationalId: string | null): string {
  if (!nationalId) return 'N/A'
  // Mask format: ******-**-5555 (show last 4 digits)
  const parts = nationalId.split('-')
  if (parts.length === 3) {
    return `******-**-${parts[2]}`
  }
  // Fallback: mask all but last 4 characters
  if (nationalId.length > 4) {
    return '*'.repeat(nationalId.length - 4) + nationalId.slice(-4)
  }
  return nationalId
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const exportedBy = searchParams.get('exportedBy') || 'unknown'

    const patients = await db.patient.findMany({
      orderBy: { createdAt: 'desc' }
    })

    if (patients.length === 0) {
      // Log export
      await db.exportLog.create({
        data: {
          format,
          recordCount: 0,
          exportedBy,
        }
      })
      return NextResponse.json({ message: 'No Patient Records Available', data: '' })
    }

    let data: string
    let contentType: string
    let filename: string

    if (format === 'pdf') {
      // Generate HTML that can be printed to PDF with masked National IDs
      const rows = patients.map(p => `
        <tr>
          <td style="border:1px solid #ccc;padding:8px;">${p.patientId}</td>
          <td style="border:1px solid #ccc;padding:8px;">${p.name}</td>
          <td style="border:1px solid #ccc;padding:8px;">${p.dateOfBirth}</td>
          <td style="border:1px solid #ccc;padding:8px;">${p.gender}</td>
          <td style="border:1px solid #ccc;padding:8px;">${p.contact}</td>
          <td style="border:1px solid #ccc;padding:8px;">${maskNationalId(p.nationalId)}</td>
          <td style="border:1px solid #ccc;padding:8px;">${p.assignedDoctor || 'N/A'}</td>
        </tr>
      `).join('')

      data = `<!DOCTYPE html>
<html>
<head><title>Patient Export - PDF</title>
<style>body{font-family:Arial,sans-serif;margin:20px;}table{border-collapse:collapse;width:100%;}th{background:#0d9488;color:#fff;border:1px solid #ccc;padding:8px;}h1{color:#0d9488;}</style></head>
<body>
<h1>HospitalRun - Patient Records</h1>
<p>Exported on: ${new Date().toLocaleString()}</p>
<table>
<thead><tr><th>ID</th><th>Name</th><th>DOB</th><th>Gender</th><th>Contact</th><th>National ID</th><th>Assigned Doctor</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`
      contentType = 'text/html'
      filename = 'patients-export.html'
    } else {
      // CSV format
      const headers = ['ID', 'Name', 'DOB', 'Gender', 'Contact', 'Email', 'National ID', 'Blood Type', 'Phone', 'Address', 'Assigned Doctor']
      const csvRows = patients.map(p => [
        p.patientId,
        p.name,
        p.dateOfBirth,
        p.gender,
        p.contact,
        p.email || '',
        p.nationalId || '',
        p.bloodType || '',
        p.phone || '',
        (p.address || '').replace(/,/g, ';'),
        p.assignedDoctor || ''
      ].map(v => `"${v}"`).join(','))

      data = [headers.join(','), ...csvRows].join('\n')
      contentType = 'text/csv'
      filename = 'patients-export.csv'
    }

    // Log export
    await db.exportLog.create({
      data: {
        format,
        recordCount: patients.length,
        exportedBy,
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'export',
        entity: 'patient',
        details: `Exported ${patients.length} patients as ${format.toUpperCase()}`,
        userId: exportedBy,
      }
    })

    return NextResponse.json({ data, contentType, filename, recordCount: patients.length })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
