"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, PieChart as PieIcon, Plus, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAdminCtx } from "../layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const TOOLTIP_STYLE = {
    contentStyle: { background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 },
    itemStyle: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    labelStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
};

const RECORD_TYPES = ['offering', 'tithe', 'thanksgiving', 'mission', 'building_fund'];
const TYPE_COLORS: Record<string, string> = { offering: '#8b5cf6', tithe: '#06b6d4', thanksgiving: '#34d399', mission: '#fbbf24', building_fund: '#f87171' };

export default function FinancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [formData, setFormData] = useState({ amount: '', record_type: 'offering', notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const { orgId } = useAdminCtx();

    const loadRecords = () => {
        if (!orgId) return;
        supabase.from('financial_records')
            .select('*')
            .eq('org_id', orgId)
            .order('given_date', { ascending: false })
            .then(({ data }) => {
                setRecords(data || []);
                setLoading(false);
            });
    };

    useEffect(() => { loadRecords(); }, [orgId]);

    const handleAddRecord = async () => {
        if (!formData.amount) return toast.error("Amount is required");
        if (!orgId) return toast.error("Organization context missing");
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const res = await fetch('/api/finance/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(formData.amount),
                    record_type: formData.record_type,
                    notes: formData.notes,
                    user_id: user?.id,
                    org_id: orgId
                })
            });
            
            if (!res.ok) throw new Error("Failed to insert");
            
            toast.success("Transaction recorded");
            setIsTrackerOpen(false);
            setFormData({ amount: '', record_type: 'offering', notes: '' });
            loadRecords();
        } catch (error: any) {
            toast.error(error.message || "Failed to add record");
        } finally {
            setSubmitting(false);
        }
    };

    const total = records.reduce((a, r) => a + Number(r.amount || 0), 0);
    const byType = RECORD_TYPES.map(type => ({
        type, amount: records.filter(r => r.record_type === type).reduce((a, r) => a + Number(r.amount || 0), 0)
    })).filter(t => t.amount > 0);

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white">Giving & Finance</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">Anonymous giving analytics — stewardship overview</p>
                </div>

                <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl h-10 px-5 shadow-lg shadow-amber-500/20">
                            <Plus className="w-4 h-4 mr-2" /> LOG TRANSACTION
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-sm rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black tracking-tight">Proxy Giving Record</DialogTitle>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Manual Finance Entry</p>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Amount (¥)</p>
                                <Input 
                                    type="number"
                                    placeholder="e.g. 10000" 
                                    className="bg-white/5 border-white/10 text-sm h-12 rounded-xl text-white"
                                    value={formData.amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Type</p>
                                <select 
                                    value={formData.record_type} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, record_type: e.target.value }))}
                                    className="bg-white/5 border border-white/10 w-full h-12 rounded-xl text-sm px-4 text-white appearance-none focus:outline-none focus:border-white/20"
                                >
                                    <option value="" disabled className="bg-[#0f172a]">Select Record Type</option>
                                    {RECORD_TYPES.map(s => (
                                        <option key={s} value={s} className="bg-[#0f172a] capitalize">
                                            {s.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button 
                                onClick={handleAddRecord}
                                disabled={submitting}
                                className="w-full bg-amber-600 hover:bg-amber-500 h-12 text-white font-black rounded-xl text-sm mt-4 shadow-xl shadow-amber-600/20"
                            >
                                {submitting ? "SAVING..." : "SAVE RECORD"}
                                <Save className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total Giving (¥)', val: total.toLocaleString(), color: 'text-emerald-400' },
                    { label: 'Transactions', val: records.length, color: 'text-violet-400' },
                    { label: 'This Month', val: records.filter(r => new Date(r.given_date).getMonth() === new Date().getMonth()).length, color: 'text-blue-400' },
                    { label: 'Avg Gift (¥)', val: records.length ? Math.round(total / records.length).toLocaleString() : 0, color: 'text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="bg-[#111827] border border-white/5 rounded-2xl p-4">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Giving by Category</p>
                    {byType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={byType}>
                                <XAxis dataKey="type" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Bar dataKey="amount" name="Amount (¥)" radius={[4, 4, 0, 0]}>
                                    {byType.map((entry, i) => <Cell key={i} fill={TYPE_COLORS[entry.type] || '#8b5cf6'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-white/20 text-xs">No financial records yet</div>
                    )}
                </div>

                <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-4">Recent Transactions</p>
                    <div className="space-y-2">
                        {records.slice(0, 8).map((r, i) => (
                            <div key={r.id} className="flex items-center justify-between py-2 border-b border-white/5">
                                <div>
                                    <p className="text-xs font-bold text-white capitalize">{r.record_type}</p>
                                    <p className="text-[9px] text-white/30">{r.given_date} {r.is_anonymous ? '· Anonymous' : ''}</p>
                                </div>
                                <p className="text-xs font-black text-emerald-400">¥{Number(r.amount).toLocaleString()}</p>
                            </div>
                        ))}
                        {records.length === 0 && !loading && <p className="text-center text-white/20 text-xs py-8">No records yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
