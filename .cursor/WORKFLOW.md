# Development Workflow with Bugbot

## Branch Strategy

### Instead of:
```bash
git add -A && git commit -m "message" && git push origin main
```

### Do this:
```bash
# 1. Create feature branch
git checkout -b feat/your-feature-name

# 2. Make changes and commit locally
git add -A
git commit -m "feat: your descriptive message"

# 3. Push to feature branch
git push origin feat/your-feature-name

# 4. Create Pull Request on GitHub
# 5. Wait for Bugbot review
# 6. Fix any issues Bugbot finds
# 7. Merge PR to main (triggers Railway deployment)
```

## Branch Naming Conventions
- `feat/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation changes
- `test/` - Test additions/changes

## Benefits
1. **Bugbot reviews** catch issues before production
2. **No broken builds** on Railway
3. **Clean commit history** on main branch
4. **Easy rollbacks** if needed
5. **Better collaboration** if working with others

## Quick Commands

### Start new feature:
```bash
git checkout main
git pull origin main
git checkout -b feat/new-feature
```

### Update feature branch with main:
```bash
git checkout main
git pull origin main
git checkout feat/your-branch
git merge main
```

### After PR is approved and merged:
```bash
git checkout main
git pull origin main
git branch -d feat/your-branch  # Delete local branch
```
