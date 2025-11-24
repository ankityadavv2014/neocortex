# Branch Protection Guide for Neocortex

This guide provides recommended branch protection rules for the `main` branch to maintain code quality and prevent accidental or malicious changes.

## Quick Setup

Navigate to your GitHub repository settings:
```
https://github.com/ankityadavv2014/neocortex/settings/branches
```

Click **"Add branch protection rule"** for the `main` branch.

---

## Recommended Protection Rules

### 1. **Require Pull Request Reviews Before Merging**
- ✅ Enable: **Require a pull request before merging**
- ✅ Enable: **Require approvals** (set to **1** for solo projects, **2+** for teams)
- ✅ Enable: **Dismiss stale pull request approvals when new commits are pushed**
- ⚠️ Optional: **Require review from Code Owners** (if you set up CODEOWNERS file)

**Why:** Ensures all changes go through review process, catching bugs and maintaining code quality.

---

### 2. **Require Status Checks to Pass**
- ✅ Enable: **Require status checks to pass before merging**
- ✅ Enable: **Require branches to be up to date before merging**

**Select these status checks** (based on your GitHub Actions workflows):

#### From `.github/workflows/`:
- `lint-and-type-check` - TypeScript compilation and linting
- `pr-check` - General PR validation  
- `e2e-tests` - Playwright end-to-end tests (if applicable)

**Note:** Status checks only appear after they've run at least once. Merge a PR first to see them in the list.

**Why:** Prevents merging code that fails tests or linting, maintaining codebase health.

---

### 3. **Require Conversation Resolution**
- ✅ Enable: **Require conversation resolution before merging**

**Why:** Ensures all reviewer feedback is addressed before code lands in main.

---

### 4. **Require Signed Commits** (Optional but Recommended)
- ⚠️ Optional: **Require signed commits**

**Why:** Verifies commit authenticity, preventing impersonation.

To set up commit signing:
```bash
# Generate GPG key
gpg --full-generate-key

# List your keys
gpg --list-secret-keys --keyid-format=long

# Export public key (replace KEY_ID)
gpg --armor --export KEY_ID

# Add to GitHub: Settings > SSH and GPG keys > New GPG key
# Configure git
git config --global user.signingkey KEY_ID
git config --global commit.gpgsign true
```

---

### 5. **Restrict Who Can Push**
- ✅ Enable: **Restrict who can push to matching branches**
- Add specific users/teams who can bypass pull request requirements
- **Recommended:** Keep this list minimal (e.g., only project owner/maintainers)

**Why:** Prevents accidental force-pushes or direct commits to main.

---

### 6. **Force Push Protection**
- ✅ Enable: **Do not allow force pushes**

**Why:** Preserves git history integrity; force pushes can rewrite history and cause data loss.

---

### 7. **Deletion Protection**
- ✅ Enable: **Do not allow deletions**

**Why:** Prevents accidental branch deletion.

---

## Additional Recommendations

### A. **Include Administrators**
- ✅ Enable: **Include administrators**

**Why:** Even repo admins should follow the same rules (best practice for solo/small teams).

---

### B. **Allow Force Pushes** (Special Cases Only)
- ❌ **Do NOT enable** for production repos
- ⚠️ Only enable if you have specific workflows requiring it (e.g., rebasing feature branches)

---

### C. **Require Linear History** (Optional)
- ⚠️ Optional: **Require linear history**

**Why:** Enforces a clean, linear git history (no merge commits). Only enable if your team prefers rebase workflow over merge commits.

---

## Workflow Integration

Ensure your `.github/workflows/` files are configured for branch protection:

### Example: `lint-and-type-check.yml`
```yaml
name: lint-and-type-check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run check-types
```

### Example: `pr-check.yml`
```yaml
name: pr-check

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

---

## Testing Your Setup

After configuring branch protection:

1. **Create a test branch:**
   ```bash
   git checkout -b test/branch-protection
   echo "test" >> README.md
   git add README.md
   git commit -m "test: verify branch protection"
   git push origin test/branch-protection
   ```

2. **Open a pull request** to `main`

3. **Verify:**
   - ✅ You cannot merge without approvals (if required)
   - ✅ You cannot merge with failing status checks
   - ✅ You cannot force-push to main
   - ✅ You cannot delete main branch

4. **Clean up:**
   ```bash
   git checkout main
   git branch -D test/branch-protection
   git push origin --delete test/branch-protection
   ```

---

## Troubleshooting

### "Required status checks are not available"
**Solution:** Status checks only appear after they've run at least once. Merge one PR first.

### "Cannot push to protected branch"
**Solution:** This is expected! Always create a pull request instead of pushing directly to `main`.

### "Status check failed but I need to merge"
**Workaround (emergency only):**
1. Temporarily disable the failing check in branch protection settings
2. Merge the PR
3. Re-enable the check immediately
4. Fix the underlying issue in a follow-up PR

**Better approach:** Fix the failing check before merging.

---

## Maintenance

**Review protection rules quarterly:**
- Are status checks still relevant?
- Should approval count change as team grows?
- Are there new workflows to protect?

**Update this guide** when adding new workflows or changing protection strategy.

---

## Quick Reference: Minimal Setup for Solo Dev

For personal projects with minimal overhead:

1. ✅ Require pull request before merging
2. ✅ Require 1 approval (self-review before merge)
3. ✅ Require status checks: `lint-and-type-check`
4. ✅ Do not allow force pushes
5. ✅ Do not allow deletions

This balances safety with workflow simplicity.

---

## Quick Reference: Team Setup

For team projects:

1. ✅ Require pull request before merging
2. ✅ Require 2 approvals
3. ✅ Dismiss stale approvals on new commits
4. ✅ Require status checks: `lint-and-type-check`, `pr-check`, `e2e-tests`
5. ✅ Require branches up to date
6. ✅ Require conversation resolution
7. ✅ Restrict push access to maintainers only
8. ✅ Do not allow force pushes
9. ✅ Do not allow deletions
10. ✅ Include administrators in protection rules

---

## Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Signing Commits Guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)

---

**Need Help?** Open an issue or ask in our [Discord community](https://discord.gg/gCRu69Upnp)!
