/** @type {import('next').NextConfig} */

// Load env from parent directory
require('dotenv').config({ path: '../.env' });

const nextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  },
  webpack: (config, { isServer }) => {
    // Ignore node-specific modules when bundling for the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Ignore onnxruntime-node native bindings
    config.externals = config.externals || [];
    config.externals.push({
      'onnxruntime-node': 'onnxruntime-node',
      'sharp': 'sharp',
    });

    // Ignore .node files
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      loader: 'node-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
