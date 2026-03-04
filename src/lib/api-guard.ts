import { NextRequest, NextResponse } from 'next/server';

export function validateApiRequest(request: NextRequest) {
    const orgId = request.headers.get('x-org-id');
    if (!orgId) {
        return NextResponse.json(
            {
                error: "security_violation",
                message: "Middleware bypassed: Missing org_id context",
                code: 401
            },
            { status: 401 }
        );
    }
    return null;
}

export function getOrgId(request: NextRequest): string {
    const orgId = request.headers.get('x-org-id');
    if (!orgId) throw new Error("Missing org_id context");
    return orgId;
}
