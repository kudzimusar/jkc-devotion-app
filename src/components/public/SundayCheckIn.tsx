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
import { usePublicTheme } from "./PublicThemeWrapper";

export default function SundayCheckIn({ user, currentDate }: { user: any, currentDate: Date }) {
  const { isDark } = usePublicTheme();
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
        <div className="rounded-[2.5rem] p-12 text-center border space-y-8"
             style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-xl)' }}>
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--muted-foreground)' }}>SUNDAY SERVICE</p>
            <h3 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>Sign in to check in for Sunday service</h3>
          </div>
          <button 
            onClick={() => {
              // Trigger sign in modal via parent or just rely on Nav?
              // Standard behavior is usually a button that opens the modal
              // We'll rely on the navbar for now or just provide a pretty link
            }}
            className="inline-block font-black px-12 py-5 rounded-full text-xs tracking-[0.2em] transition-all"
            style={{ 
               background: 'var(--jkc-navy)', 
               color: 'var(--primary-foreground)', 
               boxShadow: 'var(--shadow-md)' 
            }}
          >
            SIGN IN TO CHURCH OS
          </button>
        </div>
      </section>
    );
  }

  if (checkedIn) return (
    <section className="py-20 px-6 max-w-screen-xl mx-auto">
      <div className="rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-500 border"
           style={{ background: 'var(--section-alt)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
               style={{ background: 'var(--jkc-gold)', boxShadow: 'var(--shadow-md)' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--jkc-navy)' }} />
          </div>
          <div>
            <h4 className="text-2xl font-black italic" style={{ color: 'var(--foreground)' }}>You're Checked In!</h4>
            <p className="text-xs font-bold uppercase tracking-widest mt-1"
               style={{ color: 'var(--muted-foreground)' }}>Sunday Service {todayStr}</p>
          </div>
        </div>
        <p className="max-w-xs text-sm font-serif italic text-right"
           style={{ color: 'var(--muted-foreground)' }}>
          "I was glad when they said unto me, Let us go into the house of the LORD." - Psalm 122:1
        </p>
      </div>
    </section>
  );

  return (
    <section className="py-20 px-6 max-w-screen-xl mx-auto">
      <div className="rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
           style={{ background: 'var(--jkc-navy)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="relative z-10 space-y-8">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase"
               style={{ color: 'var(--jkc-gold)' }}>
              ONLINE & IN-PERSON
            </p>
            <h3 className="text-4xl md:text-5xl font-black italic leading-tight"
                style={{ color: 'var(--footer-fg)' }}>
              Sunday Service Check-In
            </h3>
            <p className="text-sm font-bold uppercase tracking-[0.2em]"
               style={{ color: 'var(--footer-muted)' }}>
              Join us in the house of the Lord today
            </p>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('In-Person')} 
              className="bg-white hover:bg-slate-100 font-black px-10 py-6 rounded-2xl shadow-xl h-auto transition-transform active:scale-95"
              style={{ color: 'var(--jkc-navy)' }}
            >
              <MapPin className="w-5 h-5 mr-3" /> AT CHURCH
            </Button>
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('Online')} 
              className="bg-transparent hover:bg-white/10 text-white font-black px-10 py-6 rounded-2xl border-2 border-white h-auto transition-transform active:scale-95"
            >
              <Globe className="w-5 h-5 mr-3" /> ONLINE (ZOOM/STREAM)
            </Button>
            <Button 
              disabled={loading} 
              onClick={() => handleCheckIn('Not Attending')} 
              className="bg-transparent hover:bg-white/5 font-black px-10 py-6 rounded-2xl border border-white/40 h-auto transition-transform active:scale-95"
              style={{ color: 'var(--footer-muted)' }}
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
                      ? 'bg-white scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                    style={{ 
                      color: selectedKids.includes(kid.child_name) ? 'var(--jkc-navy)' : 'inherit',
                      borderColor: selectedKids.includes(kid.child_name) ? 'white' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <span className="text-sm font-black">{kid.child_name}</span>
                    <span className="text-[10px] mt-1 uppercase tracking-widest"
                          style={{ color: selectedKids.includes(kid.child_name) ? 'var(--jkc-navy)' : 'var(--footer-muted)' }}>
                      Ready for service?
                    </span>
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
