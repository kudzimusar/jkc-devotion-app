import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Service role for auth-bypass checks in edges/proxies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function proxy(request: NextRequest) {
    // 1. Maintain Supabase session
    const response = await updateSession(request)

    // 2. Perform redirection logic
    const { data: { user } } = await supabase.auth.getUser(request.cookies.get('sb-dapxrorkcvpzzkggopsa-auth-token')?.value || '')

    // Fallback auth check if user isn't directly in request (optional as updateSession handles most)
    if (!user) return response

    const pathname = request.nextUrl.pathname
    const url = request.nextUrl.clone()

    // Match /admin or /onboarding (accounting for potential basePath usage if Next.js includes it)
    if (pathname.includes('/admin') || pathname.includes('/onboarding')) {
        const { data: member, error: memberError } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .single()

        const hasOrg = !memberError && member?.org_id

        if (pathname.includes('/onboarding') && hasOrg) {
            url.pathname = '/jkc-devotion-app/admin'
            return NextResponse.redirect(url)
        }

        if (pathname.includes('/admin') && !hasOrg) {
            url.pathname = '/jkc-devotion-app/onboarding'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        '/jkc-devotion-app/admin/:path*',
        '/jkc-devotion-app/onboarding/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
