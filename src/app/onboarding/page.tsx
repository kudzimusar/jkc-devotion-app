"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

// Simple step enum
const steps = ['details', 'domain', 'tier', 'summary'] as const;

type Step = typeof steps[number];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('details');
    const [churchName, setChurchName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [domain, setDomain] = useState('');
    const [tier, setTier] = useState<'lite' | 'pro' | 'enterprise'>('lite');
    const [loading, setLoading] = useState(false);

    const next = () => {
        const idx = steps.findIndex((s) => s === currentStep);
        if (idx < steps.length - 1) setCurrentStep(steps[idx + 1] as Step);
    };

    const prev = () => {
        const idx = steps.findIndex((s) => s === currentStep);
        if (idx > 0) setCurrentStep(steps[idx - 1] as Step);
    };

    const submit = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // Not logged in – redirect to login page
            router.push('/login');
            return;
        }
        const res = await fetch('/jkc-devotion-app/api/onboarding/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                churchName,
                contactEmail,
                domain,
                tier,
            }),
        });
        const result = await res.json();
        if (res.ok) {
            // Show the API key once then redirect to admin
            alert(`Your API key (copy now): ${result.apiKey}`);
            router.push('/admin');
        } else {
            alert(result.error || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/5 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl glass border-white/20 backdrop-blur-lg">
                <CardHeader className="bg-primary/5 rounded-t-lg">
                    <CardTitle className="text-2xl text-center">Church Onboarding</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 'details' && (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <Input
                                    placeholder="Church Name"
                                    value={churchName}
                                    onChange={(e) => setChurchName(e.target.value)}
                                />
                                <Input
                                    placeholder="Contact Email"
                                    type="email"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                />
                                <div className="flex justify-end space-x-2 mt-4">
                                    <Button onClick={next} disabled={!churchName || !contactEmail}>Next</Button>
                                </div>
                            </motion.div>
                        )}
                        {currentStep === 'domain' && (
                            <motion.div
                                key="domain"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <Input
                                    placeholder="Domain (e.g., gracechurch.org)"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                />
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={prev}>Back</Button>
                                    <Button onClick={next} disabled={!domain}>Next</Button>
                                </div>
                            </motion.div>
                        )}
                        {currentStep === 'tier' && (
                            <motion.div
                                key="tier"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {(['lite', 'pro', 'enterprise'] as const).map((t) => (
                                        <Button
                                            key={t}
                                            variant={tier === t ? 'default' : 'outline'}
                                            onClick={() => setTier(t)}
                                            className="h-24"
                                        >
                                            {t.charAt(0).toUpperCase() + t.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={prev}>Back</Button>
                                    <Button onClick={next}>Next</Button>
                                </div>
                            </motion.div>
                        )}
                        {currentStep === 'summary' && (
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <p><strong>Church Name:</strong> {churchName}</p>
                                    <p><strong>Contact Email:</strong> {contactEmail}</p>
                                    <p><strong>Domain:</strong> {domain}</p>
                                    <p><strong>Tier:</strong> {tier}</p>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <Button variant="outline" onClick={prev}>Back</Button>
                                    <Button onClick={submit} disabled={loading}>{loading ? 'Submitting…' : 'Finish'}</Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
