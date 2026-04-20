
"use client";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Users, BookOpen, Clock, Globe, 
  Search, Filter, ChevronRight, 
  CheckCircle2, AlertCircle, Phone, Mail
} from 'lucide-react';
import { AdminAuth } from "@/lib/admin-auth";

export default function KingdomClassDashboard() {
  const [applications, setApplications] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminAuth.getAdminSession().then(session => {
       if (session) setOrgId(session.orgId);
    });
  }, []);

  useEffect(() => {
    async function fetchApplications() {
      if (!orgId) return;
      try {
        // 1. Fetch from the new fragmented table
        const { data: newData } = await supabase
          .from('kingdom_class_applications')
          .select('*')
          .eq('org_id', orgId);

        // 2. Fetch/Fallback to legacy inquiries
        const { data: legacyData } = await supabase
          .from('public_inquiries')
          .select('*')
          .eq('org_id', orgId)
          .eq('visitor_intent', 'language_class');

        // 3. Unify the data streams
        const unified = [
          ...(newData || []),
          ...(legacyData || []).map(inq => ({
            id: inq.id,
            full_name: inq.first_name,
            email: inq.email,
            phone: inq.phone,
            track: inq.message?.match(/TRACK: (.*)/)?.[1] || 'General',
            learning_level: inq.message?.match(/LEVEL: (.*)/)?.[1] || 'Beginner',
            status: inq.status === 'analyzed' ? 'Accepted' : 'pending',
            wants_online: inq.message?.toLowerCase().includes('wants online: yes'),
            created_at: inq.created_at,
            is_legacy: true
          }))
        ];

        // Sort by dates
        const sorted = unified.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setApplications(sorted);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();
  }, [orgId]);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    online: applications.filter(a => a.wants_online).length,
    tracks: {
      beginners: applications.filter(a => a.track?.includes('Beginners')).length,
      intermediate: applications.filter(a => a.track?.includes('Intermediate')).length
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Kingdom Class Mission Control</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
            Language School Enrollment & Student Pipeline
          </p>
        </div>
        <div className="flex gap-2">
           <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase">Service Online</span>
           </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applicants', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'Online Learners', value: stats.online, icon: Globe, color: 'text-purple-500' },
          { label: 'Beginner Track', value: stats.tracks.beginners, icon: BookOpen, color: 'text-emerald-500' }
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-[2rem] shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-muted/50 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground/30 uppercase">LIVE</span>
            </div>
            <p className="text-2xl font-black text-foreground">{item.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Admission Pipeline</h2>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {applications.length} LEADS
            </span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Student</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Track & Level</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Applied</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-20 bg-muted/5"></td>
                  </tr>
                ))
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center italic text-muted-foreground/30 font-bold uppercase tracking-widest text-xs">
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="group hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--jkc-gold)]/10 text-[var(--jkc-gold)] flex items-center justify-center font-black">
                          {app.full_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{app.full_name}</p>
                          <p className="text-[10px] font-medium text-muted-foreground tracking-tight">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="text-xs font-bold text-foreground">{app.track}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tighter font-medium">{app.learning_level}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        app.status === 'pending' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {app.status}
                      </span>
                      {app.wants_online && (
                         <span className="ml-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-500 border border-purple-500/20">
                           Online
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-bold text-muted-foreground/50">
                        {format(new Date(app.created_at), 'MMM dd, yyyy')}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <a href={`mailto:${app.email}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary">
                           <Mail className="w-4 h-4" />
                         </a>
                         <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                           <ChevronRight className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
