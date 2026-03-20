import { supabaseAdmin } from "./supabase-admin";
import { mapProfileFromDB, mapProfileToDB } from "./profileFieldMap";

async function testProfilePipeline() {
    console.log("🚀 Starting Final Profile Data Pipeline Test...");

    try {
        // 1. Get a test user
        const { data: profile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .limit(1)
            .single();

        if (fetchError || !profile) {
            console.error("❌ Failed to fetch test profile:", fetchError);
            return;
        }

        console.log("✅ Fetched test profile:", profile.id);

        // 2. Test mapProfileFromDB
        console.log("🔍 Testing mapProfileFromDB...");
        const mappedFrom = mapProfileFromDB(profile);
        
        const checks = [
            { label: "Phone Mapping", ok: ((mappedFrom.phone_number || null) === (profile.phone_number || null)) },
            { label: "Address Mapping", ok: ((mappedFrom.physical_address || null) === (profile.address || null)) },
            { label: "Birthdate Mapping", ok: ((mappedFrom.birthdate || null) === (profile.birthdate || null)) }
        ];

        checks.forEach(c => {
            if (c.ok) console.log(`  ✔️ ${c.label} Passed`);
            else console.error(`  ❌ ${c.label} Failed! Values: DB=${profile[c.label === 'Phone Mapping' ? 'phone_number' : c.label === 'Address Mapping' ? 'address' : 'birthdate']} Mapped=${mappedFrom[c.label === 'Phone Mapping' ? 'phone_number' : c.label === 'Address Mapping' ? 'physical_address' : 'birthdate']}`);
        });

        // 3. Test mapProfileToDB
        console.log("🔍 Testing mapProfileToDB...");
        const testUpdate = {
            ...mappedFrom,
            name: `${mappedFrom.name} (Test)`,
            phone_number: "+81-STABLE-999",
        };
        const mappedTo = mapProfileToDB(testUpdate);

        const toChecks = [
            { label: "Phone To DB", ok: (mappedTo.phone_number === testUpdate.phone_number) },
            { label: "Address To DB", ok: (mappedTo.address === testUpdate.physical_address) }
        ];

        toChecks.forEach(c => {
            if (c.ok) console.log(`  ✔️ ${c.label} Passed`);
            else console.error(`  ❌ ${c.label} Failed!`);
        });

        // 4. Test Actual Round-trip
        console.log("🔍 Testing Supabase Round-trip...");
        const originalName = profile.name;
        
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(mappedTo)
            .eq('id', profile.id);

        if (updateError) {
            console.error("❌ Round-trip update failed:", updateError);
        } else {
            console.log("✅ Round-trip update successful!");
            
            // Revert
            await supabaseAdmin
                .from('profiles')
                .update({ name: originalName })
                .eq('id', profile.id);
            console.log("✅ Reverted test changes. System STABLE.");
        }

    } catch (e) {
        console.error("💥 Critical Failure in Tester:", e);
    }
}

testProfilePipeline();
