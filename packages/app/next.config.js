/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Speed up builds - run linting/type checking separately
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable SWC minification for better performance
  swcMinify: true,

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      // a clap file can be quite large - but that's OK
      bodySizeLimit: '32mb'
    },
    // Optimize large dependencies - don't bundle these on server
    serverComponentsExternalPackages: [
      'sharp',
      'fluent-ffmpeg',
      '@ffmpeg/ffmpeg',
      '@huggingface/transformers',
      'onnxruntime-node',
      'lodash',
    ],
  },

  images: {
    // temporary fix for:
    //
    //   Error: Image import
    //   "next-metadata-image-loader?type=icon&segment=&basePath=&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js!/home/runner/work/clapper/clapper/src/app/icon.png?__next_metadata__"
    //   is not a valid image file.
    //   The image may be corrupted or an unsupported format.
    unoptimized: true,
  },

  // workaround for transformers.js issues
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // "sharp$": false,
      "onnxruntime-node$": false,
    }

    // Enable WASM support for mediainfo.js
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }

    // Handle WASM files properly
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    })

    // Add fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // see https://github.com/replicate/replicate-javascript/issues/273#issuecomment-2248635353
    config.ignoreWarnings = [
      {
        module: /replicate/,
        message: /require function is used in a way in which dependencies cannot be statically extracted/,
      },
      // Suppress common node_modules warnings
      {
        module: /node_modules/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      // Ignore lodash warnings
      {
        module: /lodash/,
      },
    ]

    return config;
  },

  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      },
      {
        // matching ALL routes
        source: "/:path*",
        headers: [
          // for security reasons, performance.now() is not performant unless we disable some CORS stuff
          //  more context about why, please check the Security paragraph here:
          // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now#security_requirements
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" }
        ]
      }
    ]
  }
}

module.exports = nextConfig