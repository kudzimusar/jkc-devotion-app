'use client';
/**
 * ChurchContext — Single source of truth for per-church branding and org identity.
 * URL slug is primary. sessionStorage is fallback when navigating outside slug routes.
 * Consumed by PublicNav, PublicFooter, and any component that needs church identity.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from './supabase';
import { resolvePublicOrgId } from './org-resolver';

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

    const resolveContext = async () => {
      setIsLoading(true);
      try {
        let resolvedId: string | null = null;

        // ── 1. Resolve via Slug (URL or Session) ──
        if (slug) {
          const { data } = await supabase
            .from('organizations')
            .select('id')
            .eq('church_slug', slug)
            .eq('status', 'active')
            .single();
          resolvedId = data?.id ?? null;
        }

        // ── 2. Resolve via Domain (Hostname) ──
        if (!resolvedId) {
          resolvedId = await resolvePublicOrgId();
        }

        // ── 3. Fallback to build-time ENV ──
        if (!resolvedId) {
          resolvedId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? null;
        }

        // ── Final Data Fetch ──
        if (resolvedId) {
          const { data } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', resolvedId)
            .eq('status', 'active')
            .single();
          
          setOrg(data ?? null);
          if (data) {
             console.log('Church OS [ChurchProvider] Context Resolved:', data.name);
             // Ensure session slug stays in sync with resolved domain org
             if (typeof window !== 'undefined' && data.church_slug) {
               sessionStorage.setItem('church_os_church_slug', data.church_slug);
             }
          }
        } else {
          setOrg(null);
          console.warn('Church OS [ChurchProvider] No resolution path successful.');
        }
      } catch (err) {
        console.error('Church OS [ChurchProvider] Resolution error:', err);
        setOrg(null);
      } finally {
        setIsLoading(false);
      }
    };

    resolveContext();
  }, [slug, urlSlug]);

  // Ensure components get a valid slug even if resolution was domain-based
  const contextSlug = slug ?? org?.church_slug ?? null;

  return (
    <ChurchContext.Provider value={{ org, slug: contextSlug, isLoading }}>
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);
