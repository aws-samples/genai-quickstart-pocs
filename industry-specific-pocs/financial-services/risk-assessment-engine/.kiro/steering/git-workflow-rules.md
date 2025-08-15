# Git Workflow Rules

## Commit Guidelines

1. **Frequent Commits**
   - Make git commits after each significant change to the codebase
   - Each commit should represent a single logical change
   - Keep commits small and focused on a specific task

2. **Commit Messages**
   - Use clear and descriptive commit messages
   - Follow the format: `<type>: <description>`
   - Types include: feat, fix, docs, style, refactor, test, chore
   - Example: `feat: implement word validation logic`

3. **When to Commit**
   - After implementing a new feature
   - After fixing a bug
   - After refactoring code
   - After writing tests
   - After updating documentation
   - Any time a significant, working change is made

## Branching Strategy

1. **Main Branch**
   - The `main` branch should always contain stable, production-ready code
   - Direct commits to `main` are prohibited except for hotfixes
   - All development work should occur in feature branches

2. **Feature Branches**
   - Create a new branch for each feature or issue
   - Branch naming convention: `feature/<feature-name>` or `fix/<issue-name>`
   - Example: `feature/word-validation` or `fix/keyboard-input`

3. **Development Workflow**
   - Create a feature branch from `main`
   - Make changes and commits in the feature branch
   - Keep feature branches up to date with `main` by rebasing
   - When feature is complete, rebase on latest `main` before merging

## Merge Process

1. **Code Review**
   - All code should be reviewed before merging to `main`
   - Address all review comments before proceeding

2. **Rebase and Merge**
   - Rebase feature branch on latest `main` to ensure clean history
   - Resolve any conflicts during rebase
   - Use `--ff-only` merge to maintain linear history
   - Example workflow:
     ```bash
     git checkout feature/my-feature
     git rebase main
     git checkout main
     git merge --ff-only feature/my-feature
     ```

3. **Clean Up**
   - Delete feature branches after successful merge
   - Keep the repository clean of stale branches

## Best Practices

1. **Pull Before Push**
   - Always pull latest changes before pushing to remote
   - Resolve any conflicts locally

2. **Atomic Commits**
   - Each commit should leave the codebase in a working state
   - Break large changes into smaller, logical commits

3. **Never Rewrite Public History**
   - Only rebase branches that haven't been shared with others
   - If a branch is already pushed and shared, create a new commit instead of amending

4. **Commit Early and Often**
   - Make small, incremental commits rather than large, sweeping changes
   - This makes debugging and code review easier