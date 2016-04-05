module.exports = {
  entry: "./source/app.jsx",
  output: {
    path: __dirname + '/public/js', 
    filename: "bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel' // 'babel-loader' is also a legal name to reference
      }
    ]
  }
};
