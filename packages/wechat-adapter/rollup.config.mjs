import esbuild from 'rollup-plugin-esbuild'
import common from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default {
    input: 'src/index.js',
    output: [
        {
            file: 'lib/wechat-adapter.js',
            format: 'umd',
            name: 'wechat-adapter.js',
            sourcemap: true
        }
    ],
    plugins: [
        esbuild({
            // All options are optional
            include: /\.[jt]s?$/, // default, inferred from `loaders` option
            exclude: /node_modules/, // default
            sourceMap: true, // default
            minify: process.env.NODE_ENV === 'production',
            target: 'es2015', // default, or 'es20XX', 'esnext'
            jsx: 'transform', // default, or 'preserve'
            // Like @rollup/plugin-replace
            define: {
                __VERSION__: '"x.y.z"',
            },
            minifySyntax: true,
            minifyWhitespace: true,
            minifyIdentifiers: true,
            // tsconfig: 'tsconfig.json', // default
            // Add extra loaders
            // loaders: {
            //     // Add .json files support
            //     // require @rollup/plugin-commonjs
            //     // '.json': 'json',
            //     // Enable JSX in .js files too
            //     // '.js': 'jsx',
            // },
        }),
        common(),
        resolve(),
    ],
}
