# Versioning Strategy

This document outlines the versioning strategy for the `type-compiler` package and how it integrates with our CI/CD pipeline.

## Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/) for versioning the package:

- **MAJOR** version (x.0.0): Incremented for incompatible API changes
- **MINOR** version (0.x.0): Incremented for added functionality in a backward-compatible manner
- **PATCH** version (0.0.x): Incremented for backward-compatible bug fixes

## Version Workflow

### Manual Publishing

When manually publishing:

1. Update the version in `package.json` using one of these commands:
   ```bash
   # For patch updates (bug fixes)
   npm version patch
   
   # For minor updates (new features)
   npm version minor
   
   # For major updates (breaking changes)
   npm version major
   ```

2. Update the `CHANGELOG.md` with details about the changes.

3. Push the changes including the version tag:
   ```bash
   git push --follow-tags
   ```

### Automated Publishing with GitHub Actions

Our GitHub Actions workflow automates the publishing process when changes are merged to the main branch:

1. **Triggering the Process**:
   - The workflow is triggered automatically when code is pushed to the main branch
   - It can also be triggered manually from the GitHub Actions UI with a specified version bump type (patch, minor, major)

2. **Version Management**:
   - When triggered by a push to main, the workflow will check if the current version needs to be bumped
   - If the current version is already published to npm, the workflow will automatically bump the patch version
   - When triggered manually, you can specify the bump type (patch, minor, major)
   - The workflow automatically updates `package.json` and adds a new entry to `CHANGELOG.md`

3. **Publishing Flow**:
   - The workflow runs tests, builds the package, bumps the version if needed, and publishes to npm
   - The npm publish step uses the `NPM_TOKEN` stored in GitHub Secrets
   - After publishing, a GitHub Release is created with the contents of CHANGELOG.md

## Manual vs. Automated Versioning

You have two options for managing versions:

1. **Pre-commit Version Update**: You can update the version and CHANGELOG.md manually before pushing to main
   - Use `npm version patch|minor|major` to update package.json
   - Edit CHANGELOG.md to document the changes
   - Push with `git push --follow-tags`
   - The CI/CD pipeline will use your specified version

2. **Automated Version Update**: Let the CI/CD pipeline handle versioning
   - Make your changes and push to main without changing the version
   - The CI/CD pipeline will automatically bump the patch version if needed
   - For minor or major version bumps, trigger the workflow manually and select the appropriate bump type

## Release Checklist

Before releasing a new version:

1. ✅ Decide on version management approach (manual or automated)
2. ✅ Ensure all tests pass locally
3. ✅ Create a PR and have it reviewed
4. ✅ Merge to main after approval
5. ✅ For major or minor versions, trigger the workflow manually with the appropriate bump type
6. ✅ Verify the GitHub Actions workflow completes successfully
7. ✅ Check that the new version appears on npm

## Version Constraints and Dependencies

- We maintain compatibility with TypeScript versions specified in `peerDependencies`
- We follow minimal version ranges for dependencies to reduce potential conflicts
- Dependencies are regularly audited and updated 