
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, CreditCard, DollarSign, Smartphone, 
  Send, School, LayoutGrid, Users, Zap, 
  Copy, CheckCircle2, ArrowRightLeft, Landmark,
  Globe, TrendingUp, HandHeart, Coins
} from 'lucide-react';
import { toast } from 'sonner';

const IMPACT_CARDS = [
  { icon: Heart, title: 'Worship', desc: 'Supporting the spiritual atmosphere and worship team.' },
  { icon: Users, title: 'Community', desc: 'Funding fellowship groups and member care.' },
  { icon: Zap, title: 'Outreach', desc: 'Direct support for street evangelism in Tokyo.' },
  { icon: Landmark, title: 'Missions', desc: 'Planting seeds for new church branches in Japan.' },
  { icon: Globe, title: 'Global', desc: 'Supporting international mission partners.' },
  { icon: HandHeart, title: 'Benevolence', desc: 'Providing emergency help for those in need.' },
  { icon: CreditCard, title: 'Tech', desc: 'Maintaining the Church OS and digital sanctuary.' },
  { icon: Coins, title: 'Growth', desc: 'Investing in the future of Japan Kingdom Church.' }
];

export default function GiveClient() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.04_255)] text-white/90 selection:bg-[var(--primary)] selection:text-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--primary)]/10 blur-[160px] rounded-full" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[oklch(0.08_0.04_255)]" />
        </div>

        <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl mx-auto">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] font-black tracking-[0.5em] text-[var(--primary)] uppercase"
          >
            Worship Through Giving
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black italic font-serif leading-none"
          >
            Make a <span className="text-white">Difference</span> <br />
            <span className="font-sans normal-case text-4xl md:text-6xl tracking-tight opacity-80 italic">in Japan Together</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
          >
            "Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this," says the LORD Almighty. — Malachi 3:10
          </motion.p>
        </div>
      </section>
      
      {/* Fix 9: Pastor Marcel Video */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div
          className="relative w-full rounded-[2.5rem] overflow-hidden
                      border border-white/10 shadow-2xl"
          style={{ paddingTop: '56.25%' }}
        >
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="https://video.wixstatic.com/video/91bb3f_5e20958a3d664fc89eff9dcef222dd9a/1080p/mp4/file.mp4"
            controls
            playsInline
          />
        </div>
        <p className="text-center text-white/30 text-xs font-black
                     tracking-widest uppercase mt-4">
          A message from Pastor Marcel
        </p>
      </section>

      {/* Fix 10: Legal Tax Status */}
      <section className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <p className="text-white/70 text-base leading-relaxed font-medium">
          Japan Kingdom Church operates both as a recognized 501(c)(3)
          nonprofit organization in the USA as{' '}
          <strong className="text-white">
            Kingdom Garden International Ministries
          </strong>{' '}
          and as a nonprofit organization in Japan as{' '}
          <strong className="text-white">
            Japan Kingdom Builders, Inc
          </strong>.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4 items-start">
            <span className="text-[var(--primary)] font-black mt-1 shrink-0">
              •
            </span>
            <p className="text-white/60 text-base leading-relaxed">
              <strong className="text-white/80">USA Donations:</strong> All
              donations made to our 501(c)(3) organization in the USA are
              tax-deductible to the full extent allowed by law.
            </p>
          </li>
          <li className="flex gap-4 items-start">
            <span className="text-[var(--primary)] font-black mt-1 shrink-0">
              •
            </span>
            <p className="text-white/60 text-base leading-relaxed">
              <strong className="text-white/80">
                International Donations:
              </strong>{' '}
              Donations made directly to our nonprofit organization in Japan,
              while appreciated, are not tax-deductible under U.S. tax law,
              even if the payment is made in USD and converted to JPY.
            </p>
          </li>
        </ul>
        <p className="text-white/60 text-base leading-relaxed font-medium">
          Your generous contributions support our mission and various
          programs, helping us make a positive impact in our community
          both in the USA and Japan.
        </p>
        <p className="text-white/80 text-base font-black">
          Thank you for your support!
        </p>
      </section>


      <div className="max-w-screen-xl mx-auto px-6 pb-32 space-y-40">
        
        {/* Method 1: Tithe.ly */}
        <section className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
               <h2 className="text-4xl font-black flex items-center gap-4">
                 <span className="text-[var(--primary)]">01.</span> Tithe.ly Online
               </h2>
               <p className="text-white/50 text-lg leading-relaxed font-medium">
                 The fastest way to give from anywhere in the world. Supports recurring giving and all major credit cards.
               </p>
            </div>
            
            {/* USD -> JPY Chart */}
            <div className="glass rounded-3xl p-8 border border-white/10 bg-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-white/20 uppercase">Conversion Guide</span>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-black uppercase">USD / JPY</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { usd: '$25.00', jpy: '¥2,500' },
                    { usd: '$50.00', jpy: '¥5,000' },
                    { usd: '$100.00', jpy: '¥10,000' },
                    { usd: '$1,000.00', jpy: '¥100,000' }
                  ].map((pair, idx) => (
                    <div key={idx} className="bg-black/20 p-4 rounded-2xl border border-white/5 text-center">
                      <p className="text-xs font-black text-white/30 uppercase mb-1">{pair.usd}</p>
                      <p className="text-lg font-black text-white">{pair.jpy}</p>
                    </div>
                  ))}
               </div>
               <div className="pt-4 border-t border-white/5">
                  <p className="text-[11px] text-white/40 leading-relaxed italic">
                    All international gifts are automatically converted to Yen to fund the work in Tokyo.
                  </p>
               </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-[var(--primary)] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative glass rounded-[3rem] p-12 border border-white/10 bg-black/20 text-center space-y-8 shadow-2xl overflow-hidden">
               <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto text-[var(--primary)]">
                  <DollarSign className="w-10 h-10" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black">GIVE ONLINE NOW</h3>
                 <p className="text-white/40 text-sm font-medium">Official giving portal for Japan Kingdom Church</p>
               </div>
               <a 
                 href="https://tithe.ly/give_new/www/#/tithely/give-one-time/4010992" 
                 target="_blank" 
                 className="block w-full bg-[var(--primary)] text-white font-black py-6 rounded-2xl text-sm tracking-[0.3em] shadow-xl shadow-[var(--primary)]/20 hover:scale-105 active:scale-95 transition-all"
               >
                 GIVE VIA TITHE.LY →
               </a>
            </div>
          </div>
        </section>

        {/* Method 2, 3, 4: USA Digital */}
        <section className="space-y-16">
          <div className="text-center space-y-4">
             <h2 className="text-4xl font-black italic font-serif">US Options</h2>
             <p className="text-white/40 text-sm font-black tracking-widest uppercase">For our partners in the United States</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Cash App */}
            <div className="glass rounded-[2rem] p-10 border border-white/5 bg-white/5 space-y-6 hover:border-emerald-500/30 transition-all group">
              <Smartphone className="w-8 h-8 text-emerald-400" />
              <div className="space-y-1">
                <h3 className="text-xl font-black">Cash App</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Fast Mobile Giving</p>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-lg font-black text-white">$JapanKingdomChurch</span>
                <button 
                  onClick={() => copyToClipboard('$JapanKingdomChurch', 'cashapp')}
                  className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  {copiedField === 'cashapp' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-white/20" />}
                </button>
              </div>
              <a 
                href="https://cash.app/$JapanKingdomChurch"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center bg-emerald-500/10 border
                           border-emerald-500/20 text-emerald-400 font-black
                           text-[10px] tracking-widest uppercase py-3 rounded-xl
                           hover:bg-emerald-500/20 transition-all"
              >
                GIVE VIA CASH APP →
              </a>
            </div>

            {/* Zelle */}
            <div className="glass rounded-[2rem] p-10 border border-white/5 bg-white/5 space-y-6 hover:border-violet-500/30 transition-all group">
              <Zap className="w-8 h-8 text-violet-400" />
              <div className="space-y-1">
                <h3 className="text-xl font-black">Zelle</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Direct Bank Transfer</p>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-sm font-black text-white">finance.jkchurch@gmail.com</span>
                  <p className="text-[10px] text-white/30 font-bold">
                    Kingdom Garden International Ministries
                  </p>
                </div>
                <button 
                   onClick={() => copyToClipboard('finance.jkchurch@gmail.com', 'zelle')}
                   className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  {copiedField === 'zelle' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-white/20" />}
                </button>
              </div>
              <a 
                href="https://www.zellepay.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center bg-violet-500/10 border
                           border-violet-500/20 text-violet-400 font-black
                           text-[10px] tracking-widest uppercase py-3 rounded-xl
                           hover:bg-violet-500/20 transition-all"
              >
                GIVE VIA ZELLE →
              </a>
            </div>

            {/* Wells Fargo */}
            <div className="glass rounded-[2rem] p-10 border border-white/5 bg-white/5 space-y-6 hover:border-amber-500/30 transition-all group">
              <Landmark className="w-8 h-8 text-amber-400" />
              <div className="space-y-1">
                <h3 className="text-xl font-black">Wells Fargo</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Wire Transfer / Deposit</p>
                <p className="text-[11px] text-white/30 font-bold leading-relaxed">
                  Kingdom Garden International Ministries
                </p>
              </div>
              <div className="space-y-3 pt-4">
                 <div className="flex justify-between items-center text-[10px] font-black tracking-widest">
                    <span className="text-white/20 uppercase">RTN (Wire)</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60">125200057</span>
                      <button onClick={() => copyToClipboard('125200057', 'wf_rtn')} className="hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                    </div>
                 </div>
                  <div className="flex justify-between items-center text-[10px] font-black tracking-widest">
                    <span className="text-white/20 uppercase">Account</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60">7520856647</span>
                      <button onClick={() => copyToClipboard('7520856647', 'wf_acc')} className="hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                    </div>
                 </div>
                 <p className="text-[10px] text-white/20 leading-relaxed mt-2">
                    3300 Arctic Blvd ste 201-1433, Anchorage, AK 99503-4579
                  </p>
              </div>
            </div>
          </div>
        </section>

        {/* Method 5 & 6: PayPal */}
        <section className="grid md:grid-cols-2 gap-8">
           {/* Church PayPal */}
           <div className="glass rounded-[2.5rem] p-12 border border-blue-500/10 bg-blue-500/[0.02] flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Globe className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">General Fund</h3>
                <p className="text-white/40 text-sm font-medium">Standard PayPal missions giving</p>
              </div>
              <a href="https://www.paypal.com/paypalme/japankingdombuilders" target="_blank" className="bg-blue-600 text-white font-black px-12 py-4 rounded-full text-[10px] tracking-[0.2em] hover:bg-blue-500 transition-all">GIVE VIA PAYPAL</a>
           </div>

           {/* Personal Love Offering */}
           <div className="glass rounded-[2.5rem] p-12 border border-pink-500/10 bg-pink-500/[0.02] flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Heart className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Pastor Love Offering</h3>
                <p className="text-white/40 text-sm font-medium">Personal appreciation for the Pastor & Family</p>
              </div>
              <a href="https://www.paypal.com/paypalme/pastormarcelsfamily" target="_blank" className="bg-pink-600 text-white font-black px-12 py-4 rounded-full text-[10px] tracking-[0.2em] hover:bg-pink-500 transition-all">SEND LOVE OFFERING</a>
           </div>
        </section>

        {/* Method 7: MUFG Japan */}
        <section className="relative overflow-hidden glass rounded-[4rem] border border-white/5 bg-white/[0.02]">
           <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
           <div className="p-12 md:p-20 relative z-10 grid lg:grid-cols-5 gap-16 items-center">
              <div className="lg:col-span-2 space-y-8">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black tracking-[0.4em] text-red-500 uppercase">Local Transfer</p>
                   <h2 className="text-4xl md:text-5xl font-black">Domestic <br />Giving (Japan)</h2>
                 </div>
                 <p className="text-white/50 text-lg font-medium leading-relaxed">
                   For members and partners within Japan, bank transfer (Furikomi) via MUFG is the preferred method for regular tithes.
                 </p>
              </div>

              <div className="lg:col-span-3 space-y-4">
                 {[
                   { label: 'Account Name', val: 'Japan Kingdom Builders' },
                   { label: 'Bank Name', val: 'MUFG Bank, Ltd.' },
                   { label: 'Bank Code', val: '316' },
                   { label: 'Branch', val: 'Fussa Branch' },
                   { label: 'Account Type', val: 'Ordinary ( Futsu )' },
                   { label: 'Account Number', val: '0286887' },
                   { label: 'SWIFT (8 digit)', val: 'BOTKJPJT' },
                   { label: 'SWIFT (11 digit)', val: 'BOTKJPJTXXX' },
                 ].map((item, i) => (
                   <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                      <span className="text-[10px] font-black tracking-widest text-white/20 uppercase mb-1 md:mb-0">{item.label}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-white">{item.val}</span>
                        <button onClick={() => copyToClipboard(item.val, `mufg_${i}`)} className="text-white/10 group-hover:text-white/40 transition-colors hover:text-[var(--primary)]!">
                          {copiedField === `mufg_${i}` ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Impact Grid */}
        <section className="space-y-20">
          <div className="text-center space-y-4">
             <h2 className="text-4xl md:text-6xl font-black italic font-serif">Your Impact</h2>
             <p className="text-white/40 text-sm font-black tracking-widest uppercase">Where your generosity goes</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {IMPACT_CARDS.map((card, i) => (
              <div key={i} className="glass rounded-3xl p-8 border border-white/5 bg-white/[0.02] space-y-4 hover:border-[var(--primary)]/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-all">
                   <card.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-lg font-black">{card.title}</h3>
                   <p className="text-xs text-white/40 leading-relaxed font-medium">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Partner */}
        <section className="relative">
           <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-indigo-600 rounded-[4rem] blur-[100px] opacity-10" />
           <div className="relative glass rounded-[4rem] border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-12 md:p-24 text-center space-y-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
              </div>
              <div className="space-y-4 relative z-10">
                <p className="text-[10px] font-black tracking-[0.5em] text-[var(--primary)] uppercase">Legacy Building</p>
                <h2 className="text-4xl md:text-7xl font-black">Become a <span className="font-serif italic font-medium">Monthly Partner</span></h2>
                <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed font-bold">
                  Stand with us consistently. Monthly partners enable long-term mission planning and sustainability for the JKC community.
                </p>
              </div>
              <a href="https://tithe.ly/give_new/www/#/tithely/give-one-time/4010992" target="_blank" className="relative z-10 inline-flex items-center gap-6 bg-white text-[oklch(0.08_0.04_255)] font-black px-12 py-6 rounded-full text-sm tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all group">
                JOIN THE MISSION <ArrowRightLeft className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </a>
           </div>
        </section>

      </div>
    </div>
  );
}
