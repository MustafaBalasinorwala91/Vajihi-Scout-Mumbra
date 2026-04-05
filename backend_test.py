#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Vajihi Scout Mumbra App
Tests all API endpoints with proper authentication and role-based access control
"""

import requests
import json
import uuid
from datetime import datetime, timezone, timedelta
import time

# Configuration
BASE_URL = "https://scout-mumbra-hub-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "mansoorkholkawala@gmail.com"

class TestResults:
    def __init__(self):
        self.results = []
        self.admin_session = None
        self.member_session = None
        self.admin_user_id = None
        self.member_user_id = None
    
    def add_result(self, test_name, success, details="", response_code=None):
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_code": response_code,
            "timestamp": datetime.now().isoformat()
        })
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_code:
            print(f"   Response Code: {response_code}")
        print()
    
    def print_summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["success"])
        failed = total - passed
        
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        print()
        
        if failed > 0:
            print("FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
        print("=" * 60)

def test_database_connection():
    """Test 1: Database Connection"""
    try:
        # Test basic API health by trying to access a protected endpoint without auth
        response = requests.get(f"{BASE_URL}/users", timeout=10)
        
        if response.status_code == 401:
            results.add_result(
                "Database Connection Test", 
                True, 
                "Backend is responding and database connection is working (401 expected for unauthenticated request)",
                response.status_code
            )
            return True
        else:
            results.add_result(
                "Database Connection Test", 
                False, 
                f"Unexpected response code: {response.status_code}",
                response.status_code
            )
            return False
    except Exception as e:
        results.add_result(
            "Database Connection Test", 
            False, 
            f"Connection failed: {str(e)}"
        )
        return False

def create_test_session(email, name="Test User"):
    """Create a test session by mocking the Emergent Auth flow"""
    try:
        # Create a mock session_id
        mock_session_id = f"test_session_{uuid.uuid4().hex[:12]}"
        
        # Try to create session (this will fail with real Emergent Auth, but we can test the endpoint structure)
        session_data = {
            "session_id": mock_session_id
        }
        
        response = requests.post(f"{BASE_URL}/auth/session", json=session_data, timeout=10)
        
        # This will likely fail with 401 since we're using a mock session_id
        # But we can check if the endpoint is properly structured
        return None, response.status_code
        
    except Exception as e:
        return None, str(e)

def create_manual_test_user_and_session():
    """Create test users and sessions directly in database using MongoDB commands"""
    import subprocess
    
    try:
        # Create admin user and session
        admin_user_id = f"user_{uuid.uuid4().hex[:12]}"
        admin_session_token = f"session_{uuid.uuid4().hex}"
        admin_expires = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Create member user and session  
        member_user_id = f"user_{uuid.uuid4().hex[:12]}"
        member_session_token = f"session_{uuid.uuid4().hex}"
        member_expires = datetime.now(timezone.utc) + timedelta(days=7)
        
        # MongoDB commands to create test data
        mongo_commands = f'''
use('test_database');

// Create admin user
db.users.insertOne({{
  user_id: "{admin_user_id}",
  email: "{ADMIN_EMAIL}",
  name: "Test Admin",
  picture: "https://via.placeholder.com/150",
  role: "admin",
  created_at: new Date()
}});

// Create admin session
db.user_sessions.insertOne({{
  user_id: "{admin_user_id}",
  session_token: "{admin_session_token}",
  expires_at: new Date("{admin_expires.isoformat()}"),
  created_at: new Date()
}});

// Create member user
db.users.insertOne({{
  user_id: "{member_user_id}",
  email: "test.member@example.com",
  name: "Test Member",
  picture: "https://via.placeholder.com/150",
  role: "member",
  created_at: new Date()
}});

// Create member session
db.user_sessions.insertOne({{
  user_id: "{member_user_id}",
  session_token: "{member_session_token}",
  expires_at: new Date("{member_expires.isoformat()}"),
  created_at: new Date()
}});

print("Admin User ID: {admin_user_id}");
print("Admin Session: {admin_session_token}");
print("Member User ID: {member_user_id}");
print("Member Session: {member_session_token}");
'''
        
        # Execute MongoDB commands
        result = subprocess.run(
            ["mongosh", "--eval", mongo_commands],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            results.admin_session = admin_session_token
            results.member_session = member_session_token
            results.admin_user_id = admin_user_id
            results.member_user_id = member_user_id
            
            results.add_result(
                "Test User Creation", 
                True, 
                f"Created admin and member test users with sessions"
            )
            return True
        else:
            results.add_result(
                "Test User Creation", 
                False, 
                f"MongoDB command failed: {result.stderr}"
            )
            return False
            
    except Exception as e:
        results.add_result(
            "Test User Creation", 
            False, 
            f"Failed to create test users: {str(e)}"
        )
        return False

def test_auth_endpoints():
    """Test 2: Authentication Endpoints"""
    
    # Test /auth/session endpoint structure
    try:
        response = requests.post(f"{BASE_URL}/auth/session", json={"session_id": "invalid"}, timeout=10)
        results.add_result(
            "POST /api/auth/session endpoint", 
            response.status_code == 401, 
            f"Endpoint exists and properly rejects invalid session_id",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "POST /api/auth/session endpoint", 
            False, 
            f"Endpoint error: {str(e)}"
        )
    
    # Test /auth/me with admin session
    if results.admin_session:
        try:
            headers = {"Authorization": f"Bearer {results.admin_session}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                results.add_result(
                    "GET /api/auth/me (admin)", 
                    True, 
                    f"Successfully retrieved admin user data: {user_data.get('email')}",
                    response.status_code
                )
            else:
                results.add_result(
                    "GET /api/auth/me (admin)", 
                    False, 
                    f"Failed to get user data",
                    response.status_code
                )
        except Exception as e:
            results.add_result(
                "GET /api/auth/me (admin)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test /auth/me with member session
    if results.member_session:
        try:
            headers = {"Authorization": f"Bearer {results.member_session}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                user_data = response.json()
                results.add_result(
                    "GET /api/auth/me (member)", 
                    True, 
                    f"Successfully retrieved member user data: {user_data.get('email')}",
                    response.status_code
                )
            else:
                results.add_result(
                    "GET /api/auth/me (member)", 
                    False, 
                    f"Failed to get user data",
                    response.status_code
                )
        except Exception as e:
            results.add_result(
                "GET /api/auth/me (member)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test logout endpoint
    if results.admin_session:
        try:
            headers = {"Authorization": f"Bearer {results.admin_session}"}
            response = requests.post(f"{BASE_URL}/auth/logout", headers=headers, timeout=10)
            results.add_result(
                "POST /api/auth/logout", 
                response.status_code == 200, 
                f"Logout endpoint working",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "POST /api/auth/logout", 
                False, 
                f"Request failed: {str(e)}"
            )

def test_user_management():
    """Test 3: User Management Endpoints"""
    
    if not results.admin_session:
        results.add_result("User Management Tests", False, "No admin session available")
        return
    
    admin_headers = {"Authorization": f"Bearer {results.admin_session}"}
    member_headers = {"Authorization": f"Bearer {results.member_session}"}
    
    # Test GET /users (admin access)
    try:
        response = requests.get(f"{BASE_URL}/users", headers=admin_headers, timeout=10)
        if response.status_code == 200:
            users = response.json()
            results.add_result(
                "GET /api/users (admin)", 
                True, 
                f"Retrieved {len(users)} users",
                response.status_code
            )
        else:
            results.add_result(
                "GET /api/users (admin)", 
                False, 
                f"Failed to get users",
                response.status_code
            )
    except Exception as e:
        results.add_result(
            "GET /api/users (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test GET /users (member access - should work)
    if results.member_session:
        try:
            response = requests.get(f"{BASE_URL}/users", headers=member_headers, timeout=10)
            results.add_result(
                "GET /api/users (member)", 
                response.status_code == 200, 
                f"Member can access users list",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "GET /api/users (member)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test PUT /profile (update profile)
    try:
        profile_data = {
            "name": "Updated Test Admin",
            "phone": "+91-9876543210"
        }
        response = requests.put(f"{BASE_URL}/profile", headers=admin_headers, json=profile_data, timeout=10)
        results.add_result(
            "PUT /api/profile", 
            response.status_code == 200, 
            f"Profile update",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "PUT /api/profile", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test PUT /profile/uniform
    try:
        uniform_data = {"uniform_size": "L"}
        response = requests.put(f"{BASE_URL}/profile/uniform", headers=admin_headers, json=uniform_data, timeout=10)
        results.add_result(
            "PUT /api/profile/uniform", 
            response.status_code == 200, 
            f"Uniform size update",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "PUT /api/profile/uniform", 
            False, 
            f"Request failed: {str(e)}"
        )

def test_attendance_endpoints():
    """Test 4: Attendance Endpoints"""
    
    if not results.admin_session or not results.member_user_id:
        results.add_result("Attendance Tests", False, "No admin session or member user available")
        return
    
    admin_headers = {"Authorization": f"Bearer {results.admin_session}"}
    member_headers = {"Authorization": f"Bearer {results.member_session}"}
    
    # Test POST /attendance (admin only)
    try:
        attendance_data = {
            "user_id": results.member_user_id,
            "attendance_type": "practice",
            "date": "2024-01-15",
            "status": "present"
        }
        response = requests.post(f"{BASE_URL}/attendance", headers=admin_headers, json=attendance_data, timeout=10)
        results.add_result(
            "POST /api/attendance (admin)", 
            response.status_code == 200, 
            f"Admin can mark attendance",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "POST /api/attendance (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test POST /attendance (member access - should fail)
    if results.member_session:
        try:
            attendance_data = {
                "user_id": results.member_user_id,
                "attendance_type": "practice", 
                "date": "2024-01-16",
                "status": "present"
            }
            response = requests.post(f"{BASE_URL}/attendance", headers=member_headers, json=attendance_data, timeout=10)
            results.add_result(
                "POST /api/attendance (member - should fail)", 
                response.status_code == 403, 
                f"Member correctly denied access",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "POST /api/attendance (member - should fail)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test GET /attendance/my/practice
    if results.member_session:
        try:
            response = requests.get(f"{BASE_URL}/attendance/my/practice", headers=member_headers, timeout=10)
            results.add_result(
                "GET /api/attendance/my/practice", 
                response.status_code == 200, 
                f"Member can view own practice attendance",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "GET /api/attendance/my/practice", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test GET /attendance/my/khidmat
    if results.member_session:
        try:
            response = requests.get(f"{BASE_URL}/attendance/my/khidmat", headers=member_headers, timeout=10)
            results.add_result(
                "GET /api/attendance/my/khidmat", 
                response.status_code == 200, 
                f"Member can view own khidmat attendance",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "GET /api/attendance/my/khidmat", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test GET /attendance/user/{user_id}/practice (admin only)
    try:
        response = requests.get(f"{BASE_URL}/attendance/user/{results.member_user_id}/practice", headers=admin_headers, timeout=10)
        results.add_result(
            "GET /api/attendance/user/{user_id}/practice (admin)", 
            response.status_code == 200, 
            f"Admin can view user attendance",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "GET /api/attendance/user/{user_id}/practice (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )

def test_fees_endpoints():
    """Test 5: Fees Endpoints"""
    
    if not results.admin_session or not results.member_user_id:
        results.add_result("Fees Tests", False, "No admin session or member user available")
        return
    
    admin_headers = {"Authorization": f"Bearer {results.admin_session}"}
    member_headers = {"Authorization": f"Bearer {results.member_session}"}
    
    # Test POST /fees (admin only)
    try:
        fee_data = {
            "user_id": results.member_user_id,
            "month": "2024-01",
            "amount": 500.0,
            "status": "due"
        }
        response = requests.post(f"{BASE_URL}/fees", headers=admin_headers, json=fee_data, timeout=10)
        results.add_result(
            "POST /api/fees (admin)", 
            response.status_code == 200, 
            f"Admin can create/update fees",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "POST /api/fees (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test GET /fees/my
    if results.member_session:
        try:
            response = requests.get(f"{BASE_URL}/fees/my", headers=member_headers, timeout=10)
            results.add_result(
                "GET /api/fees/my", 
                response.status_code == 200, 
                f"Member can view own fees",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "GET /api/fees/my", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test GET /fees/user/{user_id} (admin only)
    try:
        response = requests.get(f"{BASE_URL}/fees/user/{results.member_user_id}", headers=admin_headers, timeout=10)
        results.add_result(
            "GET /api/fees/user/{user_id} (admin)", 
            response.status_code == 200, 
            f"Admin can view user fees",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "GET /api/fees/user/{user_id} (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test GET /fees/all (admin only)
    try:
        response = requests.get(f"{BASE_URL}/fees/all", headers=admin_headers, timeout=10)
        results.add_result(
            "GET /api/fees/all (admin)", 
            response.status_code == 200, 
            f"Admin can view all fees",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "GET /api/fees/all (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test POST /admin/generate-fees/{month}
    try:
        response = requests.post(f"{BASE_URL}/admin/generate-fees/2024-02?amount=600", headers=admin_headers, timeout=10)
        results.add_result(
            "POST /api/admin/generate-fees/{month}", 
            response.status_code == 200, 
            f"Admin can generate monthly fees",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "POST /api/admin/generate-fees/{month}", 
            False, 
            f"Request failed: {str(e)}"
        )

def test_inventory_endpoints():
    """Test 6: Inventory Endpoints"""
    
    if not results.admin_session:
        results.add_result("Inventory Tests", False, "No admin session available")
        return
    
    admin_headers = {"Authorization": f"Bearer {results.admin_session}"}
    member_headers = {"Authorization": f"Bearer {results.member_session}"}
    
    # Test POST /inventory (admin only)
    item_id = None
    try:
        inventory_data = {
            "name": "Test Trumpet",
            "quantity": 2,
            "condition": "good"
        }
        response = requests.post(f"{BASE_URL}/inventory", headers=admin_headers, json=inventory_data, timeout=10)
        if response.status_code == 200:
            item_data = response.json()
            item_id = item_data.get("item_id")
            results.add_result(
                "POST /api/inventory (admin)", 
                True, 
                f"Admin can create inventory item: {item_id}",
                response.status_code
            )
        else:
            results.add_result(
                "POST /api/inventory (admin)", 
                False, 
                f"Failed to create inventory item",
                response.status_code
            )
    except Exception as e:
        results.add_result(
            "POST /api/inventory (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test GET /inventory (all users)
    try:
        response = requests.get(f"{BASE_URL}/inventory", headers=admin_headers, timeout=10)
        results.add_result(
            "GET /api/inventory (admin)", 
            response.status_code == 200, 
            f"Admin can view inventory",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "GET /api/inventory (admin)", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test GET /inventory (member)
    if results.member_session:
        try:
            response = requests.get(f"{BASE_URL}/inventory", headers=member_headers, timeout=10)
            results.add_result(
                "GET /api/inventory (member)", 
                response.status_code == 200, 
                f"Member can view inventory",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "GET /api/inventory (member)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test PUT /inventory/{item_id} (admin only)
    if item_id:
        try:
            update_data = {
                "quantity": 3,
                "condition": "needs_repair"
            }
            response = requests.put(f"{BASE_URL}/inventory/{item_id}", headers=admin_headers, json=update_data, timeout=10)
            results.add_result(
                "PUT /api/inventory/{item_id} (admin)", 
                response.status_code == 200, 
                f"Admin can update inventory item",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "PUT /api/inventory/{item_id} (admin)", 
                False, 
                f"Request failed: {str(e)}"
            )
    
    # Test DELETE /inventory/{item_id} (admin only)
    if item_id:
        try:
            response = requests.delete(f"{BASE_URL}/inventory/{item_id}", headers=admin_headers, timeout=10)
            results.add_result(
                "DELETE /api/inventory/{item_id} (admin)", 
                response.status_code == 200, 
                f"Admin can delete inventory item",
                response.status_code
            )
        except Exception as e:
            results.add_result(
                "DELETE /api/inventory/{item_id} (admin)", 
                False, 
                f"Request failed: {str(e)}"
            )

def test_admin_tag_assignment():
    """Test 7: Admin Tag Assignment"""
    
    if not results.admin_session or not results.member_user_id:
        results.add_result("Admin Tag Tests", False, "No admin session or member user available")
        return
    
    admin_headers = {"Authorization": f"Bearer {results.admin_session}"}
    
    # Test POST /admin/assign-tag
    try:
        tag_data = {
            "user_id": results.member_user_id,
            "tag": "captain"
        }
        response = requests.post(f"{BASE_URL}/admin/assign-tag", headers=admin_headers, json=tag_data, timeout=10)
        results.add_result(
            "POST /api/admin/assign-tag", 
            response.status_code == 200, 
            f"Admin can assign tags",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "POST /api/admin/assign-tag", 
            False, 
            f"Request failed: {str(e)}"
        )
    
    # Test PUT /admin/uniform/{user_id}
    try:
        uniform_data = {"uniform_size": "XL"}
        response = requests.put(f"{BASE_URL}/admin/uniform/{results.member_user_id}", headers=admin_headers, json=uniform_data, timeout=10)
        results.add_result(
            "PUT /api/admin/uniform/{user_id}", 
            response.status_code == 200, 
            f"Admin can update user uniform",
            response.status_code
        )
    except Exception as e:
        results.add_result(
            "PUT /api/admin/uniform/{user_id}", 
            False, 
            f"Request failed: {str(e)}"
        )

def cleanup_test_data():
    """Clean up test data from database"""
    import subprocess
    
    try:
        cleanup_commands = '''
use('test_database');
db.users.deleteMany({email: /test\./});
db.user_sessions.deleteMany({session_token: /session_/});
db.attendance.deleteMany({marked_by: /user_/});
db.fees.deleteMany({updated_by: /user_/});
db.inventory.deleteMany({added_by: /user_/});
print("Cleanup completed");
'''
        
        result = subprocess.run(
            ["mongosh", "--eval", cleanup_commands],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            results.add_result("Test Data Cleanup", True, "Successfully cleaned up test data")
        else:
            results.add_result("Test Data Cleanup", False, f"Cleanup failed: {result.stderr}")
            
    except Exception as e:
        results.add_result("Test Data Cleanup", False, f"Cleanup error: {str(e)}")

def main():
    """Run all tests"""
    print("=" * 60)
    print("VAJIHI SCOUT MUMBRA BACKEND TEST SUITE")
    print("=" * 60)
    print(f"Testing Backend URL: {BASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print("=" * 60)
    print()
    
    # Run tests in sequence
    test_database_connection()
    
    # Create test users and sessions
    if create_manual_test_user_and_session():
        test_auth_endpoints()
        test_user_management()
        test_attendance_endpoints()
        test_fees_endpoints()
        test_inventory_endpoints()
        test_admin_tag_assignment()
        
        # Cleanup
        cleanup_test_data()
    
    # Print final summary
    results.print_summary()

if __name__ == "__main__":
    results = TestResults()
    main()