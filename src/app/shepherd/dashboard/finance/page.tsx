"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, PieChart as PieIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

    useEffect(() => {
        supabase.from('financial_records').select('*').order('given_date', { ascending: false })
            .then(({ data }) => {
                setRecords(data || []);
                setLoading(false);
            });
    }, []);

    const total = records.reduce((a, r) => a + Number(r.amount || 0), 0);
    const byType = RECORD_TYPES.map(type => ({
        type, amount: records.filter(r => r.record_type === type).reduce((a, r) => a + Number(r.amount || 0), 0)
    })).filter(t => t.amount > 0);

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Giving & Finance</h1>
                <p className="text-[11px] text-white/30 mt-0.5">Anonymous giving analytics — stewardship overview</p>
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
