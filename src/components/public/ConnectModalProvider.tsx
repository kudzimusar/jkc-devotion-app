'use client';

import { useEffect, useState } from 'react';
import KingdomConnectModal from '@/components/public/KingdomConnectModal';
import { supabase } from '@/lib/supabase';

/**
 * ConnectModalProvider
 * Mounts the KingdomConnectModal globally on all public-facing pages.
 * Fetches the current session to ensure the modal only appears for guests.
 */
export function ConnectModalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getUser().then((res: any) => {
      setUser(res?.data?.user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      {children}
      {!loading && <KingdomConnectModal user={user} />}
    </>
  );
}
