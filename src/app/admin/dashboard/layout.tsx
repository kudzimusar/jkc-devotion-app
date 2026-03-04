import { ReactNode } from 'react';
import Link from 'next/link';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <header className="border-b border-white/10 glass sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                            <span className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </span>
                            Church Portal
                        </Link>
                    </div>
                </div>
            </header>
            <main className="flex-1 container mx-auto px-4 py-8 relative">
                {/* Ambient background glows */}
                <div className="fixed top-20 left-[20%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="fixed bottom-20 right-[20%] w-96 h-96 bg-accent/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

                {children}
            </main>
        </div>
    );
}
