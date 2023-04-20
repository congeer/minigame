import {Container, Rectangle, Renderer, Ticker, UPDATE_PRIORITY} from "pixi.js";

import config from "./config";

const _app: {
    renderer: Renderer,
    stage: Container,
    ticker: Ticker,
    screen: Rectangle
} = {} as any;

export {
    _app as app
}

export const createApp = (opts?) => {
    let _canvas;
    if (config.platform === "web") {
        window.onresize = () => {
            _app.renderer.resize(innerWidth, innerHeight)
        }
        _canvas = document.createElement("canvas");
        document.body.appendChild(_canvas);
    } else if (config.platform === "wechat") {
        wx.setKeepScreenOn({keepScreenOn: true})
        _canvas = GameGlobal.canvas;
    }
    _app.stage = new Container();
    _app.renderer = new Renderer({
        view: _canvas,
        autoDensity: true,
        antialias: true,
        resolution: devicePixelRatio,
        backgroundColor: 0,
        width: innerWidth,
        height: innerHeight,
        ...opts
    })
    _app.screen = _app.renderer.screen;
    _app.ticker = Ticker.shared;
    _app.ticker.add(() => {
        _app.renderer.render(_app.stage)
    }, null, UPDATE_PRIORITY.UTILITY);

    return _app;
}
