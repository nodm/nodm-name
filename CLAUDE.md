# nodm.name Project Documentation

## Project Overview

This project deploys a **TanStack Start application** for the domain `nodm.name` using serverless AWS infrastructure managed by Pulumi.

The repository is structured as an npm workspace monorepo:
- **packages/iac/** - Infrastructure as code with Pulumi (CommonJS/Node resolution)
- **packages/app/** - TanStack Start application with React 19 (ESM/Bundler resolution)

This separation allows each package to have different TypeScript configurations optimized for their respective use cases.

## Architecture

### Infrastructure Components

1. **Lambda Function**
   - **App Function** (`nodm-name-app`)
     - Runtime: Node.js 22.x
     - Handler: TanStack Start SSR handler (`.output/server/index.mjs`)
     - Memory: 512 MB
     - Timeout: 30 seconds
     - IAM role with basic Lambda execution permissions
     - Environment: Production mode

2. **API Gateway HTTP API**
   - **HTTP API** (`nodm-name-api`)
     - Protocol: HTTP (v2)
     - Integration: AWS_PROXY to Lambda function
     - Default route (`$default`) forwards all requests to Lambda
     - Auto-deploy enabled
     - More cost-effective than REST API

3. **S3 Bucket**
   - **Static Assets Bucket** (`nodm-name`)
     - Private bucket for client-side assets (CSS, JS, images)
     - Public access blocked at all levels
     - Contains: Built assets from `.output/public/`
     - Origin Access Control (OAC) for CloudFront access
   - **Pulumi State Bucket** (`nodm-name-pulumi-state`)
     - Stores Pulumi infrastructure state
     - Versioning enabled for state history
     - Server-side encryption (AES256)
     - Private access only

4. **CloudFront CDN**
   - Global content delivery network
   - HTTPS-only (redirects HTTP to HTTPS)
   - **Dual-origin architecture**:
     - **API Gateway origin** (default): Dynamic content, SSR pages
     - **S3 origin**: Static assets (`/assets/*`, images, manifests)
   - **Cache behaviors**:
     - Static assets: Long cache (1 day default, 1 year max)
     - Dynamic content: No cache (always fresh from Lambda)
   - Compression enabled for all content
   - Price class: PriceClass_100 (US, Canada, Europe)

5. **SSL/TLS Certificate**
   - AWS Certificate Manager (ACM)
   - Region: us-east-1 (required for CloudFront)
   - Covers: `nodm.name` and `www.nodm.name`
   - Validation: DNS
   - Minimum protocol: TLSv1.2

6. **Route53 DNS**
   - A records for apex domain (`nodm.name`)
   - A records for www subdomain
   - Both alias to CloudFront distribution

### Security Features

- Private S3 bucket (no public access)
- CloudFront OAC authentication for S3
- HTTPS-only access (HTTP redirects to HTTPS)
- TLS 1.2 minimum
- Lambda execution in VPC not required (stateless)
- IAM least-privilege for Lambda execution
- API Gateway invocation restricted to CloudFront origin

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions CI/CD workflow
├── packages/
│   ├── iac/             # Infrastructure as code
│   │   ├── index.ts     # Pulumi infrastructure configuration
│   │   ├── package.json # IAC dependencies
│   │   ├── tsconfig.json # TypeScript config (CommonJS)
│   │   ├── Pulumi.yaml  # Pulumi project metadata
│   │   └── Pulumi.dev.yaml # Stack configuration
│   └── app/             # TanStack Start application
│       ├── src/
│       │   ├── routes/  # File-based routing
│       │   ├── components/ # React components
│       │   ├── router.tsx
│       │   └── styles.css
│       ├── public/      # Static assets
│       ├── package.json # App dependencies
│       ├── tsconfig.json # TypeScript config (ESM/Bundler)
│       ├── vite.config.ts # Vite configuration
│       └── biome.json   # Biome configuration
├── src/
│   └── index.html       # Under construction page (static)
├── package.json         # Workspace root configuration
└── CLAUDE.md           # This file
```

## Key Files

### packages/iac/index.ts
Main Pulumi infrastructure file that defines:
- Lambda function with TanStack Start handler
- API Gateway HTTP API and integrations
- S3 bucket for static assets and access policies
- CloudFront distribution with dual origins
- ACM certificate and DNS validation
- Route53 DNS records
- IAM roles and permissions
- Resource tagging and organization

### packages/iac/deploy.sh
Deployment script that:
- Builds the TanStack Start app
- Syncs static assets to S3
- Deploys infrastructure with Pulumi

### packages/app/
TanStack Start application with:
- **React 19** - Latest React with modern features
- **TanStack Router** - Type-safe file-based routing
- **Vite** - Fast development and build tooling
- **Tailwind CSS v4** - Utility-first CSS framework
- **TypeScript** - Full type safety with ESM/Bundler resolution
- **Biome** - Fast linting and formatting
- **Vitest** - Unit testing framework
- **File-based routing** in src/routes/
- **Server functions** and API routes support
- **SSR capabilities** with multiple rendering modes

### .github/workflows/deploy.yml
GitHub Actions workflow that:
- Triggers on push to main branch (filtered paths: `packages/app/**`, `packages/iac/**`)
- Sets up Node.js and npm
- Installs workspace dependencies
- Configures AWS credentials via OIDC
- Builds TanStack Start app
- Syncs static assets to S3
- Deploys infrastructure using Pulumi (includes Lambda code update)
- Runs automatically on every commit to main

## Configuration

### Domain Setup
- Primary domain: `nodm.name`
- Subdomains: `www`
- Both resolve to the same CloudFront distribution

### Tags
All resources tagged with:
- `Project: nodm-name`
- `ManagedBy: Pulumi`

## AWS Permissions

### Required IAM Permissions

To deploy this infrastructure, you need the following AWS permissions:

#### S3 Permissions
- `s3:CreateBucket`
- `s3:DeleteBucket`
- `s3:ListBucket`
- `s3:GetBucketPolicy`
- `s3:PutBucketPolicy`
- `s3:DeleteBucketPolicy`
- `s3:GetBucketPublicAccessBlock`
- `s3:PutBucketPublicAccessBlock`
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:PutObjectTagging`
- `s3:GetBucketTagging`
- `s3:PutBucketTagging`
- `s3:GetBucketVersioning`
- `s3:PutBucketVersioning`
- `s3:GetEncryptionConfiguration`
- `s3:PutEncryptionConfiguration`
- `s3:ListBucketVersions`

#### CloudFront Permissions
- `cloudfront:CreateDistribution`
- `cloudfront:GetDistribution`
- `cloudfront:UpdateDistribution`
- `cloudfront:DeleteDistribution`
- `cloudfront:TagResource`
- `cloudfront:ListTagsForResource`
- `cloudfront:CreateOriginAccessControl`
- `cloudfront:GetOriginAccessControl`
- `cloudfront:UpdateOriginAccessControl`
- `cloudfront:DeleteOriginAccessControl`

#### ACM (Certificate Manager) Permissions
- `acm:RequestCertificate`
- `acm:DescribeCertificate`
- `acm:DeleteCertificate`
- `acm:AddTagsToCertificate`
- `acm:ListTagsForCertificate`

#### Route53 Permissions
- `route53:GetHostedZone`
- `route53:ListHostedZones`
- `route53:ListHostedZonesByName`
- `route53:ChangeResourceRecordSets`
- `route53:GetChange`
- `route53:ListResourceRecordSets`

#### Lambda Permissions
- `lambda:CreateFunction`
- `lambda:DeleteFunction`
- `lambda:GetFunction`
- `lambda:UpdateFunctionCode`
- `lambda:UpdateFunctionConfiguration`
- `lambda:AddPermission`
- `lambda:RemovePermission`
- `lambda:GetPolicy`
- `lambda:TagResource`
- `lambda:ListTags`

#### API Gateway Permissions
- `apigateway:GET`
- `apigateway:POST`
- `apigateway:PUT`
- `apigateway:DELETE`
- `apigateway:PATCH`

#### IAM Permissions (for Lambda role)
- `iam:CreateRole`
- `iam:DeleteRole`
- `iam:GetRole`
- `iam:PassRole`
- `iam:AttachRolePolicy`
- `iam:DetachRolePolicy`
- `iam:ListAttachedRolePolicies`
- `iam:TagRole`
- `iam:UntagRole`

### IAM Policy Example

Create an IAM policy with the following JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketReadPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketPolicy",
        "s3:GetBucketPublicAccessBlock",
        "s3:GetBucketTagging",
        "s3:GetBucketVersioning",
        "s3:GetEncryptionConfiguration",
        "s3:ListBucketVersions",
        "s3:GetBucketAcl",
        "s3:GetBucketCORS",
        "s3:GetBucketWebsite",
        "s3:GetBucketLogging",
        "s3:GetBucketRequestPayment",
        "s3:GetBucketLocation",
        "s3:GetReplicationConfiguration",
        "s3:GetLifecycleConfiguration",
        "s3:GetAccelerateConfiguration",
        "s3:GetBucketObjectLockConfiguration"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name",
        "arn:aws:s3:::nodm-name-pulumi-state"
      ]
    },
    {
      "Sid": "S3BucketWritePermissions",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketTagging",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name",
        "arn:aws:s3:::nodm-name-pulumi-state"
      ]
    },
    {
      "Sid": "S3ObjectReadPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name/*",
        "arn:aws:s3:::nodm-name-pulumi-state/*"
      ]
    },
    {
      "Sid": "S3PulumiStateObjectPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name-pulumi-state/*"
      ]
    },
    {
      "Sid": "S3WebsiteObjectWritePermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectTagging",
        "s3:GetObjectTagging"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name/*"
      ]
    },
    {
      "Sid": "CloudFrontPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:TagResource",
        "cloudfront:ListTagsForResource",
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:GetOriginAccessControl",
        "cloudfront:UpdateOriginAccessControl",
        "cloudfront:DeleteOriginAccessControl"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ACMPermissions",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:AddTagsToCertificate",
        "acm:ListTagsForCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Route53Permissions",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ListHostedZonesByName",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets",
        "route53:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LambdaPermissions",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:GetPolicy",
        "lambda:TagResource",
        "lambda:UntagResource",
        "lambda:ListTags"
      ],
      "Resource": "arn:aws:lambda:*:*:function:nodm-name-app"
    },
    {
      "Sid": "APIGatewayPermissions",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:DELETE",
        "apigateway:PATCH"
      ],
      "Resource": [
        "arn:aws:apigateway:*::/apis",
        "arn:aws:apigateway:*::/apis/*"
      ]
    },
    {
      "Sid": "IAMRolePermissions",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "arn:aws:iam::*:role/nodm-name-*"
    }
  ]
}
```

### Setting Up AWS Credentials for Local Development

For local development, you can use the AWS CLI:

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Set default region (e.g., us-east-1)
# Set default output format: json
```

Or use environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

### Setting Up GitHub Actions with OIDC (Recommended)

This project uses **OpenID Connect (OIDC)** to authenticate GitHub Actions with AWS. This is more secure than storing long-lived AWS credentials as it uses temporary credentials for each workflow run.

#### Step 1: Create OIDC Identity Provider in AWS

1. Open the AWS IAM Console
2. Navigate to **Identity providers** → **Add provider**
3. Configure the provider:
   - **Provider type**: OpenID Connect
   - **Provider URL**: `https://token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
4. Click **Add provider**

#### Step 2: Create IAM Role for GitHub Actions

1. In the IAM Console, go to **Roles** → **Create role**
2. Select **Web identity** as the trusted entity type
3. Configure the trust relationship:
   - **Identity provider**: `token.actions.githubusercontent.com`
   - **Audience**: `sts.amazonaws.com`
   - Click **Next**

4. Attach the deployment policy (the JSON policy shown above in the "IAM Policy Example" section)

5. Name the role (e.g., `GitHubActionsDeployRole`)

6. After creating the role, edit the trust relationship to restrict access to your specific repository:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/nodm-name:ref:refs/heads/main"
           }
         }
       }
     ]
   }
   ```

   Replace:
   - `YOUR_ACCOUNT_ID` with your AWS account ID
   - `YOUR_GITHUB_USERNAME` with your GitHub username or organization name

7. Copy the **Role ARN** (you'll need this for GitHub Secrets)

#### Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

   **Required Secrets:**
   - `AWS_ROLE_ARN`: The ARN of the IAM role you created (e.g., `arn:aws:iam::123456789012:role/GitHubActionsDeployRole`)
   - `AWS_REGION`: Your preferred AWS region (e.g., `us-east-1`)
   - `PULUMI_CONFIG_PASSPHRASE`: A secure passphrase for encrypting Pulumi secrets (create a strong random password)

   **Notes**:
   - You do NOT need to store `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` when using OIDC
   - The `PULUMI_CONFIG_PASSPHRASE` is required for Pulumi to encrypt sensitive configuration values in your stack
   - Choose a strong passphrase and store it securely - you'll need it for local development too
   - If you lose this passphrase, you won't be able to decrypt secrets in your Pulumi stack

#### Benefits of OIDC Authentication

- **No long-lived credentials**: No access keys to manage or rotate
- **Temporary credentials**: Each workflow run gets fresh, short-lived credentials
- **Better security**: Credentials can't be leaked or stolen from GitHub Secrets
- **Fine-grained access**: Can restrict access by repository, branch, or even specific workflows
- **Audit trail**: AWS CloudTrail shows which GitHub Actions assumed the role

### Tag Enforcement

The IAM policy includes conditions that enforce required tags on all resources:

- **Required Tags**: `Project=nodm-name` and `ManagedBy=Pulumi`
- **Enforcement**: Resources can only be created/modified if these tags are present
- **Benefits**:
  - Ensures consistent resource tagging across the infrastructure
  - Prevents creation of untagged resources
  - Improves cost tracking and resource management
  - Enforces organizational governance policies

**Note**: Pulumi automatically applies these tags to all resources defined in `iac/index.ts` (see commonTags), so the conditions will be satisfied automatically. The conditions provide an additional security layer to prevent manual resource creation without proper tags.

### Important Notes

- **Multi-Region Access**: ACM certificate is created in `us-east-1` (required for CloudFront), ensure permissions work across regions
- **Pre-existing Route53 Hosted Zone**: The deployment assumes a Route53 hosted zone for `nodm.name` already exists
- **CloudFront Global Service**: CloudFront is a global service, so `Resource: "*"` is required for most CloudFront actions
- **API Gateway Global Actions**: API Gateway uses `Resource: "*"` and path-based resources for v2 HTTP APIs
- **Lambda Function Scoping**: Lambda permissions are scoped to the specific function name (`nodm-name-app`) for security
- **IAM Role Scoping**: IAM role permissions use wildcard pattern (`nodm-name-*`) to allow Pulumi-managed role creation
- **PassRole Permission**: The `iam:PassRole` permission is required for Lambda to assume the execution role
- **Route53 Tagging**: Route53 DNS records don't support tags, so no condition is added to Route53 permissions
- **Least Privilege**: S3, Lambda, and IAM permissions are scoped to specific resources for better security
- **Pulumi State Storage**: This project uses self-managed state in the `nodm-name-pulumi-state` S3 bucket. The IAM policy includes permissions for both the website bucket and the state bucket.
- **State Bucket Versioning**: The state bucket has versioning enabled to maintain history and allow rollback if needed
- **State Bucket Encryption**: Server-side encryption (AES256) is enabled on the state bucket for security
- **Tag Conditions**: The `aws:RequestTag` condition only applies when tags are being added (create/update with tags). Read and describe operations don't include tag conditions.

## Deployment

### Prerequisites
- AWS account with appropriate permissions (see AWS Permissions section above)
- Pulumi CLI installed
- Node.js and npm installed
- Route53 hosted zone for `nodm.name` (must exist before deployment)
- AWS credentials configured (see AWS Permissions section)

### State Management

This project uses **self-managed state storage** in an S3 bucket (`nodm-name-pulumi-state`) instead of Pulumi Cloud.

**First-time setup:**
```bash
# Login to S3 backend
pulumi login s3://nodm-name-pulumi-state

# Select or create the stack
pulumi stack select prod --create
```

**Note:** The state bucket is created by the Pulumi code itself, so on the very first deployment, you'll need to:
1. Comment out the state bucket creation temporarily
2. Deploy once to create the state bucket
3. Uncomment the state bucket code
4. Deploy again to add versioning and encryption

Alternatively, manually create the `nodm-name-pulumi-state` bucket before your first deployment.

### Manual Deploy Commands
```bash
# Install dependencies (from root directory)
npm install

# Navigate to infrastructure directory
cd packages/iac

# Login to S3 backend (first time only)
pulumi login s3://nodm-name-pulumi-state

# Select stack
pulumi stack select prod

# Preview changes
npm run preview

# Deploy everything (app + infrastructure)
npm run deploy-all
# This runs: build app → sync static assets to S3 → deploy with Pulumi

# Or deploy infrastructure only (without building app)
npm run deploy

# Destroy infrastructure
npm run destroy
```

**Note**: The `deploy-all` script:
1. Builds the TanStack Start app (`npm run build` in packages/app)
2. Syncs static assets from `.output/public/` to S3
3. Deploys infrastructure with Pulumi (which includes Lambda function code)

### CI/CD Deployment (Automatic)

The project includes GitHub Actions workflow for automatic deployment on every push to the `main` branch.

#### Prerequisites

Before the CI/CD pipeline can work, you need to:

1. **Set up OIDC authentication** (see "Setting Up GitHub Actions with OIDC" section above)
2. **Configure GitHub Secrets** in your repository (Settings → Secrets and variables → Actions):
   - `AWS_ROLE_ARN`: The ARN of the IAM role for GitHub Actions
   - `AWS_REGION`: Your deployment region (e.g., `us-east-1`)
   - `PULUMI_CONFIG_PASSPHRASE`: Passphrase for encrypting Pulumi secrets

**Note:** This project uses:
- **OIDC authentication** (no long-lived AWS credentials needed)
- **Self-managed state storage** in S3 (`nodm-name-pulumi-state` bucket)
- **Passphrase-based encryption** for Pulumi secrets (instead of Pulumi Cloud key management)
- No Pulumi Cloud account or access token required

#### How It Works

1. Developer pushes code to `main` branch (affecting `packages/app/**` or `packages/iac/**`)
2. GitHub Actions workflow triggers automatically
3. Workflow checks out code and sets up Node.js
4. Installs npm dependencies (workspace)
5. Authenticates with AWS using OIDC (assumes the IAM role)
6. Receives temporary AWS credentials valid for the workflow duration
7. Installs Pulumi CLI
8. Logs into S3 backend (`s3://nodm-name-pulumi-state`)
9. Selects or creates the `prod` stack
10. **Builds TanStack Start app** (`npm run build` in packages/app)
11. **Syncs static assets** from `.output/public/` to S3 bucket
12. Runs `pulumi up` to deploy infrastructure changes (includes Lambda code update)
13. Infrastructure and application are updated automatically
14. Temporary credentials expire after workflow completes

#### Workflow File Location

The workflow is defined in `.github/workflows/deploy.yml`

#### Viewing Deployment Status

- Go to your GitHub repository
- Click on the "Actions" tab
- View running or completed workflows
- Click on a workflow run to see detailed logs

### Outputs
After deployment, Pulumi exports:
- `bucketName`: S3 bucket identifier
- `lambdaFunctionName`: Lambda function name
- `apiGatewayUrl`: API Gateway endpoint URL
- `cdnUrl`: CloudFront distribution URL
- `customDomainUrl`: https://nodm.name
- `wwwUrl`: https://www.nodm.name

## Recent Changes

### Latest Updates
- **Feat**: Deployed TanStack Start app with Lambda + API Gateway
- **Feat**: Added dual-origin CloudFront (API Gateway + S3)
- **Feat**: Configured Nitro v2 plugin with AWS Lambda preset
- **Feat**: Added deployment script for static assets
- **Feat**: Updated CI/CD workflow for app build and deployment

## Development Notes

### Working with the TanStack Start App

**Development server:**
```bash
cd packages/app
npm run dev
```
Runs at http://localhost:3000 with hot reload.

**Build for production:**
```bash
cd packages/app
npm run build
```

**Available scripts:**
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests with Vitest
- `npm run lint` - Lint with Biome
- `npm run format` - Format with Biome
- `npm run check` - Run Biome checks

**File-based routing:**
- Add routes in `packages/app/src/routes/`
- Route tree auto-generates in `src/routeTree.gen.ts`

### Updating the Application
1. Modify code in `packages/app/src/`
2. Test locally with `npm run dev`
3. Deploy with `npm run deploy-all` from `packages/iac/`
4. Application updates automatically (Lambda + static assets)

### Infrastructure Changes

**Subdomain management:**
1. Add subdomain names to the `subdomains` array in `packages/iac/index.ts`
2. Run `npm run deploy` from `packages/iac/` to create DNS records and update certificate

**Lambda configuration:**
1. Update timeout, memory, or environment variables in `packages/iac/index.ts`
2. Deploy with `npm run deploy` from `packages/iac/`

## Cost Considerations

For **~1000 visitors/month** (estimated budget: **$10/month**):

- **Lambda**:
  - Free tier: 1M requests + 400,000 GB-seconds per month
  - Expected cost: **$0-2/month** (well within free tier)

- **API Gateway HTTP API**:
  - Free tier: 1M requests per month (first 12 months)
  - After free tier: $1 per million requests
  - Expected cost: **$0-1/month**

- **S3**:
  - Storage + requests for static assets
  - Expected cost: **<$1/month**

- **CloudFront**:
  - Free tier: 1TB data transfer out per month (first 12 months)
  - Pay-per-use: requests + data transfer
  - Expected cost: **$0-3/month**

- **Route53**:
  - Hosted zone: $0.50/month
  - Query charges: ~$0.40/month for 1M queries
  - Expected cost: **~$1/month**

- **ACM Certificate**: Free

**Estimated total**: **$2-8/month** (mostly free tier first year, then $5-10/month)

### Cost Optimization Tips
- Lambda cold starts: ~1-3s for low traffic (acceptable for this use case)
- CloudFront caching reduces Lambda invocations
- S3 static assets reduce Lambda load
- HTTP API cheaper than REST API Gateway

## Security Best Practices

1. **S3 bucket is private** (no public access)
2. **Access only through CloudFront** with Origin Access Control (OAC)
3. **HTTPS enforced** (HTTP redirects to HTTPS)
4. **TLS 1.2+ required** for all connections
5. **OIDC authentication** for GitHub Actions (no long-lived credentials)
6. **Temporary credentials** that expire after each deployment
7. **Repository-specific IAM role** with least-privilege permissions
8. **No sensitive data in repository** (credentials managed via GitHub Secrets)
9. **Infrastructure as code** (version controlled and auditable)
10. **Resource tagging** enforced via IAM conditions

## Troubleshooting

### Certificate Validation Issues
- Check DNS records are propagated
- Verify Route53 hosted zone matches domain
- Wait up to 30 minutes for validation

### CloudFront Not Serving Content
- Verify bucket policy allows CloudFront
- Check OAC configuration
- Ensure static assets are uploaded to S3
- Check CloudFront cache behaviors and origins
- Create CloudFront invalidation to clear cache

### Lambda Function Errors
- Check CloudWatch Logs for Lambda execution logs
- Verify Lambda has sufficient memory/timeout
- Test Lambda function directly via API Gateway URL
- Check Lambda permissions and IAM role

### API Gateway Issues
- Verify Lambda integration is configured correctly
- Check API Gateway logs in CloudWatch
- Test API Gateway endpoint directly
- Ensure Lambda permission allows API Gateway invocation

### DNS Not Resolving
- Verify Route53 A records exist
- Check CloudFront distribution is deployed
- Wait for DNS propagation (up to 48 hours)

## CI/CD Pipeline Features

### Current Implementation
- Automatic deployment on push to `main` branch
- Path filtering (triggers on `packages/app/**`, `packages/iac/**`)
- GitHub Actions workflow with OIDC authentication
- Temporary AWS credentials (no long-lived secrets)
- Node.js workspace environment
- TanStack Start app build step
- Static asset sync to S3
- Pulumi integration for infrastructure as code
- Self-managed state storage in S3

### Security Best Practices
- **OIDC authentication** eliminates need for long-lived AWS credentials
- **Temporary credentials** issued per workflow run and auto-expire
- **Repository-scoped access** via IAM trust policy
- **Branch-specific permissions** (restricted to `main` branch)
- Never commit AWS credentials to the repository
- Use GitHub Secrets only for role ARN and region (non-sensitive)
- Use least-privilege IAM policies
- Monitor workflow logs and AWS CloudTrail for audit trail

## Future Enhancements

- ~~Deploy TanStack Start app~~ ✅ **COMPLETED**
- Add custom error pages (404, 403) via Lambda
- Implement logging (CloudFront + Lambda CloudWatch logs)
- Add CloudWatch alarms for monitoring Lambda errors/latency
- Implement automatic cache invalidation on deployment
- Add preview deployments for pull requests
- Set up staging environment (separate Lambda + stack)
- Add Lambda provisioned concurrency for reduced cold starts
- Implement Lambda@Edge for request/response manipulation
- Add database integration (DynamoDB, RDS, etc.)
