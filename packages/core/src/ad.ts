import {config} from "./config";

export interface AdOptions {
    wechat?: any,
    android?: any,
    web?: any,
    ios?: any,
    mobile?: any
}

interface IAdManager {
    options: { key: string, options: AdOptions }[] | AdOptions;

    init(options: { [key: string]: AdOptions }): void;

    init(options: AdOptions): void;

    show(key?: string, success?: Function, fail?: Function, complete?: Function): void;
}

export const AdManager: IAdManager = {
    options: {},
    init: (options) => {
        AdManager.options = options;
        if (options instanceof Array) {
            config.adapter.initAds(options)
        } else {
            config.adapter.initAd(options)
        }
    },
    show: (key?, success?, fail?, complete?) => {
        config.adapter.showAd(key, success, fail, complete)
    }
}
