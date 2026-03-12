import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    print("Testing Registration Flow...")
    
    # 1. Register a new user
    reg_data = {
        "email": "newuser@example.com",
        "password": "password123",
        "role": "EMPLOYEE"
    }
    r = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
    print(f"Register Status: {r.status_code}")
    print(r.json())
    
    # 2. Try Logging in (should fail)
    print("\nTesting Login before approval...")
    login_data = {
        "username": "newuser@example.com",
        "password": "password123"
    }
    r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print(f"Login Status (Expected 400): {r.status_code}")
    print(r.json())

    # 3. Login as Admin
    print("\nLogging in as Super Admin...")
    admin_login = {
        "username": "admin@vavetechstack.com",
        "password": "admin123"
    }
    r = requests.post(f"{BASE_URL}/auth/login", data=admin_login)
    print(f"Admin Login Status: {r.status_code}")
    
    if r.status_code == 200:
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 4. Get all users
        print("\nFetching users to find the new user ID...")
        r = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        users = r.json()
        target_user = next((u for u in users if u["email"] == "newuser@example.com"), None)
        
        if target_user:
            user_id = target_user["id"]
            # 5. Approve User
            print(f"\nApproving user ID {user_id}...")
            r = requests.put(
                f"{BASE_URL}/admin/users/{user_id}/approve", 
                headers=headers,
                json={"role": "EMPLOYEE"}
            )
            print(f"Approval Status: {r.status_code}")
            print(r.json())
            
            # 6. Try Login Again (should succeed)
            print("\nTesting Login after approval...")
            r = requests.post(f"{BASE_URL}/auth/login", data=login_data)
            print(f"Login Status (Expected 200): {r.status_code}")
            if r.status_code == 200:
                print("Flow Success! User logged in.")
            else:
                print("Failed login after approval.", r.json())
        else:
            print("Could not find newly registered user in list.")

if __name__ == "__main__":
    test_flow()
