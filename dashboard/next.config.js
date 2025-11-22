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

    // Allow imports from parent directory (for attack-agent to import from ../src)
    if (isServer) {
      config.externals = config.externals || [];

      // Don't bundle parent directory modules - load them at runtime
      const parentDirExternals = (context, request, callback) => {
        if (request.startsWith('../src/') || request.includes('../../../../src/')) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      };

      if (Array.isArray(config.externals)) {
        config.externals.push(parentDirExternals);
      } else {
        config.externals = [config.externals, parentDirExternals];
      }
    }

    // Ignore onnxruntime-node native bindings
    config.externals = config.externals || [];
    if (typeof config.externals === 'function') {
      const oldExternals = config.externals;
      config.externals = async (...args) => {
        const result = await oldExternals(...args);
        if (result) return result;
        return undefined;
      };
    }

    if (!Array.isArray(config.externals)) {
      config.externals = [config.externals];
    }

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
