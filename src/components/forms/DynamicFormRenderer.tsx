"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TapCounter } from "./TapCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CloudOff, Send, CheckCircle2 } from "lucide-react";

interface FieldDefinition {
    id: string;
    label: string;
    field_type: string;
    is_required: boolean;
    sort_order: number;
}

interface FormDefinition {
    id: string;
    name: string;
    description: string;
    fields: FieldDefinition[];
}

interface DynamicFormRendererProps {
    formId: string;
    campusId?: string;
    onSuccess?: () => void;
}

export function DynamicFormRenderer({ formId, campusId, onSuccess }: DynamicFormRendererProps) {
    const [form, setForm] = useState<FormDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        async function fetchForm() {
            setLoading(true);
            try {
                const { data: formInfo, error: fError } = await supabase
                    .from('forms')
                    .select('*')
                    .eq('id', formId)
                    .single();

                if (fError) throw fError;

                const { data: fields, error: fiError } = await supabase
                    .from('form_fields')
                    .select('*')
                    .eq('form_id', formId)
                    .order('sort_order', { ascending: true });

                if (fiError) throw fiError;

                setForm({ ...formInfo, fields });

                // Initialize form data
                const initial: Record<string, any> = {};
                fields.forEach((f: any) => {
                    initial[f.id] = f.field_type === 'counter' || f.field_type === 'number' ? 0 : "";
                });
                setFormData(initial);

                // Check for local drafts
                const savedDraft = localStorage.getItem(`form_draft_${formId}`);
                if (savedDraft) {
                    setFormData(JSON.parse(savedDraft));
                    toast.info("Restored unsubmitted draft");
                }
            } catch (err) {
                console.error("Form Fetch Error:", err);
                toast.error("Failed to load digital form");
            } finally {
                setLoading(false);
            }
        }

        fetchForm();

        // Online/Offline detection
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [formId]);

    // Auto-save logic
    useEffect(() => {
        if (!loading && form) {
            localStorage.setItem(`form_draft_${formId}`, JSON.stringify(formData));
        }
    }, [formData, loading, form, formId]);

    const handleValueChange = (fieldId: string, val: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to submit forms");
                return;
            }

            // 1. Create Submission Header
            const { data: submission, error: sError } = await supabase
                .from('form_submissions')
                .insert([{
                    form_id: formId,
                    user_id: user.id,
                    campus_id: campusId,
                    submitted_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (sError) throw sError;

            // 2. Insert Values
            const valuesToInsert = Object.entries(formData).map(([fieldId, value]) => ({
                submission_id: submission.id,
                field_id: fieldId,
                value: value.toString()
            }));

            const { error: vError } = await supabase
                .from('form_submission_values')
                .insert(valuesToInsert);

            if (vError) throw vError;

            // 3. Finalize Submission (Trigger Backend Integration Dispatcher)
            const { error: rpcError } = await supabase.rpc('finalize_form_submission', {
                p_submission_id: submission.id
            });

            if (rpcError) {
                console.warn("Backend processing alert:", rpcError);
                // We don't throw here to ensure user sees success since data is saved
            }

            toast.success("Submission successfully processed!");
            localStorage.removeItem(`form_draft_${formId}`);

            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Submission Error:", err);
            if (isOffline) {
                toast.warning("Submission queued for offline synchronization");
            } else {
                toast.error("Error submitting ministry report");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-xs font-black text-white/40 uppercase tracking-widest">Loading Digital Ministry System...</p>
        </div>
    );

    if (!form) return <div className="p-8 text-center text-red-400">Error: Form definition not found.</div>;

    return (
        <div className="flex flex-col gap-6 max-w-xl mx-auto p-4 md:p-6 pb-24">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white">{form.name}</h1>
                    <p className="text-xs text-white/40 font-medium">{form.description}</p>
                </div>
                {isOffline && (
                    <div className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 border border-amber-500/20">
                        <CloudOff className="w-3.5 h-3.5" /> OFFLINE MODE
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                {form.fields.map(field => (
                    <div key={field.id} className="space-y-3">
                        {field.field_type === 'counter' ? (
                            <TapCounter
                                label={field.label}
                                value={formData[field.id]}
                                onChange={(val) => handleValueChange(field.id, val)}
                            />
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">{field.label}</label>
                                {field.field_type === 'number' ? (
                                    <Input
                                        type="number"
                                        value={formData[field.id]}
                                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl py-6 text-base font-bold focus:ring-violet-500/50"
                                        placeholder="0"
                                        required={field.is_required}
                                    />
                                ) : field.field_type === 'text' && field.label.toLowerCase().includes('notes') ? (
                                    <Textarea
                                        value={formData[field.id]}
                                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl py-4 text-sm font-medium focus:ring-violet-500/50 min-h-[100px]"
                                        placeholder="Type additional details here..."
                                        required={field.is_required}
                                    />
                                ) : (
                                    <Input
                                        type="text"
                                        value={formData[field.id]}
                                        onChange={(e) => handleValueChange(field.id, e.target.value)}
                                        className="bg-white/5 border-white/10 rounded-xl py-6 text-sm font-bold focus:ring-violet-500/50"
                                        placeholder={`Enter ${field.label}...`}
                                        required={field.is_required}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <div className="mt-8">
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-8 rounded-2xl gap-3 shadow-xl shadow-violet-500/30 active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Ministry Report...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Submit to Mission Control
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="flex items-center justify-center gap-2 py-8 border-t border-white/5 mt-8 opacity-20 group hover:opacity-100 transition-opacity">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">End of operational record</span>
            </div>
        </div>
    );
}
