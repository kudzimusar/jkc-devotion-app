# Skill: Onboarding Insight Dashboard

**Trigger:** "Add AI provisioning status widget" or "Create onboarding dashboard component"

**Purpose:** Display real-time AI provisioning status for new churches

**Implementation Steps:**

1. Create component `AIOnboardingStatus.tsx` that:
   - Fetches `organization_intelligence` for current org
   - Shows status: pending → processing → completed
   - Displays first insight when available
   - Uses glassmorphic styling matching dashboard

2. Integrate into `ShepherdView` at top of dashboard

3. Add polling every 30 seconds while status is 'processing'

4. When status becomes 'completed', fetch and display first insight

**Success Criteria:** New pastors see AI calibration progress and receive their first insight immediately upon completion

**Failure Handling:** Show error state with retry button if fetch fails
