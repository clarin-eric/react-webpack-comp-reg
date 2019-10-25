const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    host: 'localhost',
    port: 3000,
    open: true,
    contentBase: path.join(__dirname, 'dist'),
    proxy: {
      '/rest': 'http://localhost:85',
      '/ccr': 'http://localhost:85',
      '/vocabulary': 'http://localhost:85',
    },
  }
})
