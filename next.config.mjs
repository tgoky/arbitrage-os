/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: [
      "lh3.googleusercontent.com", // example for Google-hosted images
      "drive.google.com",          // if you’re pulling from Google Drive
    ],
  },
};

export default nextConfig;
