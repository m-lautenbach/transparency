const path = require('path');
var fs = require('fs');

const moduleDefinition = {
    loaders: [
        {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'stage-0']
            }
        }
    ]
}

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = [
    {
        entry: './lib/client.js',
        devtool: 'source-map',
        output: {
            path: path.join(__dirname, 'public', 'js'),
            filename: 'index.js'
        },
        module: moduleDefinition
    }
,
    {
        context: __dirname,
        entry: './lib/server.js',
        target: 'node',
        node: {
            __filename: false,
            __dirname: false
        },
        externals: nodeModules,
        devtool: 'source-map',
        output: {
            path: __dirname,
            filename: 'index.js'
        },
        module: moduleDefinition
    }
]
