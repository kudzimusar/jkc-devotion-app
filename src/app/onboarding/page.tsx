"use client";
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, Loader2, Sparkles, Check, Upload, HelpCircle, X,
    Music, BookOpen, Baby, Zap, Video, Megaphone, Globe, Users,
    Wallet, Coffee, Shield, DoorOpen, ShoppingBag, Heart, Landmark,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { RestorePrompt } from '@/components/ui/RestorePrompt';
import { basePath as BP } from '@/lib/utils';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { MemberImportWizard } from '@/components/dashboard/import/MemberImportWizard';

const steps = ['Identity', 'DNA', 'Ministries', 'Plan'] as const;
type Step = typeof steps[number];

const MINISTRY_TEMPLATES: { name: string; category: string; Icon: LucideIcon }[] = [
    { name: 'Worship Ministry',     category: 'worship',  Icon: Music },
    { name: 'Prayer Ministry',      category: 'worship',  Icon: BookOpen },
    { name: "Children's Ministry",  category: 'care',     Icon: Baby },
    { name: 'Youth Ministry',       category: 'care',     Icon: Zap },
    { name: 'Media Ministry',       category: 'media',    Icon: Video },
    { name: 'Evangelism Ministry',  category: 'outreach', Icon: Megaphone },
    { name: 'Missions Ministry',    category: 'outreach', Icon: Globe },
    { name: 'Fellowship Circles',   category: 'care',     Icon: Users },
    { name: 'Finance Ministry',     category: 'admin',    Icon: Wallet },
    { name: 'Hospitality Ministry', category: 'care',     Icon: Coffee },
    { name: 'Pastoral Care',        category: 'care',     Icon: Shield },
    { name: 'Ushering Ministry',    category: 'admin',    Icon: DoorOpen },
    { name: 'The Food Pantry',      category: 'outreach', Icon: ShoppingBag },
    { name: 'Akiramenai Outreach',  category: 'outreach', Icon: Heart },
];

const PROVISION_STEPS = [
    'Creating your digital sanctuary...',
    'Configuring your ministries...',
    'Generating prophetic insights...',
    'Activating AI intelligence...',
    'Preparing for launch...',
];

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

    // Ministry State (Change 1)
    const [selectedMinistries, setSelectedMinistries] = useState<string[]>([
        'Worship Ministry', "Children's Ministry", 'Prayer Ministry'
    ]);

    // Plan State
    const [tier, setTier] = useState<'lite' | 'pro' | 'enterprise'>('lite');
    const [provisionedOrgId, setProvisionedOrgId] = useState<string | null>(null);

    // Provisioning State (Change 2)
    const [loading, setLoading] = useState(false);
    const [provisioningStep, setProvisioningStep] = useState(0);

    // Support Widget State (Change 4)
    const [showHelp, setShowHelp] = useState(false);
    const [helpMessage, setHelpMessage] = useState('');
    const [helpSending, setHelpSending] = useState(false);

    // Import State
    const [showImport, setShowImport] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const invitedChurch = query.get('church');
        if (invitedChurch && !churchName) {
            setChurchName(decodeURIComponent(invitedChurch));
        }
    }, [churchName]);

    // Auto-save
    const [showRestore, setShowRestore] = useState(false);
    const [savedData, setSavedData] = useState<any>(null);

    // Initial server check for drafts
    useEffect(() => {
        const tryResumeFromServer = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return;
            
            const { data: draft } = await supabase
                .from('onboarding_drafts')
                .select('*')
                .eq('identity_id', session.user.id)
                .single();
            
            if (draft && draft.form_data) {
                setSavedData(draft.form_data);
                setShowRestore(true);
            }
        };
        tryResumeFromServer();
    }, []);

    const formData = useMemo(() => ({
        churchName, contactEmail, subdomain, logoPreview,
        theologicalTradition, ministryEmphasis, worshipStyle,
        congregationSize, primaryLanguage, tier, currentStep, selectedMinistries,
    }), [
        churchName, contactEmail, subdomain, logoPreview,
        theologicalTradition, ministryEmphasis, worshipStyle,
        congregationSize, primaryLanguage, tier, currentStep, selectedMinistries
    ]);

    const { clearSaved } = useAutoSave({
        formType: 'onboarding_wizard',
        data: formData,
        onSave: async () => {
            if (!formData.contactEmail) return;
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) return;
            await supabase.from('onboarding_drafts').upsert({
                email: formData.contactEmail,
                identity_id: session.user.id,
                form_data: formData,
                current_step: formData.currentStep,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'email' });
        },
        onRestore: (data) => {
            setSavedData((prev: any) => prev || data);
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
        setSelectedMinistries(savedData.selectedMinistries || ['Worship Ministry', "Children's Ministry", 'Prayer Ministry']);
        setShowRestore(false);
        toast.success('Progress restored');
    };

    const handleDiscard = () => {
        clearSaved();
        setShowRestore(false);
        setSavedData(null);
    };

    const toggleMinistry = (name: string) => {
        setSelectedMinistries(prev =>
            prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
        );
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
            setCurrentStep('Ministries');
        } else if (currentStep === 'Ministries') {
            if (selectedMinistries.length === 0) {
                toast.error('Please select at least one ministry');
                return;
            }
            setCurrentStep('Plan');
        }
    };

    const prevStep = () => {
        if (currentStep === 'DNA') setCurrentStep('Identity');
        else if (currentStep === 'Ministries') setCurrentStep('DNA');
        else if (currentStep === 'Plan') setCurrentStep('Ministries');
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

    // Change 4: Support widget submit
    const handleHelpSubmit = async () => {
        if (!helpMessage.trim()) return;
        setHelpSending(true);
        try {
            await supabase.from('public_inquiries').insert({
                org_id: await resolvePublicOrgId(),
                visitor_intent: 'onboarding_support',
                message: helpMessage,
                email: contactEmail || undefined,
            });
            toast.success("Message sent! We'll be in touch.");
            setHelpMessage('');
            setShowHelp(false);
        } catch {
            toast.error('Failed to send. Please try again.');
        } finally {
            setHelpSending(false);
        }
    };

    const handlePlanSelect = async (planName: string, orgId?: string) => {
        const resolvedOrgId = orgId || provisionedOrgId;
        if (planName === 'enterprise') {
            toast.info('Contact us at hello@churchos.ai for Enterprise');
            router.push(`/onboarding/success?church=${encodeURIComponent(churchName)}`);
            return;
        }
        if (!resolvedOrgId) {
            // Fallback: go to success without billing (org was provisioned, billing optional)
            router.push(`/onboarding/success?church=${encodeURIComponent(churchName)}`);
            return;
        }
        try {
            const { data, error } = await supabase.functions.invoke('saas-billing', {
                body: {
                    action: 'create_checkout',
                    org_id: resolvedOrgId,
                    plan_name: planName === 'lite' ? 'Lite' : 'Pro',
                    billing_interval: 'month',
                    admin_email: contactEmail,
                    org_name: churchName,
                    success_url: window.location.origin + '/jkc/onboarding/success?church=' + encodeURIComponent(churchName) + '&plan=' + planName,
                    cancel_url: window.location.origin + '/jkc/onboarding',
                }
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                router.push(`/onboarding/success?church=${encodeURIComponent(churchName)}`);
            }
        } catch (err: any) {
            toast.error('Billing setup failed: ' + err.message);
            // Still go to success — org is provisioned, billing can be set up later
            router.push(`/onboarding/success?church=${encodeURIComponent(churchName)}`);
        }
    };

    // Change 2: handleSubmit with provisioning animation
    const handleSubmit = async () => {
        setLoading(true);
        setProvisioningStep(1);

        const t1 = setTimeout(() => setProvisioningStep(2), 1500);
        const t2 = setTimeout(() => setProvisioningStep(3), 3000);
        const t3 = setTimeout(() => setProvisioningStep(4), 4500);
        const t4 = setTimeout(() => setProvisioningStep(5), 6000);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
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

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const res = await fetch(`${supabaseUrl}/functions/v1/onboarding-register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
                },
                body: JSON.stringify({
                    churchName,
                    contactEmail,
                    domain: `${subdomain}.churchos.ai`,
                    churchSlug: subdomain,
                    logoUrl,
                    theologicalTradition,
                    ministryEmphasis,
                    worshipStyle,
                    congregationSize,
                    primaryLanguage,
                    tier,
                    selectedMinistries, // Change 5
                }),
            });

            const result = await res.json();
            if (res.ok) {
                clearSaved();
                try {
                    await supabase.from('onboarding_drafts').delete().eq('email', contactEmail);
                } catch(e) {
                    // Ignore clear failure
                }
                const newOrgId = result.org_id || result.id || null;
                setProvisionedOrgId(newOrgId);
                // Let animation finish, then show the Import Wizard
                setTimeout(() => {
                    setLoading(false);
                    setShowImport(true);
                }, 6500);
            } else {
                clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
                setProvisioningStep(0);
                setLoading(false);
                toast.error(result.error || 'Registration failed');
            }
        } catch (error: any) {
            clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
            setProvisioningStep(0);
            setLoading(false);
            toast.error(error.message);
        }
    };

    const stepIndex = steps.indexOf(currentStep);
    const progress = ((stepIndex + 1) / steps.length) * 100;

    // Change 2: Full-screen provisioning overlay
    if (loading && provisioningStep > 0) {
        return (
            <div className="fixed inset-0 bg-[#0c0e12] z-50 flex flex-col items-center justify-center px-6">
                <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#72eff5]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
                <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#c37fff]/5 rounded-full blur-[100px] -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm flex flex-col items-center gap-10"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#72eff5]/10 border border-[#72eff5]/20 flex items-center justify-center">
                        <Landmark size={28} className="text-[#72eff5]" />
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#aaabb0]">Church OS</p>
                        <motion.h2
                            key={provisioningStep}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-extrabold text-[#72eff5]"
                        >
                            {PROVISION_STEPS[provisioningStep - 1]}
                        </motion.h2>
                    </div>

                    <div className="w-full space-y-2">
                        <div className="h-1 w-full bg-[#23262c] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#72eff5] to-[#c37fff] rounded-full"
                                animate={{ width: `${(provisioningStep / PROVISION_STEPS.length) * 100}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        </div>
                        <p className="text-right text-[10px] text-[#aaabb0] font-bold tracking-widest">
                            {Math.round((provisioningStep / PROVISION_STEPS.length) * 100)}%
                        </p>
                    </div>

                    <div className="w-full space-y-3">
                        {PROVISION_STEPS.map((step, i) => {
                            const done = i + 1 < provisioningStep;
                            const active = i + 1 === provisioningStep;
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 transition-opacity ${i + 1 > provisioningStep ? 'opacity-20' : 'opacity-100'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        done ? 'bg-[#72eff5]' :
                                        active ? 'border border-[#72eff5]/60 bg-[#72eff5]/10' :
                                        'bg-[#23262c]'
                                    }`}>
                                        {done && <Check size={10} className="text-[#002829]" />}
                                        {active && <Loader2 size={10} className="animate-spin text-[#72eff5]" />}
                                    </div>
                                    <span className={`text-sm ${
                                        done ? 'text-[#72eff5]' :
                                        active ? 'text-[#f6f6fc] font-semibold' :
                                        'text-[#aaabb0]'
                                    }`}>
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        );
    }

    if (showImport && provisionedOrgId) {
        return (
            <div className="fixed inset-0 bg-[#0c0e12] z-50 flex flex-col items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-2xl bg-[#171a1f] border border-[#46484d]/30 rounded-3xl overflow-hidden shadow-2xl">
                    <MemberImportWizard
                        orgId={provisionedOrgId}
                        onComplete={() => {
                            // Already handled inside wizard, user will click "Done" which calls onClose
                        }}
                        onClose={() => {
                            setShowImport(false);
                            handlePlanSelect(tier, provisionedOrgId);
                        }}
                    />
                </div>
                <button
                    onClick={() => {
                        setShowImport(false);
                        handlePlanSelect(tier, provisionedOrgId);
                    }}
                    className="mt-6 text-[#aaabb0] hover:text-[#f6f6fc] text-xs font-bold uppercase tracking-[0.2em] transition-all"
                >
                    Skip for now & continue to billing
                </button>
            </div>
        );
    }

    return (
        <div className="onboarding-theme bg-[#0c0e12] min-h-screen text-[#f6f6fc] font-body selection:bg-[#72eff5]/30 flex flex-col items-center">
            <RestorePrompt
                isOpen={showRestore}
                onRestore={handleRestore}
                onDiscard={handleDiscard}
                savedDate={savedData?.savedAt}
            />

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
                            Step {stepIndex + 1} of {steps.length}
                        </span>
                        <span className="text-[#aaabb0] text-xs font-label tracking-wider uppercase">
                            {currentStep === 'Identity' ? 'Church Identity' :
                             currentStep === 'DNA' ? 'Intelligence DNA' :
                             currentStep === 'Ministries' ? 'Ministry Selection' :
                             'Plan & Summary'}
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

                            {/* STEP 2: DNA */}
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

                            {/* STEP 3: MINISTRIES (Change 1) */}
                            {currentStep === 'Ministries' && (
                                <div className="space-y-8">
                                    <div className="mb-6">
                                        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-[#f6f6fc] leading-tight">
                                            Choose Your <span className="text-[#72eff5]">Ministries</span>.
                                        </h1>
                                        <p className="text-[#aaabb0] mt-3 text-lg font-light">
                                            Select the departments your church will activate. You can add more later.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {MINISTRY_TEMPLATES.map((m) => {
                                            const selected = selectedMinistries.includes(m.name);
                                            return (
                                                <button
                                                    key={m.name}
                                                    type="button"
                                                    onClick={() => toggleMinistry(m.name)}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                                                        selected
                                                            ? 'bg-[#72eff5]/10 border-[#72eff5] shadow-[0_0_12px_rgba(114,239,245,0.08)]'
                                                            : 'ghost-border bg-[#23262c]/40 hover:border-[#72eff5]/30 hover:bg-[#72eff5]/5'
                                                    }`}
                                                >
                                                    <m.Icon size={20} className={`flex-shrink-0 ${selected ? 'text-[#72eff5]' : 'text-[#aaabb0]'}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold leading-tight truncate ${selected ? 'text-[#72eff5]' : 'text-[#f6f6fc]'}`}>
                                                            {m.name}
                                                        </p>
                                                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#aaabb0] bg-[#171a1f] px-1.5 py-0.5 rounded mt-1 inline-block">
                                                            {m.category}
                                                        </span>
                                                    </div>
                                                    {selected && (
                                                        <div className="w-5 h-5 rounded-full bg-[#72eff5] flex items-center justify-center flex-shrink-0">
                                                            <Check size={10} className="text-[#002829]" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <p className="text-center text-xs text-[#aaabb0] font-bold tracking-widest uppercase">
                                        {selectedMinistries.length} {selectedMinistries.length === 1 ? 'ministry' : 'ministries'} selected
                                    </p>
                                </div>
                            )}

                            {/* STEP 4: PLAN */}
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
                                            { id: 'lite', name: 'Shepherd Lite', price: '$29', features: ['AI Basic', 'Member Hub'] },
                                            { id: 'pro', name: 'Growth Pro', price: '$79', features: ['Prophetic Engine', 'Full Analytics'] },
                                            { id: 'enterprise', name: 'Celestial', price: 'Custom', features: ['Unlimited AI', 'Custom DNA'] },
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
                                            <span>Ministries</span>
                                            <span className="text-right text-[#f6f6fc]">{selectedMinistries.length} departments</span>
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

                        {/* Pagination */}
                        <div className="mt-12 flex items-center justify-between w-full max-w-2xl px-2">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 'Identity'}
                                className={`flex items-center gap-2 text-sm uppercase font-bold tracking-widest transition-all group ${
                                    currentStep === 'Identity' ? 'opacity-0 pointer-events-none' : 'text-[#aaabb0] hover:text-[#72eff5]'
                                }`}
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Previous
                            </button>

                            <button
                                onClick={currentStep === 'Plan' ? handleSubmit : nextStep}
                                disabled={loading}
                                className="bg-gradient-to-br from-[#72eff5] to-[#1fb1b7] text-[#002829] px-10 py-4 rounded-full font-headline font-black text-lg shadow-xl shadow-[#72eff5]/10 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-70"
                            >
                                {currentStep === 'Plan' ? (
                                    <>Start My Growth Journey <ArrowRight size={24} /></>
                                ) : (
                                    <>Continue <ArrowRight size={24} /></>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#72eff5]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#c37fff]/5 rounded-full blur-[100px] -z-10" />

            {/* Support Widget (Change 4) */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                <AnimatePresence>
                    {showHelp && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="bg-[#171a1f] border border-[#46484d]/40 rounded-2xl p-5 w-72 shadow-2xl shadow-black/40 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-[#f6f6fc]">Need help?</span>
                                <button onClick={() => setShowHelp(false)} className="text-[#aaabb0] hover:text-[#f6f6fc] transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-[11px] text-[#aaabb0] leading-relaxed">
                                Send us a message and our team will reach out shortly.
                            </p>
                            <textarea
                                value={helpMessage}
                                onChange={(e) => setHelpMessage(e.target.value)}
                                placeholder="What do you need help with?"
                                rows={3}
                                className="w-full bg-[#23262c] border border-[#46484d]/30 rounded-lg px-3 py-2.5 text-sm text-[#f6f6fc] placeholder-[#46484d] resize-none focus:outline-none focus:border-[#72eff5]/40 transition-colors"
                            />
                            <button
                                onClick={handleHelpSubmit}
                                disabled={helpSending || !helpMessage.trim()}
                                className="w-full bg-[#72eff5]/10 hover:bg-[#72eff5]/20 border border-[#72eff5]/30 text-[#72eff5] py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                            >
                                {helpSending ? <Loader2 size={12} className="animate-spin" /> : null}
                                {helpSending ? 'Sending...' : 'Send Message'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setShowHelp(v => !v)}
                    className="bg-[#171a1f] border border-[#46484d]/40 hover:border-[#72eff5]/40 text-[#aaabb0] hover:text-[#72eff5] px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-black/20"
                >
                    <HelpCircle size={14} />
                    Need Help?
                </button>
            </div>
        </div>
    );
}
