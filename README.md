# 🕊️ Church OS: The Digital Sanctuary for Japan Kingdom Church

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_4-06b6d4?logo=tailwind-css)](https://tailwindcss.com/)

**Church OS** is a high-performance, AI-driven spiritual infrastructure designed for the "90 Days of Transformation" journey at Japan Kingdom Church. It bridges the gap between daily spiritual habits and organizational intelligence, providing a unified platform for members and leaders.

---

## 🚀 Key Modules

### 📖 1. The Devotion Engine (Member Experience)
A cross-platform PWA designed for deep spiritual engagement.
- **Bilingual Scripture**: Instant toggle between English (NASB) and Japanese (JBS) via Bolls Bible API.
- **AI Bible Chat**: A context-aware spiritual assistant bounded by the day's passage.
- **SOAP Journaling**: A structured method (Scripture, Observation, Application, Prayer) with encrypted storage.
- **Gamification**: Real-time streak tracking and progress visualization for the 90-day curriculum.

### 🛡️ 2. The Shepherd Dashboard (Admin Intelligence)
"Mission Control" for pastors and ministry leaders to monitor the church's health.
- **Intelligence Score**: A 0-100 engagement index weighing devotion consistency and ministry activity.
- **Care Alerts**: An AI-powered "Crisis Radar" that flags members who have been inactive for >7 days.
- **Counseling Queue**: Management system for spiritual, marriage, and financial guidance requests.

### 📊 3. Spiritual Analytics & Big Data
Translating spirit into strategy through data.
- **Geographic Clusters**: A spatial density map of members across Tokyo Wards (Nerima, Setagaya, etc.).
- **Sentiment Analysis**: AI mapping of the church's "Collective Pulse" (Hope, Anxiety, Joy) based on anonymized SOAP journals.
- **Discipleship Pipeline**: Visualized funnel tracking from "First Visit" to "Leadership."

### 🤖 4. Model Context Protocol (MCP) Server
Allows external AI agents (like Claude or GPT) to securely "know" the church's knowledge base.
- **Sermon Prep**: Automate research across the 90-day curriculum.
- **Trends & Insights**: Ask AI to analyze church-wide patterns via local stdio protocol.

---

## 🛠️ Technology Stack

- **Core**: Next.js 15+ (App Router), TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion, shadcn/ui
- **Backend/Auth**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Bible Data**: Bolls Bible API
- **AI Integration**: Custom AIService (OpenAI/Gemini) & MCP Server
- **Analytics**: Recharts for high-fidelity data visualization

---

## 🏁 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_admin_key
MCP_API_KEY=your_secure_mcp_key
```

### 3. Local Development
```bash
npm run dev
```

### 4. MCP Server Connection (For AI Integration)
Update your `claude_desktop_config.json` with the path to the MCP server located in `src/mcp-server`.

---

## 📖 In-Depth Documentation

For full operational details, refer to the [Comprehensive Operations Manual](file:///Users/shadreckmusarurwa/Project%20AI/jkc-devotion-app/docs/church_os_manual.md) which covers:
- The **0-100 Engagement Score** calculation.
- **Tokyo Ward clustering** strategies.
- **SOAP Sentiment Modeling** methodology.
- **Multi-Branch Onboarding** procedures.

---

Built with reverence for the ministry of Japan Kingdom Church.
**Version 2.5.0 - Transforming Lives Digitally.**
