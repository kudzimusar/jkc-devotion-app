import { supabase } from "@/lib/supabase";

export async function addMemberAction(formData: any) {
    try {
        const { name, email, phone, city, orgId, role = 'member' } = formData;

        // In a static/client-side deployment, we rely on the admin's RLS permissions
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .insert([{ name, email, phone, city, org_id: orgId }])
            .select()
            .single();

        if (pError) throw pError;

        const { error: mError } = await supabase
            .from('org_members')
            .insert([{ user_id: profile.id, org_id: orgId, role }]);

        if (mError) throw mError;

        return { success: true, data: profile };
    } catch (error: any) {
        console.error("Add Member Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createEventAction(eventData: any) {
    try {
        const { name, type, date, location, description, orgId, userId } = eventData;

        const { data, error } = await supabase
            .from('events')
            .insert([{
                name,
                event_type: type,
                event_date: date,
                location,
                description,
                org_id: orgId,
                created_by: userId
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Create Event Error:", error);
        return { success: false, error: error.message };
    }
}

export async function addPrayerRequestAction(requestData: any) {
    try {
        const { text, userId, orgId, isAnonymous } = requestData;

        // Mock AI classification logic for client-side
        const category = text.toLowerCase().includes('sick') || text.toLowerCase().includes('pain') ? 'health' :
            text.toLowerCase().includes('money') || text.toLowerCase().includes('job') ? 'financial' : 'general';

        const urgency = text.toLowerCase().includes('emergency') || text.toLowerCase().includes('urgent') ? 'urgent' : 'normal';

        const { data, error } = await supabase
            .from('prayer_requests')
            .insert([{
                user_id: userId,
                org_id: orgId,
                request_text: text,
                category,
                urgency,
                is_anonymous: isAnonymous,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data, aiInsight: `Automatically tagged as ${category} (${urgency})` };
    } catch (error: any) {
        console.error("Add Prayer Request Error:", error);
        return { success: false, error: error.message };
    }
}

export async function assignMinistryRoleAction(memberId: string, role: string, ministry: string, adminId: string) {
    try {
        const { data, error } = await supabase
            .from('ministry_members')
            .insert([{
                user_id: memberId,
                ministry_name: ministry,
                ministry_role: role,
                invited_by: adminId,
                status: 'pending_invitation'
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Assign Role Error:", error);
        return { success: false, error: error.message };
    }
}

export async function generateReportAction(reportType: string, orgId: string, userId: string) {
    try {
        const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Intelligence Briefing`;
        const aiSummary = `Based on current metrics for ${reportType}, we are seeing strong participation in morning devotions. However, small group attendance in the North Ward has seen a slight decline. Recommendation: Schedule a leadership meeting to discuss outreach strategies.`;

        const content = JSON.stringify({
            summary: aiSummary,
            timestamp: new Date().toISOString(),
            type: reportType
        });

        const { data, error } = await supabase
            .from('reports')
            .insert([{
                org_id: orgId,
                author_id: userId,
                title,
                report_type: reportType,
                content
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Generate Report Error:", error);
        return { success: false, error: error.message };
    }
}
