# Automated Security Scanning with Bandit

This repository uses [Bandit](https://bandit.readthedocs.io/) to automatically scan Python code for security vulnerabilities.

## How It Works

The security scan runs automatically on:
- Every push to `main`, `master`, or `develop` branches
- Every pull request to these branches
- Manual trigger via GitHub Actions UI

## Build Failure Policy

The build will **FAIL** if any of the following are detected:
- ❌ **HIGH severity** security issues
- ❌ **MEDIUM severity** security issues

The build will **PASS** with informational notices for:
- ℹ️ **LOW severity** issues (informational only)

## What You'll See

### When Issues Are Found

The workflow will display:
1. **Summary counts** by severity level
2. **Detailed issue reports** including:
   - Test ID and description
   - File location and line number
   - Confidence level
   - CWE reference
   - Link to documentation
3. **GitHub annotations** directly on the affected lines in your PR
4. **Clear action required message** with resolution options

### Example Output

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ❌ ❌ ❌  SECURITY ISSUES DETECTED - BUILD FAILED  ❌ ❌ ❌  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🔴 HIGH SEVERITY ISSUES (MUST FIX) 🔴
═══════════════════════════════════════════════════════════════

🔴 Issue #1: B602
   Description: subprocess call with shell=True identified
   Location: example.py:42
   Confidence: HIGH
```

## How to Resolve Issues

### Option 1: Fix the Security Issue (Recommended)

Review the issue description and documentation link, then update your code to use secure alternatives.

**Example:**
```python
# ❌ Insecure
subprocess.call(f"echo {user_input}", shell=True)

# ✅ Secure
subprocess.call(["echo", user_input])
```

### Option 2: Mark as False Positive

If you've verified the code is safe, add a `# nosec` comment with justification:

```python
# This is safe because input is validated against a whitelist
subprocess.call(command, shell=True)  # nosec B602
```

### Option 3: Configure Bandit (Not Recommended)

Edit `.bandit` to skip specific tests, but document why:

```ini
[bandit]
# Skip B101 because we use assert only in test files
skips = B101
```

## GitHub Security Integration

Security scan results are also uploaded to the **GitHub Security** tab:
1. Go to your repository
2. Click **Security** → **Code scanning alerts**
3. View detailed SARIF reports

## Configuration Files

- `.github/workflows/bandit-security-scan.yml` - GitHub Actions workflow
- `.bandit` - Bandit configuration (exclusions, test selection)

## Testing the Scanner

The `security-test/` directory contains intentional vulnerabilities for testing. Remove this directory in production.

## Resources

- [Bandit Documentation](https://bandit.readthedocs.io/)
- [Common Weakness Enumeration (CWE)](https://cwe.mitre.org/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
