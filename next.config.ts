import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is a newer rendering mode. It is off here so that every
  // authenticated page renders dynamically without extra Suspense plumbing.
  cacheComponents: false,
  // Ship the /kb markdown files with the serverless functions that read them.
  outputFileTracingIncludes: { "/**": ["./kb/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
