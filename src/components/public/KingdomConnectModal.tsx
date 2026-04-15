'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { basePath } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Share2,
  QrCode,
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  UserPlus,
  Heart as PrayingHands,
  Languages,
  BookOpen,
  ArrowLeft,
  X,
  Flame
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function KingdomConnectModal({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [source, setSource] = useState('web');
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('events');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const pathname = usePathname();

  // Navigation / URLs (same as standalone page)
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const connectUrl = `${origin}${basePath}/connect`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(connectUrl + '?via=qr')}&color=1B3A6B`;

  // Pre-fill / Resolve Effect
  useEffect(() => {
    setMounted(true);
    const params = new URLSearchParams(window.location.search);
    const via = params.get('via') || params.get('utm_source') || 'modal';
    setSource(via);

    resolvePublicOrgId().then(id => {
      console.log('[KCC] resolvedOrgId:', id);
      setResolvedOrgId(id);
      if (id) fetchPublicData(id);
    });

    // SECURITY/UX: Only show automatic pop-up once per session for all users
    if (pathname && pathname.includes('/connect')) return;
    const hasSeenModal = sessionStorage.getItem('kcc_modal_shown');
    if (!hasSeenModal) {
      // 2 second delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // LISTEN FOR CUSTOM TRIGGER (e.g., from Guest Attendance buttons)
  useEffect(() => {
    const triggerModal = () => setIsOpen(true);
    window.addEventListener('open-connect-modal', triggerModal);
    return () => window.removeEventListener('open-connect-modal', triggerModal);
  }, []);

  async function fetchPublicData(orgId: string) {
    try {
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', orgId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);
      
      setEvents(eventData || []);

      const { data: groupData } = await supabase
        .from('bible_study_groups')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .limit(10);
      
      setGroups(groupData || []);
    } catch (e) {
      console.error("Data fetch error:", e);
    }
  }

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('kcc_modal_shown', 'true');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kingdom Connect Card',
          text: 'Connect with Japan Kingdom Church',
          url: connectUrl
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          toast.error('Could not share. Please copy the link manually.');
        }
      }
    } else {
      navigator.clipboard.writeText(connectUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownloadQr = () => {
    window.open(qrUrl, '_blank');
  };

  const submitForm = async (intent: string, childTable: string | null, data: any, childData: any) => {
    console.log('[KCC] submitForm called, resolvedOrgId:', resolvedOrgId, 'intent:', intent);
    if (!resolvedOrgId) {
      toast.error("Connection error. Please refresh and try again.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let finalMessage = data.message || data.notes || data.prayer_request || '';
      if (intent === 'jkgroup') {
        const groupContext = {
          age_group: data.age_group,
          group_type: data.group_type,
          meeting_time: data.meeting_time,
          is_member: data.is_member,
          name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          email: data.email
        };
        finalMessage = `jkGroup Request [JSON]: ${JSON.stringify(groupContext)}`;
      }

      const { data: inquiry, error: inquiryError } = await supabase
        .from('public_inquiries')
        .insert({
          org_id: resolvedOrgId,
          visitor_intent: intent,
          how_heard: source,
          status: 'new',
          first_name: data.first_name || data.name?.split(' ')[0] || 'Unknown',
          last_name: data.last_name || data.name?.split(' ')[1] || '',
          email: data.email || null,
          phone: data.phone,
          message: finalMessage
        })
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      if (childTable) {
        // Clean childData to only include valid columns for the specific table
        const cleanChildData: any = {
          inquiry_id: inquiry.id,
          org_id: resolvedOrgId
        };

        if (childTable === 'prayer_requests') {
          cleanChildData.request_text = childData.prayer_request || childData.message || '';
          cleanChildData.urgency = childData.urgency || 'Normal';
          cleanChildData.category = childData.topic || 'General';
          cleanChildData.is_anonymous = !!(childData.is_anonymous || !childData.name || childData.name === 'Guest');
        } else if (childTable === 'event_registrations') {
          cleanChildData.event_id = childData.event_id;
          cleanChildData.name = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Visitor';
          cleanChildData.email = data.email || null;
          cleanChildData.guest_count = String(childData.guest_count || 1);
          cleanChildData.first_visit = !!childData.first_visit;
          cleanChildData.is_member = !!childData.is_member;
          cleanChildData.message = childData.message || '';
        } else if (childTable === 'volunteer_applications') {
          cleanChildData.name = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Visitor';
          cleanChildData.email = data.email || null;
          cleanChildData.phone = data.phone || null;
          cleanChildData.is_member = !!childData.is_member;
          cleanChildData.ministry_interests = [childData.ministry_area || 'General'];
          cleanChildData.ministry_area = childData.ministry_area || 'General';
          cleanChildData.experience_summary = childData.notes || '';
          cleanChildData.availability = childData.availability || 'Weekends';
        } else if (childTable === 'class_registrations') {
          cleanChildData.name = data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Visitor';
          cleanChildData.email = data.email || null;
          cleanChildData.phone = data.phone || null;
          cleanChildData.class_type = childData.class_type || 'japanese';
          cleanChildData.japanese_level = childData.japanese_level || childData.proficiency || '';
          cleanChildData.message = childData.message || '';
        } else if (childTable === 'bible_study_group_requests') {
          cleanChildData.group_id = childData.group_id || null;
          cleanChildData.message = `Preference: ${childData.group_type || 'Any'}. Age: ${childData.age_group || 'Any'}. Time: ${childData.meeting_time || 'Any'}`;
          cleanChildData.status = 'pending';
        }

        const { error: childError } = await supabase
          .from(childTable)
          .insert(cleanChildData);
        if (childError) throw childError;
      }

      toast.success("Successfully submitted. Blessings!");
      setActiveSection(null);
    } catch (error: any) {
      console.error(error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 w-full h-full">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-white/10 font-['DM_Sans',sans-serif] grid grid-cols-1 md:grid-cols-5"
          >

            {/* LEFT PANEL */}
            <div className="md:col-span-2 bg-[#1B3A6B] p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C] blur-[100px] opacity-10 rounded-full pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C] text-xs font-black uppercase tracking-widest relative z-10">
                <Flame className="w-3 h-3" /> Church OS
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tighter relative z-10">
                Kingdom<br/>Connect<br/>Hub
              </h2>
              <div className="bg-white p-3 md:p-4 rounded-[2rem] shadow-2xl relative z-10 w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
                {mounted ? (
                  <img src={qrUrl} alt="Kingdom Connect QR" className="w-full h-full rounded-lg" />
                ) : (
                  <div className="w-full h-full bg-slate-200 rounded-lg" />
                )}
              </div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest relative z-10 hidden md:block">Scan to connect</p>
            </div>

            {/* RIGHT PANEL */}
            <div className="md:col-span-3 bg-[#0f172a] flex flex-col overflow-y-auto max-h-[90vh]">
              {/* STICKY CLOSE BAR — always visible regardless of scroll position */}
              <div className="sticky top-0 z-[110] flex items-center justify-between bg-[#0f172a] px-4 py-3 border-b border-white/5">
                <span className="text-xs font-black tracking-widest text-white/40 uppercase">Kingdom Connect</span>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white hover:scale-110 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            <div className="pt-12 pb-8 px-6 text-center space-y-6 bg-gradient-to-b from-[#0f1f3d] to-[#111827]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[#1b3a6b]/40 backdrop-blur-md rounded-2xl flex items-center justify-center rotate-3 shadow-xl border border-white/10">
                   <Heart className="text-[#f5a623] w-8 h-8 fill-current" />
                </div>
                <div className="space-y-1">
                   <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none font-['Playfair_Display',serif]">Kingdom Connect</h1>
                   <p className="text-[9px] font-black tracking-[0.4em] text-slate-400 uppercase">Your Church · Digital Card</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 px-4">
                <Button 
                  variant="outline" 
                  onClick={handleShare}
                  className="w-full h-14 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md font-black text-xs tracking-widest text-white hover:bg-[#1b3a6b] transition-all shadow-sm"
                >
                  <Share2 className="mr-3 w-4 h-4" /> SHARE KINGDOM CONNECT CARD
                </Button>
                
                <div className="p-4 bg-black/20 border border-dashed border-white/10 rounded-[2.5rem] flex flex-row items-center gap-6 shrink-0 shadow-inner w-full sm:w-auto">
                    <div className="p-2 bg-white rounded-lg shadow-lg inline-block">
                        {mounted ? (
                            <img src={qrUrl} alt="QR Code" className="w-16 h-16" />
                        ) : (
                            <div className="w-16 h-16 bg-slate-800 flex items-center justify-center text-[8px] text-slate-400">LOADING...</div>
                        )}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-white uppercase tracking-wider">Kingdom Connect QR</p>
                      <p className="text-[9px] text-slate-400 mb-2">Scan to open · replaces bench QR</p>
                      <Button 
                          variant="ghost" 
                          onClick={handleDownloadQr}
                          className="text-[9px] font-black tracking-widest text-[#f5a623] hover:text-white h-auto p-0 flex items-center gap-2"
                      >
                          <Download className="w-3 h-3" /> DOWNLOAD FOR BENCH CARDS
                      </Button>
                    </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-24 space-y-4">
              
              {events.length > 0 && (
                <SectionShell 
                  title="EVENTS" 
                  id="events" 
                  active={activeSection} 
                  onToggle={setActiveSection}
                  icon={<Calendar className="w-4 h-4" />}
                >
                  <div className="space-y-6 pt-4">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">Select an event to register:</p>
                    <div className="grid grid-cols-1 gap-3">
                      {events.map((event) => (
                        <EventForm 
                          key={event.id} 
                          event={event} 
                          onSubmit={(data: any) => submitForm('event', 'event_registrations', data, { ...data, event_id: event.id })}
                          loading={loading}
                          session={user}
                        />
                      ))}
                    </div>
                  </div>
                </SectionShell>
              )}

              <SectionShell 
                title="CONNECT"
                id="connect"
                active={activeSection} 
                onToggle={setActiveSection}
                icon={<UserPlus className="w-4 h-4" />}
              >
                <div className="space-y-4 pt-4">
                  <AccordionItem 
                    label="BECOME A MEMBER" 
                    description="Join the family and discover your purpose."
                    form={<MembershipForm onSubmit={(d: any) => submitForm('membership', '', d, {})} loading={loading} session={user} />}
                  />
                  <AccordionItem 
                    label="VOLUNTEER" 
                    description="Serve the kingdom with your talents."
                    form={<VolunteerForm onSubmit={(d: any) => submitForm('volunteer', 'volunteer_applications', d, d)} loading={loading} session={user} />}
                  />
                  <AccordionItem 
                    label="JOIN A JKGROUP" 
                    description="Find community in our small groups."
                    form={<GroupForm groups={groups} onSubmit={(d: any) => submitForm('jkgroup', 'bible_study_group_requests', d, d)} loading={loading} session={user} />}
                  />
                  <Button 
                    onClick={() => window.open(`${basePath}/welcome/give/`, '_self')}
                    className="w-full h-16 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs tracking-[0.2em] shadow-lg group"
                  >
                    <Heart className="mr-3 w-4 h-4 group-hover:scale-125 transition-transform fill-current" /> GIVE TO THE KINGDOM
                  </Button>
                </div>
              </SectionShell>

              <SectionShell 
                title="CLASSES" 
                id="classes" 
                active={activeSection} 
                onToggle={setActiveSection}
                icon={<BookOpen className="w-4 h-4" />}
              >
                <div className="space-y-4 pt-4">
                  <AccordionItem 
                    label="HEART OF THE HOUSE" 
                    description="New members class to discover our vision."
                    form={<ClassForm type="heart_of_house" onSubmit={(d: any) => submitForm('class_hoth', 'class_registrations', d, d)} loading={loading} session={user} />}
                  />
                  <AccordionItem 
                    label="KINGDOM JAPANESE LANGUAGE CLASS" 
                    description="Learn Japanese in a Christ-centered environment."
                    form={<JapaneseClassForm onSubmit={(d: any) => submitForm('class', 'class_registrations', d, d)} loading={loading} session={user} />}
                  />
                </div>
              </SectionShell>

              <SectionShell 
                title="CARE & SUPPORT" 
                id="care" 
                active={activeSection} 
                onToggle={setActiveSection}
                icon={<PrayingHands className="w-4 h-4" />}
              >
                <div className="space-y-4 pt-4">
                  <AccordionItem 
                    label="PRAYER REQUEST" 
                    description="Our team is standing by to pray with you."
                    form={<PrayerForm onSubmit={(d: any) => submitForm('prayer', 'prayer_requests', d, d)} loading={loading} session={user} />}
                  />
                </div>
              </SectionShell>

              <div className="text-center pt-8">
                 <p className="text-[9px] font-black text-slate-700 dark:text-slate-800 uppercase tracking-[0.25em]">Integrated with Church OS Ministry Intelligence</p>
              </div>
            </div>
            </div>{/* end right panel */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionShell({ title, id, active, onToggle, children, icon }: any) {
  const isOpen = active === id;
  return (
    <div className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'border-[#f5a623]/30 bg-[#f5a623]/5' : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/[0.07]'}`}>
      <button 
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1b3a6b]/40 backdrop-blur-md flex items-center justify-center text-[#f5a623] border border-white/5">
            {icon}
          </div>
          <span className="text-[11px] font-black tracking-[0.2em] text-[#f5a623] uppercase">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#f5a623]" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccordionItem({ label, description, form }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#f5a623]/30 hover:bg-[#f5a623]/5 transition-all text-left flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <h4 className="text-[11px] font-black tracking-[0.1em] text-slate-200 uppercase">{label}</h4>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{description}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#f5a623]" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pt-6 px-2"
          >
            <div className="bg-white/[0.03] rounded-xl p-[14px] border border-white/5">
              {form}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EventForm({ event, onSubmit, loading, session }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : '',
      email: session?.email || '',
      guest_count: '1',
      first_visit: false,
      is_member: !!session,
      message: '',
      join_mailing_list: false
    });
  
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-5 bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 flex items-center justify-between transition-all"
        >
           <div className="flex flex-col items-start gap-1">
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{event.name}</p>
              <div className="flex items-center gap-3">
                 <span className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                    <Calendar className="w-2.5 h-2.5" /> {new Date(event.event_date).toLocaleDateString()}
                 </span>
                 <span className="flex items-center gap-1 text-[8px] font-bold text-slate-500">
                    <Clock className="w-2.5 h-2.5" /> {event.event_time || 'Check App'}
                 </span>
              </div>
           </div>
           <ArrowRight className={`w-3 h-3 text-[#f5a623] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 bg-white/[0.03] border-t border-white/10"
            >
              <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
                 <div className="space-y-4">
                    <Input 
                      placeholder="Full Name" 
                      required 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold"
                    />
                    <div className="space-y-1">
                      <Input 
                        type="email" 
                        placeholder="Email (Optional)" 
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})}
                        className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Guest Count</p>
                      <div className="flex flex-wrap gap-2">
                        {['1', '2-3', '4-6', '7+'].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setForm({...form, guest_count: v as any})}
                            className={`px-5 py-3 rounded-2xl border text-[14px] font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-sm
                              ${String(form.guest_count) === v
                                ? 'bg-[#1b3a6b] border-[#f5a623]/40 text-[#f5a623] shadow-lg shadow-[#1b3a6b]/20'
                                : 'bg-white/[0.04] border-white/10 text-slate-500 hover:border-[#f5a623]/30'
                              }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
  
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={form.first_visit} onCheckedChange={(v) => setForm({...form, first_visit: !!v})} />
                         <Label className="text-[10px] font-bold text-slate-800 dark:text-slate-200">First Visit?</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} />
                         <Label className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Mailing List</Label>
                      </div>
                    </div>
  
                    <Textarea 
                      placeholder="Message (optional)" 
                      value={form.message} 
                      onChange={e => setForm({...form, message: e.target.value})} 
                      className="h-24 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold resize-none"
                    />
                 </div>
                 <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
                    {loading ? 'REGISTERING...' : 'CONFIRM REGISTRATION'}
                 </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
}

function MembershipForm({ onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      first_name: session?.user_metadata?.first_name || '',
      last_name: session?.user_metadata?.last_name || '',
      email: session?.email || '',
      phone: '',
      date_of_birth: '',
      nationality: '',
      marital_status: 'Single',
      how_heard: '',
      faith_decision: 'Already a believer',
      join_mailing_list: false
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <p className="text-[10px] font-bold text-slate-400 leading-relaxed mb-4 p-4 bg-[#f5a623]/5 rounded-xl border border-[#f5a623]/20">
          After completing this form your next step will be Heart of the House new members class.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="First Name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
          <Input placeholder="Last Name" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        </div>
        <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input placeholder="Phone (e.g. +81 0x-xxxx-xxxx)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[8px] font-black text-slate-500 uppercase ml-1">DOB</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold" />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px] font-black text-slate-500 uppercase ml-1">Nationality</Label>
            <Select value={form.nationality} onValueChange={v => setForm({...form, nationality: v})}>
               <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
                 <SelectValue placeholder="Select" />
               </SelectTrigger>
               <SelectContent className="bg-[#111827] border-white/10 text-white">
                  {['Japan', 'USA', 'Philippines', 'Brazil', 'Korea', 'UK', 'Australia', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
               </SelectContent>
            </Select>
          </div>
        </div>
  
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Marital Status</p>
          <div className="flex flex-wrap gap-2">
            {['Single', 'Married', 'Divorced', 'Widowed'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({...form, marital_status: v})}
                className={`px-5 py-3 rounded-2xl border text-[14px] font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-sm
                  ${form.marital_status === v
                    ? 'bg-[#1b3a6b] border-[#f5a623]/40 text-[#f5a623] shadow-lg shadow-[#1b3a6b]/20'
                    : 'bg-white/[0.04] border-white/10 text-slate-500 hover:border-[#f5a623]/30'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
  
        <Select value={form.how_heard} onValueChange={v => setForm({...form, how_heard: v})}>
          <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
             <SelectValue placeholder="How did you hear about us?" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-white/10 text-white">
            <SelectItem value="Friend/Family">Friend/Family</SelectItem>
            <SelectItem value="Social Media">Social Media</SelectItem>
            <SelectItem value="Online Search">Online Search</SelectItem>
            <SelectItem value="Event/Outreach">Event/Outreach</SelectItem>
            <SelectItem value="QR Code">QR Code</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
  
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faith Decision</Label>
          <RadioGroup value={form.faith_decision} onValueChange={v => setForm({...form, faith_decision: v})} className="space-y-2">
             {['Yes recently', 'Already a believer', 'Still exploring'].map(v => (
               <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-300">
                  <RadioGroupItem value={v} className="border-white/20" /> {v}
               </Label>
             ))}
          </RadioGroup>
        </div>
  
        <div className="flex items-center space-x-2">
          <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} className="border-white/20" />
          <Label className="text-[10px] font-bold text-slate-300">Join Mailing List</Label>
        </div>
  
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'TRANSMITTING...' : 'SUBMIT APPLICATION'}
        </Button>
      </form>
    );
}

function VolunteerForm({ onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : '',
      email: session?.email || '',
      phone: '',
      is_member: !!session,
      ministry_area: '',
      availability: '',
      notes: ''
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
        <Input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input type="email" placeholder="Email (Optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input placeholder="Phone" required={!form.is_member} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        
        <div className="flex items-center space-x-4">
          <Label className="text-[10px] font-bold text-slate-300">Are you a member?</Label>
          <RadioGroup value={form.is_member ? 'yes' : 'no'} onValueChange={v => setForm({...form, is_member: v === 'yes'})} className="flex gap-4">
             <Label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300"><RadioGroupItem value="yes" className="border-white/20" /> Yes</Label>
             <Label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300"><RadioGroupItem value="no" className="border-white/20" /> No</Label>
          </RadioGroup>
        </div>
  
        <Select value={form.ministry_area} onValueChange={v => setForm({...form, ministry_area: v})}>
          <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
             <SelectValue placeholder="Ministry Area" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-white/10 text-white">
            {['Worship', 'Tech', 'Children', 'Hospitality', 'Language School', 'Prayer Team', 'Outreach', 'Other'].map(v => (
              <SelectItem key={v} value={v}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
  
        <div className="space-y-3 px-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Availability</p>
          <div className="flex flex-wrap gap-2">
            {['Sundays', 'Weekdays', 'Evenings', 'Flexible'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setForm({...form, availability: v})}
                className={`px-4 py-2 rounded-xl border text-[13px] font-bold transition-all
                  ${form.availability === v
                    ? 'bg-[#1b3a6b] border-[#f5a623]/40 text-[#f5a623]'
                    : 'bg-white/[0.04] border-white/10 text-slate-500'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
  
        <Textarea placeholder="Experience..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-24 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold resize-none" />
        
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'SUBMITTING...' : 'REGISTER INTEREST'}
        </Button>
      </form>
    );
}

function GroupForm({ groups, onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : '',
      email: session?.email || '',
      age_group: '',
      is_member: !!session,
      group_id: '',
      group_type: '',
      meeting_time: '',
      join_mailing_list: false
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
        <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Age Group</Label>
          <RadioGroup value={form.age_group} onValueChange={v => setForm({...form, age_group: v})} className="flex flex-wrap gap-4">
             {['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'].map(v => (
               <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300">
                  <RadioGroupItem value={v} className="border-white/20" /> {v}
               </Label>
             ))}
          </RadioGroup>
        </div>
  
        <div className="space-y-3">
          <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Group Preference</Label>
          <RadioGroup value={form.group_type} onValueChange={v => setForm({...form, group_type: v})} className="flex flex-wrap gap-4">
             {['Bible study', 'Prayer', 'Young adults', 'Families', 'International'].map(v => (
               <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-300">
                  <RadioGroupItem value={v} className="border-white/20" /> {v}
               </Label>
             ))}
          </RadioGroup>
        </div>
  
        <div className="flex items-center space-x-2">
          <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} className="border-white/20" />
          <Label className="text-[10px] font-bold text-slate-300">Join Mailing List</Label>
        </div>
  
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'REQUESTING...' : 'FIND MY GROUP'}
        </Button>
      </form>
    );
}

function ClassForm({ type, onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : '',
      email: session?.email || '',
      phone: '',
      visit_frequency: '',
      message: '',
      class_type: type
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
        <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'REGISTERING...' : 'CONFIRM INTEREST'}
        </Button>
      </form>
    );
}

function JapaneseClassForm({ onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : '',
      email: session?.email || '',
      proficiency: 'Beginner',
      message: ''
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
        <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Select value={form.proficiency} onValueChange={v => setForm({...form, proficiency: v})}>
           <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
             <SelectValue placeholder="Japanese Proficiency" />
           </SelectTrigger>
           <SelectContent className="bg-[#111827] border-white/10 text-white">
              {['Absolute Beginner', 'Beginner', 'Intermediate', 'Advanced'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
           </SelectContent>
        </Select>
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'REGISTERING...' : 'JOIN LANGUAGE CLASS'}
        </Button>
      </form>
    );
}

function PrayerForm({ onSubmit, loading, session }: any) {
    const [form, setForm] = useState({
      name: session?.user_metadata?.first_name ? `${session.user_metadata.first_name} ${session.user_metadata.last_name || ''}` : 'Guest',
      email: session?.email || '',
      prayer_request: '',
      is_public: false,
      urgency: 'Normal',
      topic: 'General'
    });
  
    return (
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
        <Input placeholder="Name (optional)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        <Input type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold" />
        
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.urgency} onValueChange={v => setForm({...form, urgency: v})}>
             <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
               <SelectValue placeholder="Urgency" />
             </SelectTrigger>
             <SelectContent className="bg-[#111827] border-white/10 text-white">
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Urgent">Urgent 🚨</SelectItem>
             </SelectContent>
          </Select>
          <Select value={form.topic} onValueChange={v => setForm({...form, topic: v})}>
             <SelectTrigger className="h-12 rounded-xl border border-white/10 bg-black/20 text-white font-bold">
               <SelectValue placeholder="Topic" />
             </SelectTrigger>
             <SelectContent className="bg-[#111827] border-white/10 text-white">
                {['General', 'Health', 'Family', 'Finances', 'Work', 'Spiritual'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
             </SelectContent>
          </Select>
        </div>
  
        <Textarea 
          placeholder="How can we pray for you?" 
          required 
          value={form.prayer_request} 
          onChange={e => setForm({...form, prayer_request: e.target.value})} 
          className="h-32 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-slate-500 font-bold resize-none"
        />
        
        <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white hover:bg-[#1b3a6b]/90 border border-[#f5a623]/10 rounded-xl font-black text-xs tracking-widest shadow-xl">
           {loading ? 'SENDING...' : 'SUBMIT PRAYER REQUEST'}
        </Button>
      </form>
    );
}
