# Skill: Onboarding Insight Dashboard

**Trigger:** "Add AI provisioning status widget" or "Create onboarding dashboard component"

**Purpose:** Display real-time AI provisioning status for new churches

**Implementation Steps:**

1. Create component `AIOnboardingStatus.tsx` that:
   - Fetches `organization_intelligence` for current org
   - Shows status: pending → processing → completed → failed
   - Displays first insight when available (from `prophetic_insights`)
   - Uses glassmorphic styling matching dashboard
   - Subscribes to realtime updates via Supabase

2. Integrate into `ShepherdView` at top of dashboard

3. Add retry mechanism calling `provision-church-intelligence` edge function

4. When status becomes 'completed', fetch and display first insight

**Success Criteria:** New pastors see AI calibration progress and receive their first insight immediately upon completion

**Failure Handling:** Show error state with retry button if fetch fails
