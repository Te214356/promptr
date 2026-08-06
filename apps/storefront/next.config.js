const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /**
   * The superseded policy pages. Their content lived on as older, conflicting
   * copies of /terms and /refund-policy, so the pages are gone — but the URLs
   * answer with a permanent redirect rather than a 404, since anything already
   * indexed or linked should land on the current policy.
   *
   * Both the bare and region-prefixed forms are listed: the bare path is
   * normally rewritten to the default region by middleware first, but a direct
   * hit must not depend on that.
   */
  async redirects() {
    return [
      { source: "/terms-of-use", destination: "/terms", permanent: true },
      {
        source: "/:countryCode/terms-of-use",
        destination: "/:countryCode/terms",
        permanent: true,
      },
      { source: "/return-policy", destination: "/refund-policy", permanent: true },
      {
        source: "/:countryCode/return-policy",
        destination: "/:countryCode/refund-policy",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "dtcbackend-production-32a2.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "*.up.railway.app",
      },
      {
        protocol: "https",
        hostname: "api.promptrsa.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
