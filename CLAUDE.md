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
  - Next.js component deploys to AWS
  - Production stage has retention and protection enabled
- GitHub Actions workflow triggers on main branch changes to package files
- Previous infrastructure: AWS Lambda + API Gateway for TanStack Start
