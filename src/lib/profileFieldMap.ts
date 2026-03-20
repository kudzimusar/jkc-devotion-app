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
    },
    // Spiritual Section
    spiritual: {
        salvation_date: 'salvation_date',
        baptism_status: 'baptism_status',
        baptism_date: 'baptism_date',
        // Missing in live DB: church_background
    },
    // Referral Section
    referral: {
        invite_method: 'invited_by', 
    },
    // Household Section
    household: {
        household_type: 'household_type',
        // Missing in live DB: head_id
    }
} as const;

/**
 * Transforms a raw Supabase profile object into a frontend-friendly form object.
 */
export function mapProfileFromDB(dbData: any) {
    if (!dbData) return {};
    
    return {
        // Identity
        name: dbData.name || "",
        phone_number: dbData.phone_number || "",
        gender: dbData.gender || "",
        birthdate: dbData.birthdate || "",
        physical_address: dbData.address || "",
        city: dbData.city || "",
        ward: dbData.ward || "",
        postal_code: dbData.postal_code || "",
        nationality: "", // Missing in DB
        preferred_language: dbData.preferred_language || "EN",
        years_in_japan: dbData.years_in_japan || 0,
        occupation: dbData.occupation || "",
        industry: "", // Missing in DB
        education_level: dbData.education_level || "",
        
        // Spiritual
        church_background: "", // Missing in DB
        salvation_date: dbData.salvation_date || "",
        baptism_status: dbData.baptism_status || "not_baptized",
        baptism_date: dbData.baptism_date || "",
        
        // Referral
        invited_by_name: dbData.invited_by || "",
        invite_method: dbData.invited_by || "",
        
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
        address: formData.physical_address || null,
        city: formData.city || null,
        ward: formData.ward || null,
        postal_code: formData.postal_code || null,
        preferred_language: formData.preferred_language || null,
        years_in_japan: formData.years_in_japan || 0,
        occupation: formData.occupation || null,
        education_level: formData.education_level || null,
        
        salvation_date: formData.salvation_date || null,
        baptism_status: formData.baptism_status || null,
        baptism_date: formData.baptism_date || null,
        
        invited_by: formData.invite_method || formData.invited_by_name || null,
        
        updated_at: new Date().toISOString()
    };

    // Safely exclude undefined/null values that shouldn't be overwritten
    Object.keys(update).forEach(key => (update[key] === undefined) && delete update[key]);

    return update;
}
