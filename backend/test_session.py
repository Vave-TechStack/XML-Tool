import requests
from time import sleep 
import os
import subprocess

# Start server
server = subprocess.Popen(['venv\\Scripts\\python.exe', '-m', 'uvicorn', 'main:app', '--port', '8005'])
sleep(2)

base = 'http://127.0.0.1:8005/api'
print('Server started.')

try:
    admin_login = {'username': 'admin@vavetechstack.com', 'password': 'admin123'}
    
    print('\n--- 1. Login Device A ---')
    r1 = requests.post(f'{base}/auth/login', data=admin_login)
    token_A = r1.json().get('access_token')
    print('Token A Acquired.')
    
    print('\n--- 2. Verify Device A ---')
    r2 = requests.get(f'{base}/auth/me', headers={'Authorization': f'Bearer {token_A}'})
    print(f'Status: {r2.status_code} (Should be 200)')
    
    print('\n--- 3. Login Device B ---')
    r3 = requests.post(f'{base}/auth/login', data=admin_login)
    token_B = r3.json().get('access_token')
    print('Token B Acquired.')
    
    print('\n--- 4. Verify Device A Again (Should Fail) ---')
    r4 = requests.get(f'{base}/auth/me', headers={'Authorization': f'Bearer {token_A}'})
    print(f'Status: {r4.status_code} (Should be 401)')
    if r4.status_code == 401:
        print(f"Message: {r4.json().get('detail')}")

    print('\n--- 5. Verify Device B Again (Should Succeed) ---')
    r5 = requests.get(f'{base}/auth/me', headers={'Authorization': f'Bearer {token_B}'})
    print(f'Status: {r5.status_code} (Should be 200)')

finally:
    server.kill()
