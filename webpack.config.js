const currentTask = process.env.npm_lifecycle_event;
const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const miniCSSExtractPlugin = require('mini-css-extract-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');
const fse = require('fs-extra');

const postCSSPlugins = [
    require('postcss-import'),
    require('postcss-simple-vars'),
    require('postcss-mixins'),
    require('postcss-nested'),
    require('autoprefixer')
];

class runAfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Copy images', function() {
            fse.copySync('./src/assets/images', './dist/assets/images')
        })
    }
}

let cssConfig =  {
    test: /\.css$/i,
    use: ['css-loader', { loader: 'postcss-loader', options: { plugins: postCSSPlugins}}]
};

let pages = fse.readdirSync('./src').filter(function(file) {
    return file.endsWith('.html');
}).map(function(page) {
    return new htmlWebpackPlugin({
        filename: page,
        template: `./src/${page}`
    });
})

let config = {
    entry: './src/assets/scripts/main.js',
    plugins: pages,
    module: {
        rules: [
           cssConfig
        ]
    }
};

if(currentTask == 'dev') {
    cssConfig.use.unshift('style-loader');
    config.output= {
        filename: 'index.js',
        path: path.resolve(__dirname, 'src')
    };
    config.devServer= {
        before: function(src,server) {
            server._watch ('./**/*.html')
        },
        contentBase: path.join(__dirname, 'src'),
        hot: true,
        port: 3000
    };
    config.mode = 'development';
};

if(currentTask == 'build') {

    cssConfig.use.unshift(miniCSSExtractPlugin.loader);

    config.output= {
        filename: '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'dist')
    };
    config.mode= 'production';
    config.optimization= {
        splitChunks: {
            chunks: 'all'
        }
    }
    config.plugins.push(
        new CleanWebpackPlugin(),
        new miniCSSExtractPlugin({filename: 'styles.[chunkhash].css'}),
        new runAfterCompile()
        )
};

module.exports = config;