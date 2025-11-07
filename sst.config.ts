// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'nodm-name',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          defaultTags: {
            tags: {
              Project: 'nodm-name',
              ManagedBy: 'sst',
              Stage: input?.stage || 'dev',
            },
          },
        },
      },
    };
  },
  async run() {
    const domain = process.env.DOMAIN_NAME;

    new sst.aws.Nextjs('NodmName', {
      domain: domain
        ? {
            name: domain,
            dns: sst.aws.dns(),
          }
        : undefined,
      warm: 0, // Disable warmer
    });
  },
});
