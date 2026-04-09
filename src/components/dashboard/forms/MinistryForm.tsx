"use client";
import { useState, useEffect } from "react";
import { useStickyForm } from "@/hooks/useStickyForm";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { assignMinistryRoleAction } from "@/app/actions/admin";
import { ShieldCheck, Sparkles, Search, Loader2 } from "lucide-react";
import { useAdminCtx } from "@/app/shepherd/dashboard/Context";
import { supabase } from "@/lib/supabase";

import { MemberSearchSelect } from "../MemberSearchSelect";

interface MinistryResult {
    id: string;
    name: string;
    category: string;
    leader_name: string | null;
}

export function MinistryForm({ onSuccess, initialMemberId }: { onSuccess: () => void, initialMemberId?: string }) {
    const { userId: adminId, orgId } = useAdminCtx();
    const [loading, setLoading] = useState(false);
    const { values, handleChange, clear } = useStickyForm({
        memberId: initialMemberId || "",
        ministry: "",
        role: "member"
    }, "admin-assign-ministry");

    // Live ministry search
    const [ministryQuery, setMinistryQuery] = useState('');
    const [ministryResults, setMinistryResults] = useState<MinistryResult[]>([]);
    const [ministrySearching, setMinistrySearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMinistryName, setSelectedMinistryName] = useState(values.ministry || '');

    useEffect(() => {
        if (!orgId || ministryQuery.trim().length < 1) {
            setMinistryResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setMinistrySearching(true);
            const { data } = await supabase
                .from('vw_ministry_directory')
                .select('id, name, category, leader_name')
                .eq('org_id', orgId)
                .ilike('name', `%${ministryQuery}%`)
                .order('name')
                .limit(10);
            setMinistryResults(data || []);
            setMinistrySearching(false);
            setShowDropdown(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [ministryQuery, orgId]);

    const selectMinistry = (m: MinistryResult) => {
        setSelectedMinistryName(m.name);
        handleChange('ministry', m.name);
        setMinistryQuery('');
        setShowDropdown(false);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!values.memberId) {
            toast.error("Please select a member first");
            return;
        }
        if (!values.ministry) {
            toast.error("Please select a ministry");
            return;
        }

        setLoading(true);

        const result = await assignMinistryRoleAction(values.memberId, values.role, values.ministry, adminId, orgId || "");

        if (result.success) {
            toast.success("Ministry invitation sent successfully!");
            clear();
            setSelectedMinistryName('');
            onSuccess();
        } else {
            toast.error("Error: " + result.error);
        }
        setLoading(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase">Ministry Matching Intelligence</p>
                    <p className="text-[10px] text-emerald-600/60 dark:text-emerald-300/60 leading-tight">I will notify the member via the app and track their invitation status automatically.</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Select Member</label>
                <MemberSearchSelect
                    onSelect={(id) => handleChange('memberId', id)}
                    selectedId={values.memberId}
                    showSkills={true}
                    placeholder="Search by name or email..."
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Ministry live search */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Ministry</label>
                    <div className="relative">
                        {selectedMinistryName ? (
                            <div className="flex items-center gap-2 h-9 bg-muted border border-border rounded-xl px-3">
                                <span className="text-xs text-foreground flex-1 truncate">{selectedMinistryName}</span>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedMinistryName(''); handleChange('ministry', ''); }}
                                    className="text-muted-foreground hover:text-foreground text-[10px] font-bold"
                                >✕</button>
                            </div>
                        ) : (
                            <>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 z-10" />
                                <input
                                    type="text"
                                    value={ministryQuery}
                                    onChange={e => { setMinistryQuery(e.target.value); setShowDropdown(true); }}
                                    onFocus={() => setShowDropdown(true)}
                                    placeholder="Search ministry..."
                                    className="w-full h-9 bg-muted border border-border rounded-xl pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                                {ministrySearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground animate-spin" />
                                )}
                            </>
                        )}
                        {showDropdown && ministryResults.length > 0 && !selectedMinistryName && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {ministryResults.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => selectMinistry(m)}
                                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                                    >
                                        <p className="text-xs font-bold text-foreground">{m.name}</p>
                                        <p className="text-[9px] text-muted-foreground capitalize">{m.category}{m.leader_name ? ` · ${m.leader_name}` : ''}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Role select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground">Role</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30" />
                        <select name="role" value={values.role} onChange={e => handleChange('role', e.target.value)} className="w-full h-9 bg-muted border border-border rounded-xl pl-9 pr-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all">
                            <option value="member" className="bg-card">Member</option>
                            <option value="leader" className="bg-card">Leader</option>
                            <option value="coordinator" className="bg-card">Coordinator</option>
                        </select>
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                {loading ? "Sending Invitation..." : "Assign & Notify"}
            </Button>
        </form>
    );
}
