"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowRight, ArrowLeft, Loader2, Sparkles, Check, Globe, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { RestorePrompt } from '@/components/ui/RestorePrompt';

// Onboarding Steps
const steps = ['Identity', 'DNA', 'Plan'] as const;
type Step = typeof steps[number];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('Identity');
    
    // Form State
    const [churchName, setChurchName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    
    // DNA State
    const [theologicalTradition, setTheologicalTradition] = useState('');
    const [ministryEmphasis, setMinistryEmphasis] = useState('');
    const [worshipStyle, setWorshipStyle] = useState('');
    const [congregationSize, setCongregationSize] = useState('');
    const [primaryLanguage, setPrimaryLanguage] = useState('');
    
    // Plan State
    const [tier, setTier] = useState<'lite' | 'pro' | 'enterprise'>('lite');
    
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-save integration
    const [showRestore, setShowRestore] = useState(false);
    const [savedData, setSavedData] = useState<any>(null);

    const formData = useMemo(() => ({
        churchName,
        contactEmail,
        subdomain,
        logoPreview,
        theologicalTradition,
        ministryEmphasis,
        worshipStyle,
        congregationSize,
        primaryLanguage,
        tier,
        currentStep
    }), [
        churchName, contactEmail, subdomain, logoPreview, 
        theologicalTradition, ministryEmphasis, worshipStyle, 
        congregationSize, primaryLanguage, tier, currentStep
    ]);

    const { clearSaved } = useAutoSave({
        formType: 'onboarding_wizard',
        data: formData,
        onRestore: (data) => {
            setSavedData(data);
            setShowRestore(true);
        }
    });

    const handleRestore = () => {
        if (!savedData) return;
        setChurchName(savedData.churchName || '');
        setContactEmail(savedData.contactEmail || '');
        setSubdomain(savedData.subdomain || '');
        setLogoPreview(savedData.logoPreview || null);
        setTheologicalTradition(savedData.theologicalTradition || '');
        setMinistryEmphasis(savedData.ministryEmphasis || '');
        setWorshipStyle(savedData.worshipStyle || '');
        setCongregationSize(savedData.congregationSize || '');
        setPrimaryLanguage(savedData.primaryLanguage || '');
        setTier(savedData.tier || 'lite');
        setCurrentStep(savedData.currentStep || 'Identity');
        setShowRestore(false);
        toast.success('Progress restored');
    };

    const handleDiscard = () => {
        clearSaved();
        setShowRestore(false);
        setSavedData(null);
    };

    const nextStep = () => {
        if (currentStep === 'Identity') {
            if (!churchName || !contactEmail || !subdomain) {
                toast.error('Please fill in all identity fields');
                return;
            }
            setCurrentStep('DNA');
        } else if (currentStep === 'DNA') {
            if (!theologicalTradition || !ministryEmphasis || !worshipStyle || !congregationSize || !primaryLanguage) {
                toast.error('Please define your spiritual core');
                return;
            }
            setCurrentStep('Plan');
        }
    };

    const prevStep = () => {
        if (currentStep === 'DNA') setCurrentStep('Identity');
        else if (currentStep === 'Plan') setCurrentStep('DNA');
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogo(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Session expired. Please log in again.');
                router.push('/login');
                return;
            }

            let logoUrl = '';
            if (logo) {
                const fileExt = logo.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('church-logos')
                    .upload(`${session.user.id}/${fileName}`, logo);
                
                if (uploadError) throw new Error('Logo upload failed');
                
                const { data: { publicUrl } } = supabase.storage
                    .from('church-logos')
                    .getPublicUrl(`${session.user.id}/${fileName}`);
                
                logoUrl = publicUrl;
            }

            const res = await fetch('/api/onboarding/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    churchName,
                    contactEmail,
                    domain: `${subdomain}.churchos.ai`,
                    logoUrl,
                    theologicalTradition,
                    ministryEmphasis,
                    worshipStyle,
                    congregationSize,
                    primaryLanguage,
                    tier,
                }),
            });

            const result = await res.json();
            if (res.ok) {
                clearSaved();
                toast.success('Sanctuary Provisioned Successfully!');
                // Store the API Key if needed or just redirect
                router.push('/admin');
            } else {
                toast.error(result.error || 'Registration failed');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = steps.indexOf(currentStep);
    const progress = ((stepIndex + 1) / steps.length) * 100;

    return (
        <div className="onboarding-theme bg-[#0c0e12] min-h-screen text-[#f6f6fc] font-body selection:bg-[#72eff5]/30 flex flex-col items-center">
            <RestorePrompt 
                isOpen={showRestore} 
                onRestore={handleRestore} 
                onDiscard={handleDiscard}
                savedDate={savedData?.savedAt}
            />
            
            {/* Header Anchor */}
            <header className="flex justify-center items-center w-full py-8 px-6 bg-transparent">
                <div className="text-2xl font-black tracking-tighter text-[#72eff5] font-headline uppercase leading-none">
                    CHURCH OS
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-6 pb-24">
                {/* Step Indicator */}
                <div className="w-full max-w-md mb-8 flex flex-col">
                    <div className="flex justify-between items-end mb-3">
                        <span className="text-[#ffd709] font-headline font-bold text-sm tracking-widest uppercase">
                            Step {stepIndex + 1} of 3
                        </span>
                        <span className="text-[#aaabb0] text-xs font-label tracking-wider uppercase">
                            {currentStep === 'Identity' ? 'Church Identity' : 
                             currentStep === 'DNA' ? 'Intelligence DNA' : 'Plan & Summary'}
                        </span>
                    </div>
                    <div className="h-0.5 w-full bg-[#23262c] rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-[#ffd709] shadow-[0_0_8px_rgba(255,215,9,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="w-full flex flex-col items-center"
                    >
                        {/* THE CARD */}
                        <div className="glass-card ambient-aura rounded-xl p-8 md:p-12 w-full max-w-2xl">
                            
                            {/* STEP 1: IDENTITY */}
                            {currentStep === 'Identity' && (
                                <div className="space-y-8">
                                    <div className="mb-8">
                                        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#f6f6fc] leading-tight">
                                            Establish Your <span className="text-[#72eff5]">Digital Presence</span>.
                                        </h1>
                                        <p className="text-[#aaabb0] mt-3 text-lg font-light">
                                            Begins the foundation of your church's AI-growth environment.
                                        </p>
                                    </div>

                                    {/* Logo Upload */}
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative w-32 h-32 rounded-3xl border-2 border-dashed border-[#74757a]/30 bg-[#171a1f] flex items-center justify-center cursor-pointer hover:border-[#72eff5]/50 hover:bg-[#1fb1b7]/5 transition-all overflow-hidden"
                                        >
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center space-y-1 text-[#aaabb0] group-hover:text-[#72eff5]">
                                                    <Upload size={24} />
                                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Logo</span>
                                                </div>
                                            )}
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleLogoChange}
                                            />
                                        </div>
                                        <p className="text-[10px] text-[#aaabb0] uppercase tracking-[0.2em] font-bold">Recommended: 512x512px</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group">
                                            <label className="block text-xs font-label uppercase tracking-[0.15em] text-[#aaabb0] mb-2 group-focus-within:text-[#72eff5] transition-colors">Church Name</label>
                                            <div className="ghost-border bg-[#23262c]/40 rounded-lg overflow-hidden flex items-center px-4 py-1">
                                                <input 
                                                    type="text" 
                                                    value={churchName}
                                                    onChange={(e) => setChurchName(e.target.value)}
                                                    placeholder="Grace Fellowship AI"
                                                    className="w-full bg-transparent border-none focus:ring-0 py-3 text-[#f6f6fc] placeholder-[#46484d]"
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-xs font-label uppercase tracking-[0.15em] text-[#aaabb0] mb-2 group-focus-within:text-[#72eff5] transition-colors">Pastor/Admin Email</label>
                                            <div className="ghost-border bg-[#23262c]/40 rounded-lg overflow-hidden flex items-center px-4 py-1">
                                                <input 
                                                    type="email" 
                                                    value={contactEmail}
                                                    onChange={(e) => setContactEmail(e.target.value)}
                                                    placeholder="lead@church.org"
                                                    className="w-full bg-transparent border-none focus:ring-0 py-3 text-[#f6f6fc] placeholder-[#46484d]"
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-xs font-label uppercase tracking-[0.15em] text-[#aaabb0] mb-2 group-focus-within:text-[#72eff5] transition-colors">OS Subdomain</label>
                                            <div className="ghost-border bg-[#23262c]/40 rounded-lg overflow-hidden flex items-center px-4 py-1">
                                                <input 
                                                    type="text" 
                                                    value={subdomain}
                                                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                                    placeholder="gracechurch"
                                                    className="w-full bg-transparent border-none focus:ring-0 py-3 text-[#f6f6fc] placeholder-[#46484d] text-right"
                                                />
                                                <span className="text-[#aaabb0] ml-1 font-bold">.churchos.ai</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: DNA (Spiritual Core) */}
                            {currentStep === 'DNA' && (
                                <div className="space-y-8">
                                    <div className="mb-8">
                                        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#f6f6fc] leading-tight">
                                            Define Your <span className="text-[#72eff5]">Spiritual Core</span>.
                                        </h1>
                                        <p className="text-[#aaabb0] mt-3 text-lg font-light leading-relaxed">
                                            To tailor your celestial experience, we must understand your theological foundations.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Dropdowns */}
                                        {[
                                            { label: 'Theological Tradition', value: theologicalTradition, setter: setTheologicalTradition, options: ['Pentecostal', 'Reformed', 'Evangelical', 'Baptist', 'Anglican', 'Non-Denominational', 'Other'] },
                                            { label: 'Ministry Emphasis', value: ministryEmphasis, setter: setMinistryEmphasis, options: ['Evangelism-led', 'Discipleship-focused', 'Social-Justice', 'Scripture-intensive', 'Worship-led'] },
                                            { label: 'Worship Style', value: worshipStyle, setter: setWorshipStyle, options: ['Modern/Contemporary', 'Traditional/Hymnal', 'Blended', 'Spontaneous/Spirit-led'] },
                                            { label: 'Congregation Size', value: congregationSize, setter: setCongregationSize, options: ['<100', '100-500', '500-2000', '2000+'] },
                                            { label: 'Primary Language', value: primaryLanguage, setter: setPrimaryLanguage, options: ['English', 'Japanese', 'Bilingual', 'Korean', 'Portuguese', 'Spanish', 'Other'] },
                                        ].map((field) => (
                                            <div key={field.label} className="group">
                                                <label className="block text-xs font-label uppercase tracking-[0.15em] text-[#aaabb0] mb-2 group-focus-within:text-[#72eff5] transition-colors">{field.label}</label>
                                                <div className="ghost-border bg-[#23262c]/40 rounded-lg overflow-hidden transition-all">
                                                    <select 
                                                        value={field.value}
                                                        onChange={(e) => field.setter(e.target.value)}
                                                        className="w-full bg-transparent border-none focus:ring-0 py-3.5 px-4 text-[#f6f6fc] appearance-none cursor-pointer"
                                                    >
                                                        <option value="" disabled className="bg-[#171a1f]">Select {field.label.toLowerCase()}...</option>
                                                        {field.options.map(opt => <option key={opt} value={opt} className="bg-[#171a1f]">{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: PLAN */}
                            {currentStep === 'Plan' && (
                                <div className="space-y-8">
                                    <div className="mb-8">
                                        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#f6f6fc] leading-tight text-center">
                                            Choose Your <span className="text-[#72eff5]">Path to Growth</span>.
                                        </h1>
                                        <p className="text-[#aaabb0] mt-3 text-lg font-light text-center">
                                            Select the intelligence tier that fits your sanctuary's mission.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { id: 'lite', name: 'Shepherd Lite', price: '$0', features: ['AI Basic', 'Member Hub'] },
                                            { id: 'pro', name: 'Growth Pro', price: '$49', features: ['Prophetic Engine', 'Full Analytics'] },
                                            { id: 'enterprise', name: 'Celestial', price: '$199', features: ['Unlimited AI', 'Custom DNA'] },
                                        ].map((p) => (
                                            <div 
                                                key={p.id}
                                                onClick={() => setTier(p.id as any)}
                                                className={`cursor-pointer rounded-2xl p-6 flex flex-col items-center space-y-3 transition-all ${
                                                    tier === p.id 
                                                    ? 'bg-[#72eff5]/10 border-2 border-[#72eff5] shadow-[0_0_20px_rgba(114,239,245,0.15)]' 
                                                    : 'bg-[#23262c]/40 border border-[#46484d]/30 opacity-60 hover:opacity-100'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${tier === p.id ? 'text-[#72eff5]' : 'text-[#aaabb0]'}`}>{p.name}</span>
                                                <div className="text-2xl font-black">{p.price}<span className="text-xs font-normal text-[#aaabb0]">/mo</span></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    {p.features.map(f => (
                                                        <div key={f} className="flex items-center gap-1.5 text-[10px] text-[#aaabb0]">
                                                            <Check size={10} className="text-[#72eff5]" /> {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Final Summary Component */}
                                    <div className="mt-8 pt-8 border-t border-[#46484d]/20 bg-[#171a1f]/30 p-6 rounded-2xl">
                                        <div className="flex items-center gap-4 mb-4">
                                            {logoPreview && <img src={logoPreview} alt="Church" className="w-12 h-12 rounded-xl object-cover" />}
                                            <div>
                                                <h3 className="text-lg font-bold leading-none">{churchName || 'New Sanctuary'}</h3>
                                                <p className="text-xs text-[#72eff5] mt-1">{subdomain}.churchos.ai</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-2 text-[10px] uppercase font-bold tracking-widest text-[#aaabb0]">
                                            <span>Theological Focus</span>
                                            <span className="text-right text-[#f6f6fc]">{theologicalTradition}</span>
                                            <span>Worship Style</span>
                                            <span className="text-right text-[#f6f6fc]">{worshipStyle}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center space-y-2">
                                        <div className="bg-[#c37fff]/10 text-[#c37fff] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-[#c37fff]/30 animate-pulse flex items-center gap-2">
                                            <Sparkles size={12} /> Powered by Prophetic AI
                                        </div>
                                        <p className="text-[10px] text-[#aaabb0] text-center italic">Your first AI Prophetic Insight will be delivered within 24 hours.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination Component */}
                        <div className="mt-12 flex items-center justify-between w-full max-w-2xl px-2">
                            <button 
                                onClick={prevStep}
                                disabled={currentStep === 'Identity'}
                                className={`flex items-center gap-2 text-sm uppercase font-bold tracking-widest transition-all group ${
                                    currentStep === 'Identity' ? 'opacity-0' : 'text-[#aaabb0] hover:text-[#72eff5]'
                                }`}
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Previous
                            </button>
                            
                            <button 
                                onClick={currentStep === 'Plan' ? handleSubmit : nextStep}
                                disabled={loading}
                                className="bg-gradient-to-br from-[#72eff5] to-[#1fb1b7] text-[#002829] px-10 py-4 rounded-full font-headline font-black text-lg shadow-xl shadow-[#72eff5]/10 active:scale-95 transition-all flex items-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        Provisioning...
                                    </>
                                ) : currentStep === 'Plan' ? (
                                    <>
                                        Start My Growth Journey
                                        <ArrowRight size={24} />
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight size={24} />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#72eff5]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#c37fff]/5 rounded-full blur-[100px] -z-10" />
        </div>
    );
}
