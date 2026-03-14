'use client';

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  MapPin, 
  Globe, 
  XCircle, 
  Leaf 
} from "lucide-react";
import Link from 'next/link';

export default function SundayCheckIn({ user, currentDate }: { user: any, currentDate: Date }) {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const todayStr = format(currentDate, "yyyy-MM-dd");
  const isSunday = format(currentDate, "EEEE") === "Sunday";

  useEffect(() => {
    if (user && isSunday) {
      supabase.from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_date', todayStr)
        .maybeSingle()
        .then(({ data }) => { if (data) setCheckedIn(true); });
    }
  }, [user, todayStr, isSunday]);

  const [children, setChildren] = useState<any[]>([]);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);

  useEffect(() => {
    if (user && isSunday) {
      supabase.from('guardian_links').select('*').eq('guardian_id', user.id)
        .then(({ data }) => { if (data) setChildren(data); });
    }
  }, [user, isSunday]);

  const handleCheckIn = async (type: string) => {
    if (!user) {
      toast.error("Please login to check-in!");
      return;
    }
    setLoading(true);
    try {
      // 1. Log to attendance_records (legacy/check-in)
      const { error: err1 } = await supabase.from('attendance_records').insert([{
        user_id: user.id,
        event_date: todayStr,
        event_type: type === 'Not Attending' ? 'absence' : 'sunday_service',
        notes: `Checked in as ${type}`
      }]);
      if (err1) throw err1;

      // 2. Sync to attendance_logs
      const statusToken = type === 'In-Person' ? 'in-person' :
        type === 'Online' ? 'online' : 'not-attending';

      await supabase.from('attendance_logs').upsert({
        user_id: user.id,
        service_date: todayStr,
        status: statusToken
      }, { onConflict: 'user_id, service_date' });

      // 3. Log Children Attendance (if any selected)
      if (selectedKids.length > 0 && type !== 'Not Attending') {
        const kidLogs = selectedKids.map(kidName => ({
          guardian_id: user.id,
          child_name: kidName,
          check_in_time: new Date().toISOString(),
          status: 'checked_in',
          location: type === 'In-Person' ? 'At Church' : 'Online'
        }));
        await supabase.from('kids_registry').insert(kidLogs);
      }

      setCheckedIn(true);
      toast.success(type === 'Not Attending' ? "Message sent to leadership." : "Checked in! Have a blessed service.");
    } catch (e) {
      console.error(e);
      toast.error("Check-in failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isSunday) return null;

  if (!user) {
    return (
      <section className="py-20 px-6 max-w-screen-xl mx-auto">
        <div className="glass rounded-[2rem] p-12 text-center border border-white/10 space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-black tracking-[0.4em] text-white/40 uppercase">SUNDAY SERVICE</p>
            <h3 className="text-2xl font-black italic">Sign in to check in for Sunday service</h3>
          </div>
          <Link 
            href="/"
            className="inline-block bg-[var(--primary)] text-white font-black px-12 py-5 rounded-full text-xs tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-center"
          >
            SIGN IN
          </Link>
        </div>
      </section>
    );
  }

  if (checkedIn) return (
    <section className="py-20 px-6 max-w-screen-xl mx-auto">
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-500">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-emerald-500 italic">You're Checked In!</h4>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">Sunday Service {todayStr}</p>
          </div>
        </div>
        <p className="max-w-xs text-sm font-serif italic text-white/60 text-right">
          "I was glad when they said unto me, Let us go into the house of the LORD." - Psalm 122:1
        </p>
      </div>
    </section>
  );

  return (
    <section className="py-20 px-6 max-w-screen-xl mx-auto">
      <div className="bg-gradient-to-r from-[var(--primary)] to-indigo-600 rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] text-white/60 uppercase">ONLINE & IN-PERSON</p>
            <h3 className="text-4xl md:text-5xl font-black italic leading-tight">Sunday Service Check-In</h3>
            <p className="text-sm font-bold opacity-80 uppercase tracking-[0.2em]">Join us in the house of the Lord today</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('In-Person')} 
              className="bg-white text-[var(--primary)] hover:bg-white/90 font-black px-10 py-6 rounded-2xl shadow-xl h-auto transition-transform active:scale-95"
            >
              <MapPin className="w-5 h-5 mr-3" /> AT CHURCH
            </Button>
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('Online')} 
              className="bg-white/20 hover:bg-white/30 text-white font-black px-10 py-6 rounded-2xl backdrop-blur-md border border-white/30 h-auto transition-transform active:scale-95"
            >
              <Globe className="w-5 h-5 mr-3" /> ONLINE (ZOOM/STREAM)
            </Button>
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('Not Attending')} 
              className="bg-white/10 hover:bg-white/20 text-white/60 font-black px-10 py-6 rounded-2xl border border-white/10 h-auto transition-transform active:scale-95"
            >
              <XCircle className="w-5 h-5 mr-3" /> NOT ATTENDING
            </Button>
          </div>

          {children.length > 0 && (
            <div className="pt-8 border-t border-white/20 space-y-6">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-emerald-300" />
                <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Junior Church Enrollments</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {children.map(kid => (
                  <button
                    key={kid.id}
                    onClick={() => {
                      setSelectedKids(prev =>
                        prev.includes(kid.child_name)
                          ? prev.filter(k => k !== kid.child_name)
                          : [...prev, kid.child_name]
                      );
                    }}
                    className={`flex flex-col items-start p-6 rounded-[1.5rem] border transition-all text-left ${
                      selectedKids.includes(kid.child_name)
                      ? 'bg-white text-[var(--primary)] border-white scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm font-black">{kid.child_name}</span>
                    <span className="text-[10px] opacity-60 mt-1 uppercase tracking-widest">Ready for service?</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
