const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  // Bundle optimization configuration
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Separate vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        // Separate dialog components for lazy loading
        dialogs: {
          test: /[\\/]dialogs[\\/]/,
          name: 'dialogs',
          chunks: 'async',
          priority: 5
        },
        // Common utilities
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 1
        }
      }
    },
    // Tree shaking configuration
    usedExports: true,
    sideEffects: false
  },

  // Module resolution for better tree shaking
  resolve: {
    alias: {
      // Alias for smaller lodash imports
      'lodash': 'lodash-es'
    }
  },

  // Plugins for analysis and optimization
  plugins: [
    // Bundle analyzer (only in analysis mode)
    ...(process.env.ANALYZE ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      })
    ] : [])
  ],

  // Performance budgets
  performance: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 250000, // 250KB
    hints: 'warning'
  }
};