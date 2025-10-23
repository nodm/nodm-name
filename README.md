# nodm-name

[![Deploy to AWS](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/nodm/nodm-name/actions/workflows/deploy.yml)

A static website hosted on AWS using Pulumi infrastructure as code. This project deploys a static HTML page to S3 with CloudFront CDN distribution.

## Prerequisites

- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) (>= v3)
- [Node.js](https://nodejs.org/) (>= 14)
- AWS credentials configured (via `aws configure` or environment variables)
- An active Pulumi account (free tier available at https://app.pulumi.com)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Preview the infrastructure changes:

   ```bash
   npm run preview
   ```

3. Deploy to AWS:

   ```bash
   npm run deploy
   ```

   This will create:
   - S3 bucket configured for static website hosting
   - CloudFront distribution for global CDN
   - Bucket policies for public access
   - Upload your static files

4. Get the deployed URLs:

   ```bash
   npm run outputs
   ```

   You'll see:
   - `websiteUrl` - Direct S3 website endpoint
   - `cdnUrl` - CloudFront HTTPS URL (recommended)

## Available Scripts

- `npm run preview` - Preview infrastructure changes before deploying
- `npm run deploy` - Deploy infrastructure to AWS
- `npm run destroy` - Tear down all AWS resources
- `npm run outputs` - Display deployed resource URLs
- `npm run lint` - Check code with Biome
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Biome

## Project Structure

```
.
├── index.ts              # Pulumi infrastructure definition
├── src/
│   └── index.html       # Static website content
├── package.json         # Node.js dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── biome.json          # Biome linter/formatter config
└── Pulumi.yaml         # Pulumi project metadata
```

## Configuration

You can customize the AWS region and other settings:

```bash
pulumi config set aws:region us-west-2
```

## Updating Content

To update the website content:

1. Edit files in the `src/` directory
2. Run `npm run deploy` to upload changes

CloudFront caching is set to 1 hour by default. For immediate updates, you may need to invalidate the CloudFront cache.

## Cleanup

When you're done, remove all AWS resources:

```bash
npm run destroy
```

## Cost Considerations

This infrastructure uses:
- **S3**: Minimal cost for storage and requests
- **CloudFront**: Free tier includes 1TB data transfer and 10M requests/month

Estimated cost: ~$0.50-$2/month for low traffic sites (after free tier).

## Next Steps

- Add custom domain with Route53
- Add SSL certificate with ACM
- Implement CloudFront cache invalidation on deploy
- Add CI/CD with GitHub Actions
- Expand to a full static site generator (Astro, Next.js, etc.)

## License

MIT