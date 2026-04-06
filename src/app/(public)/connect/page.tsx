'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { basePath } from '@/lib/utils';
import Link from 'next/link';
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
  ArrowLeft
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

export default function KingdomConnectPage() {
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [source, setSource] = useState('web');
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('events');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Navigation / URLs
  const connectUrl = typeof window !== 'undefined' ? `${window.location.origin}${basePath}/connect` : '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(connectUrl + '?via=qr')}&color=1B3A6B`;

  // Pre-fill / Resolve Effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const via = params.get('via') || params.get('utm_source') || 'web';
    setSource(via);
    setMounted(true);

    resolvePublicOrgId().then(id => {
      setResolvedOrgId(id);
      if (id) {
        fetchPublicData(id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  async function fetchPublicData(orgId: string) {
    try {
      // Fetch up to 5 upcoming events
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('org_id', orgId)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(5);
      
      setEvents(eventData || []);

      // Fetch active groups for the jkGroup registration
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

  const notifyAdmin = async (title: string, message: string, route: string) => {
    try {
      await supabase.from('member_notifications').insert({
        org_id: resolvedOrgId,
        title,
        message,
        link_to: route,
        status: 'unread'
      });
    } catch (e) {
      console.error("Notification failed:", e);
    }
  };

  // Submission Master
  const submitForm = async (intent: string, childTable: string, data: any, childData: any) => {
    if (!resolvedOrgId) return;
    setLoading(true);
    try {
      // 1. Insert Parent Inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from('public_inquiries')
        .insert({
          org_id: resolvedOrgId,
          visitor_intent: intent,
          how_heard: source,
          status: 'new',
          first_name: data.first_name || data.name?.split(' ')[0] || 'Unknown',
          last_name: data.last_name || data.name?.split(' ')[1] || '',
          email: data.email,
          phone: data.phone,
          message: data.message || data.notes || data.prayer_request || ''
        })
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      // 2. Insert Child Record
      if (childTable) {
        const { error: childError } = await supabase
          .from(childTable)
          .insert({
            ...childData,
            inquiry_id: inquiry.id,
            org_id: resolvedOrgId
          });
        if (childError) throw childError;
      }

      // 3. Urgent Prayer Logic
      if (intent === 'prayer' && childData.urgency === 'Urgent') {
        await notifyAdmin(
          'Urgent Prayer Request', 
          `${data.name || 'Anonymous'}: ${childData.prayer_request?.substring(0, 80)}...`,
          '/shepherd'
        );
      }

      // 4. Brevo Trigger (Placeholder for Edge Function Hook or direct fetch)
      // Since BREVO_API_KEY is sensitive, we trigger the visitor-connector edge function
      // which handles Gemini analysis and eventually Brevo.
      // The trigger on public_inquiries handles this automatically.

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
    <div className="min-h-screen bg-white font-geist-sans selection:bg-[#f5a623]/30 selection:text-[#1b3a6b]">
      {/* Top Nav */}
      <div className="max-w-2xl mx-auto px-6 pt-8 flex items-center justify-between">
        <Link href={basePath + '/'} className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#1b3a6b] transition-all">
           <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>
      </div>

      {/* Header Container */}
      <div className="max-w-2xl mx-auto px-6 pt-4 pb-8 text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-[#1b3a6b] rounded-2xl flex items-center justify-center rotate-3 shadow-xl">
             <Heart className="text-[#f5a623] w-8 h-8 fill-current" />
          </div>
          <div className="space-y-1">
             <h1 className="text-3xl font-black tracking-tighter text-[#1b3a6b] uppercase">Kingdom Connect</h1>
             <p className="text-[10px] font-black tracking-[0.4em] text-[#64748b] uppercase">Japan Kingdom Church Digital Card</p>
          </div>
        </div>

        {/* Share Bar */}
        <div className="flex flex-col items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleShare}
            className="w-full h-14 rounded-2xl border-2 border-[#1b3a6b]/10 bg-white/50 backdrop-blur-md font-black text-xs tracking-widest text-[#1b3a6b] hover:bg-[#1b3a6b] hover:text-white transition-all shadow-sm"
          >
            <Share2 className="mr-3 w-4 h-4" /> SHARE KINGDOM CONNECT CARD
          </Button>
          
          <div className="p-8 bg-white border-2 border-dashed border-[#1b3a6b]/10 rounded-[2.5rem] flex flex-col items-center gap-4 shrink-0 shadow-inner w-full md:w-auto">
            <div className="p-4 bg-white rounded-xl shadow-lg inline-block">
              {mounted ? (
                <img src={qrUrl} alt="QR Code" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 bg-stone-100 flex items-center justify-center text-[8px] text-stone-400">LOADING QR...</div>
              )}
            </div>
            <Button 
              variant="ghost" 
              onClick={handleDownloadQr}
              className="text-[10px] font-black tracking-widest text-[#64748b] hover:text-[#1b3a6b] h-auto p-0"
            >
              <Download className="mr-2 w-3 h-3" /> DOWNLOAD QR FOR SHARING
            </Button>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="max-w-2xl mx-auto px-6 pb-24 space-y-4">
        
        {/* EVENTS SECTION */}
        {events.length > 0 && (
          <SectionShell 
            title="EVENTS" 
            id="events" 
            active={activeSection} 
            onToggle={setActiveSection}
            icon={<Calendar className="w-4 h-4" />}
          >
            <div className="space-y-6 pt-4">
              <p className="text-xs font-bold text-[#64748b] mb-4">Select an event to register:</p>
              <div className="grid grid-cols-1 gap-3">
                {events.map((event) => (
                  <EventForm 
                    key={event.id} 
                    event={event} 
                    onSubmit={(data) => submitForm('event', 'event_registrations', data, { ...data, event_id: event.id })}
                    loading={loading}
                    session={session}
                  />
                ))}
              </div>
            </div>
          </SectionShell>
        )}

        {/* CONNECT TO JKC SECTION */}
        <SectionShell 
          title="CONNECT TO JKC" 
          id="connect" 
          active={activeSection} 
          onToggle={setActiveSection}
          icon={<UserPlus className="w-4 h-4" />}
        >
          <div className="space-y-4 pt-4">
            <AccordionItem 
              label="BECOME A MEMBER" 
              description="Join the family and discover your purpose."
              form={<MembershipForm onSubmit={(d) => submitForm('membership', '', d, {})} loading={loading} session={session} />}
            />
            <AccordionItem 
              label="VOLUNTEER" 
              description="Serve the kingdom with your talents."
              form={<VolunteerForm onSubmit={(d) => submitForm('volunteer', 'volunteer_applications', d, d)} loading={loading} session={session} />}
            />
            <AccordionItem 
              label="JOIN A JKGROUP" 
              description="Find community in our small groups."
              form={<GroupForm groups={groups} onSubmit={(d) => submitForm('jkgroup', 'bible_study_group_requests', d, d)} loading={loading} session={session} />}
            />
            <Button 
              onClick={() => window.open('https://www.japankingdomchurch.com/give', '_blank')}
              className="w-full h-16 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs tracking-[0.2em] shadow-lg group"
            >
              <Heart className="mr-3 w-4 h-4 group-hover:scale-125 transition-transform fill-current" /> GIVE TO THE KINGDOM
            </Button>
          </div>
        </SectionShell>

        {/* CLASSES SECTION */}
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
              form={<ClassForm type="heart_of_house" onSubmit={(d) => submitForm('class_hoth', 'class_registrations', d, d)} loading={loading} session={session} />}
            />
            <AccordionItem 
              label="KINGDOM JAPANESE LANGUAGE CLASS" 
              description="Learn Japanese in a Christ-centered environment."
              form={<JapaneseClassForm onSubmit={(d) => submitForm('class_language', 'class_registrations', d, d)} loading={loading} session={session} />}
            />
          </div>
        </SectionShell>

        {/* CARE & SUPPORT SECTION */}
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
              form={<PrayerForm onSubmit={(d) => submitForm('prayer', 'prayer_requests', d, d)} loading={loading} session={session} />}
            />
          </div>
        </SectionShell>

      </div>

      {/* Footer Support */}
      <div className="text-center py-12 px-6">
         <p className="text-[8px] font-black text-[#64748b] uppercase tracking-[0.4em]">Integrated with Church OS Ministry Intelligence</p>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SectionShell({ title, id, active, onToggle, children, icon }: any) {
  const isOpen = active === id;
  return (
    <div className="rounded-3xl border-2 border-[#1b3a6b]/5 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all">
      <button 
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1b3a6b]/5 flex items-center justify-center text-[#1b3a6b]">
            {icon}
          </div>
          <span className="text-[11px] font-black tracking-[0.2em] text-[#f5a623] uppercase">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#f5a623]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
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
        className="w-full p-6 rounded-2xl bg-[#f8fafc] border-2 border-transparent hover:border-[#f5a623]/20 transition-all text-left flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <h4 className="text-[10px] font-black tracking-widest text-[#1b3a6b] uppercase">{label}</h4>
          <p className="text-[9px] font-bold text-[#64748b] leading-relaxed">{description}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#f5a623]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pt-6 px-2"
          >
            {form}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- FORMS ---
interface FormProps {
  onSubmit: (data: any) => void;
  loading: boolean;
  session: any;
}

function EventForm({ event, onSubmit, loading, session }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    email: session?.user?.email || '',
    guest_count: 1,
    first_visit: false,
    is_member: !!session,
    message: '',
    join_mailing_list: false
  });

  return (
    <div className="border border-[#1b3a6b]/5 rounded-2xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 bg-[#f8fafc] hover:bg-white flex items-center justify-between transition-all"
      >
         <div className="flex flex-col items-start gap-1">
            <p className="text-[10px] font-black text-[#1b3a6b] uppercase tracking-widest">{event.title}</p>
            <div className="flex items-center gap-3">
               <span className="flex items-center gap-1 text-[8px] font-bold text-[#64748b]">
                  <Calendar className="w-2.5 h-2.5" /> {new Date(event.event_date).toLocaleDateString()}
               </span>
               <span className="flex items-center gap-1 text-[8px] font-bold text-[#64748b]">
                  <Clock className="w-2.5 h-2.5" /> {event.event_time || 'Check App'}
               </span>
            </div>
         </div>
         <ArrowRight className={`w-3 h-3 text-[#f5a623] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="p-6 bg-white border-t border-[#1b3a6b]/5">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
               <div className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="h-12 rounded-xl border-2 font-bold"
                  />
                  <div className="space-y-1">
                    <Input 
                      type="email" 
                      placeholder="Email Address" 
                      required={!form.is_member} 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                    {!session && <p className="text-[8px] font-bold text-[#64748b] px-2 italic text-left">Internal note: required if not a JKC member</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-[9px] font-black text-[#64748b] tracking-widest uppercase">Guest Count</Label>
                    <RadioGroup 
                      value={String(form.guest_count)} 
                      onValueChange={v => setForm({...form, guest_count: parseInt(v)})}
                      className="flex flex-wrap gap-2"
                    >
                      {['1', '2-3', '4-6', '7+'].map(v => (
                        <Label key={v} className="cursor-pointer border-2 p-2 rounded-xl border-transparent hover:border-[#f5a623]/20 bg-[#f8fafc] flex items-center gap-2">
                           <RadioGroupItem value={v} />
                           <span className="text-[10px] font-black">{v}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={form.first_visit} onCheckedChange={(v) => setForm({...form, first_visit: !!v})} />
                      <Label className="text-[10px] font-bold">First Visit?</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} />
                      <Label className="text-[10px] font-bold">Mailing List</Label>
                    </div>
                  </div>

                  <Textarea 
                    placeholder="Message (optional)" 
                    value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})} 
                    className="h-24 rounded-xl border-2 font-bold resize-none"
                  />
               </div>
               <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] rounded-xl font-black text-xs tracking-widest">
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
    first_name: session?.user?.user_metadata?.first_name || '',
    last_name: session?.user?.user_metadata?.last_name || '',
    email: session?.user?.email || '',
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
      <p className="text-[9px] font-bold text-[#64748b] leading-relaxed mb-4 p-4 bg-[#f5a623]/5 rounded-xl border border-[#f5a623]/10">
        After completing this form your next step will be Heart of the House new members class.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="First Name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="h-12 rounded-xl" />
        <Input placeholder="Last Name" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="h-12 rounded-xl" />
      </div>
      <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl" />
      <Input placeholder="Phone (e.g. +81 0x-xxxx-xxxx)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl" />
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[8px] font-black text-muted-foreground uppercase ml-1">DOB</Label>
          <Input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-1">
          <Label className="text-[8px] font-black text-muted-foreground uppercase ml-1">Nationality</Label>
          <Select value={form.nationality} onValueChange={v => setForm({...form, nationality: v})}>
             <SelectTrigger className="h-12 rounded-xl">
               <SelectValue placeholder="Select Country" />
             </SelectTrigger>
             <SelectContent className="max-h-[200px]">
                {['Japan', 'USA', 'Philippines', 'Brazil', 'Korea', 'UK', 'Australia', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
             </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Marital Status</Label>
        <RadioGroup value={form.marital_status} onValueChange={v => setForm({...form, marital_status: v})} className="flex gap-4">
           {['Single', 'Married', 'Divorced', 'Widowed'].map(v => (
             <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <Select value={form.how_heard} onValueChange={v => setForm({...form, how_heard: v})}>
        <SelectTrigger className="h-12 rounded-xl font-bold">
           <SelectValue placeholder="How did you hear about us?" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Friend/Family">Friend/Family</SelectItem>
          <SelectItem value="Social Media">Social Media</SelectItem>
          <SelectItem value="Online Search">Online Search</SelectItem>
          <SelectItem value="Event/Outreach">Event/Outreach</SelectItem>
          <SelectItem value="QR Code">QR Code</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Faith Decision</Label>
        <RadioGroup value={form.faith_decision} onValueChange={v => setForm({...form, faith_decision: v})} className="space-y-2">
           {['Yes recently', 'Already a believer', 'Still exploring'].map(v => (
             <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} />
        <Label className="text-[10px] font-bold">Join Mailing List</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest">
         {loading ? 'TRANSMITTING...' : 'SUBMIT APPLICATION'}
      </Button>
    </form>
  );
}

function VolunteerForm({ onSubmit, loading, session }: any) {
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    email: session?.user?.email || '',
    phone: '',
    is_member: !!session,
    ministry_area: '',
    availability: '',
    notes: ''
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
      <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl font-bold" />
      <div className="space-y-1">
        <Input type="email" placeholder="Email" required={!form.is_member} value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl font-bold" />
        {!form.is_member && <p className="text-[8px] font-bold text-rose-400 px-2 italic uppercase">* Required for non-members</p>}
      </div>
      <div className="space-y-1">
        <Input placeholder="Phone (e.g. +81 0x-xxxx-xxxx)" required={!form.is_member} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl font-bold" />
        {!form.is_member && <p className="text-[8px] font-bold text-rose-400 px-2 italic uppercase">* Required for non-members</p>}
      </div>
      
      <div className="flex items-center space-x-4">
        <Label className="text-[10px] font-bold">Are you a member of JKC?</Label>
        <RadioGroup value={form.is_member ? 'yes' : 'no'} onValueChange={v => setForm({...form, is_member: v === 'yes'})} className="flex gap-4">
           <Label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold"><RadioGroupItem value="yes" /> Yes</Label>
           <Label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold"><RadioGroupItem value="no" /> No</Label>
        </RadioGroup>
      </div>

      <Select value={form.ministry_area} onValueChange={v => setForm({...form, ministry_area: v})}>
        <SelectTrigger className="h-12 rounded-xl font-bold">
           <SelectValue placeholder="Interested Ministry Area" />
        </SelectTrigger>
        <SelectContent>
          {['Worship & Music', 'Tech & Media', 'Children\'s Ministry', 'Hospitality & Welcome', 'Language School', 'Prayer Team', 'Outreach & Evangelism', 'Other'].map(v => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Availability</Label>
        <RadioGroup value={form.availability} onValueChange={v => setForm({...form, availability: v})} className="flex flex-wrap gap-4">
           {['Sundays', 'Weekdays', 'Evenings', 'Flexible'].map(v => (
             <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <Textarea placeholder="Experience or specialized skills in this area..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="h-24 rounded-xl border-2 resize-none" />
      
      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest">
         {loading ? 'SUBMITTING...' : 'REGISTER INTEREST'}
      </Button>
    </form>
  );
}

function GroupForm({ groups, onSubmit, loading, session }: any) {
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    email: session?.user?.email || '',
    age_group: '',
    is_member: !!session,
    group_id: '',
    group_type: '',
    meeting_time: '',
    join_mailing_list: false
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
      <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl" />
      
      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Age Group</Label>
        <RadioGroup value={form.age_group} onValueChange={v => setForm({...form, age_group: v})} className="flex flex-wrap gap-4">
           {['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Group Type Preference</Label>
        <RadioGroup value={form.group_type} onValueChange={v => setForm({...form, group_type: v})} className="flex flex-wrap gap-4">
           {['Bible study', 'Prayer group', 'Young adults', 'Families', 'International'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Meeting Time Preference</Label>
        <RadioGroup value={form.meeting_time} onValueChange={v => setForm({...form, meeting_time: v})} className="flex flex-wrap gap-4">
           {['Weekday morning', 'Weekday evening', 'Weekend', 'Online'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} />
        <Label className="text-[10px] font-bold">Join Mailing List</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest">
         {loading ? 'REQUESTING...' : 'FIND MY GROUP'}
      </Button>
    </form>
  );
}

function ClassForm({ type, onSubmit, loading, session }: any) {
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    email: session?.user?.email || '',
    phone: '',
    visit_frequency: '',
    message: '',
    class_type: type
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 text-left">
      <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
      <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl" />
      <Input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl" />
      
      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Visit Frequency</Label>
        <RadioGroup value={form.visit_frequency} onValueChange={v => setForm({...form, visit_frequency: v})} className="flex flex-wrap gap-4">
           {['First time', 'A few times', 'Regular attendee'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <Textarea placeholder="Message (optional)" value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="h-24 rounded-xl border-2 resize-none" />
      
      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest uppercase">
         {loading ? 'SUBMITTING...' : `REGISTER FOR ${type.replace(/_/g, ' ')}`}
      </Button>
    </form>
  );
}

function JapaneseClassForm({ onSubmit, loading, session }: any) {
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    email: session?.user?.email || '',
    japanese_level: '',
    class_schedule_preference: '',
    motivation: '',
    join_mailing_list: false,
    class_type: 'language_class'
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input placeholder="Full Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
      <Input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl" />
      
      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Japanese Proficiency Level</Label>
        <RadioGroup value={form.japanese_level} onValueChange={v => setForm({...form, japanese_level: v})} className="space-y-2">
           {['Complete beginner', 'Basic N5–N4', 'Intermediate N3', 'Advanced N2–N1'].map(v => (
             <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <Select value={form.class_schedule_preference} onValueChange={v => setForm({...form, class_schedule_preference: v})}>
        <SelectTrigger className="h-12 rounded-xl font-bold text-xs uppercase tracking-widest">
           <SelectValue placeholder="Class Schedule Preference" />
        </SelectTrigger>
        <SelectContent>
          {['Weekday morning', 'Weekday evening', 'Saturday', 'Online'].map(v => (
            <SelectItem key={v} value={v} className="text-[10px] font-bold uppercase tracking-widest">{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea placeholder="Why do you want to learn Japanese?" value={form.motivation} onChange={e => setForm({...form, motivation: e.target.value})} className="h-24 rounded-xl border-2 resize-none" />
      
      <div className="flex items-center space-x-2">
        <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} />
        <Label className="text-[10px] font-bold">Join Mailing List</Label>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest">
         {loading ? 'SUBMITTING...' : 'REGISTER FOR JAPANESE CLASS'}
      </Button>
    </form>
  );
}

function PrayerForm({ onSubmit, loading, session }: any) {
  const [form, setForm] = useState({
    name: session?.user?.user_metadata?.first_name ? `${session.user.user_metadata.first_name} ${session.user.user_metadata.last_name || ''}` : '',
    prayer_request: '',
    urgency: 'General',
    topic: 'General',
    is_private: false,
    join_mailing_list: false
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input placeholder="Your name or 'Anonymous'" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="h-12 rounded-xl" />
      <Textarea placeholder="How can we pray for you today?" required value={form.prayer_request} onChange={e => setForm({...form, prayer_request: e.target.value})} className="h-32 rounded-xl border-2 resize-none" />
      
      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Urgency</Label>
        <RadioGroup value={form.urgency} onValueChange={v => setForm({...form, urgency: v})} className="flex gap-4">
           {['General', 'This week', 'Urgent'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prayer Topic</Label>
        <RadioGroup value={form.topic} onValueChange={v => setForm({...form, topic: v})} className="flex flex-wrap gap-4">
           {['Health', 'Family', 'Work/Finance', 'Immigration', 'Spiritual growth', 'Other'].map(v => (
             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                <RadioGroupItem value={v} /> {v}
             </Label>
           ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[8px] font-bold text-muted-foreground bg-blue-500/5 p-2 rounded-lg border border-blue-500/10 mb-2">Note: Urgent prayer requests are broadcast directly to the intercessory leadership team.</p>
        <div className="flex items-center space-x-2">
          <Checkbox checked={form.is_private} onCheckedChange={(v) => setForm({...form, is_private: !!v})} id="private-prayer" />
          <Label htmlFor="private-prayer" className="text-[10px] font-bold cursor-pointer">Keep this private — prayer team only</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox checked={form.join_mailing_list} onCheckedChange={(v) => setForm({...form, join_mailing_list: !!v})} id="maillist-prayer" />
          <Label htmlFor="maillist-prayer" className="text-[10px] font-bold cursor-pointer">Join Mailing List</Label>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-14 bg-[#1b3a6b] text-white rounded-xl font-black text-xs tracking-widest">
         {loading ? 'SUBMITTING...' : 'SUBMIT PRAYER REQUEST'}
      </Button>
    </form>
  );
}
