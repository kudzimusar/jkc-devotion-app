#!/bin/bash
# Create test users directly via Supabase REST API
# Usage: bash scripts/create-users-direct.sh

set -a
source .env.local
set +a

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo "👤 Creating test users via Supabase REST API..."
echo ""

# Function to create user
create_user() {
  local email=$1
  local password=$2
  local name=$3

  echo "Creating user: $email"

  # First delete if exists
  delete_response=$(curl -s -X DELETE \
    "${SUPABASE_URL}/auth/v1/admin/users/${email}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json")

  # Create user
  response=$(curl -s -X POST \
    "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${password}\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"name\": \"${name}\"
      }
    }")

  # Check response
  if echo "$response" | grep -q "\"id\""; then
    user_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   ✅ Created: $user_id"
  else
    echo "   ❌ Error: $(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
  fi

  echo ""
}

# Create all test users
create_user "test-corporate@church.os" "TestCorp123!" "Test Corporate Admin"
create_user "test-tenant@church.os" "TestTenant123!" "Test Tenant Pastor"
create_user "test-member@church.os" "TestMember123!" "Test Member"
create_user "test-onboarding@church.os" "TestOnboard123!" "Test Onboarding User"

echo "============================================================"
echo "✅ TEST USERS CREATION COMPLETE"
echo ""
echo "Test Credentials:"
echo "─".repeat(60)
echo ""
echo "CORPORATE (/corporate/login)"
echo "  Email:    test-corporate@church.os"
echo "  Password: TestCorp123!"
echo ""
echo "TENANT (/church/login)"
echo "  Email:    test-tenant@church.os"
echo "  Password: TestTenant123!"
echo ""
echo "MEMBER (/member/login)"
echo "  Email:    test-member@church.os"
echo "  Password: TestMember123!"
echo ""
echo "ONBOARDING (/onboarding/login)"
echo "  Email:    test-onboarding@church.os"
echo "  Password: TestOnboard123!"
echo ""
echo "============================================================"
echo ""
echo "🧪 Next: Try logging in with these credentials"
echo "📝 Start at: http://localhost:3000/member/login"
echo ""
