'use client';

import React, { useState, useEffect } from 'react';
import {
  Church, Users, Globe, BarChart3, ArrowRight, Zap,
  CheckCircle, Mail, Lock, User, Search, MapPin,
  Calendar, ShieldCheck, TrendingUp, BrainCircuit,
  HandHelping, Coins, Network, ChevronRight, Menu, X,
  ExternalLink, Bell, LayoutDashboard, Database,
  Fingerprint, Sparkles, HeartHandshake, Share2, MessageSquare,
  Play, Clock, Phone, Youtube, Music, LogOut, Settings, Filter, ArrowUpRight,
  BookOpen, Shield, Check
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { basePath as BP } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/** * ASSETS & MOCK DATA
 */

const heroImage = `${BP}/images/hero-background.jpg`;
const communityImage = `${BP}/images/pastor/pastor-event.jpg`;

const jkcChurchData = {
  id: "japan-kingdom-church-id",
  name: "Japan Kingdom Church (JKC)",
  pastor: "Pastor Marcel Jonte Gadsden",
  motto: "Making A Difference In Japan And Around The World Together!",
  missionStatement: "Building a strong Christian community that represents Christ to Japanese society.",
  foundingYear: 2017,
  denomination: "Non-denominational",
  address: "3rd Floor, SKY Akishima Building, Showacho 2-1-6, Akishima-shi, Tokyo, Japan",
  phone: "+81 42-xxx-xxxx",
  email: "info@japankingdomchurch.com",
  website: "https://www.japankingdomchurch.com/",
  serviceTimes: [
    { day: "Sunday", time: "9:30 AM - 10:00 AM JST", type: "Prayer Service" },
    { day: "Sunday", time: "10:30 AM - 12:30 PM JST", type: "Morning Worship Service (Bilingual)" }
  ],
  ministryCount: 14,
  memberCount: 350,
  isLiveStreaming: true,
  nextStreamDate: "Every Sunday",
  nextStreamTime: "10:30 AM JST",
  youtubeChannelId: "UCwwGostfvdwKJdnVbNblywQ",
  socialMedia: {
    twitter: "https://twitter.com/jkctokyo",
    youtube: "https://www.youtube.com/channel/UCwwGostfvdwKJdnVbNblywQ",
    facebook: "http://www.facebook.com/japankingdomchurch",
    instagram: "http://instagram.com/jkctokyo",
    tiktok: "http://www.tiktok.com/@jkctokyo"
  },
  ministries: [
    { name: "Worship Ministry", description: "Leading the congregation in heartfelt worship", leader: "Worship Team" },
    { name: "Prayer Ministry", description: "Intercession and spiritual warfare for the church", leader: "Prayer Team" },
    { name: "Children's Ministry", description: "Nurturing young hearts in God's love", leader: "Children's Director" },
    { name: "Youth Ministry", description: "Raising the next generation of Kingdom builders", leader: "Youth Team" },
    { name: "Media Ministry", description: "Capturing and broadcasting the church message", leader: "Media Lead" },
    { name: "Evangelism Ministry", description: "Taking the gospel outside the church walls", leader: "Evangelism Team" },
    { name: "Missions Ministry", description: "Global missions and international outreach", leader: "Missions Team" },
    { name: "Akiramenai Outreach", description: "Homeless outreach providing food, care and shelter in Tokyo", leader: "Outreach Team" },
    { name: "The Food Pantry", description: "Combating hunger for low-income families", leader: "Community Team" },
    { name: "Fellowship Circles", description: "Small groups for community and Bible study", leader: "Fellowship Lead" },
    { name: "Hospitality Ministry", description: "Creating a welcoming environment for all visitors", leader: "Hospitality Team" },
    { name: "Pastoral Care", description: "Supporting members through life challenges", leader: "Pastoral Team" },
    { name: "Finance Ministry", description: "Faithful stewardship of church resources", leader: "Finance Lead" },
    { name: "Ushering Ministry", description: "Serving as the first face of the church", leader: "Ushering Team" }
  ],
  recentSermons: [
    { title: "Perfect Love Casts Out Fear", date: "December 8, 2024", pastor: "Pastor Marcel Jonte Gadsden", scripture: "1 John 4:18" },
    { title: "Building the Kingdom", date: "December 1, 2024", pastor: "Pastor Marcel Jonte Gadsden", scripture: "Matthew 6:33" },
    { title: "Faith in Action", date: "November 24, 2024", pastor: "Pastor Marcel Jonte Gadsden", scripture: "James 2:14-26" }
  ],
  upcomingEvents: [
    { title: "Christmas Celebration Service", date: "Dec 24, 2024", time: "10:30 AM JST", ministry: "JKC Praise Music Ministry", location: "Main Sanctuary" },
    { title: "New Year Prayer & Fasting", date: "Jan 1, 2025", time: "6:00 PM JST", ministry: "Prayer Ministry", location: "Fellowship Hall" }
  ]
};

/** * UI COMPONENTS
 */

const Button = ({ className = "", variant = "primary", size = "md", children, ...props }: { className?: string; variant?: 'primary' | 'dark' | 'outline' | 'ghost' | 'white' | 'accent'; size?: 'sm' | 'md' | 'lg' | 'icon'; children?: React.ReactNode; [key: string]: any }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10",
    outline: "border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600",
    white: "bg-white text-emerald-900 hover:bg-slate-50 shadow-sm",
    accent: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20",
  };
  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 py-2 text-sm",
    lg: "h-14 px-10 text-lg",
    icon: "h-10 w-10",
  };
  return <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

const Card = ({ children, className = "", onClick }: { children?: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={`rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all duration-500 ${className}`} onClick={onClick}>{children}</div>
);

const Badge = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${className}`}>{children}</span>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-2xl font-black tracking-tight text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

/**
 * PAGE COMPONENTS
 */

const Navbar = ({ setPage, user }: { setPage: (p: string) => void; user: any }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-slate-200 py-3 shadow-sm' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('index')}>
          <div className="bg-emerald-600 p-2 rounded-2xl shadow-xl shadow-emerald-500/40">
            <Church className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">Church<span className="text-emerald-600">OS</span></span>
        </div>

        <div className="hidden lg:flex items-center space-x-10 text-xs font-black uppercase tracking-widest text-slate-400">
          <button onClick={() => setPage('registry')} className="hover:text-emerald-600 transition-colors">Global Registry</button>
          <button onClick={() => setPage('growth')} className="hover:text-emerald-600 transition-colors">AI Growth Engine</button>
          <button onClick={() => setPage('philanthropy')} className="hover:text-emerald-600 transition-colors">Philanthropy</button>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Button variant="dark" onClick={() => setPage('dashboard')}>Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:flex" onClick={() => setPage('login')}>Sign In</Button>
              <Button variant="primary" onClick={() => setPage('register')}>Get Started</Button>
            </>
          )}
          <button className="lg:hidden p-2 text-slate-900" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {mobileMenu && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-8 flex flex-col space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          <button onClick={() => { setPage('registry'); setMobileMenu(false); }} className="text-left text-sm font-black uppercase tracking-widest text-slate-900">Global Registry</button>
          <button onClick={() => { setPage('growth'); setMobileMenu(false); }} className="text-left text-sm font-black uppercase tracking-widest text-slate-900">AI Growth Engine</button>
          <button onClick={() => { setPage('philanthropy'); setMobileMenu(false); }} className="text-left text-sm font-black uppercase tracking-widest text-slate-900">Philanthropy</button>
          <hr className="border-slate-100" />
          <Button variant="ghost" className="justify-start" onClick={() => { setPage('login'); setMobileMenu(false); }}>Sign In</Button>
          <Button variant="primary" onClick={() => { setPage('register'); setMobileMenu(false); }}>Register Your Ministry</Button>
        </div>
      )}
    </nav>
  );
};

const HeroV5 = ({ setPage }: { setPage: (p: string) => void }) => (
  <section className="relative pt-44 pb-24 md:pt-60 md:pb-40 overflow-hidden bg-slate-50">
    <div className="absolute inset-0 pointer-events-none opacity-40">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-300/20 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-300/10 blur-[150px] rounded-full"></div>
    </div>

    <div className="container mx-auto px-6">
      <div className="max-w-5xl mx-auto text-center space-y-10">
        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
          Global Verified Registry • 2.1M Sanctuaries
        </Badge>

        <h1 className="text-6xl md:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter">
          Unite the <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">
            Global Sanctuary.
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium">
          The first intelligent operating system built for ministry transparency, predictive growth management, and universal philanthropy.
        </p>

        {/* RESTORED ORIGINAL BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Button size="lg" variant="primary" className="h-16 px-10 group" onClick={() => setPage('church')}>
            Explore Featured Church
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" className="h-16 px-10" onClick={() => setPage('register')}>
            Start Your Journey
          </Button>
        </div>

        {/* REGISTRY SEARCH UTILITY */}
        <div className="relative max-w-3xl mx-auto group pt-12">
          <Card className="relative p-3 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
              <input
                placeholder="Find a church by location, denomination, or ministry..."
                className="w-full h-14 md:h-16 pl-14 pr-6 bg-transparent border-none focus:ring-0 text-slate-900 font-bold placeholder:text-slate-400"
              />
            </div>
            <Button size="lg" className="h-14 md:h-16 px-12 bg-slate-950 hover:bg-slate-900 shadow-xl">
              Search Registry
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

const EcosystemPillars = () => {
  const pillars = [
    {
      id: 1,
      title: "Member Hub & Devotion Engine",
      icon: <BookOpen className="w-5 h-5 text-indigo-400" />,
      tag: "SPIRITUAL CORE",
      desc: "The spiritual 'Secret Place' for every believer. Features ChurchGPT for context-aware theological inquiry, automated SOAP journaling with sentiment analysis, and bilingual scripture immersion.",
      features: ["ChurchGPT Companion", "Sentiment Tracking", "90-Day Journey", "Streak Gamification"]
    },
    {
      id: 2,
      title: "Mission Control (Shepherd Dash)",
      icon: <Shield className="w-5 h-5 text-rose-400" />,
      tag: "ADMINISTRATIVE HEART",
      desc: "Powered by the Church OS Assistant bot. Real-time engagement scoring (0-100), predictive Care Alerts (Red/Amber), and automated Victory Briefings via Brevo.",
      features: ["Assistant bot", "Engagement Radar", "Proactive Alerts", "Briefing Engine"]
    },
    {
      id: 3,
      title: "Ministry Leadership Dashboard",
      icon: <Users className="w-5 h-5 text-amber-400" />,
      tag: "OPERATIONAL BLUEPRINT",
      desc: "Vertical-specific intelligence for department leads. Includes AI-generated Growth Blueprints, a Pastoral Approval Gate for machine-insights, and intelligent resource matching.",
      features: ["Growth Blueprints", "Approval Gates", "Skill Matching", "Dept Analytics"]
    },
    {
      id: 4,
      title: "SaaS Onboarding & Growth Portal",
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      tag: "DIGITAL GATEWAY",
      desc: "Frictionless provisioning with Theological DNA capture. Automated church setup, Day 1 Growth Strategies, and secure Magic Link onboarding for leadership teams.",
      features: ["DNA Capture", "Auto-Provisioning", "Magic Links", "Global Registry"]
    },
    {
      id: 5,
      title: "Corporate Console (Super Admin)",
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      tag: "PLATFORM ENGINE",
      desc: "Command-level orchestration for the platform. Global analytics, real-time health monitoring across all sanctuaries, and PIL engine oversight.",
      features: ["Global ROI", "PIL Strategy", "Multi-Tenant Ops", "Health Pulse"]
    }
  ];

  return (
    <section className="py-24 bg-[#0a0c10] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
      
      <div className="container mx-auto px-6">
        <div className="mb-20 space-y-4">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase">
            Platform Architecture
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none font-manrope">
            The Five Pillars of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Church OS</span>
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg font-light leading-relaxed">
            A comprehensive, AI-orchestrated ecosystem designed to strengthen every layer of modern church life—from the secret place to the command center.
          </p>
        </div>

        <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-800/50 bg-slate-900/20 backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase w-16 text-center">#</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase w-1/4">Pillar & Core Service</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Intelligence Capability & Descriptive</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase w-1/4">Key Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {pillars.map((pillar) => (
                <tr key={pillar.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-10 align-top text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800/50 text-slate-400 font-bold text-xs group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                      0{pillar.id}
                    </span>
                  </td>
                  <td className="px-8 py-10 align-top">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800/50 group-hover:scale-110 transition-transform">
                          {pillar.icon}
                        </div>
                        <h4 className="text-lg font-bold text-white leading-none">{pillar.title}</h4>
                      </div>
                      <span className="inline-block text-[9px] font-black text-amber-500/80 tracking-widest uppercase bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                        {pillar.tag}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-10 align-top">
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md italic font-light">
                      {pillar.desc}
                    </p>
                  </td>
                  <td className="px-8 py-10 align-top">
                    <div className="grid grid-cols-2 gap-2">
                      {pillar.features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-wider">
                          <Check className="w-2.5 h-2.5 text-emerald-500/60" />
                          {feat}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-slate-800/50">
                  {pillar.icon}
                </div>
                <span className="text-xs font-bold text-slate-600">0{pillar.id}</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-1">{pillar.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{pillar.desc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/50">
                {pillar.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureIntegrity = ({ setPage }: { setPage: (p: string) => void }) => (
  <section className="py-32 bg-white">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-10">
          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100">Growth Management Software</Badge>
          <h2 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
            Built for <br /><span className="text-indigo-600">Intelligent</span> <br />Ministry.
          </h2>
          <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
            Go beyond simple admin. Church OS provides a functional suite for membership management, AI sermon transcription, and deep demographic analytics.
          </p>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-black">Predictive AI</h4>
              <p className="text-sm text-slate-400 font-medium">Track engagement dips and pastoral needs before they happen.</p>
            </div>
            <div className="space-y-3">
              <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="text-xl font-black">Growth Analytics</h4>
              <p className="text-sm text-slate-400 font-medium">Data-driven insights for location planting and outreach.</p>
            </div>
          </div>
          <Button variant="outline" className="h-14 px-10" onClick={() => setPage('growth')}>Software Walkthrough</Button>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-indigo-500/5 blur-[120px] rounded-full"></div>
          <Card className="p-1 border-none shadow-none bg-slate-100/50">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spiritual Health Index</p>
                  <h3 className="text-2xl font-black">Congregation Vitality</h3>
                </div>
                <BarChart3 className="text-indigo-600 h-8 w-8" />
              </div>
              <div className="space-y-6">
                {[
                  { label: "Community Outreach", val: 88, color: "bg-emerald-500" },
                  { label: "Member Retention", val: 94, color: "bg-indigo-500" },
                  { label: "Giving Consistency", val: 76, color: "bg-amber-500" }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                      <span>{stat.label}</span>
                      <span>{stat.val}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: `${stat.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <p className="text-xs font-bold text-indigo-900">AI Alert: High outreach potential detected in Zone B.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

const PhilanthropyBridge = ({ setPage }: { setPage: (p: string) => void }) => (
  <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-20 items-center">
        <div className="space-y-10">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Global Giving Network</Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
            A Bridge for <br /><span className="text-emerald-500">Global Assistance.</span>
          </h2>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Register your ministry to become part of a verified on-chain donation network. We connect you with international assistance programs, global donors, and peer-to-peer spiritual aid.
          </p>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-emerald-500/10 p-2 rounded-xl h-fit">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Verified Trust Status</h4>
                <p className="text-slate-400">On-chain verification builds instant credibility for international donors.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-emerald-500/10 p-2 rounded-xl h-fit">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-bold">Zero-Friction Grants</h4>
                <p className="text-slate-400">Automated assistance programs for disaster relief and community expansion.</p>
              </div>
            </div>
          </div>
          <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setPage('register')}>
            Become a Verified Beneficiary
          </Button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-4 bg-emerald-500 blur-3xl opacity-5"></div>
          <Card className="bg-slate-800/50 border-slate-700/50 p-10 text-white backdrop-blur-xl">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">Aid Network Live</h3>
                  <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Real-time Assistance</p>
                </div>
                <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-4">
                {[
                  { region: "Scandinavia", target: "St. Peter's Global", amt: "$4,250", type: "Outreach Grant" },
                  { region: "Texas, USA", target: "Grace Sanctuary", amt: "$1,800", type: "Emergency Aid" },
                  { region: "Singapore", target: "Zion Hill", amt: "$12,000", type: "Expansion Fund" }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-500/10 p-2 rounded-lg">
                        <HeartHandshake className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500">{item.region} → {item.target}</p>
                        <p className="text-sm font-black">{item.type}</p>
                      </div>
                    </div>
                    <span className="text-lg font-mono font-black text-emerald-400">{item.amt}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-700/50 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Secured by ChurchOS Registry Ledger</p>
                <div className="flex justify-center -space-x-2">
                  {[1, 2, 3, 4, 5].map(i => <img key={i} src={`https://i.pravatar.cc/100?u=${i + 10}`} className="w-8 h-8 rounded-full border-2 border-slate-800" />)}
                  <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-slate-800 flex items-center justify-center text-[10px] font-bold">+2.1k</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </section>
);

const DetailedFooter = ({ setPage }: { setPage: (p: string) => void }) => {
  const [nlEmail, setNlEmail] = useState('');
  const [nlDone, setNlDone] = useState(false);

  return (
    <footer className="bg-white pt-32 pb-16 border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 mb-24">
          <div className="col-span-2 space-y-8">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('index')}>
              <div className="bg-emerald-600 p-2 rounded-xl">
                <Church className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-slate-900 uppercase">ChurchOS</span>
            </div>
            <p className="text-slate-400 font-medium max-w-sm leading-relaxed">
              The world's most trusted infrastructure for faith communities. Empowering ministries through intelligence and transparency.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"><Globe size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"><Mail size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"><MessageSquare size={18} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Registry</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><button onClick={() => setPage('registry')} className="hover:text-emerald-600">Find a Church</button></li>
              <li><button onClick={() => setPage('login')} className="hover:text-emerald-600">Verify Profile</button></li>
              <li><button onClick={() => setPage('registry')} className="hover:text-emerald-600">Leader Directory</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Ecosystem</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><button onClick={() => setPage('growth')} className="hover:text-emerald-600">Growth Engine</button></li>
              <li><button onClick={() => setPage('philanthropy')} className="hover:text-emerald-600">Philanthropy</button></li>
              <li><button onClick={() => setPage('growth')} className="hover:text-emerald-600">AI Insights</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Company</h4>
            <ul className="space-y-4 text-sm font-bold text-slate-500">
              <li><button onClick={() => setPage('index')} className="hover:text-emerald-600">Our Mission</button></li>
              <li><button onClick={() => setPage('partners')} className="hover:text-emerald-600">Partnering</button></li>
              <li><button onClick={() => setPage('support')} className="hover:text-emerald-600">Support Hub</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-8">Newsletter</h4>
            {nlDone ? (
              <p className="text-emerald-600 font-bold text-sm">You're subscribed!</p>
            ) : (
              <div className="space-y-4">
                <input
                  placeholder="Email"
                  className="w-full h-11 px-4 bg-slate-50 border-none rounded-xl text-xs font-bold"
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                />
                <Button className="w-full h-11" onClick={async () => {
                  if (!nlEmail) return;
                  await supabase.from('public_inquiries').insert({
                    email: nlEmail,
                    visitor_intent: 'newsletter_signup',
                    first_name: 'Newsletter',
                    last_name: 'Subscriber',
                  });
                  setNlDone(true);
                }}>Subscribe</Button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-200">© 2024 Church OS Collective</p>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <button onClick={() => setPage('index')} className="hover:text-slate-900 transition-colors">Privacy</button>
            <button onClick={() => setPage('registry')} className="hover:text-slate-900 transition-colors">Registry Terms</button>
            <button onClick={() => setPage('philanthropy')} className="hover:text-slate-900 transition-colors">Audit Ledger</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

/**
 * CONTEXTUAL PAGES
 */

const RegistryPage = ({ setPage }: { setPage: (p: string) => void }) => {
  const [churches, setChurches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regLoading, setRegLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setRegLoading(true);
      let query = supabase
        .from('church_registry')
        .select('name, slug, city, country, denomination, member_count, is_verified, is_church_os_client, address, pastor_name', { count: 'exact' })
        .order('is_church_os_client', { ascending: false })
        .limit(100);
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%,denomination.ilike.%${searchQuery}%`);
      }
      const { data } = await query;
      setChurches(data || []);
      setRegLoading(false);
    };
    fetch();
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 mb-20">
          <Badge className="bg-emerald-100 text-emerald-700">Global Infrastructure</Badge>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">The Global Faith <span className="text-emerald-600">Registry.</span></h1>
          <p className="text-xl text-slate-500 font-medium">Access the world's most detailed database of verified sanctuaries, missions, and spiritual community centers.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Filter size={14} /> Filters</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Denomination</label>
                  <select className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold">
                    <option>All Denominations</option>
                    <option>Apostolic</option>
                    <option>Baptist</option>
                    <option>Non-denominational</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block mb-2">Verification Status</label>
                  <div className="space-y-2">
                    {["On-chain Verified", "Pending Verification", "Claimed Profile"].map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-xs font-bold text-slate-500">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  placeholder="Search 2.1M+ ministries..."
                  className="w-full h-14 pl-12 pr-4 bg-transparent border-none font-bold text-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {!regLoading && churches.length > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Badge className="bg-slate-100 text-slate-400 lowercase">{churches.length} found</Badge>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {regLoading ? (
                <div className="col-span-2 text-center py-20 text-slate-400 font-bold">
                  Loading registry...
                </div>
              ) : churches.map((c, i) => (
                <Card key={i} className="p-8 hover:border-emerald-600 cursor-pointer group" onClick={() => setPage('church')}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-emerald-50 p-3 rounded-2xl">
                      <Church className="text-emerald-600" />
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {c.is_verified && (
                        <Badge className="bg-emerald-500 text-white">Verified</Badge>
                      )}
                      {c.is_church_os_client && (
                        <Badge className="bg-indigo-600 text-white">Church OS</Badge>
                      )}
                    </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                    <MapPin size={12}/> {c.city}, {c.country}
                  </p>
                  <p className="text-slate-300 text-xs mt-1">{c.denomination} · {c.member_count?.toLocaleString()} members</p>
                  <p className="text-slate-400 text-[10px] font-bold mt-2">
                    <span className="uppercase tracking-widest opacity-60">Lead Pastor:</span> <span className="text-slate-600">{c.pastor_name || 'TBD'}</span>
                  </p>
                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    <span>View Full Profile</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GrowthEnginePage = ({ setPage }: { setPage: (p: string) => void }) => (
  <div className="min-h-screen bg-white pt-32 pb-20">
    <div className="container mx-auto px-6">
      <div className="max-w-4xl mb-24 space-y-6">
        <Badge className="bg-indigo-50 text-indigo-600">The Core OS</Badge>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">AI Growth <br />& Intelligence.</h1>
        <p className="text-2xl text-slate-500 font-medium max-w-2xl leading-relaxed">The software suite that powers the global sanctuary. High-fidelity analytics for high-impact ministry.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-12 border-none bg-slate-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><BrainCircuit size={200} /></div>
            <div className="max-w-xl space-y-6">
              <h3 className="text-4xl font-black text-slate-900">Predictive Pastoral Care</h3>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">Our AI identifies drops in spiritual engagement and participation trends before they result in member loss. Get real-time alerts to provide care exactly when it's needed.</p>
              <ul className="space-y-4">
                {["Sentiment analysis on prayer requests", "Attendance pattern recognition", "Personalized outreach recommendations"].map(f => (
                  <li key={f} className="flex items-center gap-3 font-bold text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-10 border-none bg-indigo-900 text-white">
              <Database className="h-10 w-10 text-indigo-400 mb-8" />
              <h4 className="text-2xl font-black mb-4">Demographic Intel</h4>
              <p className="text-indigo-200/70 font-medium leading-relaxed">Analyze the surrounding community demographics to plan locations and outreach with surgical precision.</p>
            </Card>
            <Card className="p-10 border-none bg-emerald-900 text-white">
              <Sparkles className="h-10 w-10 text-emerald-400 mb-8" />
              <h4 className="text-2xl font-black mb-4">Content AI</h4>
              <p className="text-emerald-200/70 font-medium leading-relaxed">Auto-transcribe sermons, generate multi-language translations, and create social content in seconds.</p>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="p-10 text-center space-y-8">
            <h4 className="text-xl font-black">Current Network Health</h4>
            <div className="space-y-6">
              {[
                { l: "Global Engagement", v: "+14.2%" },
                { l: "Registry Uptime", v: "99.99%" },
                { l: "AI Accuracy", v: "92%" }
              ].map(s => (
                <div key={s.l} className="flex justify-between items-center py-4 border-b border-slate-50">
                  <span className="text-xs font-black uppercase text-slate-400">{s.l}</span>
                  <span className="text-lg font-black text-indigo-600">{s.v}</span>
                </div>
              ))}
            </div>
            <Button variant="accent" className="w-full h-14" onClick={() => setPage('register')}>Get Started with Engine</Button>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

const PhilanthropyPage = ({ setPage }: { setPage: (p: string) => void }) => (
  <div className="min-h-screen bg-slate-950 pt-32 pb-20 text-white">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
        <div className="space-y-10">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">The Giving Bridge</Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">universal <br /><span className="text-emerald-500">philanthropy.</span></h1>
          <p className="text-2xl text-slate-400 font-medium leading-relaxed">Connecting verified ministries with a global network of donors through secure, on-chain transparency.</p>
          <div className="flex gap-4">
            <Button size="lg" className="h-16 px-10" onClick={() => setPage('register')}>Register Beneficiary</Button>
            <Button size="lg" variant="outline" className="h-16 px-10 bg-transparent text-white border-white/20">View Donation Ledger</Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-10 bg-emerald-500/10 blur-[150px] rounded-full"></div>
          <Card className="bg-white/5 border-white/10 p-12 backdrop-blur-xl">
            <h3 className="text-3xl font-black mb-8 flex items-center gap-4"><Coins className="text-emerald-500" /> Trust Ledger</h3>
            <div className="space-y-6">
              {[
                { from: "Donor-2882", to: "St. Peter's Global", amt: "$500", t: "Verified" },
                { from: "Aid-Grant-33", to: "Zion Hill Sanctuary", amt: "$12,500", t: "Verified" },
                { from: "Donor-1109", to: "Japan Kingdom Church", amt: "$2,000", t: "Verified" }
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center py-4 border-b border-white/5">
                  <div>
                    <p className="text-xs font-black uppercase text-emerald-500 mb-1">{tx.t}</p>
                    <p className="text-sm font-bold text-slate-400">{tx.from} → {tx.to}</p>
                  </div>
                  <span className="text-xl font-mono font-black">{tx.amt}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

/**
 * CHURCH PROFILE (JKC)
 */

const FeaturedChurchProfile = ({ setPage }: { setPage: (p: string) => void }) => {
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const church = jkcChurchData;

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Hero Header */}
      <section className="relative h-[45vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} className="w-full h-full object-cover" alt="Hero" />
          <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-[2px]" />
        </div>
        <div className="relative container mx-auto px-6 h-full flex items-end pb-12">
          <div className="max-w-4xl text-white">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white p-2 rounded-xl"><Church className="text-emerald-600" size={24} /></div>
              <Badge className="bg-emerald-500 text-white border-none">{church.denomination}</Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">{church.name}</h1>
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mb-2">{church.motto}</p>
            <p className="text-lg text-slate-300 leading-relaxed max-w-2xl font-medium">{church.missionStatement}</p>

            <div className="flex flex-wrap gap-8 mt-10 text-sm font-black uppercase tracking-widest text-emerald-100/60">
              <div className="flex items-center gap-2"><MapPin size={18} className="text-emerald-500" /> {church.address.split(',').slice(-2).join(',')}</div>
              <div className="flex items-center gap-2"><Users size={18} className="text-emerald-500" /> {church.memberCount} Members</div>
              <div className="flex items-center gap-2 font-mono text-emerald-500">ID: #CP-JKC-2017</div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Actions */}
      <div className="container mx-auto px-6 -mt-8 relative z-10">
        <div className="flex flex-wrap gap-4">
          <Button size="lg" className="h-16 px-10 shadow-2xl" onClick={() => setShowVisitDialog(true)}>I Want to Visit</Button>
          <Button size="lg" variant="outline" className="h-16 px-10 bg-white shadow-xl" onClick={() => setShowJoinDialog(true)}>Join Our Church</Button>
          <Button size="lg" variant="dark" className="h-16 px-10 ml-auto hidden md:flex">Support Ministry</Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-20">
            <section className="space-y-10">
              <h2 className="text-4xl font-black tracking-tight text-slate-900">Service Gatherings</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {church.serviceTimes.map((service, i) => (
                  <Card key={i} className="p-8 border-none bg-white">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-emerald-50 p-3 rounded-2xl"><Clock className="text-emerald-600" /></div>
                      <Badge className="bg-slate-100 text-slate-500">{service.type}</Badge>
                    </div>
                    <h4 className="text-2xl font-black mb-1">{service.day}</h4>
                    <p className="text-lg font-bold text-emerald-600">{service.time}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section className="space-y-10">
              <div className="flex justify-between items-end">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">Active Ministries</h2>
                <p className="text-emerald-600 font-black uppercase text-xs tracking-widest">{church.ministryCount} Initiatives</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {church.ministries.map((min, i) => (
                  <Card key={i} className="p-8 hover:bg-emerald-600 hover:text-white group">
                    <h4 className="text-xl font-black mb-2">{min.name}</h4>
                    <p className="text-sm font-medium text-slate-500 group-hover:text-emerald-100 mb-6 leading-relaxed">{min.description}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Led by {min.leader}</p>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-10">
            <Card className="p-10 text-center space-y-6">
              <div className="w-32 h-32 rounded-[30px] mx-auto overflow-hidden ring-[10px] ring-slate-50">
                <img src="https://i.pravatar.cc/150?u=marcel" className="w-full h-full object-cover" alt="Pastor" />
              </div>
              <div>
                <h4 className="text-2xl font-black tracking-tight">{church.pastor}</h4>
                <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest mt-1">Lead Pastor</p>
              </div>
              <p className="text-slate-500 font-medium italic">"Building a community that represents Christ to the world."</p>
            </Card>

            <Card className="p-10 bg-slate-900 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><Play size={100} /></div>
              <h4 className="text-xl font-black mb-2">Join us Online</h4>
              <p className="text-slate-400 font-medium text-sm mb-8">Participate in our services from anywhere in the world.</p>
              <Button className="w-full h-14" variant="primary">Set Stream Reminder</Button>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={showVisitDialog} onClose={() => setShowVisitDialog(false)} title={`Visit ${church.name}`}>
        <div className="space-y-6">
          <input placeholder="Full Name" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
          <input type="email" placeholder="Email Address" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
          <Button className="w-full h-14" onClick={() => setShowVisitDialog(false)}>Submit Request</Button>
        </div>
      </Modal>

      <Modal isOpen={showJoinDialog} onClose={() => setShowJoinDialog(false)} title="Join Our Family">
        <div className="space-y-6 text-center">
          <p className="text-slate-500 font-medium leading-relaxed">To join our membership and connect with our growth programs, please create a verified Church OS account.</p>
          <Button className="w-full h-14" onClick={() => setPage('register')}>Continue to Registration</Button>
        </div>
      </Modal>
    </div>
  );
};

/**
 * DASHBOARD
 */

const UserDashboard = ({ setPage, user, setUser }: { setPage: (p: string) => void; user: any; setUser: (u: any) => void }) => (
  <div className="min-h-screen bg-slate-50 pt-32 pb-20">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">Welcome to Church OS!</h1>
          <p className="text-xl text-slate-500 font-medium mt-2">Connect with churches and grow in community.</p>
        </div>
        <Card className="p-4 flex items-center gap-4 border-none shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-black text-emerald-700">U</div>
          <div>
            <p className="text-sm font-black text-slate-900">{user?.email || "User"}</p>
            <button onClick={() => { setUser(null); setPage('index'); }} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 flex items-center gap-1"><LogOut size={10} /> Sign Out</button>
          </div>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <Card className="p-10 border-none bg-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Users size={120} /></div>
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3"><Users className="text-emerald-600" /> Your Church Connection</h3>
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
              <p className="text-lg font-bold text-slate-900 mb-2">You're not connected yet.</p>
              <p className="text-slate-500 font-medium mb-8">Explore churches in the network to find your home.</p>
              <Button onClick={() => setPage('registry')}>Browse Registry</Button>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { icon: Search, title: "Find Churches", desc: "Discover ministries in your area.", page: 'registry' },
              { icon: Calendar, title: "Upcoming Events", desc: "Stay connected with gatherings.", page: 'dashboard' }
            ].map((action, i) => (
              <Card key={i} className="p-8 border-none hover:translate-y-[-5px]">
                <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><action.icon className="text-emerald-600" /></div>
                <h4 className="text-xl font-black mb-2">{action.title}</h4>
                <p className="text-sm text-slate-500 font-medium mb-6">{action.desc}</p>
                <Button variant="outline" className="w-full" onClick={() => setPage(action.page)}>View All</Button>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-10">
          <Card className="p-10 bg-emerald-950 text-white border-none">
            <h4 className="text-xl font-black mb-8 tracking-tight">Getting Started</h4>
            <div className="space-y-8">
              {[{ n: 1, t: "Complete Profile" }, { n: 2, t: "Explore Registry" }, { n: 3, t: "Connect & Engage" }].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-black text-xs">{step.n}</div>
                  <p className="font-bold text-sm">{step.t}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

/**
 * MAIN APP CONTROLLER
 */

export default function App() {
  const router = useRouter();
  const [page, setPage] = useState('index');
  const [user, setUser] = useState<any>(null);

  const nav = (p: string) => {
    const routes: Record<string, string> = {
      registry: `${BP}/platform/registry/`,
      growth: `${BP}/platform/ai/`,
      philanthropy: `${BP}/platform/philanthropy/`,
      church: `${BP}/platform/church/japan-kingdom-church-tokyo/`,
      register: `${BP}/platform/register/`,
      login: `${BP}/platform/login/`,
      index: `${BP}/platform/`,
      dashboard: `${BP}/shepherd/dashboard/`,
      pricing: `${BP}/platform/register/`,
      partners: `${BP}/platform/partners/`,
      support: `${BP}/platform/support/`,
    };
    if (routes[p]) router.push(routes[p]);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleRegister = (email: string) => {
    setUser({ email });
    nav('dashboard');
  };

  const renderContent = () => {
    switch (page) {
      case 'index': return (
        <>
          <HeroV5 setPage={nav} />
          <EcosystemPillars />
          <FeatureIntegrity setPage={nav} />
          <PhilanthropyBridge setPage={nav} />
          <DetailedFooter setPage={nav} />
        </>
      );
      case 'registry': return <RegistryPage setPage={nav} />;
      case 'growth': return <GrowthEnginePage setPage={nav} />;
      case 'philanthropy': return <PhilanthropyPage setPage={nav} />;
      case 'register': return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-emerald-600 p-12 md:p-24 text-white flex flex-col justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => nav('index')}><Church size={32} /> <span className="text-2xl font-black tracking-tighter uppercase">CHURCHOS</span></div>
            <div>
              <h2 className="text-6xl font-black tracking-tighter leading-none mb-8">Claim Your Sanctuary.</h2>
              <div className="space-y-6">
                {["Global Assistance Eligible", "Growth Intelligence Tools", "Verified Trust Status"].map((t, i) => (
                  <div key={i} className="flex gap-4 items-center"><CheckCircle size={20} /><span className="font-bold">{t}</span></div>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Audit-ready Infrastructure</p>
          </div>
          <div className="md:w-2/3 p-8 md:p-24 flex items-center justify-center">
            <Card className="w-full max-w-xl p-12 border-none shadow-none bg-white">
              <h3 className="text-4xl font-black mb-8 tracking-tight">Create Ministry Profile</h3>
              <div className="space-y-6">
                <input placeholder="Ministry Name" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
                <input placeholder="Email" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
                <Button className="w-full h-14" size="lg" onClick={() => handleRegister("admin@church.com")}>Begin Listing</Button>
                <Button variant="outline" className="w-full h-14" onClick={() => nav('login')}>Already have a profile?</Button>
              </div>
            </Card>
          </div>
        </div>
      );
      case 'login': return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-16 text-center space-y-10 border-none shadow-2xl">
            <div className="bg-emerald-600 w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white"><Church size={32} /></div>
            <h3 className="text-3xl font-black tracking-tight text-slate-900">Registry Access</h3>
            <div className="space-y-4 text-left">
              <input placeholder="Email" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
              <input type="password" placeholder="Pass-key" className="w-full h-14 px-5 rounded-2xl bg-slate-50 border-none font-bold" />
              <Button className="w-full h-14 mt-4" onClick={() => handleRegister("user@example.com")}>Sign In</Button>
            </div>
            <button onClick={() => nav('index')} className="text-[10px] font-black uppercase tracking-widest text-slate-300">Return Home</button>
          </Card>
        </div>
      );
      case 'church': return <FeaturedChurchProfile setPage={nav} />;
      case 'dashboard': return <UserDashboard setPage={nav} user={user} setUser={setUser} />;
      default: return <HeroV5 setPage={nav} />;
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-600 selection:text-white font-sans antialiased overflow-x-hidden">
      <Navbar setPage={nav} user={user} />
      <main>{renderContent()}</main>
    </div>
  );
}