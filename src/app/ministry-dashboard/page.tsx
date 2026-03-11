"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { basePath as BP } from '@/lib/utils';
import { Flame } from 'lucide-react';

function MinistryDashboardContent() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          window.location.href = `${BP}/ministry/login/`;
        }
        return;
      }
      setSessionUser(session.user);
      await loadMemberships(session.user.id);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
         if (typeof window !== 'undefined') window.location.href = `${BP}/ministry/login/`;
      } else if (!sessionUser) {
         setSessionUser(session.user);
         loadMemberships(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run only once

  const loadMemberships = async (userId: string) => {
    setLoading(true);
    const { data: userMemberships } = await supabase
      .from('ministry_members')
      .select(`
        ministry_role,
        ministries!inner(name, slug, color, icon, description, is_active)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('ministries.is_active', true)
      .in('ministry_role', ['leader', 'assistant', 'volunteer', 'member']);

    if (!userMemberships || userMemberships.length === 0) {
       // If no memberships, this means they don't have access.
       setLoading(false);
       return;
    }

    setMemberships(userMemberships || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c14] text-white">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] text-white p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-[#0d1421] border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
              <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Access Denied</h1>
          <p className="text-white/40 text-sm">You are not assigned to any ministry dashboards or lack sufficient permissions. Please request access from an administrator.</p>
          <button 
             onClick={async () => {
                 await supabase.auth.signOut();
                 window.location.href = `${BP}/ministry/login/`;
             }}
             className="w-full h-12 rounded-xl bg-white/5 border border-white/10 font-bold text-white hover:bg-white/10 transition-colors"
          >
             Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8 mt-10 z-10">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-white tracking-wide">Your Ministries</h1>
              <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Ministry Intelligence Layer</p>
            </div>
            <button 
                onClick={async () => {
                   await supabase.auth.signOut();
                   window.location.href = `${BP}/ministry/login/`;
                }}
                className="text-xs text-white/40 font-bold hover:text-white transition-colors uppercase tracking-widest"
            >
                Log Out
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m: any, idx: number) => {
            const min = Array.isArray(m.ministries) ? m.ministries[0] : m.ministries;
            if (!min) return null;
            return (
              <Link 
                key={idx} 
                href={`/ministry-dashboard/${min.slug || ''}`}
                className="block p-8 bg-[#0d1421] border border-white/10 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: min.color || '#8b5cf6' }} />
                <div className="relative z-10">
                    <div 
                    className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center text-white shadow-lg" 
                    style={{ backgroundColor: min.color || '#8b5cf6' }}
                    >
                    <span className="font-black text-xl">{(min.name || 'M').charAt(0)}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-white">{min.name || 'Untitled Ministry'}</h2>
                    <p className="text-violet-400 uppercase tracking-widest text-[10px] font-black mb-4">{m.ministry_role || 'Member'}</p>
                    <p className="text-white/40 text-sm line-clamp-2 leading-relaxed">{min.description || 'No description provided.'}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default function MinistryDashboardIndex() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
    }>
      <MinistryDashboardContent />
    </Suspense>
  )
}
