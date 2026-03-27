# Skill: Session Heartbeat

**Trigger:** "Add session keep-alive" or "Prevent session expiry during long tasks"

**Purpose:** Keep Supabase session alive during user activity

**Implementation Steps:**

1. Add `useSessionHeartbeat` hook to layout or page
2. Hook refreshes session every 10 minutes automatically
3. Also refreshes after 5 minutes of inactivity
4. Add `SessionExpiryWarning` component to warn users
5. Ensure refresh doesn't disrupt user experience

**Success Criteria:** Session stays alive during active use; users warned before expiry

**Failure Handling:** Log refresh failures; don't disrupt user flow
