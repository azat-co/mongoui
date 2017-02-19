var path = require('path')
var webpack = require('webpack')
var config = require('./config');
var ExtendedDefinePlugin = require('extended-define-webpack-plugin');

module.exports = {
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:3000', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // 'only' prevents reload on syntax errors
    './source/app.jsx'
  ],
  output: {
    path: path.join(__dirname, 'public/js'),
    filename: 'bundle.js',
    publicPath: '/js/'
  },
  devtool: '#cheap-eval-source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|public)/,
        loaders: [
          'react-hot',
          'babel'
        ]
      },
      { test: /\.json$/, loader: 'json-loader'},
      { test: /\.css$/, loader: "style-loader!css-loader" }
    ],
    noParse: [
      /node_modules\/json-schema\/lib\/validate\.js/,
      /node_modules\\json-schema\\lib\\validate\.js/
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    console: false,
    'coffee-script': 'mock'
  },
  amd: { jQuery: true },

  plugins: [
    new ExtendedDefinePlugin({
      "PUB_API_WINDOW": config.public.api.use_window_defaults,
      "PUB_API_PROTO": config.public.api.protocol,
      "PUB_API_HOST": config.public.api.host,
      "PUB_API_PORT": config.public.api.port
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ]
}
