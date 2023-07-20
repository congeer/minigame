import {config} from "./config";

export interface AdOptions {
    channelOptions?: { wechat?: any, android?: any, web?: any, ios?: any, mobile?: any };
}

interface IAdManager {
    options: { [key: string]: AdOptions } | AdOptions;

    init(options: { [key: string]: AdOptions }): void;

    init(options: AdOptions): void;

    show(key?: string, success?: Function, fail?: Function, complete?: Function): void;
}

export const AdManager: IAdManager = {
    options: {},
    init: (options) => {
        AdManager.options = options;
        if (options.channelOptions) {
            config.adapter.initAd(options as AdOptions)
        } else {
            config.adapter.initAds(options as { [key: string]: AdOptions })
        }
    },
    show: (key?, success?, fail?, complete?) => {
        config.adapter.showAd(key, success, fail, complete)
    }
}
