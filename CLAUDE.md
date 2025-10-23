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
      "Sid": "S3BucketPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:ListBucket",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketTagging",
        "s3:PutBucketTagging",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetEncryptionConfiguration",
        "s3:PutEncryptionConfiguration",
        "s3:ListBucketVersions"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name",
        "arn:aws:s3:::nodm-name-pulumi-state"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "nodm-name",
          "aws:RequestTag/ManagedBy": "Pulumi"
        }
      }
    },
    {
      "Sid": "S3ObjectPermissions",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectTagging"
      ],
      "Resource": [
        "arn:aws:s3:::nodm-name/*",
        "arn:aws:s3:::nodm-name-pulumi-state/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "nodm-name",
          "aws:RequestTag/ManagedBy": "Pulumi"
        }
      }
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
        "cloudfront:CreateOriginAccessControl",
        "cloudfront:GetOriginAccessControl",
        "cloudfront:UpdateOriginAccessControl",
        "cloudfront:DeleteOriginAccessControl"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "nodm-name",
          "aws:RequestTag/ManagedBy": "Pulumi"
        }
      }
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
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestTag/Project": "nodm-name",
          "aws:RequestTag/ManagedBy": "Pulumi"
        }
      }
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
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    }
  ]
}
```

### Setting Up AWS Credentials

1. **Create IAM User or Role**
   - Go to AWS IAM Console
   - Create a new IAM user for deployment
   - Attach the policy above to the user

2. **Generate Access Keys**
   - Create access keys for the IAM user
   - Save the Access Key ID and Secret Access Key

3. **Configure AWS CLI**
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Set default region: us-east-1
   # Set default output format: json
   ```

4. **Alternative: Environment Variables**
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key-id"
   export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
   export AWS_REGION="us-east-1"
   ```

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

#### Setup GitHub Secrets

Before the CI/CD pipeline can work, you need to configure the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

**Note:** This project uses self-managed state storage in S3 (`nodm-name-pulumi-state` bucket), so you don't need a Pulumi Cloud account or access token.

#### How It Works

1. Developer pushes code to `main` branch
2. GitHub Actions workflow triggers automatically
3. Workflow checks out code and sets up Node.js
4. Installs npm dependencies
5. Configures AWS credentials from secrets
6. Installs Pulumi CLI
7. Logs into S3 backend (`s3://nodm-name-pulumi-state`)
8. Selects or creates the `prod` stack
9. Runs `pulumi up` to deploy changes
10. Infrastructure is updated automatically

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

1. S3 bucket is private (no public access)
2. Access only through CloudFront with OAC
3. HTTPS enforced (HTTP redirects)
4. TLS 1.2+ required
5. No sensitive data in repository
6. Infrastructure as code (version controlled)

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
- GitHub Actions workflow
- Secure credential management via GitHub Secrets
- Node.js environment setup
- Pulumi integration for infrastructure as code

### Security Best Practices
- Never commit AWS credentials to the repository
- Use GitHub Secrets for sensitive data
- Rotate access keys regularly
- Use least-privilege IAM policies
- Monitor workflow logs for suspicious activity

## Future Enhancements

- Add custom error pages (404, 403)
- Implement logging (CloudFront + S3 access logs)
- Add CloudWatch alarms for monitoring
- Add content compression (Gzip/Brotli)
- Implement cache invalidation strategy
- Add preview deployments for pull requests
- Set up staging environment
