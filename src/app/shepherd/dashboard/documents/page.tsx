"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAdminCtx } from "../Context"
import { FileText, Download, Trash2, Loader2, BookOpen, Calendar, Users, HandCoins, Mic2, Music, Baby, Shield } from "lucide-react"

type DownloadFormat = 'pdf' | 'docx' | 'txt'

interface ChurchDocument {
  id: string
  mode: string
  title: string
  document_data: Record<string, unknown>
  pdf_url: string | null
  created_at: string
  created_by: string | null
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  'sermon-outline':        <Mic2 className="w-4 h-4" />,
  'service-order':         <Music className="w-4 h-4" />,
  'event-brief':           <Calendar className="w-4 h-4" />,
  'stewardship-campaign':  <HandCoins className="w-4 h-4" />,
  'bible-study-guide':     <BookOpen className="w-4 h-4" />,
  'small-group-guide':     <Users className="w-4 h-4" />,
  'youth-lesson':          <Baby className="w-4 h-4" />,
  'admin-document':        <FileText className="w-4 h-4" />,
}

const MODE_LABELS: Record<string, string> = {
  'sermon-outline':        'Sermon Outline',
  'service-order':         'Service Order',
  'event-brief':           'Event Brief',
  'stewardship-campaign':  'Stewardship Campaign',
  'bible-study-guide':     'Bible Study Guide',
  'small-group-guide':     'Small Group Guide',
  'youth-lesson':          'Youth Lesson',
  'admin-document':        'Document',
}

const MODE_COLORS: Record<string, string> = {
  'sermon-outline':        'bg-blue-50 text-blue-700 border-blue-200',
  'service-order':         'bg-purple-50 text-purple-700 border-purple-200',
  'event-brief':           'bg-amber-50 text-amber-700 border-amber-200',
  'stewardship-campaign':  'bg-green-50 text-green-700 border-green-200',
  'bible-study-guide':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'small-group-guide':     'bg-teal-50 text-teal-700 border-teal-200',
  'youth-lesson':          'bg-pink-50 text-pink-700 border-pink-200',
  'admin-document':        'bg-slate-50 text-slate-700 border-slate-200',
}

export default function DocumentsPage() {
  const { orgId } = useAdminCtx()
  const [documents, setDocuments] = useState<ChurchDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState<{ id: string; fmt: DownloadFormat } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (!orgId) return
    loadDocuments()
    supabase.from('organizations').select('name').eq('id', orgId).single()
      .then(({ data }) => { if (data?.name) setOrgName(data.name) })
  }, [orgId])

  async function loadDocuments() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('church_documents')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
    if (!error && data) setDocuments(data)
    setIsLoading(false)
  }

  async function handleDownload(doc: ChurchDocument, fmt: DownloadFormat) {
    setDownloading({ id: doc.id, fmt })
    try {
      const slug = doc.title.replace(/\s+/g, '-').toLowerCase()
      // For PDF, prefer the stored URL if no specific regeneration is needed
      if (fmt === 'pdf' && doc.pdf_url) {
        const a = document.createElement('a')
        a.href = doc.pdf_url
        a.download = `${slug}.pdf`
        a.target = '_blank'
        a.click()
        return
      }
      if (!doc.document_data) return
      const res = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_data: doc.document_data, org_name: orgName, format: fmt }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${slug}.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Documents] Download failed', err)
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document from Mission Control?')) return
    setDeletingId(id)
    await supabase.from('church_documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#0f1f3d] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f1f3d]">ChurchGPT Documents</h1>
            <p className="text-xs text-slate-500">AI-generated documents saved from ChurchGPT sessions</p>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No documents yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Use ChurchGPT in Sermon Planning, Event Planning, or other document modes and save the output here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map(doc => {
            const colorClass = MODE_COLORS[doc.mode] || 'bg-slate-50 text-slate-700 border-slate-200'
            const label = MODE_LABELS[doc.mode] || doc.mode
            const icon = MODE_ICONS[doc.mode] || <FileText className="w-4 h-4" />
            const date = new Date(doc.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

            return (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Mode icon */}
                <div className="w-10 h-10 rounded-lg bg-[#0f1f3d]/5 flex items-center justify-center shrink-0 text-[#0f1f3d]">
                  {icon}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0f1f3d] truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorClass}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-400">{date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(['docx', 'pdf', 'txt'] as DownloadFormat[]).map(fmt => {
                    const isThis = downloading?.id === doc.id && downloading?.fmt === fmt
                    const isBusy = downloading?.id === doc.id && downloading?.fmt !== fmt
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleDownload(doc, fmt)}
                        disabled={isThis || isBusy}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0f1f3d] text-white text-[11px] font-bold hover:bg-[#1b3a6b] transition-colors disabled:opacity-50"
                        title={`Download ${fmt.toUpperCase()}`}
                      >
                        {isThis
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Download className="w-3 h-3" />}
                        {fmt.toUpperCase()}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                    title="Delete"
                  >
                    {deletingId === doc.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
