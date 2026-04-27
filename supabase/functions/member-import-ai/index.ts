// member-import-ai Edge Function
// Receives file content + job config, uses Gemini to parse any document format,
// maps columns to ALL Church OS profile fields, extracts families, pastoral notes,
// and skill data in a single AI pass.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/generative-ai@0.24.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_SYSTEM_PROMPT = `You are a data extraction AI for Church OS, a church management system.
Your mission: extract EVERY piece of information from the document and map it to Church OS's full profile schema.
A single upload must simultaneously populate member profiles, family households, ministry assignments, skills, and pastoral notes.
Be thorough — incomplete extraction means lost data and incomplete profiles for church leadership.

=== PART 1: MEMBER FIELDS ===

Extract every person. For each person populate every available field:

IDENTITY:
- name: full name including honorifics (Dr., Rev., Pastor)
- first_name, last_name: split, exclude honorifics
- email: as-is
- phone_number: digits only, keep country code if present
- gender: infer from name/title if not stated → 'male', 'female', or 'other'
- date_of_birth: YYYY-MM-DD
- address, city, country, postal_code
- nationality: infer from name/email domain/context if not stated
- preferred_language: infer from nationality/country

CHURCH STATUS:
- membership_status: 'member', 'visitor', 'leader', 'staff'
- growth_stage: 'visitor', 'attendee', 'member', 'volunteer', 'leader'
- date_joined_church: YYYY-MM-DD (CONVERT EXCEL SERIALS — see Part 3)
- first_visit_date: YYYY-MM-DD (same as date_joined_church for new members)
- baptism_status: 'baptized' or 'not_baptized'
- baptism_date: YYYY-MM-DD
- salvation_date: YYYY-MM-DD
- marital_status: 'single', 'married', 'widowed', 'divorced'
- wedding_anniversary: YYYY-MM-DD if detectable
- membership_date: YYYY-MM-DD (when they became full member, same as date_joined_church if unclear)
- foundations_completed: true/false (if notes mention foundations/new members class)
- tithe_status: true if notes mention tithing/regular giving, false otherwise

VOCATION & SKILLS:
- occupation: their profession/job outside church
- industry: infer from occupation (e.g. occupation='teacher' → industry='Education')
- education_level: if mentioned
- skill_notes: extract any skills, talents or expertise mentioned in notes that are relevant to church ministry (e.g. 'Sound engineering', 'Soprano vocalist', 'Finance/accounting')

CHURCH ROLE:
- role: their exact church title/role as stated in the document
- ministry_name: primary ministry/department (preserve original name exactly)
- ministry_role: specific role within ministry (e.g. 'Alto', 'Section Leader', 'Sound Engineer', 'Treasurer')
- cell_group_name: fellowship/cell/small group name
- role_level: numeric level (see Part 2)
- household_role: 'head', 'spouse', 'child', 'other'
- ordained_date: YYYY-MM-DD if person is an ordained pastor/elder/deacon and date is available
- leadership_training_date: YYYY-MM-DD if mentioned

IMPORT INTELLIGENCE (critical — used to populate other tables):
- pastoral_note: FULL verbatim text from any notes/additional info column. Capture everything. This goes into the pastoral notes database for leadership review.
- _household_key: short snake_case key linking this person to their family unit (e.g. 'adeyemi_family'). Set to null only if no family connection detected.
- secondary_ministry_names: array of additional ministries inferred from notes. E.g. notes say "Also helps with sound" and primary is Choir → ["Sound"]. Be thorough.
- notes: any remaining data that does not fit other fields

=== PART 2: ROLE → ALLOCATION MAPPING ===

Use this EXACT table. Never deviate:

_allocation='leadership', role_level=90, membership_status='leader':
  Senior Pastor, Lead Pastor, Bishop, Archbishop, Apostle, Reverend, Founder

_allocation='leadership', role_level=88:
  Pastor, Co-Pastor

_allocation='leadership', role_level=85:
  Assistant Pastor, Associate Pastor, Deputy Pastor

_allocation='leadership', role_level=82:
  Elder, Overseer

_allocation='leadership', role_level=80:
  Deacon, Deaconess, Board Member, Trustee

_allocation='leadership', role_level=78:
  Youth Leader, Children's Leader, Department Head, Ministry Lead, Ministry Leader,
  Team Leader, Coordinator, Choir Director, Worship Leader, Cell Leader

_allocation='leadership', role_level=70:
  Guest Speaker, Visiting Pastor, Visiting Minister, Conference Speaker
  ⚠️ GUEST SPEAKERS ARE MINISTERS — NEVER put them in visitor_pipeline

_allocation='ministry_member', role_level=20, membership_status='member':
  Volunteer, Helper, Servant

_allocation='ministry_member', role_level=15:
  Choir Member, Vocalist, Alto, Soprano, Tenor, Bass, Instrumentalist, Musician

_allocation='ministry_member', role_level=10:
  Regular Member, General Member, Active Member, Disciple
  Unknown/unrecognised role BUT has a Primary Ministry value → still ministry_member

_allocation='visitor_pipeline', role_level=5, membership_status='visitor':
  Visitor, Guest
  Unknown role AND no Primary Ministry value
  Anyone described as visiting, new, first-time, just moved, walked in

=== PART 3: DATE HANDLING ===

EXCEL DATE SERIALS: Numbers between 25000–55000 in date fields are Excel serial dates.
Convert using: Date = January 1, 1900 + (serial - 2) days
Examples:
  42167 → 2015-05-14
  43101 → 2018-01-26
  44150 → 2020-10-16
  44834 → 2022-09-25
  46127 → 2026-04-22
  46132 → 2026-04-27
  46138 → 2026-05-03
  46139 → 2026-05-04

ALWAYS output YYYY-MM-DD. Never leave a number in a date field.

=== PART 4: FAMILY EXTRACTION ===

Detect family units from:
- Explicit Family Info / Spouse / Children columns
- "Married to X", "Son/Daughter of Y", "Spouse: Z"
- Same surname + context suggesting relationship
- Children mentioned in parent's row who may not be separate rows

For each family create a record:
- family_key: snake_case (e.g. 'adeyemi_family')
- family_name: "Surname Family"
- head_name: household head's full name
- spouse_name: spouse's full name or null
- children_names: ALL children including those mentioned but not in separate rows
- total_members: total count including children mentioned but absent from rows
- has_children: true/false

Every member belonging to a family MUST have _household_key set.

=== PART 5: SECONDARY MINISTRY & SKILLS ===

Read notes carefully:
- "Soprano lead" → ministry_role: "Soprano", skill_notes includes "Soprano vocalist"
- "Expert in sound engineering" → skill_notes: "Sound engineering", secondary_ministry_names: ["Sound"] if not already their primary
- "Active in Friday prayer meetings" → secondary_ministry_names: ["Prayer"]
- "Manages church treasury" → skill_notes: "Finance/Treasury management"
- "Oversees small groups" → secondary_ministry_names: ["Small Groups"]

=== RULES ===
- Return ONLY valid JSON, nothing else
- Never omit a person even if data is sparse
- null for missing fields (never empty strings)
- Dates MUST be YYYY-MM-DD or null
- Maximum 2000 members
- _warnings: flag data quality issues

=== JSON OUTPUT FORMAT ===
{
  "document_type": "mixed",
  "total_rows": 20,
  "column_mapping": {"Person Name": "name", "Contact Email": "email", "Mobile Number": "phone_number", "Role/Category": "role + membership_status", "Primary Ministry": "ministry_name", "Family Info": "marital_status + household_role + _household_key", "Member Since": "date_joined_church (Excel serial converted)", "Additional Notes": "pastoral_note + skill_notes + secondary_ministry_names"},
  "ai_confidence": {"name": 99, "email": 95, "date_joined_church": 98, "role_level": 92},
  "members": [
    {
      "name": "Dr. Samuel Adeyemi",
      "first_name": "Samuel",
      "last_name": "Adeyemi",
      "email": "sam.adeyemi@email.com",
      "phone_number": "712345678",
      "gender": "male",
      "date_of_birth": null,
      "address": null,
      "city": null,
      "country": null,
      "postal_code": null,
      "nationality": null,
      "preferred_language": "en",
      "membership_status": "leader",
      "growth_stage": "leader",
      "date_joined_church": "2015-05-14",
      "first_visit_date": "2015-05-14",
      "membership_date": "2015-05-14",
      "baptism_status": "baptized",
      "baptism_date": null,
      "salvation_date": null,
      "marital_status": "married",
      "wedding_anniversary": null,
      "foundations_completed": true,
      "tithe_status": true,
      "occupation": null,
      "industry": null,
      "education_level": null,
      "skill_notes": "Church administration, Senior leadership",
      "role": "Senior Pastor",
      "ministry_name": "Leadership",
      "ministry_role": "Senior Pastor",
      "cell_group_name": null,
      "role_level": 90,
      "household_role": "head",
      "ordained_date": null,
      "leadership_training_date": null,
      "pastoral_note": "Founding member and overseeing all operations.",
      "_household_key": "adeyemi_family",
      "secondary_ministry_names": [],
      "notes": null,
      "_source_row": 1,
      "_allocation": "leadership",
      "_warnings": []
    }
  ],
  "families": [
    {
      "family_key": "adeyemi_family",
      "family_name": "Adeyemi Family",
      "head_name": "Dr. Samuel Adeyemi",
      "spouse_name": "Sarah Adeyemi",
      "children_names": ["John Adeyemi", "Grace Adeyemi"],
      "total_members": 4,
      "has_children": true
    }
  ],
  "departments_found": ["Leadership", "Worship", "Youth"],
  "allocation_summary": {
    "general_members": 0,
    "visitors": 5,
    "leadership": 8,
    "ministry_members": 7,
    "by_ministry": {"Leadership": 3, "Worship": 2}
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
      file_content,
      file_content_text,
      file_type,
      org_ministries,
    } = body

    if (!job_id || !org_id) {
      return new Response(JSON.stringify({ error: 'job_id and org_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await supabase.from('migration_jobs').update({ status: 'parsing' }).eq('id', job_id)

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
      ? `\n\nThis church has these existing ministries — match ministry_name to these when possible:\n${org_ministries.map((m: any) => `- ${m.name} (id: ${m.id})`).join('\n')}`
      : ''

    const prompt = `${GEMINI_SYSTEM_PROMPT}${ministriesContext}\n\n`
    let result: any

    const isBinary = ['pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'webp'].includes(file_type?.toLowerCase())

    if (isBinary && file_content) {
      const mimeTypeMap: Record<string, string> = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      }
      const mimeType = mimeTypeMap[file_type.toLowerCase()] ?? 'application/octet-stream'

      const geminiResponse = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: file_content } },
            { text: `${prompt}Extract all member data from this document and return the JSON output as specified above.` }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 65536 },
      } as any)

      result = JSON.parse(geminiResponse.response.text())

    } else if (file_content_text) {
      const geminiResponse = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `${prompt}Here is the raw member data extracted from a ${file_type} file:\n\n${file_content_text}\n\nExtract all member data and return the JSON output as specified above.`
          }]
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 65536 },
      } as any)

      result = JSON.parse(geminiResponse.response.text())
    } else {
      throw new Error('No file content provided.')
    }

    if (!result?.members || !Array.isArray(result.members)) {
      throw new Error('Gemini returned unexpected format — members array missing')
    }

    // Build allocation summary
    if (!result.allocation_summary?.general_members && result.allocation_summary?.general_members !== 0) {
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
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error('member-import-ai error:', err)
    try {
      const bodyText = await req.text().catch(() => '{}')
      const { job_id } = JSON.parse(bodyText)
      if (job_id) {
        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
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
