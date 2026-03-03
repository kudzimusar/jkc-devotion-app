# JKC Transformed Life 2026 Devotional

A high-performance, cross-platform devotional application designed for the "90 Days of Transformation" journey by Japan Kingdom Church.

## 🚀 Modern Technology Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 & shadcn/ui
- **Animations**: Framer Motion
- **Bible Integration**: Bolls Bible API (Direct Passage Retrieval)
- **Database/Auth**: Supabase (PostgreSQL) - Ready for config
- **Design**: Dynamic Weekly Themes (Forgiveness, Reconciliation, Submission, Obedience, Holy Week)

## ✨ Features
- **31-Day Curriculum**: All March 2026 devotions pre-loaded.
- **Dynamic Weekly Themes**: UI accents and moods change automatically based on the current week.
- **Bilingual Bible Support**: Toggle between English (NASB) and Japanese (口語訳 JBS) scriptures.
- **Interactive Declarations**: High-engagement "Speak it with Faith" interactive modal.
- **Reflection Journaling**: Personal notes for each day (saves to Supabase/Local).
- **Progress Tracking**: Real-time progress visualization of the 90-day transformation.
- **PWA/Mobile Ready**: Progressive Web App support for home screen installation.

## 📅 March 2026 Theme Schedule
1. **Week 1 (March 1-7)**: Foundation of Forgiveness (Teal)
2. **Week 2 (March 8-14)**: Ministry of Reconciliation (Gold)
3. **Week 3 (March 15-21)**: Attitude of Submission (Deep Teal)
4. **Week 4 (March 22-28)**: Practice of Obedience (Purple)
5. **Week 5 (March 29-31)**: Easter Holy Week (Dark Slate/Crimson)

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Local Development
```bash
npm run dev
```

### 3. Supabase Configuration
Add your Supabase environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```
Use `legacy/schema.sql` to initialize your database.

### 4. Build for Production
```bash
npm run build
```

## 📱 Mobile Native (Capacitor)
Initialize Capacitor to build for iOS/Android:
```bash
npx cap init "Transformed Life" com.transformedlife.app
```

---
Built with reverance for the ministry of Japan Kingdom Church.
