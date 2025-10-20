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

// Create an S3 bucket (private, HTTPS-only access via CloudFront)
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

// Create CloudFront Origin Access Control
const oac = new aws.cloudfront.OriginAccessControl("oac", {
    name: "nodm-name-oac",
    description: "OAC for nodm.name S3 bucket",
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
});

// Upload the index.html file
new aws.s3.BucketObject("index.html", {
    bucket: bucket.id,
    source: new pulumi.asset.FileAsset(path.join(__dirname, "src", "index.html")),
    contentType: "text/html",
    tags: commonTags,
});

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
    subjectAlternativeNames: allDomains,
    validationMethod: "DNS",
    tags: commonTags,
}, { provider: usEast1Provider });

// Create DNS validation records
const certificateValidationRecords = allDomains.map((_domain, index) => {
    return certificate.domainValidationOptions[index].apply(option => {
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
    validationRecordFqdns: certificateValidationRecords.map(rec => rec.fqdn),
}, { provider: usEast1Provider });

// Create CloudFront distribution for CDN (HTTPS-only)
const cloudfrontDistribution = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    defaultRootObject: "index.html",
    aliases: allDomains,
    origins: [{
        originId: "s3-website-origin",
        domainName: bucket.bucketRegionalDomainName,
        originAccessControlId: oac.id,
    }],
    defaultCacheBehavior: {
        targetOriginId: "s3-website-origin",
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
        defaultTtl: 3600,
        maxTtl: 86400,
    },
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

// Export the URLs
export const bucketName = bucket.id;
export const cdnUrl = pulumi.interpolate`https://${cloudfrontDistribution.domainName}`;
export const customDomainUrl = `https://${domainName}`;
export const wwwUrl = `https://www.${domainName}`;
