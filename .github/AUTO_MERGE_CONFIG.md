# Auto-Merge Revert PR Configuration

## Overview

The auto-merge workflow automatically merges revert PRs when HIGH severity security issues are detected. This provides immediate remediation while maintaining safety through conditional logic.

## How It Works

### Workflow Trigger
1. Security scan fails on main branch
2. Auto-revert workflow creates a revert PR
3. Auto-merge workflow detects the PR (via `auto-revert` label)
4. Checks severity level
5. If HIGH severity → Auto-merges
6. If MEDIUM/LOW severity → Requires manual review

### Safety Checks
- ✅ Only merges PRs with `auto-revert` label
- ✅ Only merges if HIGH severity issues found
- ✅ Waits for PR to be mergeable (no conflicts)
- ✅ Adds explanatory comment after merge
- ✅ Notifies if auto-merge fails

## Configuration

### Current Settings

**Auto-merge enabled for:**
- 🔴 HIGH severity issues ✅

**Manual review required for:**
- 🟡 MEDIUM severity issues ⏸️
- 🟢 LOW severity issues ⏸️

### Customization Options

#### Option 1: Enable Auto-Merge for MEDIUM Severity

Edit `.github/workflows/auto-merge-revert-pr.yml`:

```yaml
# Change this line:
const hasHighSeverity = prBody.includes('HIGH severity') || 
                        prBody.includes('🔴 HIGH') ||
                        prBody.includes('HIGH Severity');

# To this:
const hasCriticalSeverity = prBody.includes('HIGH severity') || 
                            prBody.includes('MEDIUM severity') ||
                            prBody.includes('🔴 HIGH') ||
                            prBody.includes('🟡 MEDIUM');
```

#### Option 2: Disable Auto-Merge

Delete or rename the workflow file:
```bash
mv .github/workflows/auto-merge-revert-pr.yml \
   .github/workflows/auto-merge-revert-pr.yml.disabled
```

#### Option 3: Add Time Delay

Add a delay before auto-merging (gives team time to intervene):

```yaml
- name: Wait before auto-merge
  if: steps.check_severity.outputs.result == 'true'
  run: |
    echo "⏳ Waiting 15 minutes before auto-merge..."
    echo "Team has time to review and cancel if needed"
    sleep 900  # 15 minutes
```

## Branch Protection Requirements

For auto-merge to work, you need to configure branch protection:

### Option A: Allow GitHub Actions to Bypass (Recommended)

1. Go to: Settings → Branches → Branch protection rules
2. Edit rule for `main` branch
3. Under "Restrict who can push to matching branches":
   - Add: `github-actions[bot]`
4. Or under "Allow specified actors to bypass required pull requests":
   - Add: `github-actions[bot]`

### Option B: Disable PR Review Requirement (Not Recommended)

1. Go to: Settings → Branches → Branch protection rules
2. Edit rule for `main` branch
3. Uncheck: "Require a pull request before merging"
   - ⚠️ This reduces security for all PRs

### Option C: Use Personal Access Token (Advanced)

1. Create a PAT with `repo` scope
2. Add as repository secret: `AUTO_MERGE_TOKEN`
3. Update workflow to use the token:
   ```yaml
   - uses: actions/github-script@v7
     with:
       github-token: ${{ secrets.AUTO_MERGE_TOKEN }}
   ```

## Testing

### Test Auto-Merge

1. Create a test file with HIGH severity issues:
   ```python
   # test_security.py
   import subprocess
   subprocess.call("echo test", shell=True)  # HIGH: B602
   ```

2. Push directly to main (for testing only):
   ```bash
   git add test_security.py
   git commit -m "Test: HIGH severity issue"
   git push origin main
   ```

3. Watch the automation:
   - Security scan fails
   - Revert PR created
   - Auto-merge workflow triggers
   - PR is automatically merged
   - Vulnerable code removed

### Test Manual Review (MEDIUM Severity)

1. Create a test file with MEDIUM severity issues:
   ```python
   # test_medium.py
   import pickle
   data = pickle.loads(user_input)  # MEDIUM: B301
   ```

2. Push to main
3. Watch the automation:
   - Security scan fails
   - Revert PR created
   - Auto-merge workflow adds comment: "Manual review required"
   - PR waits for human approval

## Monitoring

### View Auto-Merge Activity

1. **Actions Tab**
   - Filter by: "Auto-Merge Revert PRs"
   - See all auto-merge attempts

2. **Pull Requests**
   - Filter by label: `auto-revert`
   - See which were auto-merged vs manual

3. **Audit Log**
   - Settings → Audit log
   - Search for: "pull_request.merged"
   - Filter by actor: "github-actions[bot]"

## Troubleshooting

### Auto-Merge Not Working

**Check 1: Branch Protection**
```bash
# Verify GitHub Actions can bypass protection
# Go to: Settings → Branches → Edit rule
# Ensure github-actions[bot] is allowed
```

**Check 2: Workflow Permissions**
```yaml
# In workflow file, verify:
permissions:
  contents: write
  pull-requests: write
```

**Check 3: PR Labels**
```bash
# Verify PR has 'auto-revert' label
# Check PR in GitHub UI
```

**Check 4: Severity Detection**
```bash
# Check workflow logs
# Verify "HIGH severity found: true"
```

### Auto-Merge Happens Too Fast

Add a delay:
```yaml
- name: Delay before merge
  run: sleep 300  # 5 minutes
```

### Want to Cancel Auto-Merge

1. Remove the `auto-revert` label from PR
2. Or close the PR before auto-merge completes
3. Or add a comment: "skip-auto-merge"

## Security Considerations

### Pros
✅ Immediate response to HIGH severity issues
✅ Works 24/7 without human intervention
✅ Reduces exposure time to vulnerabilities
✅ Maintains audit trail

### Cons
❌ Could revert legitimate code if false positive
❌ No human verification before action
❌ Might cause disruption if revert breaks dependencies

### Mitigation
- Only auto-merge HIGH severity (most critical)
- Require manual review for MEDIUM/LOW
- Add comprehensive logging
- Send notifications to team
- Easy to disable if needed

## Best Practices

1. **Start Conservative**
   - Begin with HIGH severity only
   - Monitor for false positives
   - Expand to MEDIUM if confident

2. **Monitor Closely**
   - Review auto-merged PRs daily
   - Check for any issues
   - Adjust thresholds as needed

3. **Team Communication**
   - Notify team when enabling auto-merge
   - Document the policy
   - Provide override procedures

4. **Regular Review**
   - Weekly: Review auto-merge activity
   - Monthly: Assess effectiveness
   - Quarterly: Update configuration

## Disabling Auto-Merge

If you need to disable auto-merge:

### Temporary (Quick)
```bash
# Rename the workflow file
mv .github/workflows/auto-merge-revert-pr.yml \
   .github/workflows/auto-merge-revert-pr.yml.disabled
```

### Permanent
```bash
# Delete the workflow file
git rm .github/workflows/auto-merge-revert-pr.yml
git commit -m "Disable auto-merge for revert PRs"
git push
```

## Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review this configuration guide
3. Check `.github/ROLLBACK_GUIDE.md`
4. Contact repository administrators
