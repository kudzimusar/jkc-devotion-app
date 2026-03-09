"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, UserCheck, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export function AttendanceReconciliationCard() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('vw_attendance_reconciliation')
                    .select('*')
                    .order('report_date', { ascending: false })
                    .limit(1);

                if (error) throw error;
                setStats(data || []);
            } catch (err) {
                console.error("Reconciliation Stats Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) return (
        <div className="h-64 bg-card border border-border rounded-[2rem] p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reconciling records...</p>
            </div>
        </div>
    );

    if (stats.length === 0) return (
        <div className="h-64 bg-card border border-border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center opacity-40">
            <Users className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-xs font-black text-foreground uppercase tracking-widest">No Operational Attendance Data</p>
            <p className="text-[10px] text-muted-foreground mt-1">Usher headcount reports are required for reconciliation.</p>
        </div>
    );

    const latest = stats[0];
    const reachPercentage = Math.round((latest.total_digital / latest.total_physical) * 100) || 0;

    return (
        <div className="bg-card border border-border rounded-[2rem] p-8 space-y-8 flex flex-col justify-between h-full group shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Attendance Reach
                    </h3>
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase mt-1">Manual vs. Digital Comparison</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{format(new Date(latest.report_date), 'MMMM d, yyyy')}</p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-4xl font-black text-foreground tracking-tighter">
                        {reachPercentage}%
                    </p>
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Digital Engagement</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Physical</span>
                        <span className="text-lg font-black text-foreground">{latest.total_physical}</span>
                    </div>
                    <div className="w-[1px] h-8 bg-border self-end mb-1" />
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">Digital</span>
                        <span className="text-lg font-black text-primary">{latest.total_digital}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000"
                        style={{ width: `${reachPercentage}%` }}
                    />
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest">System Alert: Reach Gap</p>
                        <p className="text-[10px] text-amber-600/60 dark:text-amber-300/60 leading-relaxed font-medium">
                            {latest.unregistered_count} people were counted physically but did not check-in digitally.
                            Recommendation: Staff more welcome team members at the east entrance.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-lg bg-muted border border-card flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-foreground/5 to-transparent" />
                        </div>
                    ))}
                </div>
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Verified by Operational Submissions</span>
            </div>
        </div>
    );
}

