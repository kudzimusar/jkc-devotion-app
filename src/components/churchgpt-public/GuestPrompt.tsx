'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface GuestPromptProps {
  variant: 'soft' | 'hard'
  onContinue?: () => void
}

export function GuestPrompt({ variant, onContinue }: GuestPromptProps) {
  const isSoft = variant === 'soft'

  return (
    <div className="flex justify-center my-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="w-full max-w-md p-8 border-2 border-[#0f1f3d] bg-white shadow-xl text-center space-y-6">
        <div className="flex justify-center">
          <img src="/cgpt-icons/icon-128x128.png" alt="ChurchGPT" className="w-16 h-16" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-serif text-[#0f1f3d]">
            {isSoft ? "You've been chatting for a bit." : "You've reached the guest limit."}
          </h3>
          <p className="text-slate-600">
            {isSoft 
              ? "Create a free account to save your conversation history and pick up where you left off." 
              : "Sign up free — it takes 30 seconds. Your conversation will be saved."
            }
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/churchgpt/signup" className="w-full">
            <Button className="w-full bg-[#D4AF37] hover:bg-[#B8962E] text-white py-6 text-lg font-medium tracking-wide">
              Create Free Account
            </Button>
          </Link>
          
          {isSoft ? (
            <Button 
              variant="ghost" 
              onClick={onContinue}
              className="text-slate-500 hover:text-[#0f1f3d] hover:bg-slate-50"
            >
              Maybe later
            </Button>
          ) : (
            <Link href="/churchgpt/login" className="w-full">
              <Button 
                variant="outline" 
                className="w-full border-2 border-[#0f1f3d] text-[#0f1f3d] hover:bg-slate-50 py-6 text-lg font-medium"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
