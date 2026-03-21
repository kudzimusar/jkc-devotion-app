/**
 * Profile Field Mapping Layer
 * 
 * This module provides a single source of truth for mapping frontend form keys
 * to backend database columns. This is specifically tuned to the ACTUAL 
 * live Supabase schema (dapxrorkcvpzzkggopsa).
 */

export const PROFILE_FIELD_MAP = {
    // Identity Section
    identity: {
        name: 'name',
        phone_number: 'phone_number', 
        gender: 'gender',
        birthdate: 'birthdate',
        physical_address: 'address',
        city: 'city',
        ward: 'ward',
        postal_code: 'postal_code',
        occupation: 'occupation',
        education_level: 'education_level',
        years_in_japan: 'years_in_japan',
        preferred_language: 'preferred_language',
        nationality: 'nationality',
        industry: 'industry',
        preferred_communication: 'preferred_communication',
        invite_method: 'invite_method',
        invited_by_name: 'invited_by_name',
    },
    // Spiritual Section
    spiritual: {
        salvation_date: 'salvation_date',
        baptism_status: 'baptism_status',
        baptism_date: 'baptism_date',
        church_background: 'church_background',
        membership_date: 'membership_date',
        foundation_class_date: 'foundation_class_date',
    },
    // Referral Section
    referral: {
        invite_method: 'invite_method',
        invited_by_name: 'invited_by_name',
    },
    // Household Section
    household: {
        household_type: 'household_type',
        head_id: 'head_id'
    }
} as const;

/**
 * Transforms a raw Supabase profile object into a frontend-friendly form object.
 */
export function mapProfileFromDB(dbData: any) {
    if (!dbData) return {};
    
    return {
        // Identity
        id: dbData.id,
        name: dbData.name || "",
        phone_number: dbData.phone_number || "",
        gender: dbData.gender || "",
        birthdate: dbData.birthdate || "",
        marital_status: dbData.marital_status || "",
        wedding_anniversary: dbData.wedding_anniversary || "",
        physical_address: dbData.physical_address || "",
        city: dbData.city || "",
        ward: dbData.ward || "",
        postal_code: dbData.postal_code || "",
        nationality: dbData.nationality || "",
        preferred_language: dbData.preferred_language || "EN",
        preferred_communication: dbData.preferred_communication || "email",
        years_in_japan: dbData.years_in_japan || 0,
        occupation: dbData.occupation || "",
        industry: dbData.industry || "",
        education_level: dbData.education_level || "",
        
        // Giving & Tithe
        tithe_status: dbData.tithe_status || false,
        preferred_giving_method: dbData.preferred_giving_method || "bank_transfer",

        // Spiritual
        church_background: dbData.church_background || "",
        salvation_date: dbData.salvation_date || "",
        baptism_status: dbData.baptism_status || "not_baptized",
        baptism_date: dbData.baptism_date || "",
        membership_date: dbData.membership_date || "",
        foundation_class_date: dbData.foundation_class_date || "",
        foundations_completed: dbData.foundations_completed ?? false,
        
        // Referral
        invited_by_name: dbData.invited_by_name || "",
        invite_method: dbData.invite_method || "",
        
        // Household
        head_id: dbData.head_id || null,
        household_type: dbData.household_type || "single",
        
        // Context
        org_id: dbData.org_id,
        membership_status: dbData.membership_status || 'visitor',
        growth_stage: dbData.growth_stage || 'visitor',
    };
}

/**
 * Transforms a frontend form object into a backend-ready database update object.
 * Only includes columns known to exist in the live schema.
 */
export function mapProfileToDB(formData: any) {
    if (!formData) return {};
    
    const update: any = {
        name: formData.name,
        phone_number: formData.phone_number || null,
        gender: formData.gender || null,
        birthdate: formData.birthdate || null,
        marital_status: formData.marital_status || null,
        wedding_anniversary: formData.wedding_anniversary || null,
        physical_address: formData.physical_address || null,
        city: formData.city || null,
        ward: formData.ward || null,
        postal_code: formData.postal_code || null,
        nationality: formData.nationality || null,
        preferred_communication: formData.preferred_communication || 'email',
        preferred_language: formData.preferred_language || null,
        years_in_japan: formData.years_in_japan || 0,
        occupation: formData.occupation || null,
        industry: formData.industry || null,
        education_level: formData.education_level || null,
        
        // Giving
        tithe_status: formData.tithe_status ?? false,
        preferred_giving_method: formData.preferred_giving_method || null,

        church_background: formData.church_background || null,
        salvation_date: formData.salvation_date || null,
        baptism_status: formData.baptism_status || null,
        baptism_date: formData.baptism_date || null,
        membership_date: formData.membership_date || null,
        foundation_class_date: formData.foundation_class_date || null,
        foundations_completed: formData.foundations_completed ?? null,
        
        invite_method: formData.invite_method || null,
        invited_by_name: formData.invited_by_name || null,
        head_id: formData.head_id || null,
        household_type: formData.household_type || null,
        
        updated_at: new Date().toISOString()
    };

    // Safely exclude undefined/null values that shouldn't be overwritten
    Object.keys(update).forEach(key => (update[key] === undefined) && delete update[key]);

    return update;
}
