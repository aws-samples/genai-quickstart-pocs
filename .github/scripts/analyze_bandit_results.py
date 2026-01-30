#!/usr/bin/env python3
"""
Analyze Bandit security scan results and create GitHub annotations.
Fails the build if HIGH or MEDIUM severity issues are found.
"""
import json
import sys
from pathlib import Path


def main():
    report_file = Path('bandit-report.json')
    
    if not report_file.exists():
        print("❌ Error: bandit-report.json not found")
        sys.exit(1)
    
    try:
        with open(report_file) as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading report: {e}")
        sys.exit(1)
    
    results = data.get('results', [])
    high_issues = [r for r in results if r['issue_severity'] == 'HIGH']
    medium_issues = [r for r in results if r['issue_severity'] == 'MEDIUM']
    low_issues = [r for r in results if r['issue_severity'] == 'LOW']
    
    total = len(results)
    high_count = len(high_issues)
    medium_count = len(medium_issues)
    low_count = len(low_issues)
    critical_count = high_count + medium_count
    
    # Print summary
    print("=== Security Scan Summary ===")
    print(f"📊 Total Issues Found: {total}")
    print(f"🔴 HIGH Severity: {high_count}")
    print(f"🟡 MEDIUM Severity: {medium_count}")
    print(f"🟢 LOW Severity: {low_count}")
    print()
    
    # Create GitHub annotations
    for issue in results:
        severity = issue['issue_severity']
        filename = issue['filename'].lstrip('./')
        line = issue['line_number']
        test_id = issue['test_id']
        text = issue['issue_text'].replace(':', ' -')
        
        level = 'error' if severity in ['HIGH', 'MEDIUM'] else 'notice'
        print(f"::{level} file={filename},line={line},title=Bandit {test_id} ({severity})::{text}")
    
    # Display critical issues banner
    if critical_count > 0:
        print()
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                                                                ║")
        print("║  ❌ ❌ ❌  SECURITY ISSUES DETECTED - BUILD FAILED  ❌ ❌ ❌  ║")
        print("║                                                                ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()
    
    # Display HIGH severity issues
    if high_count > 0:
        print("🔴 HIGH SEVERITY ISSUES (MUST FIX) 🔴")
        print("═══════════════════════════════════════════════════════════════")
        for i, issue in enumerate(high_issues, 1):
            print(f"\n🔴 Issue #{i}: {issue['test_id']}")
            print(f"   Description: {issue['issue_text']}")
            print(f"   Location: {issue['filename']}:{issue['line_number']}")
            print(f"   Confidence: {issue['issue_confidence']}")
            cwe = issue.get('issue_cwe', {})
            if cwe:
                print(f"   CWE: {cwe.get('id', 'N/A')}")
            print(f"   Documentation: {issue['more_info']}")
        print("═══════════════════════════════════════════════════════════════")
        print()
    
    # Display MEDIUM severity issues
    if medium_count > 0:
        print("🟡 MEDIUM SEVERITY ISSUES (MUST FIX) 🟡")
        print("═══════════════════════════════════════════════════════════════")
        for i, issue in enumerate(medium_issues, 1):
            print(f"\n🟡 Issue #{i}: {issue['test_id']}")
            print(f"   Description: {issue['issue_text']}")
            print(f"   Location: {issue['filename']}:{issue['line_number']}")
            print(f"   Confidence: {issue['issue_confidence']}")
            print(f"   Documentation: {issue['more_info']}")
        print("═══════════════════════════════════════════════════════════════")
        print()
    
    # Display LOW severity issues
    if low_count > 0:
        print("ℹ️  LOW SEVERITY ISSUES (INFORMATIONAL) ℹ️")
        print("───────────────────────────────────────────────────────────────")
        for i, issue in enumerate(low_issues, 1):
            text = issue['issue_text'][:80]
            print(f"  {i}. {issue['test_id']}: {text}")
            print(f"     {issue['filename']}:{issue['line_number']}")
        print("───────────────────────────────────────────────────────────────")
        print()
    
    # Final verdict
    if critical_count > 0:
        print()
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                                                                ║")
        print("║  ⛔ ACTION REQUIRED: Fix all HIGH and MEDIUM severity issues  ║")
        print("║                                                                ║")
        print(f"║  Found: {high_count} HIGH + {medium_count} MEDIUM = {critical_count} issues to resolve              ║")
        print("║                                                                ║")
        print("║  This build will fail until all critical issues are fixed.    ║")
        print("║                                                                ║")
        print("║  Options to resolve:                                           ║")
        print("║  1. Fix the security issues in your code                      ║")
        print("║  2. Use # nosec comment if false positive (with justification)║")
        print("║  3. Update .bandit config to skip specific tests (discouraged)║")
        print("║                                                                ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()
        sys.exit(1)
    else:
        print()
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                                                                ║")
        print("║  ✅ ✅ ✅  SECURITY SCAN PASSED  ✅ ✅ ✅                      ║")
        print("║                                                                ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print()
        if total == 0:
            print("🎉 No security issues found!")
        else:
            print(f"ℹ️  Found {low_count} LOW severity issues (informational only)")


if __name__ == '__main__':
    main()
