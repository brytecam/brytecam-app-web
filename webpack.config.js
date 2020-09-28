const path = require('path');
const fs = require('fs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { debug } = require('console');

module.exports = (env) => {
  const isEnvProduction = !!env && env.production;
  console.log('Production: ', isEnvProduction);

  return {
  devtool: 'cheap-module-eval-source-map',
  entry: './src/index.jsx',
  devtool: 'source-map',//eval | source-map
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }, {
        test: /\.(scss|less|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ]
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  },
  output: {
    path: __dirname + '/dist',
    publicPath: '/',
    filename: 'brytecam-conference.[hash].js'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(
      Object.assign(
         {},
         {
           inject: true,
           template: path.resolve(__dirname, "public/index.html"),
         },
         isEnvProduction
           ? {
               minify: {
                 removeComments: true,
                 collapseWhitespace: true,
                 removeRedundantAttributes: true,
                 useShortDoctype: true,
                 removeEmptyAttributes: true,
                 removeStyleLinkTypeAttributes: true,
                 keepClosingSlash: true,
                 minifyJS: true,
                 minifyCSS: true,
                 minifyURLs: true,
               },
             }
           : undefined
    )),
  ],
  devServer: {
    hot: true,
    proxy: {
      '/ws': {
         target: 'ws://dev1.brytecam.com:8443',
         //target: 'ws://dev.brytecam.com:8443',
         ws: true,
         changeOrigin: true,
         logLevel: 'debug',
         //cookieDomainRewrite: "localhost",
         //onProxyReq: proxyReq => {
          // Browers may send Origin headers even with same-origin
          // requests. To prevent CORS issues, we have to change
          // the Origin to match the target URL.
         // if (proxyReq.getHeader('origin')) {
          //  proxyReq.setHeader('origin', 'conf.brytecam.com:443');
          //}
        //}
      },
    }
  }
}};
