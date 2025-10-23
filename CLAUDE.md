# nodm.name Project Documentation

## Project Overview

This project deploys a static "Under Construction" website for the domain `nodm.name` using AWS infrastructure managed by Pulumi.

## Architecture

### Infrastructure Components

1. **S3 Buckets**
   - **Website Bucket** (`nodm-name`)
     - Private bucket for storing website content
     - Public access blocked at all levels
     - Contains: `index.html` (under construction page)
   - **Pulumi State Bucket** (`nodm-name-pulumi-state`)
     - Stores Pulumi infrastructure state
     - Versioning enabled for state history
     - Server-side encryption (AES256)
     - Private access only

2. **CloudFront CDN**
   - Global content delivery network
   - HTTPS-only (redirects HTTP to HTTPS)
   - Origin Access Control (OAC) for secure S3 access
   - Cache TTL: 3600s default, 86400s max
   - Price class: PriceClass_100 (US, Canada, Europe)

3. **SSL/TLS Certificate**
   - AWS Certificate Manager (ACM)
   - Region: us-east-1 (required for CloudFront)
   - Covers: `nodm.name` and `www.nodm.name`
   - Validation: DNS
   - Minimum protocol: TLSv1.2

4. **Route53 DNS**
   - A records for apex domain (`nodm.name`)
   - A records for www subdomain
   - Both alias to CloudFront distribution

### Security Features

- Private S3 bucket (no public access)
- CloudFront OAC authentication
- HTTPS-only access (HTTP redirects to HTTPS)
- TLS 1.2 minimum
- Bucket policy restricts access to CloudFront only

## File Structure

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions CI/CD workflow
├── iac/
│   └── index.ts         # Pulumi infrastructure configuration
├── src/
│   └── index.html       # Under construction page
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
└── CLAUDE.md           # This file
```

## Key Files

### iac/index.ts
Main Pulumi infrastructure file that defines:
- S3 bucket and access policies
- CloudFront distribution configuration
- ACM certificate and DNS validation
- Route53 DNS records
- Resource tagging and organization

### src/index.html
Static HTML page with:
- Modern gradient design (purple theme)
- Animated construction icon
- Progress bar showing 75% completion
- Floating background shapes
- Responsive design for mobile devices
- All styles embedded (no external dependencies)

### .github/workflows/deploy.yml
GitHub Actions workflow that:
- Triggers on push to main branch
- Sets up Node.js and npm
- Installs project dependencies
- Configures AWS credentials
- Deploys infrastructure using Pulumi
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
- **Route53 Tagging**: Route53 DNS records don't support tags, so no condition is added to Route53 permissions
- **Least Privilege**: The S3 permissions are scoped to specific bucket names (`nodm-name` and `nodm-name-pulumi-state`) for better security
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
cd iac

# Login to S3 backend (first time only)
pulumi login s3://nodm-name-pulumi-state

# Select stack
pulumi stack select prod

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

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

1. Developer pushes code to `main` branch
2. GitHub Actions workflow triggers automatically
3. Workflow checks out code and sets up Node.js
4. Installs npm dependencies
5. Authenticates with AWS using OIDC (assumes the IAM role)
6. Receives temporary AWS credentials valid for the workflow duration
7. Installs Pulumi CLI
8. Logs into S3 backend (`s3://nodm-name-pulumi-state`)
9. Selects or creates the `prod` stack
10. Runs `pulumi up` to deploy changes
11. Infrastructure is updated automatically
12. Temporary credentials expire after workflow completes

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
- `cdnUrl`: CloudFront distribution URL
- `customDomainUrl`: https://nodm.name
- `wwwUrl`: https://www.nodm.name

## Recent Changes

### Latest Commits
- Fix: Update CloudFront origin ID and target origin ID for S3 bucket
- Fix: Update viewer protocol policy to redirect to HTTPS
- Feat: Add deployment setup
- Feat: Add "Under construction" page

## Development Notes

### Updating the Website
1. Modify `src/index.html`
2. Run `pulumi up` to upload changes
3. CloudFront cache may take up to 24 hours to refresh
4. To force immediate update, create a CloudFront invalidation

### Adding New Pages
1. Add HTML files to `src/` directory
2. Create new `BucketObject` resources in `iac/index.ts`
3. Update CloudFront configuration if needed
4. Deploy with `pulumi up` (from the `iac/` directory)

### Subdomain Management
To add more subdomains:
1. Add subdomain names to the `subdomains` array in `iac/index.ts`
2. Run `pulumi up` to create DNS records and update certificate

## Cost Considerations

- **S3**: Minimal (storage + requests)
- **CloudFront**: Pay-per-use (requests + data transfer)
- **Route53**: ~$0.50/month per hosted zone + query charges
- **ACM Certificate**: Free
- **Estimated total**: $1-5/month for low traffic

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
- Verify S3 bucket policy allows CloudFront
- Check OAC configuration
- Ensure index.html is uploaded to bucket

### DNS Not Resolving
- Verify Route53 A records exist
- Check CloudFront distribution is deployed
- Wait for DNS propagation (up to 48 hours)

## CI/CD Pipeline Features

### Current Implementation
- Automatic deployment on push to `main` branch
- GitHub Actions workflow with OIDC authentication
- Temporary AWS credentials (no long-lived secrets)
- Node.js environment setup
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

- Add custom error pages (404, 403)
- Implement logging (CloudFront + S3 access logs)
- Add CloudWatch alarms for monitoring
- Add content compression (Gzip/Brotli)
- Implement cache invalidation strategy
- Add preview deployments for pull requests
- Set up staging environment
