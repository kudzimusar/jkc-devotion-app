#!/usr/bin/env node
/**
 * Create Test Users via Signup
 * This creates auth users by signing them up (more reliable than admin API)
 *
 * Usage: npx tsx scripts/create-test-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = {
  corporate: {
    email: "test-corporate@church.os",
    password: "TestCorp123!",
    name: "Test Corporate Admin",
  },
  tenant: {
    email: "test-tenant@church.os",
    password: "TestTenant123!",
    name: "Test Tenant Pastor",
  },
  member: {
    email: "test-member@church.os",
    password: "TestMember123!",
    name: "Test Member",
  },
  onboarding: {
    email: "test-onboarding@church.os",
    password: "TestOnboard123!",
    name: "Test Onboarding User",
  },
};

async function createTestUsers() {
  console.log("👤 Creating test users in Supabase Auth...\n");

  const createdUsers: Record<string, string> = {};

  for (const [type, user] of Object.entries(TEST_USERS)) {
    try {
      console.log(`Creating ${type} user: ${user.email}`);

      // First, try to delete if exists (clean slate)
      try {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === user.email);
        if (existing) {
          await supabase.auth.admin.deleteUser(existing.id);
          console.log(`   ℹ️  Deleted existing user`);
        }
      } catch (deleteErr) {
        // Ignore delete errors
      }

      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
        },
      });

      if (error) {
        console.error(`   ❌ Failed to create: ${error.message}`);
        continue;
      }

      if (data?.user) {
        createdUsers[type] = data.user.id;
        console.log(`   ✅ Created: ${data.user.id}\n`);
      }
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}\n`);
    }
  }

  if (Object.keys(createdUsers).length === 0) {
    console.error("❌ Failed to create any users. Check your Supabase service role key.");
    process.exit(1);
  }

  console.log("============================================================");
  console.log("✅ USERS CREATED IN SUPABASE AUTH\n");
  console.log("Test Credentials:");
  console.log("─".repeat(60));

  for (const [type, user] of Object.entries(TEST_USERS)) {
    const url =
      type === "corporate"
        ? "/corporate/login"
        : type === "tenant"
          ? "/church/login"
          : type === "member"
            ? "/member/login"
            : type === "onboarding"
              ? "/onboarding/login"
              : "/login";
    console.log(`\n${type.toUpperCase()} (${url})`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n🧪 Next: Try logging in with these credentials");
  console.log("📝 Test at: http://localhost:3000/member/login\n");
}

createTestUsers();
