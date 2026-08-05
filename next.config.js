/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force CSS to be processed correctly
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
}

module.exports = nextConfig