/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@heart-and-hustle/shared"],
  experimental: {
    // Enables apps/web/instrumentation.ts (in-process daily jobs on Railway).
    instrumentationHook: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
