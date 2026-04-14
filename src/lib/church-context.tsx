'use client';
/**
 * ChurchContext — Single source of truth for per-church branding and org identity.
 * URL slug is primary. sessionStorage is fallback when navigating outside slug routes.
 * Consumed by PublicNav, PublicFooter, and any component that needs church identity.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from './supabase';

export interface ChurchOrg {
  id: string;
  name: string;
  church_slug: string;
  logo_url: string | null;
  domain: string | null;
  status: string;
  created_at: string;
  // Dynamic fields we expect or will handle via '*'
  [key: string]: any;
}

interface ChurchContextValue {
  org: ChurchOrg | null;
  slug: string | null;
  isLoading: boolean;
}

const ChurchContext = createContext<ChurchContextValue>({
  org: null,
  slug: null,
  isLoading: true,
});

export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const [org, setOrg] = useState<ChurchOrg | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL slug is primary source of truth
  const urlSlug = params?.church_slug as string | undefined;

  // sessionStorage is fallback when navigating outside slug routes (e.g. /welcome/devotion)
  const slug: string | null = urlSlug ??
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('church_os_church_slug')
      : null);

  useEffect(() => {
    // Persist slug to sessionStorage whenever URL carries it
    if (urlSlug && typeof window !== 'undefined') {
      sessionStorage.setItem('church_os_church_slug', urlSlug);
    }

    if (!slug) {
      setIsLoading(false);
      return;
    }

    (async () => {
      // Fetch everything to see available columns
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('church_slug', slug)
        .eq('status', 'active')
        .single();

      console.log('Church OS [ChurchProvider] Org Data:', data);
      setOrg(data ?? null);
      setIsLoading(false);
    })();
  }, [slug, urlSlug]);

  return (
    <ChurchContext.Provider value={{ org, slug, isLoading }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);
