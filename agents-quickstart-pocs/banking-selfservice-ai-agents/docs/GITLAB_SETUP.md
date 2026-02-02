# GitLab Setup Guide

## Step 1: Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Check what will be committed
git status
```

## Step 2: Create Initial Commit

```bash
# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Backend API and MCP server complete

- Implemented debit card operations (lock, unlock, request new)
- Created MCP server for AI agent integration
- Added mock data and local testing
- All tests passing"
```

## Step 3: Create GitLab Repository

### Option A: GitLab.com (Public/Private)

1. Go to https://gitlab.com
2. Click "New Project"
3. Choose "Create blank project"
4. Name: `banking-selfservice-ai-agents` (or your preferred name)
5. Visibility: **Private** (recommended for banking project)
6. Click "Create project"

### Option B: Self-Hosted GitLab

1. Go to your company's GitLab instance
2. Follow similar steps as above

## Step 4: Connect Local Repository to GitLab

```bash
# Add GitLab as remote (replace with your URL)
git remote add origin https://gitlab.com/your-username/banking-selfservice-ai-agents.git

# Or if using SSH:
git remote add origin git@gitlab.com:your-username/banking-selfservice-ai-agents.git

# Verify remote was added
git remote -v
```

## Step 5: Push to GitLab

```bash
# Push to main branch
git push -u origin main

# Or if your default branch is 'master':
git push -u origin master
```

## Step 6: Invite Collaborator

1. Go to your GitLab project
2. Click "Project information" → "Members"
3. Click "Invite members"
4. Enter collaborator's email or username
5. Choose role: **Developer** or **Maintainer**
6. Click "Invite"

## Step 7: Share with Collaborator

Send them:
1. **Repository URL**: `https://gitlab.com/your-username/banking-selfservice-ai-agents`
2. **Handoff document**: Point them to `HANDOFF_GUIDE.md`
3. **Quick start**: Tell them to read `README.md` first

## Recommended GitLab Setup

### Protect Main Branch

1. Go to "Settings" → "Repository"
2. Expand "Protected branches"
3. Protect `main` branch
4. Require merge requests for changes

### Create Issues for Remaining Work

Create issues for your collaborator:

1. **Issue #1: Amazon Connect Setup**
   - Description: Set up Connect instance, contact flows, phone number
   - Assignee: Collaborator
   - Label: `connect`, `critical`

2. **Issue #2: Bedrock Agent Configuration**
   - Description: Create Jeanie agent, connect to MCP server
   - Assignee: Collaborator
   - Label: `bedrock`, `critical`

3. **Issue #3: Guardrails & Safety**
   - Description: Configure guardrails, prevent jailbreaks
   - Assignee: Collaborator
   - Label: `security`, `high-priority`

4. **Issue #4: Knowledge Base**
   - Description: Set up product knowledge base
   - Assignee: Collaborator
   - Label: `knowledge-base`, `medium-priority`

5. **Issue #5: Monitoring & Logging**
   - Description: CloudWatch dashboards and logging
   - Assignee: Collaborator
   - Label: `monitoring`, `medium-priority`

6. **Issue #6: AWS Deployment**
   - Description: Deploy backend to AWS
   - Assignee: Either
   - Label: `deployment`, `critical`

### Set Up CI/CD (Optional but Recommended)

Create `.gitlab-ci.yml`:

```yaml
image: python:3.11

stages:
  - test

before_script:
  - pip install -r requirements.txt

test:
  stage: test
  script:
    - python -m pytest tests/
    - python scripts/test_local.py
    - python scripts/test_mcp_server.py
  only:
    - merge_requests
    - main
```

This will automatically run tests on every push!

## Working Together

### Your Workflow

```bash
# Create a feature branch
git checkout -b feature/deployment

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Add CloudFormation template for deployment"

# Push to GitLab
git push origin feature/deployment

# Create merge request in GitLab UI
```

### Collaborator's Workflow

```bash
# Clone repository
git clone https://gitlab.com/your-username/banking-selfservice-ai-agents.git
cd banking-selfservice-ai-agents

# Create their feature branch
git checkout -b feature/connect-setup

# Make changes
# ... work on Connect ...

# Commit and push
git add .
git commit -m "Set up Amazon Connect instance"
git push origin feature/connect-setup

# Create merge request
```

### Merging Work

1. Review each other's merge requests
2. Test changes locally
3. Approve and merge
4. Pull latest changes: `git pull origin main`

## Troubleshooting

### Authentication Issues

If using HTTPS and getting password prompts:

```bash
# Use personal access token instead of password
# Create token in GitLab: Settings → Access Tokens
# Use token as password when prompted
```

Or switch to SSH:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitLab: Settings → SSH Keys
cat ~/.ssh/id_ed25519.pub

# Change remote to SSH
git remote set-url origin git@gitlab.com:your-username/banking-selfservice-ai-agents.git
```

### Large Files

If you have large files (>100MB), consider using Git LFS:

```bash
git lfs install
git lfs track "*.pdf"
git add .gitattributes
```

## Security Best Practices

✅ **DO:**
- Keep repository **private**
- Use `.gitignore` to exclude sensitive files
- Never commit `.env` files with real credentials
- Use GitLab's secret variables for CI/CD

❌ **DON'T:**
- Commit AWS credentials
- Commit API keys
- Commit customer data
- Make repository public

## Next Steps

1. ✅ Push code to GitLab
2. ✅ Invite collaborator
3. ✅ Share `HANDOFF_GUIDE.md`
4. ✅ Create issues for remaining work
5. ⏳ Coordinate on integration points
6. ⏳ Schedule demo practice session

---

**Ready to push?** Run these commands:

```bash
git init
git add .
git commit -m "Initial commit: Backend API and MCP server"
git remote add origin <your-gitlab-url>
git push -u origin main
```
