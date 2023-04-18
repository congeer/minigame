import {Application} from "pixi.js";

import config from "./config";

let _app;

export {
    _app as app
}

export const createApp = (opts?) => {
    let _canvas;
    if (config.platform === "web") {
        window.onresize = () => {
            _app.renderer.resize(innerWidth, innerHeight)
        }
    } else if (config.platform === "wechat") {
        wx.setKeepScreenOn({keepScreenOn: true})
        _canvas = GameGlobal.canvas;
    }

    _app = new Application({
        view: _canvas,
        antialias: true,
        backgroundColor: 0,
        width: innerWidth,
        height: innerHeight,
        ...opts
    });

    return _app;
}
