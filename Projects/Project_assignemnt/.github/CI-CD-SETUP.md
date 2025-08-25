# CI/CD Pipeline Setup

## Overview

This project uses GitHub Actions for continuous integration and deployment. The pipeline ensures code quality, security, and automated deployment.

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches  
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Security**: NPM audit, vulnerability scanning
- **Lint**: ESLint and TypeScript checking
- **Test**: Unit and integration tests with coverage
- **E2E**: Playwright end-to-end tests
- **Build**: Multi-Node.js version build verification
- **Deploy**: Production deployment (main branch only)

### 2. CodeQL Security Analysis (`.github/workflows/codeql.yml`)

**Triggers:**
- Push/PR to main branches
- Weekly schedule (Mondays 6 AM)

**Features:**
- JavaScript/TypeScript security analysis
- Automated vulnerability detection
- Security report generation

### 3. PR Automation (`.github/workflows/pr-automation.yml`)

**Features:**
- Auto-labeling based on file changes
- PR size labeling (XS, S, M, L, XL)
- Semantic PR title validation

## Required Secrets

Set these in your GitHub repository settings:

### Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`

### Testing
- `NEXT_PUBLIC_SUPABASE_URL_TEST`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST`
- `SUPABASE_SERVICE_KEY_TEST`
- `OPENAI_API_KEY_TEST`

### Optional
- `VERCEL_TOKEN` (for Vercel deployment)

## Configuration Files

- `audit-ci.json` - NPM security audit configuration
- `.github/codeql/codeql-config.yml` - CodeQL security analysis settings
- `.github/labeler.yml` - PR auto-labeling rules
- `.github/dependabot.yml` - Automated dependency updates

## Local Testing

Run these commands to test the pipeline locally:

```bash
# Linting
npm run lint

# Unit tests
npm run test:ci

# Build verification
npm run build

# E2E tests  
npm run test:e2e
```

## Pipeline Status

The pipeline will:
✅ Run on every PR and push
✅ Block merging if any jobs fail
✅ Deploy automatically on main branch
✅ Generate coverage reports
✅ Scan for security vulnerabilities
✅ Auto-update dependencies via Dependabot

## Notes

- Tests must pass before deployment
- Coverage reports are uploaded to Codecov
- Security scans run weekly and on changes
- Dependabot creates weekly PRs for updates