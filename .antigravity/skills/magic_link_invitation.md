# Skill: Magic Link Invitation

**Trigger:** "Send church invitation" or "Invite new church via email"

**Purpose:** Send 48-hour magic link for church onboarding

**Implementation Steps:**

1. Create invitation form collecting email and church name
2. Call `/api/onboarding/invite` endpoint
3. Endpoint creates magic link with extended expiry (48 hours)
4. Store invitation record in `onboarding_invitations` table
5. Send email via Brevo with personalized link

**Success Criteria:** Pastor receives email with working link; link works for 48 hours

**Failure Handling:** Show user-friendly error; log failed sends to monitoring
