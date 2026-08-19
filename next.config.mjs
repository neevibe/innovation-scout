/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The JSON file store writes to ./data at runtime in local/dev.
  // On Vercel, swap StoreDriver to the Postgres implementation (see lib/db/README).
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
};

export default nextConfig;
