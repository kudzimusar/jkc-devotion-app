"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import { MinistryIntelligenceSilo } from '@/components/dashboard/ministries/MinistryIntelligenceSilo';
import { LeaderProfileExtension } from '@/components/dashboard/ministries/LeaderProfileExtension';

export default function MinistryOverviewClient({ slug }: { slug: string }) {
    const router = useRouter();
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        MinistryAuth.requireAccess(slug).then(sess => {
            setSession(sess);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            router.replace('/ministry-dashboard/');
        });
    }, [slug]);

    if (loading || !session) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing Intelligence Pipeline...</p>
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground">
            <MinistryIntelligenceSilo
                ministryId={session.ministryId}
                ministrySlug={session.slug}
                onBack={() => router.push('/ministry-dashboard/')}
                onOpenProfile={() => setIsProfileOpen(true)}
                forcedRole={session.ministryRole}
            />

            <LeaderProfileExtension 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
}

