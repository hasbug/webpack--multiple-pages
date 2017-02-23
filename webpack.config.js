var webpack = require('webpack');
var glob = require('glob');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var autoprefixer = require('autoprefixer');
var args = require('yargs').argv;

// parameters
var isProd = args.prod;
var isMock = args.mock;

var plugins = [
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    }),
    new webpack.DefinePlugin({
        __PROD__: isProd,
        __MOCK__: isMock
    }),
    new webpack.optimize.CommonsChunkPlugin('common', isProd ? 'common/common.[hash].js' : 'common/common.js'),
    new ExtractTextPlugin(isProd ? '[name]/[name].[contenthash].css' : '[name]/[name].css'),
    // new webpack.HotModuleReplacementPlugin()
];


var base = './';


//多页面处理
var getFiles = function(filepath) {
    var files = glob.sync(filepath);
    var entries = {};
    files.forEach(function(item){
        var pathname = path.basename(item, path.extname(item))
        entries[pathname] = item;
    });
    console.log(entries)
    return entries;
}
var pages = getFiles('./src/pages/*/*.html');
// generate html and inject module
Object.keys(pages).forEach(function(pageName){
    plugins.push(
        new HtmlWebpackPlugin({
            template: './src/pages/'+ pageName+ '/' + pageName + '.html',
            filename: pageName +'.html',
            chunks: [ 'common', pageName],
            hash : true
        })
    );
});


var entryJs = getFiles('./src/pages/*/*.js');

entryJs['common'] = [
    // 3rd dependencies
    'normalize.css/normalize.css',
    'bootstrap/dist/js/bootstrap.min',
    'bootstrap/dist/css/bootstrap.min.css',
    'font-awesome/css/font-awesome.min.css'
];

if (isProd) {
    plugins.push(
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: false
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    );
}


module.exports = {
    entry: entryJs,
    output: {
        path: base + 'build',
        filename: isProd ? '[name]/[name].[hash].js' : '[name]/[name].js',
        chunkFilename: isProd ? '[name]/[name].[hash].chunk.js' : '[name]/[name].chunk.js'
    },
    resolve: {
        root: [],
        //设置require或import的时候可以不需要带后缀
        extensions: ['', '.js', '.scss', '.css']
    },
    module: {
        preLoaders: [{
            test: /\.js$/,
            loader: 'eslint',
            exclude: /node_modules/
        }],
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            exclude: /node_modules/,
            query: {
                presets: ['es2015']
            }
        },
        {
            test: /\.html$/,
            loader: 'html'
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract('style', 'css?sourceMap!postcss!sass?sourceMap', {
                publicPath: '../'
            })
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('style', 'css?sourceMap', {
                publicPath: '../'
            })
        }, {
            test: /\.(woff|woff2|ttf|eot|svg)(\?]?.*)?$/,
            loader: 'file?name=assets/fonts/[name].[ext]?[hash]'
        }, {
            test: /\.(png|jpg)$/,
            loader: 'url?limit=8192&name=assets/images/[name].[hash].[ext]'
        }]
    },
    plugins: plugins,
    debug: !isProd,
    devtool: isProd ? false : 'inline-cheap-module-source-map',
    devServer: {
        contentBase: base + 'build',
        historyApiFallback: true,
        inline: true,
        stats: {
            modules: false,
            cached: false,
            colors: true,
            chunk: false
        },
        host: 'localhost',
        port: 8080
    },
    postcss: function () {
        return [autoprefixer];
    }
};


