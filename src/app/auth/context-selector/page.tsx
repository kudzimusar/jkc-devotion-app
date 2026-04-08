"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DomainAuth, AuthContext } from "@/lib/domain-auth";
import { Flame, Shield, Church, Users, ArrowRight, Loader2 } from "lucide-react";

export default function ContextSelectorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contexts, setContexts] = useState<AuthContext[]>([]);
  const [loading, setLoading] = useState(true);

  const filterDomain = searchParams.get('domain');

  useEffect(() => {
    async function loadContexts() {
      const allContexts = await DomainAuth.getContexts();
      if (filterDomain) {
        setContexts(allContexts.filter(c => c.auth_domain === filterDomain));
      } else {
        setContexts(allContexts);
      }
      setLoading(false);
    }
    loadContexts();
  }, [filterDomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (contexts.length === 0) {
    router.push("/");
    return null;
  }

  const handleSelect = (context: AuthContext) => {
    router.push(DomainAuth.getSurfaceRoute(context.auth_surface));
  };

  const icons: Record<string, any> = {
    'corporate': Shield,
    'tenant': Church,
    'member': Users,
    'onboarding': Flame
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Select Your Context</h1>
          <p className="text-white/40 font-medium">Your identity is linked to multiple domains. Choose your entry point.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contexts.map((ctx, idx) => {
            const Icon = icons[ctx.auth_domain] || Shield;
            return (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleSelect(ctx)}
                className="group relative bg-[#0d1421] border border-white/10 hover:border-violet-500/50 rounded-3xl p-8 text-left transition-all hover:shadow-2xl hover:shadow-violet-500/10"
              >
                <div className="mb-6 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500 transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">{ctx.auth_domain}</h3>
                <p className="text-sm text-white/40 font-medium capitalize mb-4">{ctx.auth_surface.replace('-', ' ')} • {ctx.role}</p>
                
                <div className="flex items-center gap-2 text-violet-400 group-hover:text-violet-300 transition-colors">
                  <span className="text-xs font-black uppercase tracking-widest">Enter Domain</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
