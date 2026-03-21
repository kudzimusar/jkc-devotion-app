"use server";
import { supabase } from "@/lib/supabase";

/**
 * Public/User Join Flow
 * Handles both auto-approval and pending requests
 */
export async function joinBibleStudyGroupAction(joinData: {
    groupId: string;
    userId: string;
    message?: string;
    shareToken?: string;
}) {
    try {
        const { groupId, userId, message, shareToken } = joinData;

        // 1. Fetch group settings
        const { data: group, error: gError } = await supabase
            .from('bible_study_groups')
            .select('requires_approval, is_private, share_token')
            .eq('id', groupId)
            .single();

        if (gError) throw gError;

        // 2. Validate invite token if private
        if (group.is_private && shareToken !== group.share_token) {
            throw new Error("Invalid or missing invite link for this private group.");
        }

        // 3. Logic: Join directly or Request
        if (!group.requires_approval) {
            // Join instantly
            const { error: jError } = await supabase
                .from('bible_study_group_members')
                .insert([{ group_id: groupId, user_id: userId }]);

            if (jError) {
                if (jError.code === '23505') throw new Error("You are already a member of this group.");
                throw jError;
            }

            return { success: true, status: 'joined' };
        } else {
            // Create pending request
            const { error: rError } = await supabase
                .from('bible_study_group_requests')
                .insert([{ group_id: groupId, user_id: userId, message, status: 'pending' }]);

            if (rError) {
                if (rError.code === '23505') throw new Error("You already have a pending request for this group.");
                throw rError;
            }

            return { success: true, status: 'pending' };
        }
    } catch (error: any) {
        console.error("Join Group Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Leader/Admin Approval Flow
 */
export async function handleJoinRequestAction(requestId: string, action: 'approved' | 'rejected') {
    try {
        // 1. Get request details
        const { data: request, error: rError } = await supabase
            .from('bible_study_group_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (rError) throw rError;

        if (action === 'approved') {
            // Add to members
            const { error: iError } = await supabase
                .from('bible_study_group_members')
                .insert([{ group_id: request.group_id, user_id: request.user_id }]);

            if (iError && iError.code !== '23505') throw iError;
        }

        // Update request status
        const { error: uError } = await supabase
            .from('bible_study_group_requests')
            .update({ status: action })
            .eq('id', requestId);

        if (uError) throw uError;

        return { success: true };
    } catch (error: any) {
        console.error("Handle Request Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Admin/Leader Direct Add
 */
export async function addGroupMemberAction(groupId: string, userId: string, role: string = 'member') {
    try {
        const { error } = await supabase
            .from('bible_study_group_members')
            .insert([{ group_id: groupId, user_id: userId, role }]);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error("Add Member Error:", error);
        return { success: false, error: error.message };
    }
}

export async function leaveGroupAction(groupId: string, userId: string) {
    try {
        const { error } = await supabase
            .from('bible_study_group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
