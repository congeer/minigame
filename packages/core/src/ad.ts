import {config} from "./config";

export interface AdOptions {
    wechat?: any,
    android?: any,
    web?: any,
    ios?: any,
    mobile?: any
}

interface IAdManager {
    options: { [key: string]: AdOptions } | AdOptions;

    init(options: { [key: string]: AdOptions }): void;

    init(options: AdOptions): void;

    show(key?: string): Promise<void>;
}

export const AdManager: IAdManager = {
    options: {},
    init: (options) => {
        AdManager.options = options;
        if (options.wechat || options.android || options.ios || options.mobile || options.web) {
            config.adapter.initAd(options)
        } else {
            config.adapter.initAds(options as { [key: string]: AdOptions })
        }
    },
    show: (key?): Promise<void> => {
        return config.adapter.showAd(key)
    }
}
