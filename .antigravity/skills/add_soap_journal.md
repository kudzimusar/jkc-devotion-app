### Skill: add_soap_journal
**Trigger:** "Add SOAP journal" or "Create journal entry form"

**Steps:**
1. Create journal input form with four sections: Scripture, Observation, Application, Prayer
2. Use Tailwind glassmorphic styling consistent with existing theme
3. Store entries in `journal_entries` table with fields: `id`, `user_id`, `org_id`, `scripture`, `observation`, `application`, `prayer`, `created_at`
4. Add RLS policy ensuring users can only see their own entries
5. Create list view showing historical entries grouped by date
6. Add AI summary option that aggregates recent entries for pastoral view
7. Ensure mobile responsive layout

**Success Criteria:** Users can create, view, and edit journal entries; pastors can see aggregated insights from their congregation

**Failure Handling:** If table missing, generate migration with proper foreign keys to `profiles` and RLS policies
