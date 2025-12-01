#!/bin/bash

# VatavaranTrack Backend API Test Script
# This script tests all backend endpoints

BASE_URL="http://localhost:4000"
API_URL="$BASE_URL/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Function to print test results
print_test() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo "======================================"
echo "VatavaranTrack API Test Suite"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$RESPONSE" -eq 200 ]; then
    print_test 0 "Health check endpoint"
else
    print_test 1 "Health check endpoint (got $RESPONSE)"
fi

# Test 2: Signup (STAFF)
echo ""
echo "2. Testing Signup..."
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Staff",
    "email": "teststaff@example.com",
    "password": "password123"
  }')

STAFF_TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$STAFF_TOKEN" ]; then
    print_test 0 "User signup (STAFF)"
    echo "   Token: ${STAFF_TOKEN:0:20}..."
else
    print_test 1 "User signup (STAFF)"
    echo "   Response: $SIGNUP_RESPONSE"
fi

# Test 3: Login
echo ""
echo "3. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststaff@example.com",
    "password": "password123"
  }')

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$LOGIN_TOKEN" ]; then
    print_test 0 "User login"
else
    print_test 1 "User login"
    echo "   Response: $LOGIN_RESPONSE"
fi

# Test 4: Create Pickup (STAFF)
echo ""
echo "4. Testing Create Pickup..."
CREATE_PICKUP=$(curl -s -X POST "$API_URL/pickups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{
    "category": "Plastic",
    "weight": 5.5,
    "latitude": 19.0760,
    "longitude": 72.8777,
    "imageUrl": "https://example.com/image.jpg"
  }')

PICKUP_ID=$(echo $CREATE_PICKUP | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -n "$PICKUP_ID" ]; then
    print_test 0 "Create pickup (STAFF)"
    echo "   Pickup ID: $PICKUP_ID"
else
    print_test 1 "Create pickup (STAFF)"
    echo "   Response: $CREATE_PICKUP"
fi

# Test 5: Get My Pickups (STAFF)
echo ""
echo "5. Testing Get My Pickups..."
MY_PICKUPS=$(curl -s -X GET "$API_URL/pickups/my?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $STAFF_TOKEN")

if echo "$MY_PICKUPS" | grep -q "\"id\":"; then
    print_test 0 "Get my pickups with sorting (STAFF)"
else
    print_test 1 "Get my pickups with sorting (STAFF)"
fi

# Test 6: Update Pickup (STAFF)
echo ""
echo "6. Testing Update Pickup..."
if [ -n "$PICKUP_ID" ]; then
    UPDATE_PICKUP=$(curl -s -X PUT "$API_URL/pickups/$PICKUP_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $STAFF_TOKEN" \
      -d '{
        "weight": 6.0,
        "category": "Organic"
      }')
    
    if echo "$UPDATE_PICKUP" | grep -q "updated successfully"; then
        print_test 0 "Update pickup (STAFF)"
    else
        print_test 1 "Update pickup (STAFF)"
    fi
else
    print_test 1 "Update pickup (STAFF) - No pickup ID"
fi

# Test 7: Unauthorized Access (STAFF trying to access supervisor route)
echo ""
echo "7. Testing Authorization..."
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/pickups" \
  -H "Authorization: Bearer $STAFF_TOKEN")

if [ "$UNAUTH_RESPONSE" -eq 403 ]; then
    print_test 0 "Authorization check (STAFF blocked from supervisor route)"
else
    print_test 1 "Authorization check (expected 403, got $UNAUTH_RESPONSE)"
fi

# Test 8: Delete Pickup (STAFF)
echo ""
echo "8. Testing Delete Pickup..."
if [ -n "$PICKUP_ID" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/pickups/$PICKUP_ID" \
      -H "Authorization: Bearer $STAFF_TOKEN")
    
    if echo "$DELETE_RESPONSE" | grep -q "deleted successfully"; then
        print_test 0 "Delete pickup (STAFF)"
    else
        print_test 1 "Delete pickup (STAFF)"
    fi
else
    print_test 1 "Delete pickup (STAFF) - No pickup ID"
fi

# Test 9: Invalid Token
echo ""
echo "9. Testing Invalid Token..."
INVALID_TOKEN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/pickups/my" \
  -H "Authorization: Bearer invalid_token_here")

if [ "$INVALID_TOKEN_RESPONSE" -eq 403 ] || [ "$INVALID_TOKEN_RESPONSE" -eq 401 ]; then
    print_test 0 "Invalid token rejection"
else
    print_test 1 "Invalid token rejection (expected 401/403, got $INVALID_TOKEN_RESPONSE)"
fi

# Test 10: Missing Required Fields
echo ""
echo "10. Testing Validation..."
VALIDATION_RESPONSE=$(curl -s -X POST "$API_URL/pickups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAFF_TOKEN" \
  -d '{
    "category": "Plastic"
  }')

if echo "$VALIDATION_RESPONSE" | grep -q "Missing required fields"; then
    print_test 0 "Input validation"
else
    print_test 1 "Input validation"
fi

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}"
    exit 1
fi
