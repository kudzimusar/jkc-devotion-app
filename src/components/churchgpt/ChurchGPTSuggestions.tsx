"use client"

import { BookOpen, Sparkles, MessageCircle, Heart, HelpCircle, Compass, Mic2, Calendar, Users, HandCoins, Baby, Music, Shield, Flame } from "lucide-react"

interface ChurchGPTSuggestionsProps {
  onSelect: (prompt: string) => void
  sessionType?: string
}

const MODE_SUGGESTIONS: Record<string, { label: string; icon: React.ReactNode }[]> = {
  general: [
    { label: "Understand a Bible verse", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Write a prayer for me", icon: <Sparkles className="w-5 h-5" /> },
    { label: "I have a faith question", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "What does Christianity say about suffering?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "Help me understand the Trinity", icon: <Compass className="w-5 h-5" /> },
    { label: "I want to start reading the Bible", icon: <Heart className="w-5 h-5" /> },
  ],
  devotional: [
    { label: "Lead me through a devotion on God's peace", icon: <Sparkles className="w-5 h-5" /> },
    { label: "I'm feeling distant from God — help me reconnect", icon: <Heart className="w-5 h-5" /> },
    { label: "I want to reflect on Psalm 23 today", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Choose a verse for me and let's go deep", icon: <Compass className="w-5 h-5" /> },
    { label: "I'm going through a hard season — guide my devotion", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "I'm grateful today — help me bring that to God", icon: <Sparkles className="w-5 h-5" /> },
  ],
  prayer: [
    { label: "Pray with me for my family", icon: <Heart className="w-5 h-5" /> },
    { label: "I need a prayer for healing", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Write a prayer of thanksgiving for me", icon: <Sparkles className="w-5 h-5" /> },
    { label: "I'm grieving — pray with me", icon: <Heart className="w-5 h-5" /> },
    { label: "Pray for a big decision I'm facing", icon: <Compass className="w-5 h-5" /> },
    { label: "I need a prayer of protection", icon: <Shield className="w-5 h-5" /> },
  ],
  'bible-study': [
    { label: "Explain Romans 8 in depth", icon: <BookOpen className="w-5 h-5" /> },
    { label: "What does 'grace' mean in the original Greek?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "Study the Sermon on the Mount with me", icon: <BookOpen className="w-5 h-5" /> },
    { label: "What is the context of Genesis 1?", icon: <Compass className="w-5 h-5" /> },
    { label: "Generate small group questions for John 15", icon: <Users className="w-5 h-5" /> },
    { label: "Help me understand the book of Revelation", icon: <BookOpen className="w-5 h-5" /> },
  ],
  apologetics: [
    { label: "How do we know Jesus actually rose from the dead?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "How can a good God allow suffering?", icon: <Compass className="w-5 h-5" /> },
    { label: "Is the Bible historically reliable?", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Can science and Christianity coexist?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "How do I respond to 'all religions are the same'?", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "What is the strongest argument for God's existence?", icon: <Flame className="w-5 h-5" /> },
  ],
  pastoral: [
    { label: "I'm going through a really hard time", icon: <Heart className="w-5 h-5" /> },
    { label: "I'm struggling with anxiety and fear", icon: <Heart className="w-5 h-5" /> },
    { label: "My marriage is in trouble — I need help", icon: <Heart className="w-5 h-5" /> },
    { label: "I'm dealing with deep loneliness", icon: <Compass className="w-5 h-5" /> },
    { label: "I feel like God has abandoned me", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "I'm struggling to forgive someone", icon: <Heart className="w-5 h-5" /> },
  ],
  'grief-support': [
    { label: "I lost someone I love recently", icon: <Heart className="w-5 h-5" /> },
    { label: "I'm not sure how to grieve as a Christian", icon: <Compass className="w-5 h-5" /> },
    { label: "It's an anniversary of my loss today", icon: <Heart className="w-5 h-5" /> },
    { label: "I'm angry at God over this loss", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "Help me write a message to support a grieving friend", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "What does the Bible say about death and grief?", icon: <BookOpen className="w-5 h-5" /> },
  ],
  visitor: [
    { label: "What is Christianity really about?", icon: <Compass className="w-5 h-5" /> },
    { label: "I've had bad experiences with church", icon: <Heart className="w-5 h-5" /> },
    { label: "Who is Jesus — really?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "Why do Christians believe the Bible?", icon: <BookOpen className="w-5 h-5" /> },
    { label: "I'm curious about faith but not sure where to start", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Is God real?", icon: <MessageCircle className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Draft a pastoral letter to the congregation", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "Write a Sunday announcement for me", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "Help me plan our church's ministry calendar", icon: <Calendar className="w-5 h-5" /> },
    { label: "Draft a volunteer role description", icon: <Users className="w-5 h-5" /> },
    { label: "Help me think through a ministry decision", icon: <Compass className="w-5 h-5" /> },
    { label: "Write a church vision statement", icon: <Flame className="w-5 h-5" /> },
  ],
  'sermon-planning': [
    { label: "Help me plan a sermon on John 3:16", icon: <BookOpen className="w-5 h-5" /> },
    { label: "I have a theme — help me find the right text", icon: <Compass className="w-5 h-5" /> },
    { label: "Plan a 4-week series on prayer", icon: <Mic2 className="w-5 h-5" /> },
    { label: "Help me structure my sermon on forgiveness", icon: <Mic2 className="w-5 h-5" /> },
    { label: "I have a passage — help me build the Big Idea", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Give me illustrations for a sermon on faith", icon: <Sparkles className="w-5 h-5" /> },
  ],
  'worship-planning': [
    { label: "Plan a worship set for a sermon on hope", icon: <Music className="w-5 h-5" /> },
    { label: "Design a full Sunday service order", icon: <Music className="w-5 h-5" /> },
    { label: "Suggest songs for a Good Friday service", icon: <Music className="w-5 h-5" /> },
    { label: "Review these song lyrics for theological accuracy", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Plan a worship set for a baptism Sunday", icon: <Music className="w-5 h-5" /> },
    { label: "Help me choose a call to worship scripture", icon: <BookOpen className="w-5 h-5" /> },
  ],
  'event-planning': [
    { label: "Help me plan a church outreach event", icon: <Calendar className="w-5 h-5" /> },
    { label: "Create a volunteer roles list for our event", icon: <Users className="w-5 h-5" /> },
    { label: "Draft a communications plan for our event", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "Build a run-of-show for our Sunday special", icon: <Calendar className="w-5 h-5" /> },
    { label: "Plan a leadership retreat for our team", icon: <Compass className="w-5 h-5" /> },
    { label: "Help me plan a community service day", icon: <Heart className="w-5 h-5" /> },
  ],
  stewardship: [
    { label: "Help me launch a giving campaign", icon: <HandCoins className="w-5 h-5" /> },
    { label: "Draft a pastoral appeal letter for our building fund", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "What does the Bible say about generosity?", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Write a thank-you letter to our donors", icon: <Heart className="w-5 h-5" /> },
    { label: "Help me build a year-end giving campaign", icon: <HandCoins className="w-5 h-5" /> },
    { label: "How do I preach on tithing without it feeling like pressure?", icon: <Mic2 className="w-5 h-5" /> },
  ],
  'youth-ministry': [
    { label: "Plan a youth lesson on identity in Christ", icon: <Baby className="w-5 h-5" /> },
    { label: "Write a 4-week series for teenagers on prayer", icon: <Baby className="w-5 h-5" /> },
    { label: "Draft a parent update email for our youth group", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "Plan a youth outreach event", icon: <Calendar className="w-5 h-5" /> },
    { label: "Give me discussion questions for John 15 for teens", icon: <Users className="w-5 h-5" /> },
    { label: "Help me brief our youth volunteers", icon: <Users className="w-5 h-5" /> },
  ],
  'small-group': [
    { label: "Generate discussion questions for Romans 12", icon: <Users className="w-5 h-5" /> },
    { label: "Help me design a full small group session", icon: <Users className="w-5 h-5" /> },
    { label: "Give me an icebreaker for a session on grace", icon: <Sparkles className="w-5 h-5" /> },
    { label: "How do I handle a dominant talker in my group?", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "Plan a 6-week small group series on the Sermon on the Mount", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Give me facilitation tips for a sensitive passage", icon: <Compass className="w-5 h-5" /> },
  ],
  'evangelism-coaching': [
    { label: "Help me craft my personal testimony", icon: <Flame className="w-5 h-5" /> },
    { label: "Roleplay — I'll practice sharing my faith with you", icon: <MessageCircle className="w-5 h-5" /> },
    { label: "How do I bring up Jesus naturally in conversation?", icon: <Compass className="w-5 h-5" /> },
    { label: "Prepare me for the objection 'all religions are the same'", icon: <HelpCircle className="w-5 h-5" /> },
    { label: "What do I do after sharing the Gospel?", icon: <Heart className="w-5 h-5" /> },
    { label: "Help me share my faith with a skeptical friend", icon: <MessageCircle className="w-5 h-5" /> },
  ],
  'leadership-development': [
    { label: "Help me identify my ministry shape (APEST)", icon: <Compass className="w-5 h-5" /> },
    { label: "Walk me through the Matthew 18 conflict process", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Help me cast vision for my team", icon: <Flame className="w-5 h-5" /> },
    { label: "How do I delegate without losing quality?", icon: <Users className="w-5 h-5" /> },
    { label: "I'm struggling with burnout in ministry", icon: <Heart className="w-5 h-5" /> },
    { label: "Help me develop a leader on my team", icon: <Compass className="w-5 h-5" /> },
  ],
}

const MODE_SUBTITLES: Record<string, string> = {
  general: "Your Christian AI Companion",
  devotional: "Devotional Mode — Come as you are",
  prayer: "Prayer Mode — Bring it before God",
  'bible-study': "Bible Study Mode — Go deep in the Word",
  apologetics: "Apologetics Mode — Defend the faith",
  pastoral: "Pastoral Mode — You are not alone",
  'grief-support': "Grief Support — I'm here with you",
  visitor: "Welcome — I'm genuinely curious about you",
  admin: "Admin Mode — Let's get to work",
  'sermon-planning': "Sermon Planning — Every sermon is a Kingdom moment",
  'worship-planning': "Worship Planning — Design a service that glorifies God",
  'event-planning': "Event Planning — Ministry that moves people",
  stewardship: "Stewardship — Theology before tactics",
  'youth-ministry': "Youth Ministry — Meet them where they are",
  'small-group': "Small Group — Equip leaders to lead well",
  'evangelism-coaching': "Evangelism — Share your faith naturally",
  'leadership-development': "Leadership — Character before capacity",
}

export function ChurchGPTSuggestions({ onSelect, sessionType = 'general' }: ChurchGPTSuggestionsProps) {
  const suggestions = MODE_SUGGESTIONS[sessionType] ?? MODE_SUGGESTIONS.general
  const subtitle = MODE_SUBTITLES[sessionType] ?? "Your Christian AI Companion"

  return (
    <div className="flex flex-col items-center justify-center p-8 max-w-2xl mx-auto flex-1 min-h-[400px]">
      <div className="text-center mb-8 space-y-2">
        <div className="mb-4 flex justify-center">
          <img src="/cgpt-icons/icon-128x128.png" alt="ChurchGPT" className="w-16 h-16" />
        </div>
        <h2
          className="text-3xl font-bold text-[#1b3a6b]"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          ChurchGPT
        </h2>
        <p className="text-gray-400 font-medium text-xs tracking-widest uppercase">
          {subtitle}
        </p>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s.label)}
              className="flex items-center gap-3 p-4 min-h-[64px] bg-white border border-gray-200 hover:border-[#f5a623] hover:bg-amber-50 cursor-pointer transition-all rounded-xl shadow-sm text-left group"
            >
              <span className="shrink-0 text-[#f5a623]">
                {s.icon}
              </span>
              <span className="text-sm font-medium text-[#1b3a6b] leading-snug line-clamp-2">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
