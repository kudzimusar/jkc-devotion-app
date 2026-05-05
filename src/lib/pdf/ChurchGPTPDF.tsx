import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const NAVY = '#0f1f3d'
const GOLD = '#D4AF37'
const GOLD_LIGHT = '#fdf8e8'
const SLATE = '#475569'
const SLATE_LIGHT = '#f8fafc'
const SLATE_MID = '#e2e8f0'
const WHITE = '#ffffff'

const s = StyleSheet.create({
  page:            { fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', backgroundColor: WHITE, paddingBottom: 52 },
  header:          { backgroundColor: NAVY, padding: '22 34', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerOrg:       { fontFamily: 'Helvetica-Bold', fontSize: 18, color: WHITE },
  headerSub:       { fontSize: 8, color: GOLD, marginTop: 3, letterSpacing: 1 },
  headerBadge:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GOLD, borderWidth: 1, borderColor: GOLD, padding: '3 8', borderRadius: 4 },
  goldBar:         { height: 3, backgroundColor: GOLD },
  body:            { padding: '22 34' },
  docTitle:        { fontFamily: 'Helvetica-Bold', fontSize: 20, color: NAVY, marginBottom: 4 },
  docMeta:         { fontSize: 9, color: SLATE, marginBottom: 14 },
  divider:         { height: 1, backgroundColor: SLATE_MID, marginVertical: 10 },
  section:         { marginTop: 14 },
  sectionLabel:    { fontFamily: 'Helvetica-Bold', fontSize: 8, color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 },
  bodyText:        { fontSize: 10, lineHeight: 1.65, color: SLATE },
  callout:         { backgroundColor: GOLD_LIGHT, borderLeft: `3 solid ${GOLD}`, padding: '8 12', borderRadius: 4, marginVertical: 4 },
  calloutText:     { fontSize: 10, fontStyle: 'italic', color: '#5c4a1e', lineHeight: 1.6 },
  card:            { backgroundColor: SLATE_LIGHT, borderLeft: `2 solid ${NAVY}`, padding: '8 12', borderRadius: 4, marginBottom: 8 },
  cardTitle:       { fontFamily: 'Helvetica-Bold', fontSize: 10, color: NAVY, marginBottom: 3 },
  cardText:        { fontSize: 9, color: SLATE, lineHeight: 1.55 },
  cardTag:         { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GOLD, marginTop: 3 },
  bulletRow:       { flexDirection: 'row', marginBottom: 4 },
  bulletDot:       { fontSize: 9, color: GOLD, marginRight: 6, marginTop: 1 },
  bulletText:      { fontSize: 9, color: SLATE, flex: 1, lineHeight: 1.5 },
  qRow:            { marginBottom: 10, paddingBottom: 10, borderBottom: `1 solid ${SLATE_MID}` },
  qNum:            { fontFamily: 'Helvetica-Bold', fontSize: 8, color: GOLD, marginBottom: 2 },
  qText:           { fontSize: 10, color: '#334155', lineHeight: 1.55 },
  tableRow:        { flexDirection: 'row', borderBottom: `1 solid ${SLATE_MID}`, paddingVertical: 6 },
  tableHead:       { fontFamily: 'Helvetica-Bold', color: NAVY },
  cell:            { fontSize: 9, color: SLATE, paddingRight: 8 },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: NAVY, padding: '7 34', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerL:         { fontSize: 7, color: 'rgba(255,255,255,0.45)' },
  footerR:         { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GOLD },
})

function Layout({ children, orgName, badge }: { children: React.ReactNode, orgName: string, badge: string }) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View>
          <Text style={s.headerOrg}>{orgName || 'Church OS'}</Text>
          <Text style={s.headerSub}>CHURCHGPT · AI MINISTRY ASSISTANT</Text>
        </View>
        <Text style={s.headerBadge}>{badge}</Text>
      </View>
      <View style={s.goldBar} />
      <View style={s.body}>{children}</View>
      <View style={s.footer} fixed>
        <Text style={s.footerL}>Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · ChurchGPT</Text>
        <Text style={s.footerR}>ChurchGPT</Text>
      </View>
    </Page>
  )
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{String(text)}</Text>
    </View>
  )
}

// ── Sermon Outline ────────────────────────────────────────────────────────────

function SermonOutlinePDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="SERMON OUTLINE">
        <Text style={s.docTitle}>{data.title || 'Untitled Sermon'}</Text>
        {data.anchor_text && <Text style={s.docMeta}>Anchor Text: {data.anchor_text}</Text>}

        {data.big_idea && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>The Big Idea</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.big_idea}</Text></View>
          </View>
        )}

        {data.context && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Context</Text>
            <Text style={s.bodyText}>{data.context}</Text>
          </View>
        )}

        {data.main_points?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Sermon Moves</Text>
            {data.main_points.map((pt: any, i: number) => (
              <View key={i} style={s.card}>
                <Text style={s.cardTitle}>{i + 1}. {pt.title}</Text>
                {pt.content && <Text style={s.cardText}>{pt.content}</Text>}
                {pt.scripture && <Text style={s.cardTag}>{pt.scripture}</Text>}
              </View>
            ))}
          </View>
        )}

        {data.illustrations?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Illustrations</Text>
            {data.illustrations.map((ill: string, i: number) => <Bullet key={i} text={ill} />)}
          </View>
        )}

        {data.application && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Application</Text>
            <Text style={s.bodyText}>{data.application}</Text>
          </View>
        )}

        {data.invitation && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Invitation / Altar Call</Text>
            <View style={[s.callout, { borderColor: NAVY, backgroundColor: '#eef2ff' }]}>
              <Text style={[s.calloutText, { color: NAVY }]}>{data.invitation}</Text>
            </View>
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Service Order ─────────────────────────────────────────────────────────────

function ServiceOrderPDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="SERVICE ORDER">
        <Text style={s.docTitle}>{data.theme || 'Sunday Service'}</Text>
        {data.sermon_text && <Text style={s.docMeta}>Sermon Text: {data.sermon_text}</Text>}

        {data.songs?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Worship Songs</Text>
            {data.songs.map((song: string, i: number) => <Bullet key={i} text={song} />)}
          </View>
        )}

        {data.scripture_readings?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Scripture Readings</Text>
            {data.scripture_readings.map((r: string, i: number) => <Bullet key={i} text={r} />)}
          </View>
        )}

        {data.service_elements?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Service Flow</Text>
            {data.service_elements.map((el: any, i: number) => (
              <View key={i} style={s.tableRow}>
                <Text style={[s.cell, s.tableHead, { width: 120 }]}>{el.element}</Text>
                <Text style={[s.cell, { flex: 1 }]}>{el.description}</Text>
                {el.duration_minutes > 0 && (
                  <Text style={[s.cell, { width: 50, color: GOLD }]}>{el.duration_minutes} min</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Event Brief ───────────────────────────────────────────────────────────────

function EventBriefPDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="EVENT BRIEF">
        <Text style={s.docTitle}>{data.event_name || 'Event Brief'}</Text>
        {(data.event_type || data.audience) && (
          <Text style={s.docMeta}>{[data.event_type, data.audience].filter(Boolean).join(' · ')}</Text>
        )}

        {data.volunteer_roles?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Volunteer Roles</Text>
            {data.volunteer_roles.map((vr: any, i: number) => (
              <View key={i} style={s.card}>
                <Text style={s.cardTitle}>{vr.role}</Text>
                <Text style={s.cardText}>{vr.responsibilities}</Text>
              </View>
            ))}
          </View>
        )}

        {data.run_of_show?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Run of Show</Text>
            {data.run_of_show.map((item: any, i: number) => (
              <View key={i} style={s.tableRow}>
                <Text style={[s.cell, s.tableHead, { width: 80 }]}>{item.time}</Text>
                <Text style={[s.cell, { flex: 1 }]}>{item.item}</Text>
              </View>
            ))}
          </View>
        )}

        {data.communications_checklist?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Communications Checklist</Text>
            {data.communications_checklist.map((c: string, i: number) => <Bullet key={i} text={c} />)}
          </View>
        )}

        {data.follow_up_steps?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Follow-Up Steps</Text>
            {data.follow_up_steps.map((step: string, i: number) => <Bullet key={i} text={step} />)}
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Stewardship Campaign ──────────────────────────────────────────────────────

function StewardshipCampaignPDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="STEWARDSHIP CAMPAIGN">
        <Text style={s.docTitle}>{data.goal || 'Giving Campaign'}</Text>

        {data.vision && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Vision</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.vision}</Text></View>
          </View>
        )}

        {data.biblical_rationale && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Biblical Foundation</Text>
            <Text style={s.bodyText}>{data.biblical_rationale}</Text>
          </View>
        )}

        {data.timeline && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Timeline</Text>
            <Text style={s.bodyText}>{data.timeline}</Text>
          </View>
        )}

        {data.communication_sequence?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Communication Sequence</Text>
            {data.communication_sequence.map((phase: any, i: number) => (
              <View key={i} style={s.card}>
                <Text style={s.cardTitle}>{phase.phase}</Text>
                <Text style={s.cardText}>{phase.message}</Text>
              </View>
            ))}
          </View>
        )}

        {data.testimony_framework && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Testimony Framework</Text>
            <Text style={s.bodyText}>{data.testimony_framework}</Text>
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Bible Study Guide ─────────────────────────────────────────────────────────

function BibleStudyGuidePDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="BIBLE STUDY GUIDE">
        <Text style={s.docTitle}>{data.passage || 'Bible Study'}</Text>

        {data.context && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Context</Text>
            <Text style={s.bodyText}>{data.context}</Text>
          </View>
        )}

        {data.cross_references?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Cross-References</Text>
            {data.cross_references.map((ref: string, i: number) => <Bullet key={i} text={ref} />)}
          </View>
        )}

        {data.discussion_questions?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Discussion Questions</Text>
            {data.discussion_questions.map((q: string, i: number) => (
              <View key={i} style={s.qRow}>
                <Text style={s.qNum}>Q{i + 1}</Text>
                <Text style={s.qText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {data.application && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Application</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.application}</Text></View>
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Small Group Guide ─────────────────────────────────────────────────────────

function SmallGroupGuidePDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="SMALL GROUP GUIDE">
        <Text style={s.docTitle}>{data.passage || 'Small Group Session'}</Text>

        {data.icebreaker && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Icebreaker</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.icebreaker}</Text></View>
          </View>
        )}

        {data.discussion_questions?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Discussion Questions</Text>
            {data.discussion_questions.map((q: string, i: number) => (
              <View key={i} style={s.qRow}>
                <Text style={s.qNum}>Q{i + 1}</Text>
                <Text style={s.qText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {data.facilitation_notes && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Facilitation Notes</Text>
            <Text style={s.bodyText}>{data.facilitation_notes}</Text>
          </View>
        )}

        {data.closing_prayer_prompt && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Closing Prayer</Text>
            <Text style={s.bodyText}>{data.closing_prayer_prompt}</Text>
          </View>
        )}

        {data.weekly_challenge && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Weekly Challenge</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.weekly_challenge}</Text></View>
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Youth Lesson ──────────────────────────────────────────────────────────────

function YouthLessonPDF({ data, orgName }: { data: any, orgName: string }) {
  return (
    <Document>
      <Layout orgName={orgName} badge="YOUTH LESSON">
        <Text style={s.docTitle}>{data.title || 'Youth Lesson'}</Text>
        {data.anchor_text && <Text style={s.docMeta}>Text: {data.anchor_text}</Text>}

        {data.big_idea && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>The Big Idea</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.big_idea}</Text></View>
          </View>
        )}

        {data.illustration && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Illustration</Text>
            <Text style={s.bodyText}>{data.illustration}</Text>
          </View>
        )}

        {data.discussion_questions?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Discussion Questions</Text>
            {data.discussion_questions.map((q: string, i: number) => (
              <View key={i} style={s.qRow}>
                <Text style={s.qNum}>Q{i + 1}</Text>
                <Text style={s.qText}>{q}</Text>
              </View>
            ))}
          </View>
        )}

        {data.weekly_challenge && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>This Week's Challenge</Text>
            <View style={s.callout}><Text style={s.calloutText}>{data.weekly_challenge}</Text></View>
          </View>
        )}
      </Layout>
    </Document>
  )
}

// ── Admin Document ────────────────────────────────────────────────────────────

function AdminDocumentPDF({ data, orgName }: { data: any, orgName: string }) {
  const badge = (data.document_subtype as string | undefined)?.toUpperCase() || 'DOCUMENT'
  return (
    <Document>
      <Layout orgName={orgName} badge={badge}>
        <Text style={s.docTitle}>{data.title || 'Document'}</Text>
        <View style={s.divider} />
        <Text style={[s.bodyText, { lineHeight: 1.9 }]}>{data.body || ''}</Text>
      </Layout>
    </Document>
  )
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildPDF(documentData: Record<string, unknown>, orgName: string): React.ReactElement {
  switch (documentData.type as string) {
    case 'sermon-outline':        return <SermonOutlinePDF data={documentData} orgName={orgName} />
    case 'service-order':         return <ServiceOrderPDF data={documentData} orgName={orgName} />
    case 'event-brief':           return <EventBriefPDF data={documentData} orgName={orgName} />
    case 'stewardship-campaign':  return <StewardshipCampaignPDF data={documentData} orgName={orgName} />
    case 'bible-study-guide':     return <BibleStudyGuidePDF data={documentData} orgName={orgName} />
    case 'small-group-guide':     return <SmallGroupGuidePDF data={documentData} orgName={orgName} />
    case 'youth-lesson':          return <YouthLessonPDF data={documentData} orgName={orgName} />
    case 'admin-document':        return <AdminDocumentPDF data={documentData} orgName={orgName} />
    default:
      return <AdminDocumentPDF data={{ title: 'Document', body: JSON.stringify(documentData, null, 2), document_subtype: 'document' }} orgName={orgName} />
  }
}

export { getDocumentTitle, getDocumentBadge } from './churchgpt-document-utils'
