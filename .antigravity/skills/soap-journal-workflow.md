### Skill: SOAP Journal Workflow
**Trigger:** *"Implement SOAP journaling for [X]"* or *"Validate SOAP entries."*

**Steps:**
1.  **Input Segregation**: Divide the journaling input into four fields: **S**cripture, **O**bservation, **A**pplication, and **P**rayer.
2.  **Sentiment Mapping**: Run a background sentiment check on the "Observation" field using the `AIService` to identify current member sentiments (e.g., Hope, Anxiety).
3.  **Database Integration**: Save the completed SOAP object to the `soap_journals` table with the corresponding `day_number` and `org_id`.
4.  **Milestone Check**: If "Prayer" includes an urgency flag, trigger a pastoral alert (Care Alert) immediately.
5.  **UI Feedback**: Show a success state ("Journaled successfully") and increment the member's daily streak.

**Success Criteria:** 
- Member journals are correctly saved and analyzed for spiritual sentiment.
- The "Day Streak" is updated accurately.

**Failure Handling:** 
- If any of the mandatory SOAP fields are empty, prompt the user for additional input before saving.
- If sentiment analysis fails, default to a "Neutral" sentiment tag and log the error for analysis.
