# Documentation Guidelines

## Overview

This document defines the standards and practices for maintaining project documentation.

## Documentation Structure

### Permanent Documentation (docs/)

These files are referenced in README.md and maintained as part of the project:

```
docs/
├── ARCHITECTURE.md                      # System architecture
├── BUSINESS_VALUE.md                    # Executive summary
├── DEPLOYMENT.md                        # Deployment guide
├── DEVELOPMENT.md                       # Development guide
├── SERVICE_NAME_RESOLUTION.md           # Service resolution
├── BUILD_TIME_RESOURCE_CURATION.md      # Resource curation
├── ARCHITECTURE_REFACTORING_SUMMARY.md  # Architecture improvements
├── RESOURCE_TYPE_FILTERING.md           # Resource filtering
├── lambda-functions/                    # Lambda function docs
├── cost-analysis/                       # Cost analysis
└── blog/                                # Blog content
```

### Temporary Documentation (docs/temp-fixes/)

These files are created during development but NOT referenced in README.md:

```
docs/temp-fixes/
├── README.md                            # This folder's purpose
├── *_FIX.md                            # Individual fix documentation
├── *_SUMMARY.md                        # Temporary summaries
└── *_ANALYSIS.md                       # Temporary analysis
```

## Creating Documentation

### For Permanent Features

When adding a new feature or major component:

1. **Update existing docs** if the feature fits into current documentation
2. **Create new doc** only if it's a significant standalone topic
3. **Add to README.md** in the appropriate section
4. **Follow naming convention**: `FEATURE_NAME.md` (uppercase with underscores)

**Example:**
```markdown
# New Feature: Service Name Resolution

## Overview
Brief description of the feature...

## Implementation
How it works...

## Usage
How to use it...

## Configuration
Any configuration needed...
```

### For Fixes and Improvements

When fixing bugs or making improvements:

1. **Create in temp-fixes/** folder
2. **Use descriptive name**: `PROBLEM_DESCRIPTION_FIX.md`
3. **Document**: Problem, Solution, Implementation, Testing
4. **Do NOT reference** in README.md
5. **Review after completion** - consolidate into permanent docs if needed

**Example:**
```markdown
# Fix: Service Name Resolution for Gateway Load Balancer

## Problem
Gateway Load Balancer failed to resolve...

## Solution
Added alias mapping...

## Implementation
Created service_name_resolver.py...

## Testing
23 tests passing...

## Files Modified
- layers/common-layer/python/service_name_resolver.py
```

### For Temporary Analysis

When analyzing or planning changes:

1. **Create in temp-fixes/** folder
2. **Use descriptive name**: `TOPIC_ANALYSIS.md` or `TOPIC_PLAN.md`
3. **Include**: Context, Options, Recommendations, Next Steps
4. **Do NOT reference** in README.md
5. **Archive or delete** after implementation

## Naming Conventions

### Permanent Documentation
- `UPPERCASE_WITH_UNDERSCORES.md`
- Clear, descriptive names
- Examples: `ARCHITECTURE.md`, `DEPLOYMENT.md`, `SERVICE_NAME_RESOLUTION.md`

### Temporary Documentation
- `DESCRIPTIVE_NAME_FIX.md` for fixes
- `DESCRIPTIVE_NAME_SUMMARY.md` for summaries
- `DESCRIPTIVE_NAME_ANALYSIS.md` for analysis
- Examples: `LAYER_ORGANIZATION_FIX.md`, `DOCS_CLEANUP_SUMMARY.md`

### Lambda Function Documentation
- `FunctionName.md` (PascalCase matching Lambda function name)
- Located in `docs/lambda-functions/`
- Examples: `SecurityProfileProcessor.md`, `AWSServiceDocumentationManager.md`

## Content Standards

### All Documentation Should Include

1. **Clear Title** - What is this about?
2. **Overview/Purpose** - Why does this exist?
3. **Details** - How does it work?
4. **Usage/Examples** - How to use it?
5. **Related Information** - Links to related docs

### Code Examples

Use proper markdown code blocks with language specification:

```python
def example_function():
    """Example with proper formatting"""
    return "result"
```

### File References

Use relative paths from project root:
- ✅ `layers/common-layer/python/service_name_resolver.py`
- ❌ `/Users/username/project/layers/...`

### Links

Use relative links for internal documentation:
- ✅ `[Architecture](docs/ARCHITECTURE.md)`
- ❌ `[Architecture](https://github.com/...)`

## Maintenance

### Regular Reviews

1. **Quarterly**: Review all permanent documentation for accuracy
2. **After major changes**: Update affected documentation immediately
3. **Before releases**: Verify all documentation is current

### Cleanup Process

1. **Review temp-fixes/** folder monthly
2. **Consolidate** useful content into permanent docs
3. **Archive** old temporary docs (move to archive/ or delete)
4. **Keep** only recent temporary docs for reference

### Version Control

1. **Commit** documentation changes with code changes
2. **Use descriptive commit messages**: "docs: Update DEPLOYMENT.md with new layer"
3. **Review** documentation in pull requests
4. **Keep** documentation in sync with code

## README.md References

### When to Add to README.md

Add documentation to README.md when:
- ✅ It's permanent project documentation
- ✅ Users/developers need to reference it regularly
- ✅ It describes core features or architecture
- ✅ It's part of getting started or deployment

### When NOT to Add to README.md

Do NOT add to README.md when:
- ❌ It's temporary fix documentation
- ❌ It's analysis or planning documents
- ❌ It's implementation notes
- ❌ It's troubleshooting for specific issues

### README.md Structure

Maintain this structure in README.md:

```markdown
## Documentation

### Core Documentation
- [Business Value & Impact](docs/BUSINESS_VALUE.md)
- [Architecture Details](docs/ARCHITECTURE.md)
- [Lambda Functions](docs/lambda-functions/)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development Guide](docs/DEVELOPMENT.md)

### Technical Deep Dives
- [Feature Name](docs/FEATURE_NAME.md)
- [Another Feature](docs/ANOTHER_FEATURE.md)
```

## Examples

### Good Documentation Structure

```
docs/
├── ARCHITECTURE.md              ✅ Permanent, referenced
├── DEPLOYMENT.md                ✅ Permanent, referenced
├── SERVICE_NAME_RESOLUTION.md   ✅ Permanent, referenced
└── temp-fixes/
    ├── GATEWAY_LB_FIX.md       ✅ Temporary, not referenced
    └── LAYER_CLEANUP_PLAN.md   ✅ Temporary, not referenced
```

### Bad Documentation Structure

```
docs/
├── fix1.md                      ❌ Unclear name
├── temp_notes.txt               ❌ Wrong format
├── IMPORTANT_FIX.md             ❌ Should be in temp-fixes/
└── my-analysis.md               ❌ Should be in temp-fixes/
```

## Checklist for New Documentation

### Before Creating a New Doc

- [ ] Is this permanent or temporary?
- [ ] Does it fit into existing documentation?
- [ ] Is the name clear and descriptive?
- [ ] Is it in the correct folder?

### After Creating a New Doc

- [ ] Content is clear and complete
- [ ] Code examples are tested
- [ ] Links are relative and working
- [ ] If permanent: Added to README.md
- [ ] If temporary: In temp-fixes/ folder
- [ ] Committed with descriptive message

## Summary

**Golden Rules:**

1. **Permanent docs** → `docs/` → Referenced in README.md
2. **Temporary docs** → `docs/temp-fixes/` → NOT referenced in README.md
3. **Fix documentation** → Always start in `temp-fixes/`
4. **After implementation** → Review and consolidate into permanent docs
5. **Keep README.md clean** → Only reference permanent documentation

**When in doubt:**
- Create in `temp-fixes/` first
- Review after implementation
- Move to permanent docs if needed
- Never reference temp docs in README.md
