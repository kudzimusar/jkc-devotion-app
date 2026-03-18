
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Ministry = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  leader_name?: string;
};

const fallbacks: Ministry[] = [
  { name: "Children's Ministry", slug: "kids-ministry",
    description: "Nurturing the next generation in faith." },
  { name: "Youth Ministry", slug: "youth-ministry",
    description: "Empowering young people to live for Christ." },
  { name: "Worship Ministry", slug: "worship-ministry",
    description: "Leading the congregation into God's presence." },
  { name: "Women's Ministry", slug: "womens-ministry",
    description: "Equipping women to walk in purpose and grace." },
  { name: "Men's Ministry", slug: "mens-ministry",
    description: "Building men of faith, character, and vision." },
  { name: "Language School", slug: "language-school",
    description: "Kingdom Language School — bridging cultures." },
  { name: "Pastoral Care", slug: "pastoral",
    description: "Spiritual support, counseling, and guidance for our church family." }
];

export default function MinistryClient({ slug }: { slug: string }) {
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    async function fetchMinistry() {
      const { data } = await supabase
        .from('ministries')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (data) {
        setMinistry(data);
      } else {
        const fallback = fallbacks.find(f => f.slug === slug);
        setMinistry(fallback || null);
      }
      setLoading(false);
    }
    fetchMinistry();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('public_inquiries')
      .insert([{
        first_name: formData.name,
        last_name: '',
        email: formData.email,
        message: `Ministry Interest: ${ministry?.name} — ${formData.message}`
      }]);

    if (error) {
      toast.error('Failed to send inquiry');
    } else {
      toast.success('Interest sent! We will contact you soon.');
      setFormData({ name: '', email: '', message: '' });
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  if (!ministry) return (
     <div className="min-h-screen flex flex-col items-center justify-center pt-20 space-y-6">
        <h1 className="text-4xl font-black">Ministry Not Found</h1>
        <Link href="/welcome" className="text-[var(--primary)] font-black uppercase tracking-widest">Back to Home</Link>
     </div>
  );

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--background)' }}>
      {/* Hero Strip */}
      <section className="relative py-48 px-6 flex items-center justify-center overflow-hidden border-b border-white/5 bg-slate-900">
        {/* Background Image Overlay */}
        {(ministry as any).image_url && (
          <>
            <img 
              src={(ministry as any).image_url} 
              alt={ministry.name} 
              className="absolute inset-0 w-full h-full object-cover opacity-30" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950" />
          </>
        )}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[var(--jkc-gold)] blur-[120px] rounded-full opacity-5" />
        </div>
        <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto">
          <Link href="/welcome" className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase hover:text-[var(--jkc-gold)] transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" /> BACK TO ALL MINISTRIES
          </Link>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white">
             {ministry.name}
          </h1>
          <div className="w-24 h-1 bg-[var(--jkc-gold)] mx-auto" />
          <p className="text-slate-300 text-xl font-medium pt-4 leading-relaxed italic drop-shadow-sm">
             {ministry.description}
          </p>
        </div>
      </section>

      <div className="max-w-screen-xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          {/* Details Content */}
          <div className="space-y-12">
            <div className="space-y-6">
               <h2 className="text-3xl font-black italic" style={{ color: 'var(--foreground)' }}>About this ministry</h2>
               <div className="w-12 h-1 bg-[var(--jkc-navy)]" />
               <p className="text-lg leading-relaxed font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Our {ministry.name} is a vital part of our community here at Japan Kingdom Church. 
                  We believe in building a strong foundation of faith and providing a space where 
                  everyone can grow together, worship, and serve Japan according to their unique divine gifts.
               </p>
               {ministry.description?.includes('Led by') || (ministry as any).leader_name ? (
                 <div className="pt-8 p-8 rounded-3xl border border-dashed border-[var(--border)]" style={{ background: 'var(--section-alt)' }}>
                    <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase mb-2">MINISTRY VISION</p>
                    <p className="text-xl font-bold italic" style={{ color: 'var(--foreground)' }}>
                      "To represent Christ to Japanese society through excellence and love."
                    </p>
                 </div>
               ) : null}
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="rounded-3xl p-8 space-y-2 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase">FREQUENCY</p>
                  <p className="text-lg font-black italic" style={{ color: 'var(--foreground)' }}>
                    {ministry.description?.includes('Every') ? 'Regular Gatherings' : 'Weekly'}
                  </p>
               </div>
               <div className="rounded-3xl p-8 space-y-2 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                  <p className="text-[10px] font-black tracking-widest text-[var(--jkc-gold)] uppercase">OPPORTUNITY</p>
                  <p className="text-lg font-black italic" style={{ color: 'var(--foreground)' }}>Service & Outreach</p>
               </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="rounded-[3rem] p-12 border shadow-2xl relative overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full" style={{ background: 'rgba(245,166,35,0.08)' }} />
            <div className="relative space-y-8">
              <div className="space-y-2 text-center">
                 <h2 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>Join this Ministry</h2>
                 <p className="text-sm italic font-medium" style={{ color: 'var(--muted-foreground)' }}>Interested in serving? Let us know.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full rounded-2xl px-8 py-5 transition-all outline-none border"
                    style={{ background: 'var(--section-alt)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full rounded-2xl px-8 py-5 transition-all outline-none border"
                    style={{ background: 'var(--section-alt)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase ml-1" style={{ color: 'var(--muted-foreground)' }}>Message</label>
                  <textarea 
                    required
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    rows={4}
                    className="w-full rounded-2xl px-8 py-5 transition-all outline-none resize-none border"
                    style={{ background: 'var(--section-alt)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    placeholder="Tell us a bit about why you'd like to join..."
                  />
                </div>

                <button 
                  disabled={submitting}
                  className="w-full text-white font-black py-6 rounded-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{ background: 'var(--jkc-navy)', boxShadow: '0 8px 24px rgba(27,58,107,0.3)' }}
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5" /> SEND INTEREST</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
