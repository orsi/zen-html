module.exports = {
    mode: 'development',
    entry: './test/zen-html.js',
    devServer: {
        watchContentBase: true,
        inline: true,
        hot: true,
        open: 'Chrome',
        openPage: 'test/index.html',
        port: 9000
    }
};