import {AdOptions} from "../ad";
import {Adapter} from "../adapter";
import type {FileInfo} from "../assets";
import type {ShareOptions} from "../share";
import {access, getFileByType, mkdir} from "./fs";
import {root, wx} from "./wx";

class WechatAdapter extends Adapter {

    adMap: { [key: string]: WechatMinigame.RewardedVideoAd } = {};

    defaultAd: WechatMinigame.RewardedVideoAd | undefined;

    constructor(url: string) {
        super(url);

    }

    initAds(options: { [key: string]: AdOptions }): any {
        const cp = options as { [key: string]: AdOptions };
        for (let key in cp) {
            const option = cp[key];
            const ad = this.initOneAd(option);
            if (!ad) {
                continue;
            }
            this.adMap[key] = ad;
            if (key === 'default') {
                this.defaultAd = ad;
            }
        }
    }

    initAd(option: AdOptions): any {
        this.defaultAd = this.initOneAd(option);
    }

    private initOneAd(option: AdOptions) {
        if (!option.channelOptions || !option.channelOptions.wechat) {
            return;
        }
        const ad = wx.createRewardedVideoAd(option.channelOptions.wechat);
        return ad;
    }

    showAd(key?: string, success?: Function, fail?: Function, complete?: Function): any {
        const ad = key ? this.adMap[key] : this.defaultAd;
        if (ad) {
            const onClose: WechatMinigame.RewardedVideoAdOnCloseCallback = (res) => {
                if (res.isEnded) {
                    success?.();
                } else {
                    fail?.();
                }
                complete?.();
            };
            ad.onClose(onClose)
            const onError: WechatMinigame.GridAdOnErrorCallback = (err) => {
                console.error(err);
                fail?.();
                complete?.();
            };
            ad.onError(onError)
            ad?.show().catch(() => {
                ad.load().then(() => ad.show());
            })
        }
    }

    share(opts: ShareOptions) {
        return wx.shareAppMessage(opts);
    }

    getCanvas(): HTMLCanvasElement {
        return GameGlobal.canvas;
    }

    async saveFile(file: FileInfo): Promise<string> {
        const url = await super.saveFile(file);
        const resPath = await getResPath(file.type, getVerName(file.name, file.version));
        await getFileByType(file.type, resPath, url, file.version);
        return `${root}/${resPath}`;
    }

    async loadFont(file: FileInfo): Promise<any> {
        const path = await this.saveFile(file);
        return wx.loadFont(path);
    }

    async loadSound(file: FileInfo): Promise<any> {
        await this.saveFile(file);
    }

}

const getResPath = async (type: string, name: string) => {
    const existed = await access(`${type}`);
    if (!existed) {
        await mkdir(`${type}`);
    }
    return `${type}/${name}`;
}

const getVerName = (name: string, version?: string) => {
    if (version) {
        const ext = name.split('.').pop();
        name = name.replace(`.${ext}`, `-${version}.${ext}`);
    }
    return name;
}

export default WechatAdapter;
