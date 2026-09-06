/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The JSON file store writes to ./data at runtime in local/dev.
  // On Vercel, swap StoreDriver to the Postgres implementation (see lib/db/README).
  outputFileTracingIncludes: {
    "/**": ["./data/**"],
  },
  async rewrites() {
    return {
      // beforeFiles runs before app-router pages, so "/" serves the static
      // revolving-globe landing (public/scout-globe/index.html) verbatim,
      // as a full document load (no SPA hijack, no redirect flash).
      beforeFiles: [
        { source: "/", destination: "/scout-globe/index.html" },
        // The landing file references ./support.js and ./image-slot.js
        // relatively; when served at "/" those resolve to /support.js etc.
        // Map them back to the scout-globe folder so the dc-runtime (which
        // binds the {{ }} city-reveal templates) loads.
        { source: "/support.js", destination: "/scout-globe/support.js" },
        { source: "/image-slot.js", destination: "/scout-globe/image-slot.js" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
