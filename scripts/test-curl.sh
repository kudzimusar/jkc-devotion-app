#!/bin/bash

# =========================================================================
# TEST SCRIPT for Next.js Edge Middleware
#
# INSTRUCTIONS:
# 1. Ensure your Next.js app is running locally (npm run dev)
# 2. Ensure your Supabase instance has the required tables (api_keys, organizations)
# 3. Create a test API key for an organization in Supabase.
#    Example Organization: testsite.com
#    Example API Key Hash matching "test_key_123"
#
# Replace the API_KEY variable below with your actual raw test key.
# =========================================================================

API_KEY="test_key_123"
URL="http://localhost:3000/api/v1/devotion/today"

echo "--------------------------------------------------------"
echo "TEST 1: Successful Request (Valid Key + Valid Domain)"
echo "--------------------------------------------------------"
curl -s -i -H "x-api-key: $API_KEY" -H "Origin: https://test-church.com" $URL
echo -e "\n\n"

echo "--------------------------------------------------------"
echo "TEST 2: Failed Request (Valid Key + WRONG Domain)"
echo "--------------------------------------------------------"
curl -s -i -H "x-api-key: $API_KEY" -H "Origin: https://hackersite.com" $URL
echo -e "\n\n"

echo "--------------------------------------------------------"
echo "TEST 3: Failed Request (Invalid Key)"
echo "--------------------------------------------------------"
curl -s -i -H "x-api-key: invalid_fake_key_000" -H "Origin: https://test-church.com" $URL
echo -e "\n\n"

echo "--------------------------------------------------------"
echo "TEST 4: Failed Request (Missing Key)"
echo "--------------------------------------------------------"
curl -s -i -H "Origin: https://test-church.com" $URL
echo -e "\n\n"
