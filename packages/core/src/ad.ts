import {config} from "./config";

export interface AdOptions {
    channelOptions: { wechat: any, android: any, web: any, ios: any, mobile: any };
    success?: () => void;
    fail?: () => void;
    complete?: () => void;
}

interface IAdManager {
    options: { [key: string]: AdOptions } | AdOptions;

    init(options: { [key: string]: AdOptions }): void;

    init(options: AdOptions): void;

    show(key?: string): void;
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
    show: (key?) => {
        config.adapter.showAd(key)
    }
}
