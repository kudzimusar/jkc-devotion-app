import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { buildPDF, getDocumentTitle } from '@/lib/pdf/ChurchGPTPDF'

export async function POST(req: NextRequest) {
  try {
    const { document_data, org_name = 'Church OS' } = await req.json()

    if (!document_data || typeof document_data !== 'object') {
      return NextResponse.json({ error: 'document_data is required' }, { status: 400 })
    }

    const element = buildPDF(document_data as Record<string, unknown>, org_name)
    // Cast required: renderToBuffer expects DocumentProps generic but our builder returns ReactElement
    const buffer = await renderToBuffer(element as any)

    const title = getDocumentTitle(document_data as Record<string, unknown>)
    const safeFilename = title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase()

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[generate-document]', err)
    return NextResponse.json({ error: err.message ?? 'PDF generation failed' }, { status: 500 })
  }
}
