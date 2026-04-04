'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PublicChurchGPTHero() {
  const scrollToChat = () => {
    document.getElementById('churchgpt-chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="bg-[#0f1f3d] py-16 px-6 min-h-[45vh] flex flex-col items-center justify-center text-center">
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-top-6 duration-1000">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M7 8h10" />
          </svg>
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight">
            ChurchGPT
          </h1>
        </div>

        {/* Text */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl text-slate-300 font-medium tracking-wide leading-relaxed">
            Your Christian AI Companion
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed antialiased">
            The AI that knows the Bible, loves people, and never pretends to be neutral about Jesus.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            onClick={scrollToChat}
            className="bg-[#D4AF37] hover:bg-[#B8962E] text-white px-10 py-7 text-lg font-bold tracking-[0.05em] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#D4AF37]/10"
          >
            Try ChurchGPT Free →
          </Button>
          <Link href="/churchgpt/login">
            <Button 
              variant="outline" 
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-10 py-7 text-lg font-medium tracking-wide transition-all"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
