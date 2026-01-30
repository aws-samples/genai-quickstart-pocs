# What Happens When Security Scan Fails

This guide explains what developers will see when the Bandit security scan detects issues.

## 🔴 Visual Indicators

### 1. Pull Request Overview
When you open your PR, you'll see:
```
❌ Some checks were not successful
   ❌ Bandit Security Scan — Failed
      [Details] [Re-run]
```

### 2. PR Comment (Automatic)
A bot will post a comment on your PR:

```markdown
## 🔒 Bandit Security Scan Results

📊 **Summary:** 6 total issues found
- 🔴 **HIGH:** 2
- 🟡 **MEDIUM:** 4
- 🟢 **LOW:** 0

---

### ❌ Build Failed - Action Required

Found **6 critical security issues** that must be fixed before merging.

#### 🔴 HIGH Severity Issues

1. **B602**: subprocess call with shell=True identified, security issue
   - **File:** `security-test/bandit_test_sample.py:19`
   - **Confidence:** HIGH
   - [Documentation](https://bandit.readthedocs.io/...)

2. **B324**: Use of weak MD5 hash for security
   - **File:** `security-test/bandit_test_sample.py:51`
   - **Confidence:** HIGH
   - [Documentation](https://bandit.readthedocs.io/...)

---

### 🔧 How to Fix

1. Review each issue using the documentation links above
2. Fix the security vulnerabilities in your code
3. If false positive, add `# nosec` comment with justification
4. Push your changes to re-run the scan
```

### 3. Files Changed Tab - Inline Annotations
When viewing the "Files changed" tab, you'll see red error boxes directly on the problematic lines:

```python
def execute_command(user_input):
    """Shell injection vulnerability"""
    subprocess.call(f"echo {user_input}", shell=True)  # ⚠️ Bandit B602 (HIGH): subprocess call with shell=True identified, security issue
```

### 4. Checks Tab - Detailed Log
Click "Details" on the failed check to see the full workflow log:

```
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ❌ ❌ ❌  SECURITY ISSUES DETECTED - BUILD FAILED  ❌ ❌ ❌  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

🔴 HIGH SEVERITY ISSUES (MUST FIX) 🔴
═══════════════════════════════════════════════════════════════

🔴 Issue #1: B602
   Description: subprocess call with shell=True identified, security issue
   Location: security-test/bandit_test_sample.py:19
   Confidence: HIGH
   CWE: 78
   Documentation: https://bandit.readthedocs.io/en/1.9.3/plugins/b602_subprocess_popen_with_shell_equals_true.html
```

### 5. Security Tab
Navigate to **Security** → **Code scanning alerts** to see:
- All security issues in one place
- Filter by severity (HIGH, MEDIUM, LOW)
- See which branches are affected
- Track when issues were introduced

## 📧 Notifications

Developers receive notifications through:

1. **Email** (if enabled in GitHub settings)
   - Subject: "Action failed: Bandit Security Scan"
   - Includes link to workflow run

2. **GitHub Notifications** (bell icon)
   - "Workflow run failed in [repo-name]"
   - Click to view details

3. **PR Status Updates**
   - Real-time updates when checks complete
   - Shows in PR timeline

## 🚫 Branch Protection

If branch protection is enabled (recommended):
- PR **cannot be merged** until checks pass
- "Merge" button is disabled
- Red banner: "Required checks must pass before merging"

## ✅ How to Resolve

### Step 1: Understand the Issue
Click the documentation link for each issue to understand:
- Why it's a security problem
- How attackers could exploit it
- Recommended secure alternatives

### Step 2: Fix the Code
Example fix for shell injection (B602):

**Before (Insecure):**
```python
subprocess.call(f"echo {user_input}", shell=True)  # ❌ Vulnerable
```

**After (Secure):**
```python
subprocess.call(["echo", user_input])  # ✅ Safe
```

### Step 3: False Positives
If you've verified the code is safe, add a `# nosec` comment:

```python
# This is safe because input is validated against a whitelist
subprocess.call(command, shell=True)  # nosec B602
```

**Important:** Always include a comment explaining WHY it's safe!

### Step 4: Push and Verify
- Commit your fixes
- Push to your branch
- The scan will run automatically
- Check that it passes (green ✅)

## 🎯 Quick Reference

| Severity | Build Status | Action Required |
|----------|--------------|-----------------|
| 🔴 HIGH | ❌ FAILS | Must fix before merge |
| 🟡 MEDIUM | ❌ FAILS | Must fix before merge |
| 🟢 LOW | ✅ PASSES | Informational only |

## 💡 Tips

1. **Run locally first:** Use `bandit -r . -f screen` before pushing
2. **Check annotations:** Look at the "Files changed" tab for inline errors
3. **Read documentation:** Each issue links to detailed explanations
4. **Ask for help:** If unsure, ask in the PR comments or team chat
5. **Don't ignore:** Security issues can lead to serious vulnerabilities

## 📚 Resources

- [Bandit Documentation](https://bandit.readthedocs.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Database](https://cwe.mitre.org/)
- Repository: `SECURITY_SCANNING.md` for more details
