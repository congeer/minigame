import path from "path";
import webpack from 'webpack';
import webpackDevServer from 'webpack-dev-server';


export const run = {
    command: "run",
    description: "run",
    action: (config: any) => {
        console.log(path.resolve("webpack.config"))
        const cfg = require(path.resolve("webpack.config"));
        webpack(cfg({prod:false, channel: 'web'}),()=>{})
    }
}
