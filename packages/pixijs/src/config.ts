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

type Direction = "horizontal" | "vertical" | "auto";

interface Config {
    name: string;
    scale: number;
    direction?: Direction;
    platform: Platform;
    version: string;
    resource: string;
    fonts: { [key: string]: string };
    unit: number;
    adapter: IAdapter;
    innerX: number;
    innerY: number;
    innerWidth: number;
    innerHeight: number;
    safeArea: Area;
    baseURL: string;
}

const defaultScale = 1;
let direction: Direction = "vertical";

let innerWidth = window.innerWidth;
let innerHeight = window.innerHeight;

if (innerWidth > innerHeight * defaultScale) {
    innerWidth = innerHeight * defaultScale;
}

let unit = innerWidth > innerHeight ? innerHeight / 1000 : innerWidth / 1000;

let safeArea: Area = {
    width: innerWidth,
    height: innerHeight,
    top: (window.innerHeight - innerHeight) / 2,
    bottom: innerHeight,
    left: (window.innerWidth - innerWidth) / 2,
    right: innerWidth,
}
export const config: Config = {
    name: "game",
    scale: defaultScale,
    platform: Platform.Web,
    version: "0.0.0",
    resource: "0.0.0",
    fonts: {},
    adapter: new WebAdapter(""),

    get safeArea() {
        return safeArea;
    },

    set safeArea(area) {
        safeArea = area;
    },

    get direction() {
        return direction;
    },

    get unit() {
        return unit;
    },

    get innerWidth() {
        return innerWidth;
    },

    get innerHeight() {
        return innerHeight;
    },

    get innerX() {
        return (window.innerWidth - innerWidth) / 2;
    },

    get innerY() {
        return (window.innerHeight - innerHeight) / 2
    },

    get baseURL() {
        return this.adapter.baseURL;
    },

    set baseURL(url) {
        this.adapter.baseURL = url;
    }
}

const updateUnit = () => {
    unit = innerWidth > innerHeight ? innerHeight / 1000 : innerWidth / 1000
}

updateScale(defaultScale)


const updateSafeArea = (sa?: Area) => {
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
    safeArea = {
        bottom: window.innerHeight - bn,
        height: window.innerHeight - bn - tn,
        left: ln,
        right: window.innerWidth - rn,
        top: tn,
        width: window.innerWidth - rn - ln,
        ...sa
    }
    updateUnit();
}

function updateScale(value: number) {
    const scale = value;
    innerWidth = window.innerWidth;
    innerHeight = window.innerHeight;
    if (direction === 'horizontal') {
        if (innerHeight > innerWidth / scale) {
            innerHeight = innerWidth / scale;
        }
    } else {
        if (innerWidth > innerHeight * scale) {
            innerWidth = innerHeight * scale;
        }
    }
    safeArea = {
        width: innerWidth,
        height: innerHeight,
        top: (window.innerHeight - innerHeight) / 2,
        bottom: innerHeight,
        left: (window.innerWidth - innerWidth) / 2,
        right: innerWidth,
    }
    updateUnit();
}

export const install = (e: Partial<Config>) => {
    Object.keys(e).forEach(key => {
        // @ts-ignore
        config[key] = e[key];
        switch (key) {
            case 'safeArea':
                updateSafeArea(e[key]);
                break;
            case 'scale':
                // @ts-ignore
                updateScale(e[key]);
                break;
        }
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
