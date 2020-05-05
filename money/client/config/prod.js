const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJsPlugin = require('terser-webpack-plugin');
const merge = require('webpack-merge');
const common = require('./common');

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  optimization: {
    minimizer: [
      new TerserJsPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          output: {
            comments: false,
          },
        },
      }),
      new OptimizeCssAssetsPlugin({}),
    ],
  },
  plugins: [
    new ScriptExtHtmlWebpackPlugin({
      inline: ['index.js'],
    }),
    new StyleExtHtmlWebpackPlugin(),
  ],
});
