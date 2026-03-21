// Converted to client-side functions for output: export compatibility
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
        return { success: false, error: error.message || "Failed to add member" };
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
        return { success: false, error: error.message || "Failed to create event" };
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
        return { success: false, error: error.message || "Failed to add prayer request" };
    }
}

export async function assignMinistryRoleAction(memberId: string, role: string, ministry: string, adminId: string, orgId?: string) {
    try {
        const { data, error } = await supabase
            .from('ministry_members')
            .insert([{
                user_id: memberId,
                ministry_name: ministry,
                ministry_role: role,
                invited_by: adminId,
                org_id: orgId,
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Assign Role Error:", error);
        return { success: false, error: error.message || "Failed to assign role" };
    }
}

export async function sendPastoralMessageAction(params: {
    receiverId: string,
    senderId: string,
    orgId: string,
    body: string,
    subject?: string
}) {
    try {
        const { receiverId, senderId, orgId, body, subject = "Pastoral Guidance" } = params;

        const { data, error } = await supabase
            .from('pastoral_messages')
            .insert([{
                receiver_id: receiverId,
                sender_id: senderId,
                org_id: orgId,
                body,
                subject
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error("Send Message Error:", error);
        return { success: false, error: error.message || "Failed to send message" };
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
        return { success: false, error: error.message || "Failed to generate report" };
    }
}

export async function createBibleStudyGroupAction(groupData: any) {
    try {
        const { 
            name, description, meeting_link, meeting_time, 
            meeting_day, meeting_type, curriculum, orgId, leader_id,
            assistant_leader_id, is_private = false, requires_approval = false, 
            max_members = 50, location
        } = groupData;

        // Note: share_token is handled by DB default (uuid_generate_v4)
        const { data, error } = await supabase
            .from('bible_study_groups')
            .insert([{
                name,
                description,
                meeting_link,
                meeting_time,
                meeting_day,
                meeting_type,
                curriculum,
                org_id: orgId,
                leader_id,
                assistant_leader_id: assistant_leader_id || null,
                is_private,
                requires_approval,
                max_members,
                location,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            console.error("Supabase Error details:", error);
            throw error;
        }
        return { success: true, data };
    } catch (error: any) {
        console.error("Create Bible Study Group Error:", error);
        return { success: false, error: error.message || "Failed to create group" };
    }
}

export async function updateBibleStudyGroupAction(groupId: string, groupData: any) {
    try {
        const { 
            name, description, meeting_link, meeting_time, 
            meeting_day, meeting_type, curriculum, leader_id,
            assistant_leader_id, is_private, requires_approval, 
            max_members, location, is_active
        } = groupData;

        const { data, error } = await supabase
            .from('bible_study_groups')
            .update({
                name,
                description,
                meeting_link,
                meeting_time,
                meeting_day,
                meeting_type,
                curriculum,
                leader_id,
                assistant_leader_id: assistant_leader_id || null,
                is_private,
                requires_approval,
                max_members,
                location,
                is_active
            })
            .eq('id', groupId)
            .select()
            .single();

        if (error) {
            console.error("Supabase Update Error:", error);
            throw error;
        }
        return { success: true, data };
    } catch (error: any) {
        console.error("Update Bible Study Group Error:", error);
        return { success: false, error: error.message || "Failed to update group" };
    }
}
