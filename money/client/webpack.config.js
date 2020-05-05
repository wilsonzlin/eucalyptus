'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJsPlugin = require('terser-webpack-plugin');
const {join} = require('path');

const resolveRelativeToProject = relativePath => join(__dirname, relativePath);

const TSCONFIG = resolveRelativeToProject('tsconfig.json');
const SRC = resolveRelativeToProject('src');
const SRC_INDEX_TSX = resolveRelativeToProject('src/index.tsx');
const PUBLIC_INDEX_HTML = resolveRelativeToProject('public/index.html');
const BUILD = resolveRelativeToProject('build');

module.exports = {
  devtool: false,
  entry: SRC_INDEX_TSX,
  output: {
    path: BUILD,
    filename: 'index.js',
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
    ],
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.tsx?$/,
        include: SRC,
        use: [
          {loader: 'ts-loader', options: {configFile: TSCONFIG}},
        ],
      },
      {
        test: /\.css$/,
        include: SRC,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader', options: {modules: true}},
        ],
      },
    ],
  },
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
    new HtmlWebpackPlugin({
      inject: true,
      template: PUBLIC_INDEX_HTML,
      minify: {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        decodeEntities: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        removeTagWhitespace: true,
        useShortDoctype: true,
      },
    }),
    new ScriptExtHtmlWebpackPlugin({
      inline: ['index.js'],
    }),
    new MiniCssExtractPlugin(),
    new StyleExtHtmlWebpackPlugin(),
  ],
};
