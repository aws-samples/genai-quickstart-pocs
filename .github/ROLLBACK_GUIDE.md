# Rollback Guide for Security Scan Failures

## Overview

This guide explains how to handle code that fails security scans and the rollback options available.

## 🛡️ Prevention (Recommended Approach)

**With branch protection enabled (✅ Already active):**
- Code with security issues **cannot be merged** to main
- Developers must fix issues in their feature branches
- No rollback needed because bad code never reaches main

**This is the best approach because:**
- Prevents security issues from entering production
- Forces developers to address problems before merge
- Maintains clean commit history
- No emergency rollbacks needed

## 🔄 Rollback Scenarios

### Scenario 1: Pull Request Fails Security Scan

**What happens:**
- PR shows red X
- Merge button is disabled
- Developer cannot merge

**Action required:**
```bash
# Developer fixes the issues in their branch
git checkout feature-branch
# ... make fixes ...
git add .
git commit -m "Fix security issues"
git push origin feature-branch
# Security scan runs again automatically
```

**No rollback needed** - code never reached main.

---

### Scenario 2: Direct Push to Main Fails (Rare)

**What happens:**
- Commit reaches main branch
- Security scan runs and fails
- Code with vulnerabilities is now in main

**Option A: Automatic Revert (Enabled via workflow)**

The `auto-revert-security-failures.yml` workflow will:
1. Detect the failed security scan
2. Automatically revert the commit
3. Create an issue to notify the team
4. Preserve full history

**Option B: Manual Revert**

```bash
# Find the problematic commit
git log --oneline -10

# Revert it (creates a new commit)
git revert <commit-sha>

# Push the revert
git push origin main
```

**Option C: Manual Rollback (Advanced)**

```bash
# Reset to previous commit (rewrites history - dangerous!)
git reset --hard HEAD~1
git push --force origin main

# ⚠️ WARNING: Only use if absolutely necessary
# This can cause issues for other developers
```

---

## 🤖 Automatic Revert Workflow

### How It Works

The `auto-revert-security-failures.yml` workflow:

1. **Triggers** when Bandit Security Scan fails on main branch
2. **Checks** if it was a direct push (not a PR)
3. **Reverts** the commit automatically
4. **Creates** an issue to notify the team
5. **Preserves** full history (safe and auditable)

### When It Runs

- ✅ Direct push to main that fails security scan
- ❌ Does NOT run for PRs (branch protection handles those)
- ❌ Does NOT run if scan passes

### Configuration

The workflow is **optional**. To enable/disable:

**Enable:**
- File already exists: `.github/workflows/auto-revert-security-failures.yml`
- It will run automatically

**Disable:**
- Delete or rename the workflow file
- Or add `if: false` to the job

### Notifications

When auto-revert happens:
1. **GitHub Issue** created with:
   - Commit details
   - Reason for revert
   - Link to failed workflow
   - Instructions for developer
2. **Commit** appears in history: "Revert: [original message]"
3. **Workflow log** shows revert action

---

## 📋 Rollback Decision Matrix

| Situation | Branch | Action | Rollback Needed? |
|-----------|--------|--------|------------------|
| PR fails scan | feature | Fix in branch | ❌ No |
| Direct push fails | main | Auto-revert | ✅ Yes (automatic) |
| Merged PR fails | main | Manual revert | ✅ Yes (manual) |
| Old commit has issues | main | Create fix PR | ⚠️ Maybe |

---

## 🔧 Manual Rollback Commands

### Revert Last Commit
```bash
git revert HEAD
git push origin main
```

### Revert Specific Commit
```bash
git revert <commit-sha>
git push origin main
```

### Revert Multiple Commits
```bash
git revert <oldest-sha>^..<newest-sha>
git push origin main
```

### Revert and Edit Message
```bash
git revert -e <commit-sha>
# Edit the commit message
git push origin main
```

### Check What Will Be Reverted
```bash
git show <commit-sha>
```

---

## 🚨 Emergency Procedures

### If Auto-Revert Fails

1. **Check workflow logs:**
   - Go to Actions tab
   - Find "Auto-Revert Security Failures" workflow
   - Check error messages

2. **Manual revert:**
   ```bash
   git checkout main
   git pull
   git revert <commit-sha>
   git push origin main
   ```

3. **Notify team:**
   - Create issue explaining what happened
   - Tag relevant developers
   - Document the security issues found

### If Multiple Commits Need Reverting

```bash
# Revert a range of commits
git revert --no-commit <oldest-sha>^..<newest-sha>
git commit -m "Revert multiple commits due to security issues"
git push origin main
```

---

## 🎯 Best Practices

### DO:
✅ Use Pull Requests for all changes
✅ Let branch protection prevent bad merges
✅ Fix issues in feature branches
✅ Review security scan results before merging
✅ Use `git revert` to preserve history

### DON'T:
❌ Push directly to main branch
❌ Use `git push --force` on shared branches
❌ Ignore security scan failures
❌ Bypass branch protection rules
❌ Delete commits from history

---

## 📊 Monitoring Rollbacks

### View Revert History
```bash
# Find all revert commits
git log --all --grep="Revert"

# Show details of a revert
git show <revert-commit-sha>
```

### Check for Auto-Reverts
1. Go to: Issues tab
2. Filter by label: `auto-revert`
3. Review all automatic rollbacks

### Workflow Runs
1. Go to: Actions tab
2. Select: "Auto-Revert Security Failures"
3. View all executions

---

## 🔍 Troubleshooting

### Auto-Revert Didn't Run

**Possible reasons:**
1. Branch protection prevented the push
2. Workflow file is disabled
3. Permissions are insufficient
4. It was a PR (auto-revert only for direct pushes)

**Check:**
```bash
# Verify workflow file exists
ls -la .github/workflows/auto-revert-security-failures.yml

# Check recent workflow runs
# Go to Actions tab in GitHub
```

### Revert Created Conflicts

```bash
# If revert has conflicts
git revert <commit-sha>
# Fix conflicts manually
git add .
git revert --continue
git push origin main
```

### Need to Undo a Revert

```bash
# Revert the revert (brings back original changes)
git revert <revert-commit-sha>
git push origin main
```

---

## 📚 Additional Resources

- [Git Revert Documentation](https://git-scm.com/docs/git-revert)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Security Scanning Guide](.github/SECURITY_SCAN_GUIDE.md)
- [Bandit Documentation](https://bandit.readthedocs.io/)

---

## 💡 Summary

**Current Setup:**
- ✅ Branch protection prevents bad merges (primary defense)
- ✅ Auto-revert workflow handles direct pushes (backup defense)
- ✅ Manual revert available for edge cases (last resort)

**Recommended Flow:**
1. Developer creates PR
2. Security scan runs automatically
3. If fails: Developer fixes in their branch
4. If passes: PR can be merged
5. No rollback ever needed!

**Emergency Flow:**
1. Bad commit reaches main (rare)
2. Security scan fails
3. Auto-revert triggers
4. Issue created for tracking
5. Developer fixes in new PR
