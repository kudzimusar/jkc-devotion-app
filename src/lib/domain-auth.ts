import { supabase } from './supabase';

export type AuthDomain = 'corporate' | 'tenant' | 'onboarding' | 'member';
export type AuthSurface = 'console' | 'pastor-hq' | 'mission-control' | 'ministry' | 'profile' | 'onboarding';

export interface AuthContext {
  identity_id: string;
  auth_domain: AuthDomain;
  auth_surface: AuthSurface;
  org_id?: string;
  role: string;
}

export interface DomainSession {
  identity_id: string;
  auth_domain: AuthDomain;
  auth_surface: AuthSurface;
  org_id?: string;
  role: string;
  expires_at: number;
}

export const DomainAuth = {
  async getContexts(): Promise<AuthContext[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('v_user_auth_contexts')
      .select('*')
      .eq('identity_id', user.id);

    if (error) {
      console.error('[DomainAuth] Context resolution error:', error.message);
      return [];
    }

    return data as AuthContext[];
  },

  async validateAccess(domain: AuthDomain, surface?: AuthSurface): Promise<boolean> {
    const contexts = await this.getContexts();
    return contexts.some(c => 
      c.auth_domain === domain && (!surface || c.auth_surface === surface)
    );
  },

  getLoginRoute(domain: AuthDomain): string {
    const routes: Record<AuthDomain, string> = {
      'corporate': '/corporate/login',
      'onboarding': '/onboarding/login',
      'tenant': '/church/login',
      'member': '/member/login'
    };
    return routes[domain];
  },

  getSurfaceRoute(surface: AuthSurface): string {
    const routes: Record<AuthSurface, string> = {
      'console': '/super-admin',
      'pastor-hq': '/pastor-hq',
      'mission-control': '/shepherd/dashboard',
      'ministry': '/shepherd/dashboard',
      'profile': '/member/profile',
      'onboarding': '/onboarding'
    };
    return routes[surface];
  }
};
