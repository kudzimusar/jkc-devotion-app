import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildPDF, getDocumentTitle } from '@/lib/pdf/ChurchGPTPDF'
import { buildDocx } from '@/lib/pdf/ChurchGPTDOCX'
import { buildTXT } from '@/lib/pdf/ChurchGPTTXT'

export async function POST(req: NextRequest) {
  try {
    const { document_data, org_name = 'Church OS', format = 'pdf' } = await req.json()

    if (!document_data || typeof document_data !== 'object') {
      return NextResponse.json({ error: 'document_data is required' }, { status: 400 })
    }

    const data = document_data as Record<string, unknown>
    const title = getDocumentTitle(data)
    const safeFilename = title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase()

    if (format === 'docx') {
      const buffer = await buildDocx(data, org_name)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeFilename}.docx"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'txt') {
      const text = buildTXT(data, org_name)
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename}.txt"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // default: pdf
    const element = buildPDF(data, org_name)
    // Cast required: renderToBuffer expects DocumentProps generic but our builder returns ReactElement
    const buffer = await renderToBuffer(element as any)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[generate-document]', err)
    return NextResponse.json({ error: err.message ?? 'Document generation failed' }, { status: 500 })
  }
}
