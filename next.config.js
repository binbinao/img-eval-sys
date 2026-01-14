/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    output: 'standalone',
    experimental: {
        instrumentationHook: true,
    },
};

module.exports = nextConfig;
