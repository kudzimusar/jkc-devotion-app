"use client";

import { Loader2 } from 'lucide-react';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import DynamicFormRenderer, { FormTemplate } from '@/components/forms/DynamicFormRenderer';
import Link from 'next/link';

export default function ReportsClient() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Require at least 'assistant' to submit reports
        MinistryAuth.requireAccess(slug, 'assistant').then(async sess => {
            setSession(sess);

            // Fetch available form templates for this ministry (and universal ones where ministry_id is null)
            const { data, error } = await supabase
                .from('form_templates')
                .select('*')
                .eq('is_active', true)
                .or(`ministry_id.is.null,ministry_id.eq.${sess.ministryId}`);
            
            if (data) {
                setTemplates(data as FormTemplate[]);
            } else {
                console.error("Failed to load templates", error);
            }
            
            setLoading(false);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    if (loading || !session) {
        return <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#080c14] text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
            <div className="max-w-4xl mx-auto space-y-6 relative z-10">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-wide">{session.ministryName} Reports</h1>
                        <p className="text-white/40 text-sm mt-1 font-medium uppercase tracking-widest">Submit operational reports and track metrics.</p>
                    </div>
                    <Link href={`/ministry-dashboard/${slug}`} className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors border border-white/10 px-4 py-2 rounded-full bg-[#0d1421]">
                        ← Back to Ministry Hub
                    </Link>
                </div>

                {!selectedTemplate ? (
                    <div>
                        <h2 className="text-lg font-black text-white mb-5 tracking-wide">Select a Report Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(tmpl => (
                                <button 
                                    key={tmpl.id} 
                                    onClick={() => setSelectedTemplate(tmpl)}
                                    className="bg-[#0d1421] border border-white/10 p-6 rounded-3xl hover:border-violet-500/50 hover:bg-white/5 transition-all shadow-xl text-left group"
                                >
                                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400">{tmpl.name}</h3>
                                    {tmpl.description && (
                                        <p className="text-white/40 text-sm mt-2 font-medium">{tmpl.description}</p>
                                    )}
                                    <div className="mt-4 inline-flex text-[10px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 px-3 py-1.5 rounded-full border border-violet-500/20">
                                        Type: {tmpl.report_type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button 
                            onClick={() => setSelectedTemplate(null)}
                            className="bg-[#0d1421] px-5 py-2.5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                        >
                            ← Select Different Report
                        </button>
                        
                        <div className="bg-[#0d1421] border border-white/10 rounded-3xl p-8 shadow-2xl">
                            <h2 className="text-xl font-black text-white mb-6 tracking-wide">New: {selectedTemplate.name}</h2>
                            <DynamicFormRenderer 
                                template={selectedTemplate} 
                                ministryId={session.ministryId}
                                onSuccess={() => {
                                    setSelectedTemplate(null);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
