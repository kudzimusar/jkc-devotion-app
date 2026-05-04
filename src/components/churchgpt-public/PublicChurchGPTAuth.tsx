'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getChurchGPTSupabaseClient } from '@/lib/churchgpt/supabase-client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface PublicChurchGPTAuthProps {
  mode: 'login' | 'signup'
}

export function PublicChurchGPTAuth({ mode }: PublicChurchGPTAuthProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use the module-level singleton to avoid multiple GoTrueClient instances
  const supabase = getChurchGPTSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              source: 'churchgpt_public',
              is_church_member: false
            }
          }
        })
        if (error) throw error

        if (signUpData.user?.id) {
          // Ensure churchgpt_users row exists (trigger handles this too,
          // but upsert here guarantees it's visible in the same session)
          await supabase
            .from('churchgpt_users')
            .upsert({
              user_id: signUpData.user.id,
              email,
              display_name: email.split('@')[0],
              source: 'churchgpt_public',
            }, { onConflict: 'user_id', ignoreDuplicates: true })

          // Send welcome email (fire-and-forget — don't block the signup flow)
          fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-welcome`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
              body: JSON.stringify({ user_id: signUpData.user.id }),
            }
          ).catch(() => { /* silent — email failure must not block signup */ })

          // Merge guest session fingerprint → user account
          const fingerprint = localStorage.getItem('cgpt_fp')
          if (fingerprint) {
            await supabase
              .from('churchgpt_guest_sessions')
              .update({
                converted_user_id: signUpData.user.id,
                converted_at: new Date().toISOString()
              })
              .eq('fingerprint', fingerprint)
            localStorage.removeItem('cgpt_fp')
            localStorage.removeItem('churchgpt_guest_messages')
            localStorage.setItem('churchgpt_guest_count', '0')
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }

      router.push('/churchgpt/chat')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1f3d] flex items-center justify-center p-6">
      <Card className="w-full max-w-[400px] p-10 bg-white border-0 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-3">
          <img src="/cgpt-icons/icon-96x96.png" alt="ChurchGPT" width="56" height="56" className="rounded-xl" />
          <div className="text-center">
            <h1 className="text-3xl font-serif text-[#0f1f3d] tracking-tight">ChurchGPT</h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">
              {mode === 'signup' ? 'Create a free account' : 'Sign in to your account'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[#0f1f3d] font-bold text-xs uppercase tracking-widest">Email</Label>
              <Input 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-12 border-slate-200 focus:border-[#0f1f3d] focus:ring-[#0f1f3d]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0f1f3d] font-bold text-xs uppercase tracking-widest">Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="h-12 border-slate-200 focus:border-[#0f1f3d] focus:ring-[#0f1f3d]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#0f1f3d] hover:bg-[#1a2f5a] text-white py-8 text-lg font-bold tracking-wide transition-all shadow-lg active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" /> : (mode === 'signup' ? 'Create Free Account' : 'Sign In')}
          </Button>
        </form>

        <div className="pt-2 flex flex-col items-center gap-4 border-t border-slate-100 italic">
          <p className="text-slate-500 text-sm">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link 
              href={mode === 'signup' ? '/churchgpt/login' : '/churchgpt/signup'} 
              className="text-[#0f1f3d] font-bold hover:underline decoration-[#D4AF37] decoration-2 underline-offset-4 not-italic"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up Free'}
            </Link>
          </p>
          {mode === 'signup' && (
            <Link 
              href="/churchgpt" 
              className="text-slate-400 text-xs hover:text-[#0f1f3d] transition-colors flex items-center gap-1 group"
            >
              Or continue as guest <span className="text-[#D4AF37] font-bold transition-transform group-hover:translate-x-1">→</span>
            </Link>
          )}
        </div>
      </Card>
    </div>
  )
}
