# 🗺 Church OS: End-to-End Customer Journey & Use Cases

This document outlines the premium journey for a church joining the Church OS ecosystem, from the initial invitation to the strategic growth phase powered by the AI Prophetic Intelligence Layer.

---

## 🎭 The Stakeholder Perspective

| Stage | Actor | Objective |
|-------|-------|-----------|
| **1. Invitation** | System / Admin | Invite a prospect or partner church to join the ecosystem. |
| **2. Onboarding** | Senior Pastor | Define the church's unique "Theological DNA." |
| **3. AI Provisioning** | Church OS Engine | Generate a custom "Growth Blueprint" based on the DNA. |
| **4. Leadership HQ** | Senior Pastor | High-level oversight via Pastor HQ (Strategic Insights). |
| **5. Daily Life** | General Member | Real-world spiritual engagement via the Devotion App. |
| **6. Prophetic Synthesis** | AI Shepherd | Analyze member sentiment to give the pastor real-time health data. |

---

## 🛣 Workflow 1: The New Church Onboarding (Senior Pastor)

### Step 1: Authentication & Identity
- **Action**: The Pastor receives a **magic link** (e.g., via Brevo) and signs up at `/onboarding`.
- **System**: Automatically creates a new entry in `organizations` and links it to the pastor's profile.

### Step 2: Cultural DNA Definition
- **Action**: The Pastor fills out the multi-step wizard, defining:
    - **Language**: English/Japanese
    - **Style**: Contemporary/Liturgical
    - **Strategy**: Discipleship-first, Outreach-focused, etc.
- **System**: Saves these settings into `organization_intelligence`.

### Step 3: AI Strategic Blueprint (The "Aha!" Moment)
- **Action**: The Pastor finishes the onboarding.
- **System**: Triggers a **Supabase Edge Function** (`provision-church-intelligence`).
- **Result**: Gemini analyzes the inputs and generates a **Prophetic Insight** (e.g., "Vision for Expansion: Your church's liturgical style and discipleship focus suggest a high potential for reaching young intellectuals in the Tokyo area.")
- **Communication**: The Pastor receives a **Welcome Email via Brevo** with this first insight.

---

## 🛣 Workflow 2: The Pastor's Week (Strategic Center)

### Stage 1: The Monday Overview
- **Action**: The Pastor logs into the **Pastor HQ Dashboard** (`/admin`).
- **Dashboard**: Sees real-time health indicators:
    - **Spiritual Climate**: "Positive sentiment in devotion logs (vibrant joy)."
    - **Critical Alerts**: "3 members have stopped journaling in the last 7 days."
- **Strategic Recommendation**: AI suggests: "Send a personal note to the worship team; they've been highly engaged but are showing signs of burnout."

### Stage 2: Mission Control (Ministry Execution)
- **Action**: The Pastor clicks into **Mission Control**.
- **Execution**: Oversees sermon schedules, ministry health, and financial momentum in one unified view.

---

## 🛣 Workflow 3: The Member's Daily Walk (Devotion App)

### Stage 1: Morning Devotion
- **Action**: A member (e.g., from JKC Church) logs into the **Devotion App** (`/welcome/devotion`).
- **Journaling**: They follow the **SOAP method** (Scripture, Observation, Application, Prayer).
- **System**: Sentiment Analysis (AI) runs asynchronously to detect the spiritual theme of the entry.

### Stage 2: Engagement Rewards
- **Action**: The member maintains a streak of 7 days.
- **System**: Updates `user_progress` and offers a badge or encouragement message.

---

## 🛣 Workflow 4: The Full-Circle Synthesis (AI Shepherd)

### Real-Time Pastoral Intelligence
- **Synthesis**: The **AI Shepherd** aggregates all member SOAP entries for a given month.
- **Result**: It identifies a "Global Trend" for the church: "This month, members are consistently praying about 'financial anxiety' and 'career transitions'."
- **Pastoral Action**: The Pastor creates a sermon series on "God's Provision" precisely when the congregation is struggling with it, closing the loop between data and ministry.

---

## 🏆 The "North Star" Value Proposition
**"From Data to Discernment"**: Church OS isn't just a database; it's a strategic partner that uses AI to provide pastors with the **clarity** they need to lead their flock effectively.
