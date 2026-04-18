'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminCtx } from '../../Context';
import { 
  Mail, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { disconnectAccount, triggerManualSync } from '@/app/actions/email-account-actions';

interface ConnectedAccount {
  id: string;
  email_address: string;
  display_name: string;
  provider: string;
  connection_status: string;
  last_successful_sync_at: string | null;
  sync_enabled: boolean;
  account_color: string | null;
}

const PROVIDER_ICONS: Record<string, string> = {
  gmail: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg',
  outlook: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/windows8/windows8-original.svg',
};

export default function EmailAccountsPage() {
  const { userId, orgId } = useAdminCtx() as any;
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (userId) loadAccounts();
  }, [userId]);

  async function loadAccounts() {
    setLoading(true);
    const { data } = await supabase
      .from('connected_email_accounts')
      .select('*')
      .eq('member_id', userId)
      .order('created_at', { ascending: false });
    
    setAccounts(data ?? []);
    setLoading(false);
  }

  const handleConnect = (provider: 'gmail' | 'outlook') => {
    if (!orgId || !userId) return;
    const url = `/api/email/oauth-url?provider=${provider}&org_id=${orgId}&user_id=${userId}&redirect_url=/shepherd/dashboard/settings/email-accounts`;
    window.location.href = url;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    const res = await disconnectAccount(id);
    if (res.success) {
      toast.success('Account disconnected');
      loadAccounts();
    } else {
      toast.error(res.error || 'Failed to disconnect');
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    const res = await triggerManualSync(id);
    if (res.success) {
      toast.success('Sync triggered successfully');
      setTimeout(loadAccounts, 3000);
    } else {
      toast.error(res.error || 'Sync failed');
    }
    setSyncing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-1">Email Integrations</h1>
        <p className="text-xs font-black text-muted-foreground/40 tracking-widest uppercase">
          Connect your personal Gmail or Outlook to manage church communications
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Options */}
        <Card className="glass border-white/10 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-24 bg-violet-500/10 blur-[80px] pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-lg">Add New Integration</CardTitle>
            <CardDescription>Choose a provider to sync your messages and calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 relative">
            <Button 
              onClick={() => handleConnect('gmail')}
              variant="outline" 
              className="w-full h-14 justify-between border-white/10 hover:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <img src={PROVIDER_ICONS.gmail} className="w-6 h-6" alt="Gmail" />
                <span className="font-bold">Gmail / Google Workspace</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={() => handleConnect('outlook')}
              variant="outline" 
              className="w-full h-14 justify-between border-white/10 hover:bg-white/5 group"
            >
              <div className="flex items-center gap-3">
                <img src={PROVIDER_ICONS.outlook} className="w-6 h-6" alt="Outlook" />
                <span className="font-bold">Outlook / Microsoft 365</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                * By connecting, you enable Church OS AI to help you draft responses and organize your inbox. 
                Your data is encrypted and never sold.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <div className="space-y-4">
          <Card className="glass border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-emerald-500 flex items-center gap-2 tracking-widest uppercase">
                <ShieldCheck className="w-4 h-4" /> Military-Grade Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-emerald-500/70 leading-relaxed font-medium">
                Your OAuth tokens are protected by 256-bit AES encryption. Even in the event of a database breach, your email access remains locked.
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-white/40 flex items-center gap-2 tracking-widest uppercase">
                <AlertCircle className="w-4 h-4" /> Why connect?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[10px] text-white/60 font-medium">Unified Inbox: Manage members, LNS, and personal email in one view.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[10px] text-white/60 font-medium">AI Assistance: Draft summaries and replies automatically using context.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[10px] text-white/60 font-medium">Auto-Categorization: AI tags emails as Crisis, Joy, or Inquiry.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connected Accounts List */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-black text-white/20 tracking-[0.2em] uppercase">Active Integrations</h3>
        
        {accounts.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-40">
            <Mail className="w-12 h-12 mb-4 text-white/20" />
            <p className="text-sm font-bold">No accounts connected yet</p>
            <p className="text-xs">Your unified inbox is waiting to be built.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {accounts.map((acc) => (
              <div 
                key={acc.id} 
                className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between group transition-all hover:bg-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center p-2.5 relative">
                    <img src={PROVIDER_ICONS[acc.provider]} className="w-full h-full opacity-80" alt={acc.provider} />
                    {acc.connection_status === 'active' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground mb-0.5">{acc.email_address}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10">
                        {acc.provider}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/40 font-medium italic">
                        Last sync: {acc.last_successful_sync_at ? new Date(acc.last_successful_sync_at).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                    onClick={() => handleSync(acc.id)}
                    disabled={!!syncing}
                  >
                    {syncing === acc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <ExternalLink className="w-3.5 h-3.5 mr-2" />}
                    Sync Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => handleDelete(acc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
