# Skill: analytics_tracking

**Trigger:** "Track user [action]" or "Add analytics to [feature]"

**Steps:**
1. Identify the user action to track (login, journal entry, prayer request, milestone).
2. Use `AnalyticsService` from `src/lib/supabase.ts` to log event.
3. Include metadata: `user_id`, `org_id`, `action_type`, `timestamp`, `context_data`.
4. For events that should trigger Prophetic Intelligence, flag in `requires_pil_analysis` field.
5. Ensure tracking doesn't block UI (fire-and-forget with error handling).
6. Verify data appears in pastor dashboard analytics views.

**Success Criteria:** Events logged to database with proper org isolation, visible in analytics queries.

**Failure Handling:** If analytics insert fails, log to console but don't break user flow. Queue for retry if critical.
