// member-import-ai Edge Function
// Receives file content + job config, uses Gemini to parse any document format,
// maps columns to Church OS member fields, and returns structured member data.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.24.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Church OS member fields the AI must map to
const CHURCH_OS_FIELDS = [
  'name', 'first_name', 'last_name', 'email', 'phone_number',
  'gender', 'date_of_birth', 'address', 'city', 'country',
  'membership_status', 'growth_stage', 'date_joined_church',
  'baptism_status', 'baptism_date', 'salvation_date',
  'marital_status', 'ministry_name', 'ministry_role',
  'cell_group_name', 'role_level', 'household_role', 'notes',
]

const GEMINI_SYSTEM_PROMPT = `You are a data extraction AI for Church OS, a church management system.
You will receive raw data extracted from a church membership document.
Your task is to identify every person in the document and map their data to Church OS fields.

CHURCH OS FIELDS YOU MUST MAP TO:
- name: full name
- first_name, last_name: split if separable
- email: email address
- phone_number: normalize to digits only, preserve country code if present
- gender: normalize to exactly 'male', 'female', or 'other'
- date_of_birth: normalize to YYYY-MM-DD
- address: street address
- city, country
- membership_status: map to one of: 'member', 'visitor', 'leader', 'staff'
- growth_stage: map to one of: 'visitor', 'attendee', 'member', 'volunteer', 'leader'
- date_joined_church: normalize to YYYY-MM-DD
- baptism_status: 'baptized' or 'not_baptized'
- baptism_date: YYYY-MM-DD
- salvation_date: YYYY-MM-DD
- marital_status: 'single', 'married', 'widowed', 'divorced'
- ministry_name: the ministry/department/team they belong to (preserve original name)
- ministry_role: their role within that ministry (e.g. 'Alto', 'Section Leader', 'Volunteer')
- cell_group_name: fellowship/cell group name
- role_level: map to numeric level: visitor=5, member=10, volunteer=20, leader=80, staff=85, pastor=90
- household_role: 'head', 'spouse', 'child', 'other'
- notes: any data that does not fit other fields

ALLOCATION RULES:
- If a row/person has role = visitor, guest, or no clear membership: _allocation = 'visitor_pipeline'
- If a row/person has role = member, regular, active: _allocation = 'general_member'
- If a row/person has a specific ministry/department column: _allocation = 'ministry_member'
- If a row/person has role = pastor, elder, deacon, reverend, staff: _allocation = 'leadership'

FAMILY DETECTION:
- Detect family units from same surname + same address, or explicit parent/child/spouse columns
- Group them under the 'families' key

DOCUMENT STRUCTURE DETECTION:
- If the document has section headers that indicate departments, capture them
- Detect if this is: general_members | visitors | department_list | mixed

IMPORTANT RULES:
- Return ONLY valid JSON, nothing else
- Never omit a person/row even if data is sparse
- For missing fields, use null
- Dates must be YYYY-MM-DD or null
- Limit to 2000 members maximum
- Flag rows with data quality issues in _warnings

REQUIRED JSON OUTPUT FORMAT:
{
  "document_type": "general_members|visitors|department_list|mixed",
  "total_rows": N,
  "column_mapping": { "OriginalColumnName": "church_os_field_name" },
  "ai_confidence": { "name": 99, "email": 95, "date_of_birth": 72 },
  "members": [
    {
      "name": "...",
      "first_name": "...",
      "last_name": "...",
      "email": null,
      "phone_number": "...",
      "gender": "male",
      "date_of_birth": null,
      "address": null,
      "city": null,
      "country": null,
      "membership_status": "member",
      "growth_stage": "member",
      "date_joined_church": null,
      "baptism_status": "not_baptized",
      "baptism_date": null,
      "salvation_date": null,
      "marital_status": null,
      "ministry_name": null,
      "ministry_role": null,
      "cell_group_name": null,
      "role_level": 10,
      "household_role": null,
      "notes": null,
      "_source_row": 1,
      "_allocation": "general_member",
      "_warnings": []
    }
  ],
  "families": [
    { "head": "John Doe", "spouse": "Jane Doe", "children": ["Tom Doe"] }
  ],
  "departments_found": ["Choir", "Youth"],
  "allocation_summary": {
    "general_members": 0,
    "visitors": 0,
    "leadership": 0,
    "ministry_members": 0,
    "by_ministry": {}
  },
  "warnings": []
}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const {
      job_id,
      org_id,
      file_content,      // base64 for binary formats (pdf, docx, images)
      file_content_text, // plain text/JSON for already-extracted csv/xlsx data
      file_type,         // csv, xlsx, pdf, docx, txt, image/jpeg, image/png
      org_ministries,    // existing ministries for this org
    } = body

    if (!job_id || !org_id) {
      return new Response(JSON.stringify({ error: 'job_id and org_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update job status to parsing
    await supabase.from('migration_jobs')
      .update({ status: 'parsing' })
      .eq('id', job_id)

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')

    const genai = new GoogleGenerativeAI(geminiKey)
    const model = genai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    })

    const ministriesContext = org_ministries?.length
      ? `\n\nThis church has these existing ministries (match ministry_name to these when possible):\n${org_ministries.map((m: any) => `- ${m.name} (id: ${m.id})`).join('\n')}`
      : ''

    let result: any

    // BINARY FORMATS: send inline to Gemini Vision (PDF, DOCX, images)
    const isBinary = ['pdf', 'docx', 'doc', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file_type?.toLowerCase())

    if (isBinary && file_content) {
      const mimeTypeMap: Record<string, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        'image/jpeg': 'image/jpeg',
        'image/jpg': 'image/jpeg',
        'image/png': 'image/png',
        'image/webp': 'image/webp',
      }
      const mimeType = mimeTypeMap[file_type.toLowerCase()] ?? 'application/octet-stream'

      const geminiResponse = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: file_content, // base64
              }
            },
            {
              text: `${GEMINI_SYSTEM_PROMPT}${ministriesContext}\n\nPlease extract all member data from this document and return the JSON output as specified above.`,
            }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 65536,
        },
      } as any)

      const rawText = geminiResponse.response.text()
      result = JSON.parse(rawText)

    } else if (file_content_text) {
      // TEXT FORMATS: CSV/XLSX already extracted to text/JSON on client, pass as text
      const geminiResponse = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `${GEMINI_SYSTEM_PROMPT}${ministriesContext}\n\nHere is the raw member data extracted from a ${file_type} file:\n\n${file_content_text}\n\nPlease extract all member data and return the JSON output as specified above.`,
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 65536,
        },
      } as any)

      const rawText = geminiResponse.response.text()
      result = JSON.parse(rawText)
    } else {
      throw new Error('No file content provided. Provide file_content (base64) or file_content_text.')
    }

    // Validate result shape
    if (!result?.members || !Array.isArray(result.members)) {
      throw new Error('Gemini returned unexpected format — members array missing')
    }

    // Build allocation summary if AI didn't compute it
    if (!result.allocation_summary?.general_members) {
      const summary: Record<string, any> = { general_members: 0, visitors: 0, leadership: 0, ministry_members: 0, by_ministry: {} }
      for (const m of result.members) {
        if (m._allocation === 'visitor_pipeline') summary.visitors++
        else if (m._allocation === 'leadership') summary.leadership++
        else if (m._allocation === 'ministry_member') summary.ministry_members++
        else summary.general_members++
        if (m.ministry_name) {
          summary.by_ministry[m.ministry_name] = (summary.by_ministry[m.ministry_name] ?? 0) + 1
        }
      }
      result.allocation_summary = summary
    }

    // Persist results back to migration_jobs
    await supabase.from('migration_jobs').update({
      status: 'review',
      total_rows: result.total_rows ?? result.members.length,
      field_mapping: result.column_mapping ?? {},
      ai_confidence: result.ai_confidence ?? {},
      parsed_data: result.members,
      allocation_summary: result.allocation_summary,
      document_type: result.document_type ?? 'general_members',
      departments_found: result.departments_found ?? [],
      error_log: result.warnings?.length ? [{ warnings: result.warnings }] : [],
    }).eq('id', job_id)

    return new Response(JSON.stringify({
      success: true,
      job_id,
      total_rows: result.total_rows ?? result.members.length,
      document_type: result.document_type,
      column_mapping: result.column_mapping,
      ai_confidence: result.ai_confidence,
      members: result.members,
      families: result.families ?? [],
      departments_found: result.departments_found ?? [],
      allocation_summary: result.allocation_summary,
      warnings: result.warnings ?? [],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('member-import-ai error:', err)

    // Mark job as failed if we have a job_id in the body
    try {
      const bodyText = await req.text().catch(() => '{}')
      const { job_id } = JSON.parse(bodyText)
      if (job_id) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        await supabase.from('migration_jobs').update({
          status: 'failed',
          error_log: [{ error: err.message, timestamp: new Date().toISOString() }],
        }).eq('id', job_id)
      }
    } catch { /* best effort */ }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
