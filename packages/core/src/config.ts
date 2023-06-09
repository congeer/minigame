import type {IAdapter} from "./adapter";
import {WebAdapter} from "./adapter";

export enum Platform {
    Web = 'web',
    Android = 'android',
    Wechat = 'wechat',
}

export interface Area {
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
}

interface Config {
    name: string;
    platform: Platform;
    version: string;
    resource: string;
    fonts: { [key: string]: string };
    unit: number;
    adapter: IAdapter;
    safeArea: Area;
    baseURL: string;
}

export const config: Config = {
    name: "game",
    platform: Platform.Web,
    version: "0.0.0",
    resource: "0.0.0",
    fonts: {},
    unit: innerWidth > innerHeight ? innerHeight / 1000 : innerWidth / 1000,
    adapter: new WebAdapter(""),
    safeArea: {
        width: innerWidth,
        height: innerHeight,
        top: 0,
        bottom: innerHeight,
        left: 0,
        right: innerWidth,
    },

    get baseURL() {
        return this.adapter.baseURL;
    },

    set baseURL(url) {
        this.adapter.baseURL = url;
    }
}


const setUnit = (safeArea: Area) => {
    config.unit = safeArea.width > safeArea.height ? safeArea.height / 1000 : safeArea.width / 1000
}

const setSafeArea = (safeArea?: Area) => {
    document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)')
    document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)')
    document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
    document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)')
    const top = getComputedStyle(document.documentElement).getPropertyValue("--sat");
    const right = getComputedStyle(document.documentElement).getPropertyValue("--sar");
    const bottom = getComputedStyle(document.documentElement).getPropertyValue("--sab");
    const left = getComputedStyle(document.documentElement).getPropertyValue("--sal");
    const tn = top ? parseInt(top.substring(0, top.length - 2)) : 0;
    const rn = right ? parseInt(right.substring(0, right.length - 2)) : 0;
    const bn = bottom ? parseInt(bottom.substring(0, bottom.length - 2)) : 0;
    const ln = left ? parseInt(left.substring(0, left.length - 2)) : 0;
    config.safeArea = {
        bottom: innerHeight - bn,
        height: innerHeight - bn - tn,
        left: ln,
        right: innerWidth - rn,
        top: tn,
        width: innerWidth - rn - ln,
        ...safeArea
    }
    setUnit(config.safeArea);
}

interface ConfigOption {
    name?: string;
    platform?: Platform;
    version?: string;
    resource?: string;
    unit?: number;
    adapter?: IAdapter;
    safeArea?: Area;
    baseURL?: string;
}

export const install = (e: ConfigOption) => {
    Object.keys(e).forEach(key => {
        // @ts-ignore
        config[key] = e[key];
    })
}

export interface LoadFontFn {
    (name: string, font: string): void;
}

const _afterLoadFont: LoadFontFn[] = [];

export const installFont = (name: string, font: string) => {
    config.fonts[name] = font;
    _afterLoadFont.forEach(fn => fn(name, font));
}

export const afterLoadFont = (fn: LoadFontFn) => {
    _afterLoadFont.push(fn);
}
