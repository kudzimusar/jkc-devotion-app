"use client";
import { useState, useEffect } from "react";
import { Users, Search, Filter, UserCheck, UserX, ChevronRight, Mail, Phone, Calendar, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils";
import { Download, ChevronDown, UserPlus, Send, MessageSquareText } from "lucide-react";
import { useAdminCtx } from "../Context";
import { MinistryForm } from "@/components/dashboard/forms/MinistryForm";
import { sendPastoralMessageAction } from "@/app/actions/admin";
import * as XLSX from "xlsx";
import { FilePlus } from "lucide-react";

interface Member {
    id: string; name: string; email: string;
    membership_status?: string; city?: string;
    gender?: string; phone_number?: string;
    date_joined_church?: string; baptism_status?: string;
    avatar_url?: string;
    skills_talents?: string[];
    milestones?: any;
    ministry_members?: any[];
    member_skills?: any[];
    org_members?: any;
    discipleship_score?: number;
    stage?: string;
    growth_stage?: string;
    created_at?: string;
    roles?: string[];
    church_background?: string;
    referral_source?: string;
}

const BADGE_COLORS: Record<string, string> = {
    member: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    visitor: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    leader: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
    'not_baptized': 'bg-muted text-muted-foreground',
    'baptized': 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
};

export default function MembersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [showExport, setShowExport] = useState(false);
    const [membershipRequests, setMembershipRequests] = useState<any[]>([]);
    const [showMinistryAssign, setShowMinistryAssign] = useState(false);
    const [showMessenger, setShowMessenger] = useState(false);
    const [messageDraft, setMessageDraft] = useState("");
    const [sendingMsg, setSendingMsg] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const { orgId } = useAdminCtx();

    const [memberInsights, setMemberInsights] = useState<any[]>([]);

    useEffect(() => {
        if (orgId) fetchMembers();
    }, [orgId]);

    useEffect(() => {
        if (selectedMember && orgId) {
            fetchMemberInsights(selectedMember.id);
        } else {
            setMemberInsights([]);
        }
    }, [selectedMember, orgId]);

    async function fetchMemberInsights(memberId: string) {
        const { data } = await supabase
            .from('prophetic_insights')
            .select('*')
            .eq('org_id', orgId)
            .eq('subject_id', memberId)
            .eq('is_acknowledged', false);
        setMemberInsights(data || []);
    }

    async function fetchMembers() {
        if (!orgId) return;
        setLoading(true);
        // Using standard supabase client (RLS enforced for org_id)
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                milestones:member_milestones(*),
                ministry_members(*),
                member_skills(*),
                org_members(role, stage, discipleship_score, joined_at)
            `)
            .eq('org_id', orgId)
            .order('name');

        if (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to load members directory");
        } else {
            const processed = (data || []).map((m: any) => ({
                ...m,
                milestones: {
                    // Unified: Prioritize profile columns as the single source of truth
                    salvation_date: m.salvation_date || m.milestones?.[0]?.salvation_date,
                    baptism_date: m.baptism_date || m.milestones?.[0]?.baptism_date,
                    membership_date: m.membership_date || m.milestones?.[0]?.membership_date,
                    foundation_class_date: m.foundation_class_date || m.milestones?.[0]?.foundation_class_date,
                    foundations_completed: m.foundations_completed ?? m.milestones?.[0]?.foundations_completed
                },
                org_members: m.org_members?.[0] || {},
                discipleship_score: m.org_members?.[0]?.discipleship_score || 0,
                growth_stage: m.growth_stage || m.org_members?.[0]?.stage || 'visitor',
                roles: m.ministry_members?.map((mm: any) => `${mm.ministry_name} (${mm.ministry_role})`) || []
            }));
            setMembers(processed);

            // Fetch pending requests
            const { data: requests } = await supabase
                .from('membership_requests')
                .select('*, profiles(name, email)')
                .eq('org_id', orgId)
                .eq('status', 'pending');
            setMembershipRequests(requests || []);
        }
        setLoading(false);
    }

    async function handlePromoteToMember(targetId: string) {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const { error } = await supabase
                .from('profiles')
                .update({
                    membership_status: 'member',
                    growth_stage: 'disciple',
                    membership_date: today
                })
                .eq('id', targetId);

            if (error) throw error;

            // Reconcile membership_requests table
            await supabase
                .from('membership_requests')
                .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                .eq('user_id', targetId)
                .eq('status', 'pending');

            // Automatic record membership milestone sync for backward compatibility
            await supabase
                .from('member_milestones')
                .upsert({
                    user_id: targetId,
                    membership_date: today,
                    org_id: orgId,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            toast.success("Membership approved!");
            await fetchMembers(); // Refresh list

            // Update selected member view if open
            if (selectedMember && selectedMember.id === targetId) {
                setSelectedMember({
                    ...selectedMember,
                    membership_status: 'member',
                    growth_stage: 'disciple'
                });
            }
        } catch (err: any) {
            console.error("Promotion failed:", err);
            toast.error("Failed to approve membership.");
        } finally {
            setLoading(false);
        }
    }

        }
    }

    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) processImportFile(file);
        };
        input.click();
    };

    const processImportFile = async (file: File) => {
        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e: any) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(sheet);

                if (json.length === 0) {
                    toast.error("The file appears to be empty.");
                    return;
                }

                // Map standard fields
                const profilesToInsert = json.map(row => ({
                    id: crypto.randomUUID(), // Generate a UUID for these skeleton profiles
                    org_id: orgId,
                    name: row.Name || row.name || row.Fullname || row['Full Name'],
                    email: row.Email || row.email || `user_${Math.random().toString(36).substr(2, 9)}@placeholder.com`,
                    phone_number: row.Phone || row.phone || row['Phone Number'] || null,
                    city: row.City || row.city || row.Location || null,
                    membership_status: (row.Status || row.status || 'visitor').toLowerCase(),
                    growth_stage: (row['Growth Stage'] || row.stage || 'visitor').toLowerCase(),
                    church_background: row['Background'] || row.church_background || null,
                    referral_source: row['Referral'] || row.referral_source || 'Bulk Import',
                    gender: row.Gender || row.gender || null
                }));

                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(profilesToInsert);

                if (insertError) throw insertError;

                // Also need to create entries in org_members for each
                const orgMembersToInsert = profilesToInsert.map(p => ({
                    user_id: p.id,
                    org_id: orgId,
                    role: 'member',
                    stage: p.growth_stage
                }));

                await supabase.from('org_members').insert(orgMembersToInsert);

                toast.success(`Successfully imported ${profilesToInsert.length} members!`);
                fetchMembers();
            } catch (err: any) {
                console.error("Import error:", err);
                toast.error("Failed to parse or import file. Ensure headers match Name, Email, etc.");
            } finally {
                setIsImporting(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    async function handleSendMessage() {
        if (!messageDraft || !selectedMember || !orgId) return;
        setSendingMsg(true);
        try {
            const { userId: adminId } = await supabase.auth.getUser().then(res => ({ userId: res.data.user?.id }));
            if (!adminId) throw new Error("Auth required");

            const res = await sendPastoralMessageAction({
                receiverId: selectedMember.id,
                senderId: adminId,
                orgId,
                body: messageDraft
            });

            if (res.success) {
                toast.success("Pastoral guidance sent successfully!");
                setMessageDraft("");
                setShowMessenger(false);
            } else throw new Error(res.error);
        } catch (err: any) {
            toast.error(err.message || "Failed to deliver message");
        } finally {
            setSendingMsg(false);
        }
    }
    const filtered = members.filter((m: Member) => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
        const hasPending = membershipRequests.some(r => r.user_id === m.id);

        if (filter === 'pending_request') return matchSearch && hasPending;
        const matchFilter = filter === 'all' || m.membership_status === filter;
        return matchSearch && matchFilter;
    });

    const exportDirectory = (format: 'csv' | 'xlsx' | 'pdf') => {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `JKC_Member_Directory_${timestamp}`;

        const exportData = filtered.map((m: Member) => ({
            Name: m.name,
            Email: m.email,
            Status: m.membership_status || 'visitor',
            City: m.city || '-',
            Phone: m.phone_number || '-',
            'Join Date': m.created_at || '-',
            'Membership Status': m.membership_status || 'visitor',
            'Growth Stage': m.growth_stage || 'visitor',
            'Assigned Roles': m.roles?.join(', ') || 'None',
            'Baptism Status': m.baptism_status || 'not_baptized',
            'Church Background': m.church_background || '-',
            'Referral Source': m.referral_source || '-'
        }));

        const headers = ["Name", "Email", "Status", "City", "Phone", "Join Date", "Membership Status", "Growth Stage", "Assigned Roles", "Baptism Status", "Church Background", "Referral Source"];
        const keys = headers;

        if (format === 'csv') {
            exportToCSV(exportData, filename, headers);
        } else if (format === 'xlsx') {
            exportToExcel(exportData, filename, "Members");
        } else if (format === 'pdf') {
            exportToPDF(exportData, filename, "Member Directory Report", headers, keys);
        }

        toast.success(`Exporting as ${format.toUpperCase()}...`);
        setShowExport(false);
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-foreground">Member Directory</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-muted-foreground">{members.length} registered members</p>
                        {membershipRequests.length > 0 && (
                            <>
                                <span className="text-[10px] text-border">•</span>
                                <p className="text-[11px] text-amber-600 dark:text-amber-500 font-bold">{membershipRequests.length} pending requests</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search members..."
                            className="h-9 pl-8 pr-4 bg-muted border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 w-52"
                        />
                    </div>
                    <select
                        value={filter} onChange={e => setFilter(e.target.value)}
                        className="h-9 px-3 bg-muted border border-border rounded-xl text-xs text-muted-foreground focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending_request">Pending Approval</option>
                        <option value="member">Members</option>
                        <option value="visitor">Visitors</option>
                        <option value="leader">Leaders</option>
                    </select>
                    <div className="relative">
                        <Button
                            onClick={() => setShowExport(!showExport)}
                            variant="outline"
                            className="h-9 px-4 bg-muted border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-2"
                        >
                            <Download className="w-3.5 h-3.5" />
                            EXPORT
                            <ChevronDown className="w-3 h-3" />
                        </Button>

                        {showExport && (
                            <div className="absolute top-full right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                                <button onClick={() => exportDirectory('xlsx')} className="w-full px-4 py-2.5 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground hover:bg-muted text-left transition-colors border-b border-border">Excel (.xlsx)</button>
                                <button onClick={() => exportDirectory('csv')} className="w-full px-4 py-2.5 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground hover:bg-muted text-left transition-colors border-b border-border">CSV Table</button>
                                <button onClick={() => exportDirectory('pdf')} className="w-full px-4 py-2.5 text-[10px] font-black uppercase text-muted-foreground hover:text-foreground hover:bg-muted text-left transition-colors">PDF Report</button>
                            </div>
                        )}
                    </div>
                    <Button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="h-9 px-4 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <FilePlus className="w-3.5 h-3.5" />
                        {isImporting ? 'IMPORTING...' : 'IMPORT'}
                    </Button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Members', val: members.length, icon: Users, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Active Members', val: members.filter(m => m.membership_status === 'member').length, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Visitors', val: members.filter(m => m.membership_status === 'visitor' || !m.membership_status).length, icon: UserX, color: 'text-amber-600 dark:text-amber-400' },
                    { label: 'Baptized', val: members.filter(m => m.baptism_status === 'baptized').length, icon: UserCheck, color: 'text-cyan-600 dark:text-cyan-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-foreground">{s.val}</p>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wide">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Member table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-colors">
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border">
                    {['Name', 'Email', 'Status', 'City', 'Joined', ''].map(h => (
                        <p key={h} className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest">{h}</p>
                    ))}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">Loading members...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground/30 text-xs uppercase font-black tracking-widest">No members found</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filtered.map((m, i) => (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors items-center"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-black text-primary flex-shrink-0">
                                        {m.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <p className="text-xs font-bold text-foreground truncate">{m.name || 'Unknown'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Mail className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground/70 truncate">{m.email}</p>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg capitalize ${BADGE_COLORS[m.growth_stage || 'visitor'] || 'bg-muted text-muted-foreground'}`}>
                                        {m.growth_stage || 'visitor'}
                                    </span>
                                    {membershipRequests.some(r => r.user_id === m.id) && (
                                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold text-amber-600 dark:text-amber-500 animate-pulse">
                                            PENDING
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-muted-foreground/30" />
                                    <p className="text-xs text-muted-foreground/70 truncate">{m.city || '—'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground/30" />
                                    <p className="text-[10px] text-muted-foreground/70">
                                        {m.date_joined_church ? new Date(m.date_joined_church).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedMember(m)}
                                    className="text-[9px] font-black text-primary hover:text-primary/80 dark:text-violet-400 dark:hover:text-violet-300 transition-colors flex items-center gap-0.5"
                                >
                                    View <ChevronRight className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-colors"
                    >
                        <div className="p-8 border-b border-border flex items-start justify-between bg-gradient-to-br from-primary/5 dark:from-violet-600/10 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-violet-500/20 flex items-center justify-center text-3xl font-black text-primary dark:text-violet-400 border border-primary/20 dark:border-violet-500/20">
                                    {selectedMember.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-foreground tracking-tighter">{selectedMember.name}</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge className={`${BADGE_COLORS[selectedMember.membership_status || 'visitor'] || 'bg-muted text-muted-foreground'} border-0 font-black px-3 py-1 shadow-sm`}>
                                            {selectedMember.membership_status?.toUpperCase() || 'VISITOR'}
                                        </Badge>
                                        {membershipRequests.some(r => r.user_id === selectedMember.id) && (
                                            <Badge className="bg-amber-600 dark:bg-amber-500 text-white border-0 font-black px-3 py-1 animate-pulse shadow-sm">
                                                PENDING APPROVAL
                                            </Badge>
                                        )}
                                        <Badge className="bg-muted text-muted-foreground border-0 font-black px-3 py-1">
                                            {selectedMember.city || 'LOCATION UNKNOWN'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedMember(null);
                                    setShowMinistryAssign(false);
                                    setShowMessenger(false);
                                }} 
                                className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <UserX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {showMessenger ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageSquareText className="w-4 h-4 text-primary" />
                                            <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Pastoral Messenger</h4>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setShowMessenger(false)} className="text-[10px] font-black uppercase">Close</Button>
                                    </div>

                                    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black">{selectedMember.name?.[0]}</div>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">Recipient: {selectedMember.name}</p>
                                        </div>
                                        <textarea 
                                            value={messageDraft}
                                            onChange={(e) => setMessageDraft(e.target.value)}
                                            placeholder="Write your pastoral guidance here..."
                                            className="w-full h-40 bg-muted/50 border border-border rounded-2xl p-4 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none transition-all"
                                        />
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-[9px] text-muted-foreground italic">Powered by AI Shepherd Intelligence</p>
                                            <Button 
                                                onClick={handleSendMessage}
                                                disabled={sendingMsg}
                                                className="bg-primary text-white rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                            >
                                                {sendingMsg ? 'Sending...' : 'Deliver Message'}
                                                <Send className="w-3 h-3 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-muted/30 border border-dashed border-border rounded-2xl">
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase mb-2">Secure Channel Log</p>
                                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">This message will be encrypted and delivered to the member's profile. You can view your sent duplicates in the 'Communication Logs' section of your dashboard.</p>
                                    </div>
                                </div>
                            ) : showMinistryAssign ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-widest">Assign to Ministry</h4>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setShowMinistryAssign(false)}
                                            className="text-[10px] font-black uppercase"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                    <MinistryForm 
                                        initialMemberId={selectedMember.id} 
                                        onSuccess={() => {
                                            setShowMinistryAssign(false);
                                            fetchMembers();
                                        }} 
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</p>
                                    <p className="text-sm font-bold text-foreground/80">{selectedMember.email}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</p>
                                    <p className="text-sm font-bold text-foreground/80">{selectedMember.phone_number || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Spiritual Milestones</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: 'Salvation', val: selectedMember.milestones?.salvation_date },
                                        { label: 'Baptism', val: selectedMember.milestones?.baptism_date },
                                        { label: 'Membership', val: selectedMember.milestones?.membership_date },
                                        { label: 'Foundation', val: selectedMember.milestones?.foundation_class_date }
                                    ].map(m => (
                                        <div key={m.label} className={`p-4 rounded-2xl border ${m.val ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/5 border-emerald-500/20' : 'bg-muted/30 border-border opacity-50'}`}>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/50">{m.label}</p>
                                            <p className={`text-sm font-bold mt-0.5 ${m.val ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/20'}`}>
                                                {m.val ? new Date(m.val).toLocaleDateString() : 'Pending'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedMember.ministry_members && selectedMember.ministry_members.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Ministry Involvement</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.ministry_members.map(m => (
                                            <Badge key={m.id} className="bg-primary/10 text-primary dark:bg-violet-500/10 dark:text-violet-400 border border-border dark:border-violet-500/20 px-4 py-1.5 rounded-xl font-bold shadow-sm transition-colors">
                                                {m.ministry_name} • {m.ministry_role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedMember.member_skills?.length || 0) > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Skills & Assets</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMember.member_skills?.map(s => (
                                            <Badge key={s.id} className="bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-border dark:border-cyan-500/20 px-4 py-1.5 rounded-xl font-bold transition-colors">
                                                {s.skill_name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 pt-6 border-t border-border">
                                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Personal & Spiritual Context</h4>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">Spiritual History</p>
                                                <p className="text-xs font-bold text-foreground">Background: {selectedMember.church_background || 'None'}</p>
                                                <p className="text-[10px] text-muted-foreground">Referred by: {selectedMember.referral_source || 'Direct'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase">Pastor's Intelligence</p>
                                                <p className="text-xs font-bold text-foreground">Stage: {selectedMember.growth_stage || 'Visitor'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 w-20 h-1 bg-muted rounded-full">
                                                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${selectedMember.discipleship_score || 0}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-violet-500">{selectedMember.discipleship_score || 0}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Prophetic Intelligence Section */}
                            {memberInsights.length > 0 && (
                                <div className="space-y-4 pt-6 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Leadership Forecasts</h4>
                                    </div>
                                    <div className="space-y-3">
                                        {memberInsights.map(insight => (
                                            <div key={insight.id} className={`p-4 rounded-2xl border ${insight.risk_level === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-primary/5 border-primary/20'}`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${insight.risk_level === 'critical' ? 'text-red-500' : 'text-primary'}`}>
                                                        {insight.category.replace('_', ' ')} Alert
                                                    </p>
                                                    {insight.probability_score && (
                                                        <span className="text-[9px] font-black text-muted-foreground/50">{insight.probability_score}% Prob.</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-foreground mb-1">{insight.insight_title}</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{insight.insight_description}</p>
                                                {insight.recommended_action && (
                                                    <div className="bg-background/50 rounded-xl p-3 border border-border/50">
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</p>
                                                        <p className="text-[10px] font-bold text-foreground/80">{insight.recommended_action}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                        <div className="p-8 border-t border-border bg-muted/30 flex flex-wrap gap-3">
                            {selectedMember.membership_status !== 'member' && (
                                <Button
                                    onClick={() => handlePromoteToMember(selectedMember.id)}
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl border-0 shadow-lg shadow-emerald-600/20 mb-2"
                                >
                                    Approve Membership
                                </Button>
                            )}
                            <Button
                                onClick={() => window.print()}
                                className="flex-1 h-14 bg-muted text-foreground hover:bg-muted/80 font-black rounded-2xl border-border shadow-md"
                            >
                                Print Profile
                            </Button>
                             <Button 
                                onClick={() => setShowMessenger(true)}
                                className="flex-1 h-14 bg-primary text-white hover:bg-primary/90 font-black rounded-2xl border-0 shadow-lg shadow-primary/20 transition-all"
                            >
                                Send Message
                            </Button>
                            {!showMinistryAssign && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowMinistryAssign(true)}
                                    className="flex-1 h-14 border-border bg-background hover:bg-muted text-foreground font-black rounded-2xl shadow-sm transition-all"
                                >
                                    Assign to Ministry
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .fixed.inset-0.z-50 {
                        position: static !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    header, aside, .p-8.border-t, button, .flex.items-center.justify-between.mb-6, .grid.grid-cols-4.gap-3.mb-6, .mb-6 {
                        display: none !important;
                    }
                    .bg-card {
                        background: white !important;
                        color: black !important;
                        border: none !important;
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .text-foreground { color: black !important; }
                    .text-muted-foreground { color: #666 !important; }
                    .bg-muted { background: #f5f5f5 !important; }
                    .border-border { border-color: #eee !important; }
                    h2, h3, h4 { color: black !important; }
                    .text-primary, .text-violet-400 { color: #7c3aed !important; }
                    .bg-primary\/10, .bg-violet-600\/10 { background: #f5f3ff !important; }
                }
            `}</style>
        </div>
    );
}
