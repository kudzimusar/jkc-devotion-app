import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Use existing singletons
const db = supabaseAdmin

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
        const { data: member, error: memberError } = await db
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
