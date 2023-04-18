import {isWx} from "./wechat/wx";

export enum Platform {
    Web = 'web',
    Wechat = 'wechat',
}

const config = {
    name: "game",
    platform: Platform.Web,
    version: "0.0.0",
    resource: "0.0.0",
    baseURL: "",
    fonts: {},
    unit: innerWidth > innerHeight ? innerHeight / 1000 : innerWidth / 1000,
    safeArea: {
        bottom: innerHeight,
        height: innerHeight,
        left: 0,
        right: innerWidth,
        top: 0,
        width: innerWidth
    }
}

if (isWx()) {
    config.platform = Platform.Wechat;
    const systemInfo = wx.getSystemInfoSync();
    config.safeArea = systemInfo.safeArea;
    config.unit = config.safeArea.width > config.safeArea.height ? config.safeArea.height / 1000 : config.safeArea.width / 1000
}


export const install = (...e) => {
    Object.assign(config, ...e);
}

const _afterLoadFont = [];

export const installFont = (name, font) => {
    config.fonts[name] = font;
    _afterLoadFont.forEach(fn => fn(name, font));
}

export const afterLoadFont = (fn) => {
    _afterLoadFont.push(fn);
}

export default config;
