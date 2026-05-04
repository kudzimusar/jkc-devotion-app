import { NextRequest, NextResponse } from 'next/server'

// Converts non-image/non-PDF attachments to plain text so they can be sent to the AI.
// Accepts: { data: string (base64), mimeType: string, name?: string }
// Returns: { text: string }

export async function POST(req: NextRequest) {
  try {
    const { data, mimeType, name = '' } = await req.json()

    if (!data || !mimeType) {
      return NextResponse.json({ error: 'data and mimeType are required' }, { status: 400 })
    }

    const buffer = Buffer.from(data, 'base64')
    let text = ''

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'text/csv' ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv')
    ) {
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const parts: string[] = []
      for (const sheetName of workbook.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
        parts.push(`[Sheet: ${sheetName}]\n${csv}`)
      }
      text = parts.join('\n\n')
    } else if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      name.endsWith('.txt') ||
      name.endsWith('.md')
    ) {
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 415 })
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err: any) {
    console.error('[read-attachment]', err)
    return NextResponse.json({ error: err.message ?? 'Extraction failed' }, { status: 500 })
  }
}
