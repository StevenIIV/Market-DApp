const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    index: './app/javascripts/index.js',
    rentalMarket: './app/javascripts/rentalMarket.js',
    productDetails: './app/javascripts/productDetails.js',
    market: './app/javascripts/market.js',
    userInfo:'./app/javascripts/userInfo.js',
    test: './app/javascripts/test.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js'
  },
  plugins: [
    // Copy our app's rentalMarket.html to the build folder.
    new CopyWebpackPlugin([
      { from: './app/rentalMarket.html', to: "rentalMarket.html" },
      { from: './app/productDetails.html', to: "productDetails.html" },
      { from: './app/market.html', to: "market.html" },
      { from: './app/userInfo.html', to: "userInfo.html"},
      { from: './app/index.html', to: "index.html"},
      { from: './app/test.html', to: "test.html"}
    ])
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
