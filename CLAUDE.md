# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Next.js 16 app with React 19, TypeScript, and Tailwind CSS v4. Recent migration from TanStack Start (see git history).

## Commands

### Development
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
tsc --noEmit         # Check TypeScript errors
```

## Architecture

### Structure
- `app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts (Sans & Mono)
  - `page.tsx` - Home page
  - `globals.css` - Global styles with Tailwind
- `public/` - Static assets
- TypeScript path alias: `@/*` maps to root

### Configuration
- **Next.js**: v16, App Router, minimal config ([next.config.ts](next.config.ts))
- **TypeScript**: Strict mode, ES2017 target
- **ESLint**: Next.js config with core-web-vitals and TypeScript rules
- **Tailwind**: v4 with PostCSS

### Deployment
- **SST**: v3 for AWS infrastructure ([sst.config.ts](sst.config.ts))
  - Next.js component deploys to AWS (CloudFront + Lambda + S3)
  - Custom domain via `DOMAIN_NAME` env var (Route53 + ACM)
  - AWS tags: Project, ManagedBy, Stage
  - Lambda warmer disabled
  - Easy cleanup: `npx sst remove` deletes all resources
- **GitHub Actions**: OIDC auth, deploys on main branch push
  - Required secrets: `AWS_ROLE_ARN`, `DOMAIN_NAME` (optional)
  - IAM policy: [.github/iam-policy.json](.github/iam-policy.json)
- Previous infrastructure: AWS Lambda + API Gateway for TanStack Start
