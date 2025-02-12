const path = require('path');

module.exports = {
    // The entry point file described above
    entry: './src/app.js',
    // The location of the build folder described above
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'app.js'
    },
    // Optional and for development only. This provides the ability to
    // map the built code back to the original source format when debugging.
    devtool: 'eval-source-map',
    //todo: add watch here for development
};