import { NextRequest, NextResponse } from "next/server";
import { getDevotionForDate, getAllDevotions } from "@/data/devotions";
import { validateApiRequest, getOrgId } from "@/lib/api-guard";

// Optional: if there's middleware, it might handle the API key. We'll do a simple mock here.
export async function GET(req: NextRequest) {
    // 1. Validate API Request (Secondary Guard)
    const guardResponse = validateApiRequest(req);
    if (guardResponse) return guardResponse;

    const orgId = getOrgId(req); // Usage Context

    // 2. Determine User Timezone Date
    const url = new URL(req.url);
    const tz = url.searchParams.get("timezone") || "UTC";

    // Get current date in that timezone
    const now = new Date();
    // Format to yyyy-mm-dd
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    const dateStr = `${y}-${m}-${d}`;

    // Just mock picking a devotion based on date loop if the exact date isn't found
    let devotion = getDevotionForDate(dateStr);

    // Fallback for testing: always pick the first devotion if today's date doesn't match data
    if (!devotion) {
        const devotions = getAllDevotions();
        if (devotions.length > 0) {
            devotion = devotions[0];
        } else {
            return NextResponse.json({ error: "No devotions available" }, { status: 404 });
        }
    }

    return NextResponse.json({
        id: devotion.id,
        date: devotion.date,
        theme: devotion.theme,
        title: devotion.title,
        week: devotion.week,
        week_theme: devotion.week_theme,
        scripture: devotion.scripture,
        declaration: devotion.declaration
    });
}
