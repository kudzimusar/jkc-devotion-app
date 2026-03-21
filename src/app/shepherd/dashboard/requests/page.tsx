"use client";
import { supabase } from "@/lib/supabase";

import { useState, useEffect } from "react";
import {
    Users, UserCheck, UserX, Clock,
    ShieldCheck, ChevronRight, Mail,
    Calendar, MapPin, Search, Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

import { useAdminCtx } from "../Context";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MembershipRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("pending");
    const { orgId } = useAdminCtx();

    useEffect(() => {
        if (orgId) fetchRequests();
    }, [orgId]);

    async function fetchRequests() {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('membership_requests')
                .select(`
                    *,
                    profiles:user_id(
                        name, email, city, ward, 
                        phone_number, growth_stage, 
                        invite_method, church_background,
                        created_at, org_id
                    )
                `)
                .eq('profiles.org_id', orgId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (e) {
            console.error("Error fetching requests:", e);
            toast.error("Failed to load membership requests");
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(requestId: string, status: 'approved' | 'rejected') {
        try {
            const { error } = await supabase
                .from('membership_requests')
                .update({
                    status,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;
            toast.success(`Request ${status} successfully`);
            fetchRequests();
            if (selectedRequest?.id === requestId) setSelectedRequest(null);
        } catch (e) {
            toast.error(`Failed to ${status} request`);
        }
    }

    const filtered = requests.filter(r => {
        const matchesSearch = r.profiles?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.profiles?.email?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || r.status === filter;
        return matchesSearch && matchesFilter;
    });

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground uppercase tracking-tight">Membership Pipeline</h1>
                    <p className="text-sm text-muted-foreground font-medium">Review and approve new member applications</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-4 py-2 text-xs font-black">
                        {pendingCount} PENDING ACTION
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List Column */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="bg-card border-border border-2 overflow-hidden shadow-sm">
                        <CardHeader className="border-b border-border bg-muted/30">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search applicants..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full h-10 bg-muted border-none rounded-lg pl-10 text-xs font-bold focus:ring-2 ring-primary/20"
                                    />
                                </div>
                                <div className="flex gap-2 p-1 bg-muted rounded-lg">
                                    {['pending', 'approved', 'rejected', 'all'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilter(s)}
                                            className={`flex-1 text-[10px] font-black uppercase py-2 rounded-md transition-all ${filter === s ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center animate-pulse">
                                    <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4" />
                                    <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-black uppercase">No requests found</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filtered.map(req => (
                                        <button
                                            key={req.id}
                                            onClick={() => setSelectedRequest(req)}
                                            className={`w-full p-4 flex items-center justify-between text-left hover:bg-muted transition-colors ${selectedRequest?.id === req.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                                    {req.profiles?.name?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">{req.profiles?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                                                </div>
                                            </div>
                                            <Badge className={`text-[9px] font-black uppercase ${
                                                req.status === 'pending' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                                                'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                                {req.status}
                                            </Badge>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedRequest ? (
                            <motion.div
                                key={selectedRequest.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <Card className="bg-card border-border border-2 overflow-hidden shadow-sm">
                                    <CardHeader className="bg-muted/30 border-b border-border p-8">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-black">
                                                    {selectedRequest.profiles?.name?.[0] || '?'}
                                                </div>
                                                <div className="space-y-1">
                                                    <h2 className="text-2xl font-black text-foreground">{selectedRequest.profiles?.name}</h2>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {selectedRequest.profiles?.email}</span>
                                                        <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Joined: {format(new Date(selectedRequest.profiles?.created_at), 'PPP')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedRequest.status === 'pending' && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        onClick={() => handleAction(selectedRequest.id, 'approved')}
                                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-6 h-12 shadow-lg shadow-emerald-500/20"
                                                    >
                                                        <UserCheck className="w-4 h-4 mr-2" /> APPROVE
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleAction(selectedRequest.id, 'rejected')}
                                                        className="border-border hover:bg-red-500/10 hover:text-red-500 font-black rounded-xl px-6 h-12"
                                                    >
                                                        <UserX className="w-4 h-4 mr-2" /> REJECT
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            {/* Spiritual Details */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest border-b border-border pb-2">
                                                    <ShieldCheck className="w-4 h-4" /> Spiritual Profile
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Growth Stage</p>
                                                            <Badge variant="outline" className="text-xs font-bold text-foreground border-primary/20 bg-primary/5 uppercase">{selectedRequest.profiles?.growth_stage || 'Visitor'}</Badge>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Background</p>
                                                            <p className="font-bold text-sm">{selectedRequest.profiles?.church_background || 'None'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Invite Method</p>
                                                        <p className="font-bold text-sm italic">"{selectedRequest.profiles?.invite_method || 'Direct Discovery'}"</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact & Location */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest border-b border-border pb-2">
                                                    <MapPin className="w-4 h-4" /> Location info
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">City</p>
                                                            <p className="font-bold text-sm">{selectedRequest.profiles?.city || 'Tokyo'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Ward</p>
                                                            <p className="font-bold text-sm">{selectedRequest.profiles?.ward || 'Unspecified'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Phone</p>
                                                        <p className="font-bold text-sm">{selectedRequest.profiles?.phone_number || 'Not provided'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">Notes from Applicant</p>
                                                        <div className="p-4 bg-muted rounded-xl text-xs text-muted-foreground font-medium italic border border-border">
                                                            {selectedRequest.notes || "No additional notes provided."}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-20 text-center border-4 border-dashed border-border rounded-[3rem] opacity-30">
                                <Clock className="w-16 h-16 mb-6" />
                                <h3 className="text-2xl font-black uppercase">Select a request</h3>
                                <p className="text-sm font-bold">Choose a member application on the left to review details</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
