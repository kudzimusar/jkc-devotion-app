# Skill: vertex_ai_pil

**Trigger:** "Generate prophetic insight for [topic]" or "Run PIL analysis"

**Steps:**
1. Fetch data from AnalyticsService for the target `org_id` (journal sentiment, prayer requests, engagement metrics).
2. Construct prompt with theological guardrails (Scripture-first, grace-based, culturally relevant to JKC).
3. Call Vertex AI via service account (using `ai-service.ts` Gemini implementation).
4. Parse response into structured insight with category (Care, Strategy, Alert).
5. Store in `prophetic_insights` table with `org_id` and `created_by` (pastor/shepherd).
6. Trigger dashboard refresh via React Query invalidation.

**Success Criteria:** Insight appears in pastor dashboard within 30 seconds of generation, includes scripture reference and actionable recommendation.

**Failure Handling:** If Vertex AI rate-limited, queue generation and notify user. If output doesn't match schema, regenerate with refined prompt.
