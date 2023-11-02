import esbuild from 'rollup-plugin-esbuild'
import common from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import json from "@rollup/plugin-json";
import pkg from './package.json' assert {type: 'json'};
import path from "path";


export default {
    input: 'src/index.ts',
    output: [
        {
            dir: path.resolve('lib'),
            entryFileNames: '[name].js',
            format: 'cjs',
            freeze: false,
            sourcemap: true,
            preserveModules: true,
            preserveModulesRoot: path.resolve('src'),
            exports: 'named',
        },
        {
            dir: path.resolve('lib'),
            entryFileNames: '[name].mjs',
            format: 'esm',
            freeze: false,
            sourcemap: true,
            preserveModules: true,
            preserveModulesRoot: path.resolve('src'),
            exports: 'named',
        }
    ],
    plugins: [
        esbuild({
            target: 'es2015'
        }),
        json(),
        common(),
        resolve()
    ],
    external: pkg.dependencies ? Object.keys(pkg.dependencies) : []
}
