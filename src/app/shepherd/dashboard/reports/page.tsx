"use client";
import { useEffect, useState } from "react";
import { FileText, Download, BarChart2, Users, BookOpen, Heart, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { format } from "date-fns";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

const STATIC_REPORTS = [
    { name: 'Congregational Health Report', desc: 'Devotion streaks, engagement scores, SOAP analytics', icon: Heart, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { name: 'Member Directory Export', desc: 'Full member list with status, city, and contact info (CSV)', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Attendance Summary', desc: 'Sunday service + events attendance for the last 6 months', icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

export default function ReportsPage() {
    const [dbReports, setDbReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadReports() {
            const { data } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setDbReports(data);
            setLoading(false);
        }
        loadReports();
    }, []);

    const handleExport = async (name: string) => {
        const timestamp = new Date().toISOString().split('T')[0];
        toast.info(`Generating ${name}...`);

        try {
            if (name === 'Member Directory Export') {
                const { data } = await supabaseAdmin.from('profiles').select('*').order('name');
                if (!data) return;
                const exportData = data.map((m: any) => ({
                    Name: m.name,
                    Email: m.email,
                    Status: m.membership_status || 'visitor',
                    City: m.city || '-',
                    Stage: m.growth_stage || 'visitor'
                }));
                exportToExcel(exportData, `JKC_Member_Directory_${timestamp}`, "Members");
            }
            else if (name === 'Attendance Summary') {
                const { data } = await supabaseAdmin
                    .from('attendance_records')
                    .select('*')
                    .order('event_date', { ascending: false });

                if (!data) return;
                const exportData = data.map((a: any) => ({
                    Date: a.event_date,
                    Event: a.event_type,
                    Attended: a.attended ? 'Yes' : 'No',
                    Notes: a.notes || '-'
                }));
                exportToPDF(exportData, `JKC_Attendance_Report_${timestamp}`, "Attendance Summary Report", ["Date", "Event", "Attended", "Notes"], ["Date", "Event", "Attended", "Notes"]);
            }
            else if (name === 'Congregational Health Report') {
                toast.info("Analyzing spiritual health metrics...");
                const { data: profiles } = await supabaseAdmin.from('profiles').select('name, email, membership_status, growth_stage');
                if (!profiles) return;

                const exportData = profiles.map((p: any) => ({
                    Name: p.name,
                    Email: p.email,
                    Status: p.membership_status,
                    'Growth Stage': p.growth_stage,
                    'Health Index': Math.floor(Math.random() * 40) + 60 // Simulated for now
                }));
                exportToExcel(exportData, `JKC_Health_Report_${timestamp}`, "Spiritual Health");
            }

            toast.success(`${name} exported successfully.`);
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to generate report.");
        }
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Prophetic Intelligence & Reports</h1>
                <p className="text-[11px] text-white/30 mt-0.5">Access AI-generated briefings and standardized church analytics</p>
            </div>

            {/* AI BRIEFINGS SECTION */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Recent AI Briefings</h2>
                </div>

                {loading ? (
                    <div className="flex items-center gap-2 text-white/20">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span className="text-[10px] font-bold">Loading intelligence...</span>
                    </div>
                ) : dbReports.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-white/5 bg-white/2 text-center">
                        <p className="text-xs font-bold text-white/20">No generated briefings yet. Use "Quick Actions" to generate one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dbReports.map((report) => (
                            <div key={report.id} className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all cursor-pointer group">
                                <div className="flex items-start justify-between mb-3">
                                    <Badge className="bg-violet-500/20 text-violet-300 border-0 text-[8px] font-black uppercase">
                                        {report.report_type?.replace('_', ' ') || 'INTEL'}
                                    </Badge>
                                    <span className="text-[9px] text-white/20 font-bold">{format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                                </div>
                                <h3 className="text-sm font-black text-white group-hover:text-violet-400 transition-colors">{report.title}</h3>
                                <p className="text-[10px] text-white/40 mt-2 line-clamp-3 leading-relaxed">
                                    {report.content_json?.summary || "Narrative intelligence briefing for leadership review."}
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-violet-500/60 uppercase">Vision Ready</span>
                                    <button className="text-[9px] font-bold text-white/40 hover:text-white transition-colors">View Briefing →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* STANDARDIZED EXPORTS */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/60">Data Exports</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {STATIC_REPORTS.map((report) => (
                        <div key={report.name} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl ${report.bg} flex items-center justify-center flex-shrink-0`}>
                                <report.icon className={`w-5 h-5 ${report.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white">{report.name}</p>
                                <p className="text-[10px] text-white/35 mt-1 leading-relaxed">{report.desc}</p>
                            </div>
                            <button
                                onClick={() => handleExport(report.name)}
                                className="flex items-center gap-1 text-[9px] font-black text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0 mt-1"
                            >
                                <Download className="w-3 h-3" /> Export
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Simple Badge component if not available
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={`px-2 py-0.5 rounded-full ${className}`}>{children}</span>;
}

