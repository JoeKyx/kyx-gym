/**
 * @type {import('next-sitemap').IConfig}
 * @see https://github.com/iamvishnusankar/next-sitemap#readme
 */
module.exports = {
  // ! TODO: Change this to your domain
  /** Without additional '/' on the end, e.g. https://theodorusclarence.com */
  siteUrl: 'https://kyx-gym-joekyx.vercel.app',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
};
