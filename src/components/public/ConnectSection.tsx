'use client';

import { useState, useEffect } from 'react';
import { useStickyForm } from '@/hooks/useStickyForm';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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
import { motion, AnimatePresence } from 'framer-motion';
import { usePublicTheme } from './PublicThemeWrapper';
import { Sparkles, Phone, Mail, HelpCircle, Heart, Languages, Share2, QrCode } from 'lucide-react';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { sendConnectEmail } from '@/app/(public)/connect/actions';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

export default function ConnectSection() {
  const { isDark } = usePublicTheme();
  const [loading, setLoading] = useState(false);
  const [isViaQr, setIsViaQr] = useState(false);
  const [resolvedOrgId, setResolvedOrgId] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('via') === 'qr' || params.get('utm_source') === 'qr') {
      setIsViaQr(true);
    }
    
    resolvePublicOrgId().then(id => {
      if (id) {
        setResolvedOrgId(id);
        setFormData(prev => ({ ...prev, org_id: id }));
      }
    });
  }, []);

  const { values: formData, handleChange: handleFormChange, setValues: setFormData, clear: clearForm } = useStickyForm({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    visitor_intent: 'inquiry',
    how_heard: '',
    preferred_language: 'EN',
    prayer_request: '',
    urgency: 'General',
    topic: 'General',
    is_private: false,
    message: '',
    org_id: ''
  }, "public-connect-v3");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.email) {
      toast.error("Please fill in first name and email.");
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Parent Inquiry
      const submissionData = {
        org_id: resolvedOrgId,
        visitor_intent: formData.visitor_intent,
        how_heard: isViaQr ? 'QR Code' : formData.how_heard,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        message: formData.visitor_intent === 'prayer_request' ? formData.prayer_request : formData.message,
        status: 'new'
      };

      const { data: inquiry, error: inquiryError } = await supabase
        .from('public_inquiries')
        .insert([submissionData])
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      // 2. Insert into prayer_requests if intent is prayer
      if (formData.visitor_intent === 'prayer_request') {
        const { error: childError } = await supabase
          .from('prayer_requests')
          .insert({
            inquiry_id: inquiry.id,
            org_id: resolvedOrgId,
            prayer_request: formData.prayer_request,
            urgency: formData.urgency,
            topic: formData.topic,
            is_private: formData.is_private
          });
        
        if (childError) throw childError;

        // 3. Notification for urgent requests
        if (formData.urgency === 'Urgent') {
          await supabase.from('member_notifications').insert({
            org_id: resolvedOrgId,
            title: '🚨 Urgent Prayer Request',
            message: `${formData.first_name} ${formData.last_name || ''}: ${formData.prayer_request.substring(0, 80)}...`,
            link_to: '/shepherd',
            is_read: false
          });
        }
      }

      // 4. Trigger Brevo Pipeline (Background)
      sendConnectEmail(
        formData.visitor_intent,
        formData.email,
        `${formData.first_name} ${formData.last_name || ''}`.trim()
      ).catch(e => console.error("Brevo connect section failed:", e));

      toast.success("Submission received! A ministry leader will connect with you soon.");
      clearForm();
    } catch (error: any) {
      console.error(error);
      toast.error("Submission failed — please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--input)',
    borderColor: 'var(--border)',
    color: 'var(--foreground)',
  };

  return (
    <section id="connect" data-section="connect" className="py-24 md:py-32 px-6 scroll-mt-20 overflow-hidden relative"
             style={{ background: 'var(--section-alt)', borderTop: '1px solid var(--border)' }}>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-jkc-gold/20 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative z-10">

        {/* Section Header */}
        <div className="text-center space-y-4 mb-20">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-jkc-gold/30 bg-jkc-gold/5"
          >
            <Sparkles size={12} style={{ color: 'var(--jkc-gold)' }} />
            <span className="text-[9px] font-black tracking-[0.3em] uppercase"
               style={{ color: 'var(--jkc-gold)' }}>
              KINGDOM CONNECT
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]" style={{ color: 'var(--foreground)' }}>
            Join the <br/><span style={{ color: 'var(--jkc-gold)' }}>Family</span>
          </h2>
          
          <p className="text-base md:text-lg leading-relaxed max-w-xl mx-auto font-medium" style={{ color: 'var(--muted-foreground)' }}>
            Whether you're visiting for the first time or have a specific prayer request, we'd love to hear from you.
          </p>

          <AnimatePresence>
            {isViaQr && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
              >
                <QrCode size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">QR Verification Active</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Legend / Info */}
          <div className="lg:col-span-4 space-y-8 hidden lg:block">
            <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-jkc-navy text-white flex items-center justify-center shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-1">Visitors</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">Register as a guest to receive a personalized welcome pack.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-jkc-gold text-white flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-1">Prayer</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">Our intercessory team prays over every request received.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0">
                  <Languages size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest mb-1">Global</h4>
                  <p className="text-[10px] text-muted-foreground font-medium">We support both English and Japanese speaking members.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-jkc-navy text-white space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Office Hours</p>
              <p className="text-xl font-black">TUE — SAT</p>
              <p className="text-xs font-medium opacity-80">9:00 AM — 6:00 PM JST</p>
              <div className="pt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone size={14} className="text-jkc-gold" />
                </div>
                <span className="text-[10px] font-black tracking-widest">+81 0x-xxxx-xxxx</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8 rounded-3xl p-8 md:p-12 space-y-8"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-2xl)',
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Intent Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                       style={{ color: 'var(--muted-foreground)' }}>
                  <HelpCircle size={10} /> Purpose of Contact
                </label>
                <Select 
                  value={formData.visitor_intent} 
                  onValueChange={v => handleFormChange('visitor_intent', v)}
                >
                  <SelectTrigger style={inputStyle} className="h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest">
                    <SelectValue placeholder="Select Purpose" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    <SelectItem value="inquiry" className="font-bold text-[10px] uppercase tracking-widest">General Inquiry</SelectItem>
                    <SelectItem value="first_visit" className="font-bold text-[10px] uppercase tracking-widest">First Time Visitor</SelectItem>
                    <SelectItem value="prayer_request" className="font-bold text-[10px] uppercase tracking-widest">Prayer Request</SelectItem>
                    <SelectItem value="testimony" className="font-bold text-[10px] uppercase tracking-widest">Share Testimony</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    First Name <span style={{ color: 'var(--jkc-gold)' }}>*</span>
                  </label>
                  <Input
                    required
                    placeholder="John"
                    className="rounded-2xl h-14 px-5 border-2 transition-all focus-visible:ring-0 focus-visible:border-jkc-gold"
                    style={inputStyle}
                    value={formData.first_name}
                    onChange={e => handleFormChange('first_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Last Name
                  </label>
                  <Input
                    placeholder="Doe"
                    className="rounded-2xl h-14 px-5 border-2 transition-all"
                    style={inputStyle}
                    value={formData.last_name}
                    onChange={e => handleFormChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Email Address <span style={{ color: 'var(--jkc-gold)' }}>*</span>
                  </label>
                  <div className="relative">
                    <Input
                      required
                      type="email"
                      placeholder="john@example.com"
                      className="rounded-2xl h-14 pl-12 pr-5 border-2 transition-all"
                      style={inputStyle}
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                    />
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+81 0x-xxxx-xxxx"
                      className="rounded-2xl h-14 pl-12 pr-5 border-2 transition-all"
                      style={inputStyle}
                      value={formData.phone}
                      onChange={e => handleFormChange('phone', e.target.value)}
                    />
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    Preferred Language
                  </label>
                  <Select 
                    value={formData.preferred_language} 
                    onValueChange={v => handleFormChange('preferred_language', v)}
                  >
                    <SelectTrigger style={inputStyle} className="h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="EN" className="font-bold text-[10px] uppercase tracking-widest">ENGLISH</SelectItem>
                      <SelectItem value="JP" className="font-bold text-[10px] uppercase tracking-widest">JAPANESE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isViaQr && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block"
                           style={{ color: 'var(--muted-foreground)' }}>
                      How did you hear about us?
                    </label>
                    <Select 
                      value={formData.how_heard} 
                      onValueChange={v => handleFormChange('how_heard', v)}
                    >
                      <SelectTrigger style={inputStyle} className="h-14 rounded-2xl border-2 font-black text-xs uppercase tracking-widest">
                        <SelectValue placeholder="Referral Source" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="friend" className="font-bold text-[10px] uppercase tracking-widest">Friend / Family</SelectItem>
                        <SelectItem value="social" className="font-bold text-[10px] uppercase tracking-widest">Social Media</SelectItem>
                        <SelectItem value="website" className="font-bold text-[10px] uppercase tracking-widest">Website Search</SelectItem>
                        <SelectItem value="outreach" className="font-bold text-[10px] uppercase tracking-widest">Street Outreach</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <motion.div layout className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest block"
                         style={{ color: 'var(--muted-foreground)' }}>
                    {formData.visitor_intent === 'prayer_request' ? 'How can we pray for you?' : 'Your Message'}
                  </label>
                  <Textarea
                    required
                    placeholder={formData.visitor_intent === 'prayer_request' ? "Tell us how we can intercede..." : "Tell us how we can help you..."}
                    className="rounded-2xl min-h-[140px] p-6 border-2 transition-all resize-none shadow-inner"
                    style={inputStyle}
                    value={formData.visitor_intent === 'prayer_request' ? formData.prayer_request : formData.message}
                    onChange={e => handleFormChange(formData.visitor_intent === 'prayer_request' ? 'prayer_request' : 'message', e.target.value)}
                  />
                </div>

                <AnimatePresence>
                  {formData.visitor_intent === 'prayer_request' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6 pt-4 border-t-2 border-dashed"
                    >
                      {/* Urgency */}
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Urgency</Label>
                        <RadioGroup 
                          value={formData.urgency} 
                          onValueChange={v => handleFormChange('urgency', v)} 
                          className="flex gap-4"
                        >
                           {['General', 'This week', 'Urgent'].map(v => (
                             <Label key={v} className="flex items-center gap-2 cursor-pointer text-[10px] font-bold">
                                <RadioGroupItem value={v} /> {v}
                             </Label>
                           ))}
                        </RadioGroup>
                      </div>

                      {/* Topic */}
                      <div className="space-y-3">
                        <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Prayer Topic</Label>
                        <RadioGroup 
                          value={formData.topic} 
                          onValueChange={v => handleFormChange('topic', v)} 
                          className="flex flex-wrap gap-4"
                        >
                           {['Health', 'Family', 'Work/Finance', 'Immigration', 'Other'].map(v => (
                             <Label key={v} className="flex items-center gap-1 cursor-pointer text-[10px] font-bold">
                                <RadioGroupItem value={v} /> {v}
                             </Label>
                           ))}
                        </RadioGroup>
                      </div>

                      {/* Privacy */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="private_prayer_main" 
                          checked={formData.is_private} 
                          onCheckedChange={(v) => handleFormChange('is_private', !!v)} 
                        />
                        <Label htmlFor="private_prayer_main" className="text-[10px] font-black uppercase tracking-widest cursor-pointer text-muted-foreground">Keep request private</Label>
                      </div>

                      {formData.urgency === 'Urgent' && (
                        <p className="text-[8px] font-bold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10 italic">
                          Alert: Urgent requests are sent directly to pastoral leadership.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-16 font-black text-[10px] tracking-[0.4em] rounded-full transition-all group overflow-hidden relative shadow-xl active:scale-95"
                  style={{
                    background: loading ? 'var(--muted)' : 'var(--jkc-navy)',
                    color: '#ffffff',
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? "TRANSMITTING..." : (
                      <>
                        {formData.visitor_intent === 'prayer_request' ? 'SUBMIT FOR PRAYER' : 'CONNECT WITH MINISTRY'}
                        <Share2 size={14} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  
                  {/* Subtle hover effect */}
                  {!loading && (
                    <div className="absolute inset-0 bg-jkc-gold translate-y-full group-hover:translate-y-[90%] transition-transform duration-500 opacity-20" />
                  )}
                </Button>
                
                <p className="text-[8px] font-bold text-center mt-6 text-muted-foreground uppercase tracking-widest">
                  Secure Submission Integrated with Church OS Ministry Intelligence
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
