# nodm-name

[![Deploy to AWS](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml)

Personal website monorepo with AWS infrastructure managed by Pulumi.
## Features

- **Private S3 hosting** with CloudFront Origin Access Control (OAC)
- **HTTPS-only** with ACM certificate (TLS 1.2+)
- **Custom domain**
- **GitHub Actions CI/CD** with OIDC authentication
- **Self-managed Pulumi state** in S3 (no Pulumi Cloud required)
- **Monorepo structure** ready for future applications

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

**Infrastructure (packages/iac):**
- `npm run preview` - Preview infrastructure changes
- `npm run deploy` - Deploy infrastructure to AWS
- `npm run destroy` - Tear down all AWS resources
- `npm run outputs` - Display deployed URLs

## Project Structure

```
.
├── packages/
│   └── iac/              # Infrastructure as code
│       ├── index.ts      # Pulumi infrastructure definition
│       ├── package.json  # IAC dependencies
│       └── tsconfig.json # TypeScript config (CommonJS)
├── src/
│   └── index.html        # Static website content
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD pipeline
└── package.json          # Workspace root
```

## Deployment

**Automatic (Recommended):**
Push to `main` branch triggers GitHub Actions deployment.

**Manual:**
```bash
cd packages/iac
pulumi up
```

## Updating Content

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