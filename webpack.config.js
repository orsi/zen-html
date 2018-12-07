var path = require('path');

module.exports = {
    mode: "development",
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'index.js',
        path: path.join(__dirname, 'dist'),
        publicPath: '/lib/'
    },
    devServer: {
        contentBase: path.join(__dirname, "test"),
        watchContentBase: true,
        compress: true,
        open: 'Chrome',
        port: 9000
    }
};