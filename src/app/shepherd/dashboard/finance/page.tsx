"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, PieChart as PieIcon, Plus, Save } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAdminCtx } from "../Context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useStickyForm } from "@/hooks/useStickyForm";

const TOOLTIP_STYLE = {
    contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 },
    itemStyle: { color: 'var(--foreground)', fontSize: 11 },
    labelStyle: { color: 'var(--muted-foreground)', fontSize: 9 },
};

const RECORD_TYPES = ['offering', 'tithe', 'thanksgiving', 'mission', 'building_fund'];
const TYPE_COLORS: Record<string, string> = { offering: '#8b5cf6', tithe: '#06b6d4', thanksgiving: '#34d399', mission: '#fbbf24', building_fund: '#f87171' };

export default function FinancePage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const { values, handleChange, clear } = useStickyForm({
        amount: '',
        record_type: 'offering',
        notes: ''
    }, 'finance-log-form');
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
        if (!values.amount) return toast.error("Amount is required");
        if (!orgId) return toast.error("Organization context missing");
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            const res = await fetch('/api/finance/donate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(values.amount),
                    record_type: values.record_type,
                    notes: values.notes,
                    user_id: user?.id,
                    org_id: orgId
                })
            });
            
            if (!res.ok) throw new Error("Failed to insert");
            
            toast.success("Transaction recorded");
            setIsTrackerOpen(false);
            clear();
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
                    <h1 className="text-xl font-black text-foreground">Giving & Finance</h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Anonymous giving analytics — stewardship overview</p>
                </div>

                <Dialog open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl h-10 px-5 shadow-lg shadow-amber-500/20">
                            <Plus className="w-4 h-4 mr-2" /> LOG TRANSACTION
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border border-border text-foreground max-w-sm rounded-3xl p-6 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black tracking-tight text-foreground">Proxy Giving Record</DialogTitle>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Manual Finance Entry</p>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Amount (¥)</p>
                                <Input 
                                    type="number"
                                    placeholder="e.g. 10000" 
                                    className="bg-muted border border-border text-sm h-12 rounded-xl text-foreground"
                                    value={values.amount}
                                    onChange={(e) => handleChange("amount", e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Type</p>
                                <select 
                                    value={values.record_type} 
                                    onChange={(e) => handleChange("record_type", e.target.value)}
                                    className="bg-muted border border-border w-full h-12 rounded-xl text-sm px-4 text-foreground appearance-none focus:outline-none focus:border-border/60"
                                >
                                    <option value="" disabled className="bg-card">Select Record Type</option>
                                    {RECORD_TYPES.map(s => (
                                        <option key={s} value={s} className="bg-card capitalize">
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
                    { label: 'Total Giving (¥)', val: total.toLocaleString(), color: 'text-emerald-600 dark:text-emerald-400' },
                    { label: 'Transactions', val: records.length, color: 'text-primary' },
                    { label: 'This Month', val: records.filter(r => new Date(r.given_date).getMonth() === new Date().getMonth()).length, color: 'text-blue-600 dark:text-blue-400' },
                    { label: 'Avg Gift (¥)', val: records.length ? Math.round(total / records.length).toLocaleString() : 0, color: 'text-amber-600 dark:text-amber-400' },
                ].map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                        <p className={`text-2xl font-black ${s.color}`}>{loading ? '—' : s.val}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Giving by Category</p>
                    {byType.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={byType}>
                                <XAxis dataKey="type" tick={{ fill: 'var(--muted-foreground)', fontSize: 9, opacity: 0.5 }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Bar dataKey="amount" name="Amount (¥)" radius={[4, 4, 0, 0]}>
                                    {byType.map((entry, i) => <Cell key={i} fill={TYPE_COLORS[entry.type] || '#8b5cf6'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground/20 text-xs uppercase font-black tracking-widest">No financial records yet</div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Recent Transactions</p>
                    <div className="space-y-2">
                        {records.slice(0, 8).map((r, i) => (
                            <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50">
                                <div>
                                    <p className="text-xs font-bold text-foreground capitalize">{r.record_type}</p>
                                    <p className="text-[9px] text-muted-foreground">{r.given_date} {r.is_anonymous ? '· Anonymous' : ''}</p>
                                </div>
                                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">¥{Number(r.amount).toLocaleString()}</p>
                            </div>
                        ))}
                        {records.length === 0 && !loading && <p className="text-center text-muted-foreground/20 text-xs py-8 uppercase font-black tracking-widest">No records yet</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
