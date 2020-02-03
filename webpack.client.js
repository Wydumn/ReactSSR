const path = require('path')
// const nodeExternals = require('webpack-node-externals')

const merge = require('webpack-merge')
const config = require('./webpack.base.js')

const clientConfig = {
    // target: 'node', 客户端渲染不再需要
    mode: 'development', 
    entry: './src/client/index.js', //
    output: {
        filename: 'index.js',   //
        path: path.resolve(__dirname, 'public')
    },
    // externals: [nodeExternals()],   
}

module.exports = merge(config, clientConfig)