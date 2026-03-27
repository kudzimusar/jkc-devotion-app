### Skill: Prophetic Insight (PIL) Generation
**Trigger:** *"Generate a prophetic insight for [X]"* or *"Connect this to PIL."*

**Steps:**
1.  **Data Aggregation**: Fetch anonymized member data (SOAP journal sentiment, attendance patterns, and ward density) for the active `org_id`.
2.  **Prompt Engineering**: Query the `PIL Engine` or `AIService` using the established spiritual guardrails (Grace-first, Scripture-aligned).
3.  **Persistence**: Save the generated insight into the `prophetic_insights` table, tagging it with the correct category (Care, Strategy, Alert).
4.  **UI Integration**: Link the new record to the Shepherd Dashboard's "Daily Intelligence" tab and trigger a UI refetch.

**Success Criteria:** 
- A new, context-rich insight is successfully saved in the database.
- Leading pastors see actionable recommendations on their dashboard.

**Failure Handling:** 
- If the data density is too low for a meaningful insight, return a "Needs more data" status and suggest a church engagement campaign.
- If the AI output violates theological guardrails, regenerate the insight with a more restrictive system prompt.
