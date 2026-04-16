import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/supabase-middleware'

const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  'ai.churchos-ai.website': '/churchgpt',
  'admin.churchos-ai.website': '/shepherd/dashboard',
  'super.churchos-ai.website': '/super-admin',
  'onboard.churchos-ai.website': '/onboarding',
  'auth.churchos-ai.website': '/login',
  'app.churchos-ai.website': '/welcome',
  'devotion.churchos-ai.website': '/welcome/devotion',
  'www.churchos-ai.website': '/platform',
  'churchos-ai.website': '/platform',
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  const targetPath = SUBDOMAIN_REDIRECTS[hostname]
  if (targetPath && pathname === '/') {
    return NextResponse.redirect(new URL(targetPath, request.url))
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
