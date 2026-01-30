# Bandit Security Scan - Test Checklist

## Pre-Test Setup
- [x] Branch protection enabled on main branch
- [x] Workflow file created
- [x] Analysis script created
- [x] Test files with vulnerabilities ready
- [x] Documentation created

## Test 1: Verify Build FAILS with Security Issues

### Step 1: Commit and Push
```bash
# Add all files
git add .github/workflows/bandit-security-scan.yml
git add .github/scripts/analyze_bandit_results.py
git add .github/SECURITY_SCAN_GUIDE.md
git add security-test/
git add SECURITY_SCANNING.md
git add TEST_CHECKLIST.md

# Commit
git commit -m "Add enhanced Bandit security scanning with test vulnerabilities"

# Create test branch
git checkout -b test-security-scan

# Push
git push origin test-security-scan
```

### Step 2: Create Pull Request
1. Go to: https://github.com/aws-samples/genai-quickstart-pocs/pulls
2. Click "New pull request"
3. Base: `main` ← Compare: `test-security-scan`
4. Title: "Test: Security Scan with Vulnerabilities"
5. Description: "Testing the Bandit security scan workflow"
6. Click "Create pull request"

### Step 3: Verify FAILURE Indicators

#### In PR Overview:
- [ ] Red X appears: "Some checks were not successful"
- [ ] Status shows: "Bandit Security Scan — Failed"
- [ ] "Merge" button is DISABLED with message about required checks

#### In PR Comments:
- [ ] Bot posts automatic comment with:
  - Summary: "6 total issues found"
  - "2 HIGH + 4 MEDIUM = 6 critical issues"
  - List of HIGH severity issues with file locations
  - List of MEDIUM severity issues
  - "How to Fix" section

#### In Files Changed Tab:
- [ ] Red error annotations appear on `security-test/bandit_test_sample.py`
- [ ] Annotations on lines: 7, 8, 14, 19, 24, 34, 40, 45, 51, 58
- [ ] Click annotation shows full issue description

#### In Checks Tab:
- [ ] Click "Details" on "Bandit Security Scan"
- [ ] See big red error box: "SECURITY ISSUES DETECTED - BUILD FAILED"
- [ ] See detailed breakdown of HIGH issues
- [ ] See detailed breakdown of MEDIUM issues
- [ ] See "ACTION REQUIRED" message at bottom

#### In Security Tab:
- [ ] Go to: Security → Code scanning alerts
- [ ] See 10 alerts listed
- [ ] Filter by "HIGH" shows 2 issues
- [ ] Filter by "MEDIUM" shows 4 issues
- [ ] Each alert shows file and line number

#### Notifications:
- [ ] Check email for failure notification
- [ ] Check GitHub notifications (bell icon)

---

## Test 2: Verify Build PASSES without Security Issues

### Step 1: Remove Test Files
```bash
# Make sure you're on the test branch
git checkout test-security-scan

# Remove test files
git rm -r security-test/

# Commit
git commit -m "Remove test vulnerabilities - expect scan to pass"

# Push
git push origin test-security-scan
```

### Step 2: Verify SUCCESS Indicators

#### In PR Overview:
- [ ] Green checkmark appears: "All checks have passed"
- [ ] Status shows: "Bandit Security Scan — Passed"
- [ ] "Merge" button is ENABLED

#### In PR Comments:
- [ ] Bot posts new comment with:
  - "Security Scan Passed"
  - "No security issues found!" or "Found X LOW severity issues (informational only)"

#### In Files Changed Tab:
- [ ] No red error annotations
- [ ] May see blue "notice" annotations for LOW severity (informational)

#### In Checks Tab:
- [ ] Click "Details" on "Bandit Security Scan"
- [ ] See green success box: "SECURITY SCAN PASSED"
- [ ] No critical issues listed

#### Notifications:
- [ ] Check email for success notification

---

## Test 3: Merge and Cleanup

### If Everything Passed:
```bash
# Merge the PR via GitHub UI
# Then cleanup local branches
git checkout main
git pull origin main
git branch -d test-security-scan
```

### If Issues Found:
Document any problems and we'll fix them!

---

## Expected Results Summary

### With security-test/ files (FAIL):
- ❌ Build fails
- ❌ Red X on PR
- 💬 Bot comment with 6 critical issues
- 📝 10 inline annotations
- 🚫 Merge blocked
- 📧 Failure email

### Without security-test/ files (PASS):
- ✅ Build passes
- ✅ Green checkmark on PR
- 💬 Bot comment with success message
- ✅ Merge enabled
- 📧 Success email

---

## Troubleshooting

### If workflow doesn't run:
1. Check Actions tab for any errors
2. Verify workflow file is in `.github/workflows/`
3. Check branch protection settings

### If bot doesn't comment:
1. Check workflow has `pull_request` trigger
2. Verify `actions/github-script@v7` step ran
3. Check workflow permissions include `pull-requests: write`

### If merge isn't blocked:
1. Verify branch protection rule is active
2. Check "Require status checks" is enabled
3. Ensure "Bandit Security Scan" is selected

---

## Quick Commands Reference

```bash
# View current branch
git branch

# Check status
git status

# View remote branches
git branch -r

# Force push (if needed)
git push -f origin test-security-scan

# Delete remote branch
git push origin --delete test-security-scan
```
