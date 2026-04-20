'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Calendar, MapPin, Clock, BookOpen, User, Users, Languages, FileText, Download, CheckCircle2, ChevronRight, Loader2, Globe } from 'lucide-react';
import { resolvePublicOrgId, JKC_ORG_ID } from '@/lib/org-resolver';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LanguageSchoolPage() {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    track: 'Beginners (Sundays)',
    level: 'Complete beginner',
    heardAbout: 'Friend',
    onlineAccess: 'No',
    message: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const fullMessage = `
TRACK: ${formData.track}
LEVEL: ${formData.level}
HEARD VIA: ${formData.heardAbout}
WANTS ONLINE: ${formData.onlineAccess}
PHONE: ${formData.phone}
NOTES: ${formData.message}
    `.trim();

    // For the pilot site, we explicitly route to JKC to avoid oragnizational siphoning
    const orgId = JKC_ORG_ID;

    const { error } = await supabase
      .from('public_inquiries')
      .insert([{
        org_id: orgId,
        first_name: formData.name,
        last_name: '',
        email: formData.email,
        phone: formData.phone,
        message: fullMessage,
        visitor_intent: 'language_class',
        how_heard: formData.heardAbout.toLowerCase(),
        preferred_language: 'EN',
        status: 'new'
      }]);

    if (error) {
      toast.error('Failed to send application. Please try again.');
    } else {
      toast.success('Application received!');
      setFormData({ ...formData, name: '', email: '', phone: '', message: '' });
      // We also show a custom message below with alert or similar if we wanted, 
      // but a prolonged toast works too.
      toast('Application received!', {
          description: "Check your email within 24 hours for next steps including your payment link and class materials. If you don't hear from us, email japankingdom1@gmail.com",
          duration: 10000,
      });
    }
    setSubmitting(false);
  }

  const scrollByElementId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pt-16 bg-[var(--background)]">
      
      {/* STEP 1: Hero section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/language-school/hero.jpg" 
            alt="Japanese Language Class" 
            className="w-full h-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/40 to-[var(--background)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto space-y-6 pt-20">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--jkc-gold)]/50 bg-[var(--jkc-gold)]/10 backdrop-blur-md mb-4">
            <span className="text-[10px] font-black tracking-[0.2em] text-[var(--jkc-gold)] uppercase">Semester 1 2026 — Now Enrolling</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
            Kingdom Japanese
            <br className="hidden md:block" /> Language School
          </h1>
          
          <p className="text-xl md:text-2xl font-serif italic text-white/90 drop-shadow-md">
            Learn Japanese. Build Community. Bridge Cultures.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={() => scrollByElementId('apply')}
              className="w-full sm:w-auto px-8 py-4 bg-[var(--jkc-gold)] text-[var(--jkc-navy)] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
              Apply Now
            </button>
            <button 
              onClick={() => scrollByElementId('schedule')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border-2 border-white/50 font-black uppercase tracking-widest rounded-full hover:bg-white/10 active:scale-95 transition-all"
            >
              View Schedule
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer opacity-50 hover:opacity-100" onClick={() => scrollByElementId('social-proof')}>
            <ChevronDown className="w-8 h-8 text-white" />
        </div>
      </section>

      {/* STEP 2: Social proof / environment strip */}
      <section id="social-proof" className="py-12 bg-slate-900 border-y border-white/10">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xl md:text-2xl font-black italic text-white/90">
              "50+ students. 2 tracks. 1 community."
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-slate-800 shadow-2xl hover:scale-[1.02] transition-transform duration-500">
               <img src="/images/language-school/hero.jpg" alt="Classroom environment" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-slate-800 shadow-2xl hover:scale-[1.02] transition-transform duration-500">
               <img src="/images/language-school/class1.jpg" alt="Students learning" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-slate-800 hidden lg:block shadow-2xl hover:scale-[1.02] transition-transform duration-500">
               <img src="/images/pastor/pastor-event.jpg" alt="Community gathering" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3: Curriculums / Tracks */}
      <section className="py-24 px-6 max-w-screen-xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic font-serif text-[var(--foreground)]">Choose your track</h2>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Beginner Track */}
            <div className="card-surface p-10 md:p-12 rounded-[3rem] border border-[var(--foreground)]/10 shadow-2xl relative overflow-hidden group hover:border-[var(--jkc-gold)]/50 transition-colors">
                <div className="absolute top-0 right-0 p-8">
                    <span className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-[var(--jkc-navy)] text-white rounded-full">LEVEL 1</span>
                </div>
                <div className="space-y-6">
                    <h3 className="text-3xl font-black text-[var(--foreground)]">Beginners</h3>
                    <p className="text-[var(--muted-foreground)] font-medium">For absolute beginners.</p>
                    
                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-[var(--border)]">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase mb-1">SCHEDULE</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">Sundays 15:00–17:00</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase mb-1">FEE</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">¥12,000</p>
                            <p className="text-xs text-[var(--muted-foreground)]">(¥1k/class + ¥2k book)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">What you will learn:</p>
                        <ul className="space-y-3">
                            {['Hiragana, Katakana', 'Basic greetings', 'Numbers', 'Survival Japanese for daily life in Japan'].map(item => (
                                <li key={item} className="flex gap-3 text-sm text-[var(--muted-foreground)] border-l-2 border-[var(--jkc-gold)] pl-3">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-4">
                        <button onClick={() => { setFormData({...formData, track: 'Beginners (Sundays)'}); scrollByElementId('apply'); }}
                          className="w-full bg-[var(--foreground)]/5 hover:bg-[var(--jkc-navy)] hover:text-white border border-[var(--foreground)]/10 text-[var(--foreground)] font-black uppercase tracking-widest px-6 py-4 rounded-xl transition-all">
                            Apply for Beginners
                        </button>
                    </div>
                </div>
            </div>

            {/* JLPT N5 Track */}
            <div className="card-surface p-10 md:p-12 rounded-[3rem] border border-[var(--foreground)]/10 shadow-2xl relative overflow-hidden group hover:border-[var(--jkc-gold)]/50 transition-colors">
                <div className="absolute top-0 right-0 p-8">
                    <span className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-gradient-to-r from-[var(--jkc-navy)] to-slate-700 text-white rounded-full">LEVEL 2</span>
                </div>
                <div className="space-y-6">
                    <h3 className="text-3xl font-black text-[var(--foreground)]">JLPT N5 <span className="text-lg font-medium italic opacity-60">(Advance Beginners)</span></h3>
                    <p className="text-[var(--muted-foreground)] font-medium">For those with basic knowledge, targeting N5.</p>
                    
                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-[var(--border)]">
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase mb-1">SCHEDULE</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">Fridays 19:00–21:00</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase mb-1">FEE</p>
                            <p className="text-sm font-bold text-[var(--foreground)]">¥17,000</p>
                            <p className="text-xs text-[var(--muted-foreground)]">(¥1.5k/class + ¥2k book)</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">What you will learn:</p>
                        <ul className="space-y-3">
                            {['Verb conjugation', 'Particles', 'JLPT N5 vocabulary', 'Reading practice'].map(item => (
                                <li key={item} className="flex gap-3 text-sm text-[var(--muted-foreground)] border-l-2 border-[var(--jkc-gold)] pl-3">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="pt-4">
                        <button onClick={() => { setFormData({...formData, track: 'JLPT N5 (Fridays)'}); scrollByElementId('apply'); }}
                          className="w-full bg-[var(--foreground)]/5 hover:bg-[var(--jkc-navy)] hover:text-white border border-[var(--foreground)]/10 text-[var(--foreground)] font-black uppercase tracking-widest px-6 py-4 rounded-xl transition-all">
                            Apply for JLPT N5
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* STEP 4: Full schedule calendar section */}
      <section id="schedule" className="py-24 px-6 bg-[var(--foreground)]/5 border-y border-[var(--border)]">
         <div className="max-w-screen-xl mx-auto space-y-12">
            <div className="text-center space-y-4">
               <p className="text-[10px] font-black tracking-[0.4em] text-[var(--jkc-gold)] uppercase">DATES & TIMES</p>
               <h2 className="text-3xl md:text-5xl font-black italic font-serif text-[var(--foreground)]">2026 Class Schedule</h2>
               <p className="text-sm font-medium text-[var(--muted-foreground)]">Classes resume after public holidays. Check announcements for updates.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               {/* Beginners Column */}
               <div className="card-surface rounded-3xl p-8 border border-[var(--border)] shadow-xl">
                  <h3 className="text-xl font-black uppercase text-[var(--foreground)] mb-6 flex justify-between items-center">
                     Beginners Track
                     <span className="text-xs font-bold bg-[var(--foreground)]/10 px-3 py-1 rounded-full">Sundays</span>
                  </h3>
                  <div className="space-y-3">
                     {['4/5 (Sun)', '4/12 (Sun)', '4/26 (Sun)', '5/10 (Sun)', '5/17 (Sun)', '5/31 (Sun)', '6/7 (Sun)', '6/21 (Sun)', '6/28 (Sun)', '7/12 (Sun)'].map((date, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-[var(--jkc-navy)] text-white font-black text-xs flex items-center justify-center">
                                  {i+1}
                               </div>
                               <span className="font-bold text-sm text-[var(--foreground)]">{date}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--muted-foreground)]">15:00 - 17:00</span>
                        </div>
                     ))}
                  </div>
                  <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center gap-2 w-full py-4 border border-[var(--border)] rounded-xl font-bold text-xs uppercase text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all">
                      <Calendar className="w-4 h-4" /> Add to Google Calendar
                  </a>
               </div>

               {/* N5 Column */}
               <div className="card-surface rounded-3xl p-8 border border-[var(--border)] shadow-xl">
                  <h3 className="text-xl font-black uppercase text-[var(--foreground)] mb-6 flex justify-between items-center">
                     JLPT N5 Track
                     <span className="text-xs font-bold bg-[var(--foreground)]/10 px-3 py-1 rounded-full">Fridays</span>
                  </h3>
                  <div className="space-y-3">
                     {['4/3 (Fri)', '4/10 (Fri)', '4/24 (Fri)', '5/1 (Fri)', '5/15 (Fri)', '5/22 (Fri)', '6/5 (Fri)', '6/12 (Fri)', '6/26 (Fri)', '7/3 (Fri)'].map((date, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--jkc-navy)] to-slate-600 text-white font-black text-xs flex items-center justify-center">
                                  {i+1}
                               </div>
                               <span className="font-bold text-sm text-[var(--foreground)]">{date}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--muted-foreground)]">19:00 - 21:00</span>
                        </div>
                     ))}
                  </div>
                  <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-center gap-2 w-full py-4 border border-[var(--border)] rounded-xl font-bold text-xs uppercase text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-all">
                      <Calendar className="w-4 h-4" /> Add to Google Calendar
                  </a>
               </div>
            </div>
         </div>
      </section>

      {/* STEP 5: What happens after you apply */}
      <section className="py-24 px-6 max-w-screen-xl mx-auto space-y-20">
         <div className="text-center space-y-4">
             <h2 className="text-3xl md:text-5xl font-black italic font-serif text-[var(--foreground)]">Your journey from interest to fluency</h2>
         </div>

         <div className="relative">
             {/* Line connector for md+ */}
             <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-[var(--border)]" />
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                    { step: 1, title: 'Submit Application', desc: 'Fill in the form below. Takes 2 minutes.' },
                    { step: 2, title: 'Receive Confirmation', desc: 'You will get an email within 24 hours with your enrollment details and payment instructions.' },
                    { step: 3, title: 'Complete Payment', desc: 'Pay your course fee via the link in your confirmation email.' },
                    { step: 4, title: 'Join First Class', desc: 'Show up on your start date. Your teacher and classmates are waiting.' },
                ].map(s => (
                    <div key={s.step} className="relative z-10 text-center flex flex-col items-center group">
                        <div className="w-14 h-14 rounded-full bg-[var(--background)] border-4 border-[var(--background)] shadow-[0_0_0_2px_var(--border)] flex items-center justify-center font-black text-xl text-[var(--foreground)] mb-6 group-hover:bg-[var(--jkc-gold)] group-hover:text-white group-hover:border-transparent transition-all">
                            {s.step}
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-[var(--foreground)] mb-2 text-sm">{s.title}</h4>
                        <p className="text-xs font-medium text-[var(--muted-foreground)] px-4">{s.desc}</p>
                    </div>
                ))}
             </div>
         </div>

         <div className="max-w-3xl mx-auto rounded-3xl p-10 border border-[var(--border)] bg-[var(--foreground)]/[0.02] shadow-sm">
             <h3 className="text-xl font-black uppercase text-[var(--foreground)] mb-8 border-b border-[var(--border)] pb-4">Frequently Asked Questions</h3>
             <div className="space-y-6">
                 {[
                    { q: 'Do I need to speak any Japanese to join?', a: 'No. The Beginners track starts from zero.' },
                    { q: 'What if I miss a class?', a: 'Materials are uploaded to the student portal after each session.' },
                    { q: 'Can I switch tracks?', a: 'Yes, contact us within the first two sessions.' },
                    { q: 'Is there a refund policy?', a: 'Fees are non-refundable after the second class. Contact us if you have special circumstances.' },
                    { q: 'Where is the class held?', a: 'TE Akishima Building 3F, 2-1-6 Showa-cho, Akishima City, Tokyo 196-0015. 2-minute walk from JR Akishima Station.' },
                 ].map((faq, i) => (
                     <div key={i}>
                         <p className="font-bold text-sm text-[var(--foreground)] mb-1">Q: {faq.q}</p>
                         <p className="text-sm font-medium text-[var(--muted-foreground)]">A: {faq.a}</p>
                     </div>
                 ))}
             </div>
         </div>
      </section>

      {/* STEP 6: Accessibility and directions section */}
      <section className="py-24 bg-[var(--foreground)]/[0.02] border-y border-[var(--border)] overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <p className="text-[10px] font-black tracking-[0.4em] text-[var(--jkc-gold)] uppercase">LOCATION</p>
                <h2 className="text-3xl md:text-5xl font-black italic font-serif text-[var(--foreground)]">Getting here</h2>
                
                <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                        <MapPin className="w-6 h-6 text-[var(--jkc-navy)] shrink-0 mt-1" />
                        <div>
                            <p className="font-black text-[var(--foreground)] uppercase tracking-widest mb-1">ADDRESS</p>
                            <p className="text-[var(--muted-foreground)] font-medium leading-relaxed">TE Akishima Building 3F,<br/>2-1-6 Showa-cho, Akishima City,<br/>Tokyo 196-0015</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <User className="w-6 h-6 text-[var(--jkc-navy)] shrink-0 mt-1" />
                        <div>
                            <p className="font-black text-[var(--foreground)] uppercase tracking-widest mb-1">BY TRAIN</p>
                            <p className="text-[var(--muted-foreground)] font-medium leading-relaxed">Take the JR Ōme Line to Akishima Station (南口 / South Exit). The building is a 2-minute walk straight ahead.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-sm">
                    <p className="font-bold text-sm text-[var(--foreground)] mb-1 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--jkc-gold)]" /> Online Option Available
                    </p>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Can't make it in person? Online participation is available. You will receive a Zoom link after enrollment.</p>
                </div>

                <a href="https://www.google.com/maps/dir/?api=1&destination=TE+Akishima+Building+Akishima+Tokyo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-[var(--jkc-navy)] text-white font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all">
                    GET DIRECTIONS
                </a>
            </div>
            
            <div className="aspect-square rounded-[3rem] overflow-hidden border border-[var(--border)] shadow-xl relative bg-slate-100 dark:bg-slate-800">
                {/* Embed Map or Static Image */}
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3240.239616858586!2d139.356770275752!3d35.70776597257858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018e10014a5b6f3%3A0x6fbba2ad28a1eaad!2zVCZFIOWtneWztiDjg5Pjg6s!5e0!3m2!1sen!2sjp!4v1711200000000!5m2!1sen!2sjp" 
                    className="absolute inset-0 w-full h-full border-0" 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </div>
      </section>

      {/* STEP 8: Downloadable resources section */}
      <section className="py-24 px-6 max-w-screen-xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row items-baseline justify-between gap-6 border-b border-[var(--border)] pb-6">
              <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--foreground)]">Download & prepare</h2>
              <p className="text-sm font-medium italic text-[var(--muted-foreground)]">Get a head start on your studies.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
              {[
                  { title: 'Course Overview PDF', desc: 'Download the full Semester 1 2026 curriculum.', tag: 'COMING SOON' },
                  { title: 'Class Schedule PDF', desc: 'A printable version of all track dates.', tag: 'COMING SOON' },
                  { title: 'Beginner Vocab List', desc: 'A free starter list of 100 Japanese words to get you ready.', tag: 'COMING SOON' }
              ].map((res, i) => (
                  <div key={i} className="card-surface p-8 rounded-3xl border border-[var(--border)] flex flex-col justify-between opacity-80 group hover:opacity-100 transition-opacity">
                      <div>
                          <FileText className="w-8 h-8 text-[var(--muted-foreground)] mb-6 group-hover:text-[var(--jkc-gold)] transition-colors" />
                          <h3 className="font-black text-lg text-[var(--foreground)] mb-2">{res.title}</h3>
                          <p className="text-xs font-medium text-[var(--muted-foreground)] mb-6">{res.desc}</p>
                      </div>
                      <div>
                          <span className="inline-block px-3 py-1 bg-[var(--background)] border border-[var(--border)] text-[8px] font-black uppercase tracking-widest rounded text-[var(--muted-foreground)] mb-3">
                              {res.tag}
                          </span>
                          <button disabled className="w-full py-3 rounded-lg border border-[var(--border)] bg-[var(--foreground)]/5 text-[var(--muted-foreground)] text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                              DOWNLOAD
                          </button>
                      </div>
                  </div>
              ))}
          </div>
          <p className="text-center text-xs font-bold text-[var(--muted-foreground)] pt-4">Materials will be available by April 1, 2026.</p>
      </section>

      {/* STEP 9: Why join this community */}
      <section className="py-24 bg-slate-900 border-y border-white/10">
          <div className="max-w-screen-xl mx-auto px-6 space-y-16">
              <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-5xl font-black italic font-serif text-white">More than a language class</h2>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { icon: <BookOpen className="w-6 h-6"/>, title: 'Faith + Language', desc: "Learn Japanese in a Christ-centred environment. Language learning is faster when you're part of a community that cares about you." },
                      { icon: <Languages className="w-6 h-6"/>, title: 'Real-world practice', desc: "Every session includes conversation practice. You will leave each class able to use what you learned the same day." },
                      { icon: <Users className="w-6 h-6"/>, title: 'Community for life', desc: "JKC is a multilingual, multicultural church in Tokyo. Your classmates become your community, your prayer partners, and your friends." }
                  ].map((benefit, i) => (
                      <div key={i} className="p-8 rounded-3xl bg-slate-800 border border-white/5 space-y-4 shadow-xl hover:bg-slate-700 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-[var(--jkc-gold)]">
                              {benefit.icon}
                          </div>
                          <h3 className="text-xl font-black text-white">{benefit.title}</h3>
                          <p className="text-sm font-medium text-slate-300 leading-relaxed">{benefit.desc}</p>
                      </div>
                  ))}
              </div>

              {/* Testimonials */}
              <div className="pt-8 grid md:grid-cols-2 gap-8">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative">
                     <div className="text-4xl text-[var(--jkc-gold)] absolute top-6 left-6 opacity-20 font-serif">"</div>
                     <p className="font-medium text-slate-200 text-sm leading-relaxed relative z-10 italic">
                         "Before joining the beginners track, I was terrified of speaking Japanese. Now, I can order food and ask for directions with confidence. The community here is so encouraging!"
                     </p>
                     <p className="font-black text-white text-xs uppercase tracking-widest mt-6 flex items-center gap-2">
                         <span className="w-6 h-0.5 bg-[var(--jkc-gold)] inline-block"></span> SARAH, 2025 ALUMNI
                     </p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 relative">
                     <div className="text-4xl text-[var(--jkc-gold)] absolute top-6 left-6 opacity-20 font-serif">"</div>
                     <p className="font-medium text-slate-200 text-sm leading-relaxed relative z-10 italic">
                         "The N5 course was exactly what I needed to pass my JLPT. The teachers explain grammar perfectly, and I found a small group that I still pray with every week."
                     </p>
                     <p className="font-black text-white text-xs uppercase tracking-widest mt-6 flex items-center gap-2">
                         <span className="w-6 h-0.5 bg-[var(--jkc-gold)] inline-block"></span> DAVID, 2025 ALUMNI
                     </p>
                  </div>
              </div>
          </div>
      </section>

      {/* STEP 7: Application Form */}
      <section id="apply" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="card-surface rounded-[3rem] p-10 md:p-16 border border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full" style={{ background: 'var(--primary)', opacity: 0.1 }} />
            
            <div className="relative z-10 space-y-12">
                <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black tracking-[0.4em] text-[var(--jkc-gold)] uppercase">ADMISSIONS OPEN</p>
                    <h2 className="text-3xl md:text-5xl font-black text-[var(--foreground)]">Apply for Semester 1</h2>
                    <p className="text-sm font-medium text-[var(--muted-foreground)] max-w-lg mx-auto">
                        Takes 2 minutes. We'll send you payment details and class materials via email.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Full Name *</label>
                            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] focus:border-[var(--jkc-navy)] transition-colors"
                                placeholder="Your full name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Email Address *</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] focus:border-[var(--jkc-navy)] transition-colors"
                                placeholder="you@example.com" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Phone Number (WhatsApp preferred)</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] focus:border-[var(--jkc-navy)] transition-colors"
                            placeholder="+81 90 1234 5678" />
                    </div>

                    <div className="h-px bg-[var(--border)] w-full" />

                    {/* Track Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--foreground)' }}>SELECTION: Which track do you want to join? *</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {['Beginners (Sundays)', 'JLPT N5 (Fridays)'].map(track => (
                                <label key={track} className={`cursor-pointer border rounded-2xl p-5 flex items-center justify-between transition-all ${formData.track === track ? 'border-[var(--jkc-navy)] bg-[var(--jkc-navy)]/5 shadow-md' : 'border-[var(--border)] bg-[var(--background)]'}`}>
                                    <span className="font-bold text-sm text-[var(--foreground)]">{track}</span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.track === track ? 'border-[var(--jkc-navy)]' : 'border-[var(--muted-foreground)]/30'}`}>
                                        {formData.track === track && <div className="w-2.5 h-2.5 bg-[var(--jkc-navy)] rounded-full" />}
                                    </div>
                                    <input type="radio" className="hidden" name="track" value={track} checked={formData.track === track} onChange={() => setFormData({...formData, track})} />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Dropdowns */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Current Japanese Level *</label>
                            <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}
                                className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] appearance-none">
                                <option>Complete beginner</option>
                                <option>Know hiragana & katakana</option>
                                <option>Studied before, need a refresh</option>
                                <option>Currently studying JLPT N5</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Online Access (Zoom)? *</label>
                            <select value={formData.onlineAccess} onChange={e => setFormData({...formData, onlineAccess: e.target.value})}
                                className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] appearance-none">
                                <option>No, I will attend in-person</option>
                                <option>Yes, I need online access</option>
                                <option>Maybe sometimes</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>How did you hear about us? *</label>
                        <select value={formData.heardAbout} onChange={e => setFormData({...formData, heardAbout: e.target.value})}
                            className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] appearance-none">
                            <option>Friend</option>
                            <option>Church member</option>
                            <option>Social media</option>
                            <option>QR code</option>
                            <option>Google</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Any questions or special requirements?</label>
                        <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                            rows={3} className="w-full rounded-2xl px-6 py-4 outline-none border bg-[var(--background)] text-[var(--foreground)] border-[var(--border)] resize-none" />
                    </div>

                    <button disabled={submitting} className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-[var(--jkc-navy)]/20" style={{ background: 'var(--jkc-navy)' }}>
                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit Application'}
                    </button>
                    
                    <p className="text-center text-[10px] font-medium text-[var(--muted-foreground)] max-w-xs mx-auto">
                        By submitting, you agree to our privacy policy. Your information is secure.
                    </p>
                </form>
            </div>
        </div>
      </section>

      {/* STEP 10: Footer CTA */}
      <section className="bg-[var(--jkc-navy)] text-center py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--jkc-gold)]/5 to-transparent animate-pulse" />
          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                  Ready to start your<br/>Japanese journey?
              </h2>
              <p className="text-[var(--jkc-gold)] font-medium text-lg">
                  Applications for Semester 1 2026 are open now. Limited seats.
              </p>
              <div className="pt-4">
                  <button onClick={() => scrollByElementId('apply')} className="px-10 py-5 bg-[var(--jkc-gold)] text-[var(--jkc-navy)] font-black uppercase tracking-widest rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(245,166,35,0.3)]">
                      Apply Now
                  </button>
              </div>
          </div>
      </section>

    </div>
  );
}
