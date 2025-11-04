# nodm-name

[![Deploy to AWS](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml)

Personal website monorepo with AWS infrastructure managed by Pulumi.
## Features

- **TanStack Start application** with React 19, TypeScript, and Tailwind CSS v4
- **Private S3 hosting** with CloudFront Origin Access Control (OAC)
- **HTTPS-only** with ACM certificate (TLS 1.2+)
- **Custom domain**
- **GitHub Actions CI/CD** with OIDC authentication
- **Self-managed Pulumi state** in S3 (no Pulumi Cloud required)
- **Monorepo structure** with separate packages for app and infrastructure

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) (>= v3)
- [Node.js](https://nodejs.org/) (>= 22)
- AWS credentials configured (via `aws configure` or environment variables)
- Route53 hosted zone for your domain

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Login to S3 backend:

   ```bash
   cd packages/iac
   pulumi login s3://<bucket-name-for-pulumi-state>
   ```

3. Select stack:

   ```bash
   pulumi stack select prod
   ```

4. Preview infrastructure changes:

   ```bash
   npm run preview
   ```

5. Deploy to AWS:

   ```bash
   npm run deploy
   ```

## Available Scripts

**Root level:**
- `npm run lint` - Check code with Biome
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Biome

**Application (packages/app):**
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run lint` - Lint with Biome
- `npm run format` - Format with Biome

**Infrastructure (packages/iac):**
- `npm run preview` - Preview infrastructure changes
- `npm run deploy` - Deploy infrastructure to AWS
- `npm run destroy` - Tear down all AWS resources
- `npm run outputs` - Display deployed URLs

## Project Structure

```
.
├── packages/
│   ├── app/              # TanStack Start application
│   │   ├── src/
│   │   │   ├── routes/   # File-based routing
│   │   │   └── components/ # React components
│   │   ├── package.json  # App dependencies
│   │   ├── tsconfig.json # TypeScript config (ESM)
│   │   └── vite.config.ts # Vite configuration
│   └── iac/              # Infrastructure as code
│       ├── index.ts      # Pulumi infrastructure definition
│       ├── package.json  # IAC dependencies
│       └── tsconfig.json # TypeScript config (CommonJS)
├── src/
│   └── index.html        # Static "under construction" page
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD pipeline
└── package.json          # Workspace root
```

## Development

### Running the App Locally

```bash
cd packages/app
npm run dev
```

Starts development server at http://localhost:3000 with hot reload.

### Building the App

```bash
cd packages/app
npm run build
```

Builds optimized production bundle.

## Deployment

### Infrastructure Deployment

**Automatic (Recommended):**
Push to `main` branch triggers GitHub Actions deployment.

**Manual:**
```bash
cd packages/iac
pulumi up
```

### Updating Static Content

1. Edit `src/index.html`
2. Push to `main` (auto-deploys) or run `pulumi up` manually
3. CloudFront cache TTL: 1 hour (invalidate for immediate updates)

## Cost Considerations

- **S3**: Minimal (storage + requests)
- **CloudFront**: Pay-per-use (requests + data transfer)
- **Route53**: ~$0.50/month per hosted zone + queries
- **ACM**: Free

Estimated: $1-5/month for low traffic

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed architecture, AWS permissions, and deployment setup.

## License

MIT