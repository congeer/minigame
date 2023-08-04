import {CleanWebpackPlugin} from "clean-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import webpackDevServer from "webpack-dev-server";
import WebpackBar from "webpackbar";

const packageJson = require(path.resolve('./package.json'));
const projectName = packageJson.name;
const version = packageJson.version;


const plugins: WebpackPluginInstance[] = [
    new WebpackBar(),
    new CopyWebpackPlugin({
        patterns: ['public']
    }),
];

export const pack = ({channel, prod}: { channel: string, prod: boolean }) => {
    const web = channel === 'web';
    plugins.push(new webpack.DefinePlugin({
        "process.env.FENGARICONF": "void 0",
        "typeof process": JSON.stringify("undefined"),
        PROD: JSON.stringify(prod),
        CHANNEL: JSON.stringify(channel),
        PROJECT_NAME: JSON.stringify(projectName),
        VERSION: JSON.stringify(version),
    }))

    const entry: any = {
        main: {
            import: [
                './src/app.ts'
            ],
            filename: web ? 'index.js' : "game.js"
        },
    };
    const conf: Configuration = {
        experiments: {
            topLevelAwait: true
        },
        output: {
            globalObject: web ? 'window' : 'GameGlobal',
            path: path.resolve('dist')
        },
        resolve: {
            extensions: ['.js', '.ts'],
            alias: {
                '@': path.resolve('./src'),
            }
        },

        devtool: prod ? false : 'source-map',

        stats: 'errors-only',

        module: {
            rules: [
                {
                    test: /\.(ts|mjs)$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true
                        }
                    },
                    // exclude: /node_modules/
                },
                {
                    test: /\.(vert|frag)$/,
                    type: 'asset',
                    exclude: /node_modules/
                }
            ]
        },
        mode: prod ? 'production' : 'development',
    }

    if (web) {
        plugins.push(new HtmlWebpackPlugin({
            template: 'index.html',
            filename: 'index.html',
        }))
    } else {
        entry.main.import.unshift('@minigame/wechat-adapter')
        plugins.push(new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'bin/game.json',
                    to: 'game.json',
                    transform: (content) => {
                        const json = JSON.parse(content.toString())
                        return JSON.stringify(json)
                    }
                },
                {
                    from: 'wechat/project.config.json',
                    to: 'project.config.json',
                    transform: (content) => {
                        const json = JSON.parse(content.toString())
                        json.projectname = projectName;
                        json.appid = packageJson.appid;
                        return JSON.stringify(json)
                    }
                }
            ]
        }))
        entry['context'] = {
            import: [
                './src/context/index.ts'
            ],
            filename: "context/index.js"
        }
        entry['worker'] = {
            import: [
                './src/worker/index.ts'
            ],
            filename: "worker/index.js"
        }
    }

    if (prod) {
        plugins.unshift(new CleanWebpackPlugin())
        conf.optimization = {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    parallel: 4,
                    extractComments: true,
                    terserOptions: {
                        output: {
                            comments: false
                        }
                    },
                })
            ]
        }
    }
    conf.entry = entry;
    conf.plugins = plugins;

    const callback = (err: any, stats: any) => {
        if (stats?.compilation?.errors?.length > 0) {
            for (let i = 0; i < stats?.compilation?.errors?.length; i++) {
                const error = stats.compilation.errors[i];
                console.error("\x1b[31m%s\x1b[0m %s", "ERROR", error.message);
            }
            console.error("\n%s\x1b[31m%s\x1b[0m " ,"webpack compiled with ", stats?.compilation?.errors?.length + " error")
        }
    };
    if (prod) {
        const compiler = webpack(conf);
        compiler.run(callback);
    } else {
        conf.performance = {
            maxEntrypointSize: 100000000,
            maxAssetSize: 20000000,
            assetFilter: function (assetFilename: string) {
                return assetFilename.endsWith('.js');
            }
        }
        const compiler = webpack(conf);
        compiler.watch({
            aggregateTimeout: 300,
        }, callback)
        if (web) {
            const devServerOptions = {
                historyApiFallback: true,
                hot:true
            };
            const server = new webpackDevServer(devServerOptions, compiler);

            const runServer = async () => {
                console.log("Starting server...");
                await server.start();
            };
            runServer();
        }
    }
}
