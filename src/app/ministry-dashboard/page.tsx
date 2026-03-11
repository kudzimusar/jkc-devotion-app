"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth/AuthModal';

function MinistryDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get('redirect');

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionUser(session?.user || null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []); // Run only once

  useEffect(() => {
    if (sessionUser && redirectParams) {
      router.push(redirectParams);
    }
  }, [sessionUser, redirectParams, router]);

  useEffect(() => {
    if (sessionUser) {
      loadMemberships(sessionUser.id);
    }
  }, [sessionUser]);

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
      .eq('ministries.is_active', true);

    setMemberships(userMemberships || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <p className="animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-neutral-900 border border-neutral-800 p-8 rounded-2xl">
          <h1 className="text-2xl font-bold">Ministry Access Required</h1>
          <p className="text-neutral-400">Please log in to access the Ministry Intelligence Layer and view your assigned dashboards.</p>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="w-full h-12 rounded-full bg-indigo-600 font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          >
            LOGIN SECURELY
          </button>
          <Link href="/" className="block text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors mt-4">
            Return to Home
          </Link>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setShowAuthModal(false);
            setSessionUser(u);
          }}
        />
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-neutral-400">You are not assigned to any ministry dashboards.</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8 mt-10">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Your Ministries</h1>
            <Link href="/" className="text-sm text-neutral-500 hover:text-white transition-colors">Return Home</Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m: any, idx: number) => {
            const min = Array.isArray(m.ministries) ? m.ministries[0] : m.ministries;
            return (
              <Link 
                key={idx} 
                href={`/ministry-dashboard/${min.slug}`}
                className="block p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-indigo-500 transition-colors relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: min.color || '#6366F1' }} />
                <div className="relative z-10">
                    <div 
                    className="w-12 h-12 rounded-full mb-4 flex items-center justify-center text-white" 
                    style={{ backgroundColor: min.color || '#6366F1' }}
                    >
                    {/* Icon could go here, for now just initial */}
                    <span className="font-bold text-lg">{min.name.charAt(0)}</span>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">{min.name}</h2>
                    <p className="text-indigo-400 uppercase tracking-widest text-[10px] font-black mb-4">{m.ministry_role}</p>
                    <p className="text-neutral-400 text-sm line-clamp-2">{min.description || 'No description provided.'}</p>
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
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 text-white p-6 flex items-center justify-center">Loading...</div>}>
      <MinistryDashboardContent />
    </Suspense>
  )
}

