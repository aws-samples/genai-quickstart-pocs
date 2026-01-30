"""
Sample file to test Bandit security scanning.
This file contains intentional security vulnerabilities for testing purposes.
DO NOT use these patterns in production code!
"""

import pickle
import subprocess
import os

# HIGH SEVERITY: Using pickle with untrusted data (B301)
def load_untrusted_data(data):
    """Pickle is unsafe for untrusted data"""
    return pickle.loads(data)

# HIGH SEVERITY: Using shell=True with subprocess (B602)
def execute_command(user_input):
    """Shell injection vulnerability"""
    subprocess.call(f"echo {user_input}", shell=True)

# MEDIUM SEVERITY: Using assert for security checks (B101)
def check_admin(user):
    """Assert should not be used for security"""
    assert user == "admin", "Not authorized"
    return True

# HIGH SEVERITY: SQL injection vulnerability (B608)
def get_user_data(username):
    """SQL injection risk"""
    import sqlite3
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    # Vulnerable to SQL injection
    query = f"SELECT * FROM users WHERE username = '{username}'"
    cursor.execute(query)
    return cursor.fetchall()

# MEDIUM SEVERITY: Hardcoded password (B105, B106)
API_KEY = "hardcoded-secret-key-12345"
PASSWORD = "admin123"

# HIGH SEVERITY: Using eval (B307)
def calculate(expression):
    """Eval is dangerous with user input"""
    return eval(expression)

# MEDIUM SEVERITY: Weak cryptographic hash (B303, B324)
import hashlib
def weak_hash(data):
    """MD5 is cryptographically broken"""
    return hashlib.md5(data.encode()).hexdigest()

# HIGH SEVERITY: Binding to all interfaces (B104)
def start_server():
    """Binding to 0.0.0.0 exposes service to all networks"""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('0.0.0.0', 8080))
    s.listen(1)

if __name__ == "__main__":
    print("This is a test file for Bandit security scanning")
    print("Expected to find multiple HIGH and MEDIUM severity issues")
