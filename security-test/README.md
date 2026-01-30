# Security Test Files

This directory contains intentional security vulnerabilities for testing the Bandit security scanner.

## Purpose

These files are used to verify that our automated Bandit security scanning in GitHub Actions is working correctly.

## Files

- `bandit_test_sample.py` - Contains intentional security issues including:
  - **HIGH Severity**: Shell injection (subprocess with shell=True)
  - **HIGH Severity**: Weak cryptographic hash (MD5)
  - **MEDIUM Severity**: SQL injection vulnerability
  - **MEDIUM Severity**: Use of eval()
  - **MEDIUM Severity**: Pickle deserialization
  - **MEDIUM Severity**: Binding to all interfaces
  - **LOW Severity**: Hardcoded passwords
  - **LOW Severity**: Use of assert for security checks

## Expected Results

When Bandit scans this repository, it should detect:
- 2 HIGH severity issues
- 4 MEDIUM severity issues  
- 4 LOW severity issues

## Warning

⚠️ **DO NOT use any code patterns from these test files in production!** ⚠️

These are intentionally vulnerable examples for testing purposes only.
