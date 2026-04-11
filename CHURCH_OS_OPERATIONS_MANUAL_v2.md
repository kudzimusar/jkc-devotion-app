# 🕊️ Church OS: The Comprehensive Operations Manual & System Guide

Welcome to the definitive guide for **Church OS**, a high-performance, AI-driven spiritual infrastructure designed specifically for **Japan Kingdom Church (JKC)** and the "90 Days of Transformation" journey. 

This manual provides an in-depth operational blueprint for every feature within the system, from the member-facing devotional interface to the complex "Shepherd Dashboards" used by leadership.

---

## 📖 1. Devotion Site: The Daily Spiritual Engine
The Devotion Site is the primary digital sanctuary for our members, engineered to bridge language barriers and foster daily consistency.

### **A. Real-Time Journey Tracking**
*   **The 90-Day Progress Ring**: A dynamic SVG-based visualization at the top of the interface. 
    *   **Calculation Logic**: It calculates the current day status (1–90) and fills clockwise. 
    *   **The Hero Message**: Using the `AIService`, the system generates a context-aware greeting. If a member is on a streak, it celebrates consistency. If a member hasn't logged in for days, it offers a "Foundations of Grace" greeting to minimize shame and encourage return.
*   **Day Navigation Bar**: Located at the bottom, this persistent, glassmorphic UI allows members to:
    *   **Catch Up**: Scroll back to previous days to catch up on missed journaling.
    *   **Calendar View**: A popover calendar with "high-density" indicators showing which days already have completed entries.

### **B. Bilingual Scripture System (Bolls Bible API Integration)**
*   **Translation Support**: Fully integrated with the Bolls API to fetch:
    *   **NASB (English)**: The primary study version for international members.
    *   **JBS (Japanese 口語訳)**: The standard Japanese translation for local believers.
*   **Bilingual Toggle**: The "NASB/口語訳/Bilingual" button allows side-by-side viewing. This is critical for JKC's multiracial congregation, allowing families of different nationalities to study the same verse in their heart language.
*   **Scripture Persistence**: Once a verse is loaded for the day, it is cached locally to ensure the site remains fast even on slow connections.

### **C. AI-Powered "Ask Bible Chat"**
*   **The "Spirit-Led" Assistant**: This isn't just a generic chatbot. It is a "Data-Aware" assistant that is restricted only to the context of the day's devotional scripture.
*   **Functionality**: Members can click the "AI CHAT" sparkles button to ask questions like:
    *   *"What is the historical meaning of 'Submission' in this context?"*
    *   *"Give me a modern-day example of how to apply this at my workplace."*
*   **System Bounds**: To ensure theological safety, the AI is prompted to strictly adhere to the provided scripture and avoid speculating on unrelated topics.

### **D. The SOAP Journaling Protocol**
The site enforces the **SOAP** (Scripture, Observation, Application, Prayer) method:
*   **Quick Reflection**: A simplified text field for brief daily take-aways.
*   **Full SOAP Tab**: Four dedicated fields for deep study.
    *   **Observation Sentiment**: When a member saves their "Observation," the AI (AIService) runs a "Sentiment Analysis" in the background. It identifies if the member is feeling Hopeless, Anxious, or Joyful based on their writing. This anonymized data feeds the Admin Dashboard (Section 4).
*   **Gamification (Streaks)**: Saving an entry updates the member's "Day Streak," which is visible in their profile.

### **E. Sunday Service Check-In**
*   **Automated Triggers**: This card *only* appears on Sundays.
*   **Options**: "AT CHURCH" (using GPS/MapPin metadata) or "ONLINE." 
*   **Impact**: Check-ins update the "Attendance Trend" charts in the Shepherd Dashboard, helping leaders see who is disconnected from the physical gathering.

---

## 👤 2. Member Profile & Settings: The Connection Card Hub
The Member Profile is more than a settings page; it is a "Digital Identity" that helps leaders shepherd people more effectively.

### **A. Comprehensive Identity Metadata**
*   **Basic Details**: Birthdate, Gender, and Anniversary dates.
*   **The "Japan Context"**: Specific fields for "Years in Japan" and "Ward" (区). This helps leaders understand the integration level of international members.
*   **Education & Occupation**: Members list their backgrounds, allowing the church to find professionals (e.g., accountants, teachers) when administrative needs arise.

### **B. Referral & Growth Intelligence**
*   **Invite-By Tracking**: Records who brought the member to the church. This allows leaders to see "Spiritual Lineage"—which groups are the most fruitful in evangelism.
*   **Method Tracking**: Tracks if they found the church via "Social Media," "Street Outreach," "Friend," or "Web Search." This informs the church's marketing and outreach budgets.

### **C. Household & Family Linkages**
*   **Family Unit Creation**: Members can add spouses and children. 
*   **Logic**: The system automatically logic-flags the household as "Single," "Couple," or "Family with Children." 
*   **Shepherding Impact**: If a child's faith is faltering (low streaks), the system allows leaders to see the parent's status in a unified view.

### **D. Spiritual Journey Milestones**
Trackable dates for:
*   First Visit Date.
*   Salvation Decision.
*   Water Baptism (A key indicator of commitment).
*   Official Membership Enrollment (The final step in the discipleship funnel).

### **E. Skills, Talents & Ministry Matching**
*   **Skill Library**: A huge dropdown of skills (Music, Video, Finance, Administration, Intercessory Prayer).
*   **Ministry Matching Engine**: The profile shows "Ministry Recommendations" based on the skills provided. For example, if a member lists "Video Editing," the system suggests the "Media Ministry."

### **F. Care & Prayer Portal**
*   **Request Management**: Members can submit private prayer requests.
*   **Urgency Levels**: Normal, Urgent, or Crisis.
*   **Pastoral Reach**: A checkbox to "Require direct pastoral contact." If checked, a Red Alert is triggered on the Admin Dashboard immediately.

---

## 🛡️ 3. Admin Dashboard: The Shepherd Mission Control
The Admin Dashboard is the "Nerve Center" for Japan Kingdom Church leaders, accessible via `/shepherd/dashboard`.

### **A. Core Mission Metrics (Mission Control)**
*   **Engagement Score (0-100)**: A proprietary index that combines:
    *   Devotion completion rates.
    *   Sunday attendance consistency.
    *   Ministry involvement.
    *   *Result*: A single number that tells the pastor if the church is growing or stagnating.
*   **Real-Time Gauge**: A visual SVG gauge showing current vs. targeted engagement.
*   **Attendance Tracking**: Weekly Bar Charts comparing total attendance week-over-week.

### **B. Pastoral Care Intelligence**
*   **The Care Alerts System**: An AI-powered "Crisis Radar."
    *   **Critical Alerts (Red)**: Flagged if a member has been inactive for >14 days. These members are considered "At-Risk" of drifting away.
    *   **Warning Alerts (Amber)**: Flagged if inactive for >7 days.
*   **Counseling Queue**: 
    *   Tracks all members waiting for a meeting.
    *   Categorized by topic (Marriage, Career, Spiritual Warfare, Immigration/Legal).
    *   Allows leaders to "Acknowledge" or "Follow Up" with a single click.

### **C. AI Insights Dashboard**
*   A dedicated section (powered by the `ai_insights` table) that generates proactive strategy:
    *   *"Insight: 80% of new members are from the Adachi-ku area. Suggest opening a new Fellowship Group cluster there."*
    *   *"Insight: Anxiety sentiment has increased by 30% in journals this week. Suggest a sermon on 'The Peace of God'."*

### **D. Financial Intelligence Layer (Specialized Finance Hub)**
For the Finance Ministry, the Mission Control expands into a high-fidelity fiscal monitoring layer:
*   **Giving Health Dashboard**: Real-time tracking of Tithes, Offerings, and Building Funds with year-over-year comparisons.
*   **Giving at Risk (Churn Analytics)**: An AI model that flags members who have stopped giving or whose giving patterns have significantly decreased, allowing for proactive pastoral care.
*   **Ministry ROI Tracking**: Correlates ministry activities (reports/events) with financial health and salvations to determine the "Spiritual ROI" of each department.
*   **Recurring Pledge Management**: Integrated with Stripe to manage monthly pledges and predict future church cash flow.

---

## 📊 4. Data Analytics Board: Spiritual Intelligence Layer
The Data Analytics Board uses advanced visualization tools (**recharts**) to turn complex database rows into "Prophetic Data."

### **A. Collective Spiritual Health (Anonymized)**
*   **SOAP Sentiment Modeling**: Analyzes the "Observation" field of all members' journals.
    *   Categorizes results into Hope, Gratitude, Confusion, Anxiety, and Repentance.
*   **Word Cloud Analysis**: Identifies the top 20 themes appearing in church journals. This gives leaders an inside look at what people are *actually* struggling with or celebrating without violating their privacy.

### **B. Geographic Cluster Mapping**
*   **Tokyo Ward Density**: Visualizing member counts in wards like **Nerima-ku, Setagaya, and Adachi-ku**.
*   **Strategy**: This map literally dictates where the church should plant its next physical location or home-church.

### **C. The Discipleship Funnel (Evangelism Pipeline)**
A high-level view of how many people are moving from each stage:
1.  **Invited Visitors** (Top of the funnel).
2.  **Attendance** (Regular Sunday flow).
3.  **Salvation Decisions** (Spiritual breakthrough).
4.  **Baptism** (Public commitment).
5.  **Membership** (Full integration).
*   *Observation*: If the "drop-off" between Attendance and Salvation is too high, the leadership knows to adjust their gospel presentation.

### **D. Bible Study & Fellowship Hub**
A decentralized community management system:
*   **Group Coordination**: Leaders manage group meeting times, locations (Tokyo Wards), and member enrollment.
*   **Self-Enrollment**: Members can find and join Bible Study groups directly from their profile based on location and meeting days.

---

## 🌟 5. Benefits of the Church OS to the Church
1.  **Data-Driven Compassion**: Stop guessing who is struggling; the **Prophetic Intelligence** identifies them before they leave.
2.  **Scalable Discipleship**: A small pastoral team can monitor the spiritual habits of hundreds with the **Church OS Assistant bot**.
3.  **Bilingual Unity & ChurchGPT**: Removes the language barrier and provides deep theological grounding in both heart languages.
4.  **Operational Excellence**: Real-time 0-100 engagement scoring ensures leadership always has an accurate pulse on the house.

---

## 🤖 6. API and MCP Tool: AI Integration & Sermon Prep
The system includes a **Model Context Protocol (MCP)** server, bridging the gap between the church database and Modern AI Assistants.

### **A. Connection Guide**
*   Leaders can connect tools like **Claude Desktop** to the `/mcp-server/index.ts` endpoint.
*   This grants the AI "Contextual Vision" into the church's knowledge base.

### **B. Practical AI Prompts for Leaders**
1.  *"Search devotions for the theme 'Forgiveness' and summarize the top insights for my sermon prep."*
2.  *"Analyze the anonymized SOAP journal sentiment for this month and identify the top 3 pastoral needs."*
3.  *"How many members live in the Setagaya area and are currently not in a Fellowship Group?"*

---

## ⚙️ 7. Other Operational & Hidden Areas
*   **Multi-Branch Onboarding Wizard**: A hidden `/onboarding` route for new church branches to join the system. 
    *   Handles Domain Whitelisting and Tier Selection (Lite/Pro/Enterprise).
*   **Security Middleware**: A sophisticated layer in `src/middleware.ts` that:
    *   Authenticates via API Keys.
    *   Prevents Cross-Domain Hijacking.
    *   Tracks usage metrics for performance monitoring.
*   **Mock Stripe Hub**: A fully-ready architecture for handling Tithes and Offerings, currently in a "Mock Demonstration" mode for training and screencasts.
*   **Merchandise Hub**: A system for members to order church-branded apparel and resources, tracked directly on their profile.
*   **Children's Registry (Junior Church)**: A secure check-in system linked via `guardian_links` to ensure child safety and attendance tracking.
*   **Global Assistant Bot**: A persistent floating assistant (`GlobalAIAssistant.tsx`) that provides context-aware help on any page of the app.

---

> [!IMPORTANT]
> **Data Security Alert**: All "Shepherd" level dashboards bypass standard member-level security (using `supabaseAdmin`) to provide the aggregate data. This level of access must ONLY be granted to verified Pastoral staff.

> [!TIP]
> **Operational Tip**: Update the "Hero Messages" and "Week Themes" once a month to keep the app feeling fresh and alive for the congregation. 

---
**Version 2.0 (Comprehensive Build) - March 2026**
**Compiled by: Japan Kingdom Church Technology Division**
