// Client-safe document utility functions — no @react-pdf/renderer imports here

export function getDocumentTitle(data: Record<string, unknown>): string {
  return (
    (data.title as string) ||
    (data.event_name as string) ||
    (data.theme as string) ||
    (data.passage as string) ||
    (data.goal as string) ||
    'ChurchGPT Document'
  )
}

export function getDocumentBadge(type: string): string {
  const badges: Record<string, string> = {
    'sermon-outline':       'Sermon Outline',
    'service-order':        'Service Order',
    'event-brief':          'Event Brief',
    'stewardship-campaign': 'Stewardship Campaign',
    'bible-study-guide':    'Bible Study Guide',
    'small-group-guide':    'Small Group Guide',
    'youth-lesson':         'Youth Lesson',
    'admin-document':       'Document',
  }
  return badges[type] || 'Document'
}
