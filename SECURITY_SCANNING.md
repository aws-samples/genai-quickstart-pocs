# Security Scanning with Bandit

This repository uses [Bandit](https://bandit.readthedocs.io/) to automatically scan Python code for common security issues.

## Automated Scanning

Bandit scans run automatically on:
- Every push to `main`, `master`, or `develop` branches (when Python files change)
- Every pull request to these branches (when Python files change)
- Manual trigger via GitHub Actions workflow dispatch

## Viewing Results

Security scan results are available in two places:

1. **GitHub Security Tab**: Navigate to the Security tab → Code scanning alerts to view detailed findings
2. **GitHub Actions**: Check the workflow run logs for immediate feedback

## Running Bandit Locally

To run Bandit on your local machine before pushing:

```bash
# Install Bandit
pip install bandit

# Run scan on entire repository
bandit -r .

# Run with specific severity/confidence levels
bandit -r . -ll  # Only show medium/high severity and confidence
bandit -r .      # Show all severity and confidence levels (default)

# Generate a report
bandit -r . -f json -o bandit-report.json
```

## Configuration

Bandit configuration is stored in `.bandit` file at the repository root. You can customize:
- Excluded directories
- Severity and confidence levels
- Specific tests to skip or run

## Common Issues and Fixes

### B201: Flask app with debug=True
**Fix**: Ensure `debug=True` is only used in development, never in production

### B608: Possible SQL injection
**Fix**: Use parameterized queries instead of string concatenation

### B105: Hardcoded password
**Fix**: Use environment variables or secrets management

### B403: Import of pickle module
**Fix**: Consider using safer alternatives like JSON for serialization

## Suppressing False Positives

If Bandit flags a false positive, you can suppress it with a comment:

```python
# nosec B101
password = "test_password"  # This is a test fixture, not a real password
```

Use suppressions sparingly and document why the issue is not a real security concern.
