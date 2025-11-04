import * as path from "node:path";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Configuration
const domainName = "nodm.name";
const subdomains = ["www"];

// Common tags for all resources
const commonTags = {
    Project: "nodm-name",
    ManagedBy: "Pulumi",
};

// Note: The Pulumi state bucket (nodm-name-pulumi-state) is managed separately
// and should not be part of the infrastructure code to avoid circular dependencies

// ===== S3 BUCKET FOR STATIC ASSETS =====

// Create an S3 bucket for static assets (CSS, JS, images)
const bucket = new aws.s3.Bucket("website-bucket", {
    bucket: "nodm-name",
    tags: commonTags,
});

// Keep bucket private (block all public access)
new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
});

// Create CloudFront Origin Access Control for S3
const oac = new aws.cloudfront.OriginAccessControl("oac", {
    name: "nodm-name-oac",
    description: "OAC for nodm.name S3 bucket",
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
});

// ===== LAMBDA FUNCTION =====

// Create IAM role for Lambda
const lambdaRole = new aws.iam.Role("lambda-role", {
    name: "nodm-name-lambda-role",
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "lambda.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: commonTags,
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment("lambda-basic-execution", {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Create Lambda function with TanStack Start handler
const lambdaFunction = new aws.lambda.Function("app-function", {
    name: "nodm-name-app",
    runtime: "nodejs22.x",
    handler: "index.handler",
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
        ".": new pulumi.asset.FileArchive(path.join(__dirname, "..", "app", ".output", "server")),
    }),
    timeout: 30,
    memorySize: 512,
    environment: {
        variables: {
            NODE_ENV: "production",
        },
    },
    tags: commonTags,
});

// ===== API GATEWAY =====

// Create HTTP API (v2) - cheaper and simpler than REST API
const httpApi = new aws.apigatewayv2.Api("http-api", {
    name: "nodm-name-api",
    protocolType: "HTTP",
    tags: commonTags,
});

// Create Lambda integration
const lambdaIntegration = new aws.apigatewayv2.Integration("lambda-integration", {
    apiId: httpApi.id,
    integrationType: "AWS_PROXY",
    integrationUri: lambdaFunction.arn,
    integrationMethod: "POST",
    payloadFormatVersion: "2.0",
});

// Create default route that forwards all requests to Lambda
const defaultRoute = new aws.apigatewayv2.Route("default-route", {
    apiId: httpApi.id,
    routeKey: "$default",
    target: pulumi.interpolate`integrations/${lambdaIntegration.id}`,
});

// Create API stage (auto-deploy)
const apiStage = new aws.apigatewayv2.Stage("api-stage", {
    apiId: httpApi.id,
    name: "$default",
    autoDeploy: true,
    tags: commonTags,
}, { dependsOn: [defaultRoute, lambdaIntegration] });

// Grant API Gateway permission to invoke Lambda
new aws.lambda.Permission("api-gateway-invoke", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
});

// ===== SSL CERTIFICATE =====

// Get the hosted zone for the domain
const hostedZone = aws.route53.getZone({
    name: domainName,
});

// Create ACM certificate for the domain (must be in us-east-1 for CloudFront)
const usEast1Provider = new aws.Provider("us-east-1", {
    region: "us-east-1",
});

const allDomains = [domainName, ...subdomains.map(sub => `${sub}.${domainName}`)];

const certificate = new aws.acm.Certificate("ssl-cert", {
    domainName: domainName,
    subjectAlternativeNames: subdomains.map(sub => `${sub}.${domainName}`),
    validationMethod: "DNS",
    tags: commonTags,
}, { provider: usEast1Provider });

// Create DNS validation records
const certValidationRecords = certificate.domainValidationOptions.apply(options => {
    const uniqueRecords = new Map<string, typeof options[0]>();
    options.forEach(option => {
        uniqueRecords.set(option.resourceRecordName, option);
    });

    return Array.from(uniqueRecords.values()).map((option, index) => {
        return new aws.route53.Record(`cert-validation-${index}`, {
            name: option.resourceRecordName,
            type: option.resourceRecordType,
            zoneId: hostedZone.then(zone => zone.zoneId),
            records: [option.resourceRecordValue],
            ttl: 60,
        });
    });
});

// Wait for certificate validation
const certificateValidation = new aws.acm.CertificateValidation("cert-validation", {
    certificateArn: certificate.arn,
    validationRecordFqdns: certValidationRecords.apply(records => records.map(r => r.fqdn)),
}, { provider: usEast1Provider });

// ===== CLOUDFRONT DISTRIBUTION =====

// Create CloudFront distribution with dual origins
const cloudfrontDistribution = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    aliases: allDomains,
    // Two origins: API Gateway for dynamic content, S3 for static assets
    origins: [
        {
            originId: "api-gateway-origin",
            domainName: pulumi.interpolate`${httpApi.id}.execute-api.${aws.config.region}.amazonaws.com`,
            customOriginConfig: {
                httpPort: 80,
                httpsPort: 443,
                originProtocolPolicy: "https-only",
                originSslProtocols: ["TLSv1.2"],
            },
        },
        {
            originId: "s3-static-origin",
            domainName: bucket.bucketRegionalDomainName,
            originAccessControlId: oac.id,
        },
    ],
    // Default behavior: API Gateway for dynamic content
    defaultCacheBehavior: {
        targetOriginId: "api-gateway-origin",
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
        cachedMethods: ["GET", "HEAD", "OPTIONS"],
        forwardedValues: {
            queryString: true,
            headers: ["Accept", "Accept-Language", "Authorization", "CloudFront-Forwarded-Proto", "Host", "Origin", "Referer", "User-Agent"],
            cookies: {
                forward: "all",
            },
        },
        minTtl: 0,
        defaultTtl: 60, // 1 minute default cache, respects Cache-Control headers
        maxTtl: 3600, // 1 hour max
        compress: true,
    },
    // Ordered cache behaviors: S3 for static assets (high priority)
    orderedCacheBehaviors: [
        {
            pathPattern: "/assets/*",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
        {
            pathPattern: "/*.ico",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
        {
            pathPattern: "/*.png",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
        {
            pathPattern: "/*.svg",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
        {
            pathPattern: "/*.json",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
        {
            pathPattern: "/*.txt",
            targetOriginId: "s3-static-origin",
            viewerProtocolPolicy: "redirect-to-https",
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            minTtl: 0,
            defaultTtl: 86400, // 1 day
            maxTtl: 31536000, // 1 year
            compress: true,
        },
    ],
    priceClass: "PriceClass_100",
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
    viewerCertificate: {
        acmCertificateArn: certificateValidation.certificateArn,
        sslSupportMethod: "sni-only",
        minimumProtocolVersion: "TLSv1.2_2021",
    },
    tags: commonTags,
});

// Update bucket policy to allow CloudFront OAC access
new aws.s3.BucketPolicy("bucket-policy", {
    bucket: bucket.id,
    policy: pulumi.all([bucket.arn, cloudfrontDistribution.arn]).apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: {
                        Service: "cloudfront.amazonaws.com",
                    },
                    Action: "s3:GetObject",
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringEquals: {
                            "AWS:SourceArn": distributionArn,
                        },
                    },
                },
            ],
        })
    ),
});

// ===== DNS RECORDS =====

// Create Route53 A records pointing to CloudFront
new aws.route53.Record("apex-domain", {
    name: domainName,
    type: "A",
    zoneId: hostedZone.then(zone => zone.zoneId),
    aliases: [{
        name: cloudfrontDistribution.domainName,
        zoneId: cloudfrontDistribution.hostedZoneId,
        evaluateTargetHealth: false,
    }],
});

// Create www subdomain record
subdomains.forEach(subdomain => {
    new aws.route53.Record(`${subdomain}-record`, {
        name: `${subdomain}.${domainName}`,
        type: "A",
        zoneId: hostedZone.then(zone => zone.zoneId),
        aliases: [{
            name: cloudfrontDistribution.domainName,
            zoneId: cloudfrontDistribution.hostedZoneId,
            evaluateTargetHealth: false,
        }],
    });
});

// ===== OUTPUTS =====

export const bucketName = bucket.id;
export const lambdaFunctionName = lambdaFunction.name;
export const apiGatewayUrl = pulumi.interpolate`${httpApi.apiEndpoint}`;
export const cdnUrl = pulumi.interpolate`https://${cloudfrontDistribution.domainName}`;
export const customDomainUrl = `https://${domainName}`;
export const wwwUrl = `https://www.${domainName}`;
