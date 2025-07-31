# Release Checklist

Before publishing to npm, ensure all items are checked:

## Pre-release Checks

- [ ] All tests pass (`npm test`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation succeeds (`npm run typecheck`)
- [ ] Build completes successfully (`npm run build`)
- [ ] Bundle sizes are within limits
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated with version changes
- [ ] Demo site works correctly

## Package Configuration

- [ ] package.json version is updated
- [ ] package.json metadata is correct:
  - [ ] name: `webgl-carousel`
  - [ ] description is accurate
  - [ ] keywords are comprehensive
  - [ ] author information is correct
  - [ ] repository URL is correct
  - [ ] homepage URL is correct
  - [ ] license is correct (MIT)
- [ ] .npmignore excludes all unnecessary files
- [ ] README.md has correct badges and links
- [ ] All exports in package.json are correct

## npm Account Setup

- [ ] npm account exists
- [ ] npm account is verified
- [ ] 2FA is enabled (recommended)
- [ ] npm access token is generated for CI/CD

## Publishing Steps

1. **Final build and test**
   ```bash
   npm run build
   npm test
   npm run test:e2e
   ```

2. **Check what will be published**
   ```bash
   npm pack --dry-run
   ```

3. **Login to npm**
   ```bash
   npm login
   ```

4. **Publish to npm**
   ```bash
   npm publish
   ```

5. **Create Git tag**
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

6. **GitHub Release**
   - Will be created automatically by GitHub Actions
   - Verify release notes are correct

## Post-release Checks

- [ ] Package is visible on npmjs.com
- [ ] Installation works: `npm install webgl-carousel`
- [ ] CDN links work (unpkg, jsDelivr)
- [ ] Documentation site is live
- [ ] Demo site is accessible
- [ ] GitHub release is created
- [ ] Announce release (Twitter, blog, etc.)

## Rollback Plan

If issues are found after release:

1. **Unpublish the broken version** (within 72 hours)
   ```bash
   npm unpublish webgl-carousel@0.1.0
   ```

2. **Fix the issue**

3. **Publish a patch version**
   ```bash
   npm version patch
   npm publish
   ```

## Notes

- First publication may take a few minutes to appear on npm
- CDN services may take up to 24 hours to update
- Always test installation in a fresh project after publishing