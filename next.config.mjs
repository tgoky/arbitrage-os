/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: [
      "lh3.googleusercontent.com", // example for Google-hosted images
      "drive.google.com",          // if you’re pulling from Google Drive
    ],
  },
  webpack(config) {
    // Add rule to handle .md files using raw-loader
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });
    return config;
  },
};

export default nextConfig;