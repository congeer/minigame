import {Container, IRendererOptions, Rectangle, Renderer, Ticker, UPDATE_PRIORITY} from "pixi.js";

import {config} from "./config";

const _app: {
    renderer: Renderer,
    stage: Container,
    ticker: Ticker,
    screen: Rectangle
} = {} as any;

export {
    _app as app
}

export const createApp = (opts?: Partial<IRendererOptions>) => {
    _app.stage = new Container();
    _app.renderer = new Renderer({
        view: config.adapter.getCanvas(),
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
