import type { NextConfig } from "next";

// The Vercel + Supabase integration names its variables differently. Map them onto the NEXT_PUBLIC_* names
// the browser code reads (these are inlined at build time, so a redeploy is needed after changing them).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const nextConfig: NextConfig = {
  // Only inline values that exist at build time; otherwise leave process.env alone for runtime.
  env: {
    ...(supabaseUrl ? { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl } : {}),
    ...(supabaseKey ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey } : {}),
  },
  // Cache Components is a newer rendering mode. It is off here so that every
  // authenticated page renders dynamically without extra Suspense plumbing.
  cacheComponents: false,
  // Ship the /kb markdown files with the serverless functions that read them.
  outputFileTracingIncludes: { "/**": ["./kb/**/*", "./drizzle/**/*"] },
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
