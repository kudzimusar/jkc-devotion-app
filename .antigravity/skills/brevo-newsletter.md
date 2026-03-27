# Skill: brevo_newsletter

**Trigger:** "Add newsletter signup" or "Send weekly briefing" or "Create Brevo email template"

**Steps:**
1. Identify the communication type (newsletter, weekly victory briefing, pastoral alert).
2. For signup forms: Collect email and `org_id`, store in Supabase `newsletter_subscribers` table.
3. Use Brevo API (via service account) to add contact to appropriate mailing list.
4. For automated sends: Trigger via Edge Function (since static export can't run server actions).
5. Ensure unsubscribe handling is implemented per Brevo requirements.
6. Log email events in AnalyticsService for pastoral visibility.

**Success Criteria:** Newsletter signup persists to database, contact added to Brevo list, confirmation email sent (if applicable).

**Failure Handling:** If Brevo API fails, queue in local database for retry via Edge Function.
