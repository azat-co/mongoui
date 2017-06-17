var webpack = require('webpack')
var WebpackDevServer = require('webpack-dev-server')
var webpackconfig = require('./webpack.config')
var config = require("./config");

new WebpackDevServer(webpack(webpackconfig), {
  publicPath: webpackconfig.output.publicPath,
  hot: true,
  historyApiFallback: true,
  contentBase: 'public',
  inline: true,
  stats: { colors: true }
}).listen(config.dev.port, config.dev.host, function (err, result) {
  if (err) {
    return console.log(err)
  }

  console.log('Listening at http://localhost:3000/')
})
