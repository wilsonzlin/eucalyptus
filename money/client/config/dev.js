const merge = require('webpack-merge');
const common = require('./common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  watch: true,
});
