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

    initAds(options: { key: string, options: AdOptions }[]): any {
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            const ad = this.initOneAd(option.options);
            if (!ad) {
                continue;
            }
            this.adMap[option.key] = ad;
            if (option.key === 'default') {
                this.defaultAd = ad;
            }
        }
    }

    initAd(option: AdOptions): any {
        this.defaultAd = this.initOneAd(option);
    }

    private initOneAd(option: AdOptions) {
        if (!option.wechat) {
            return;
        }
        return wx.createRewardedVideoAd(option.wechat);
    }

    showAd(key?: string): Promise<void> {
        const ad = key ? this.adMap[key] : this.defaultAd;
        return new Promise<void>((resolve, reject) => {
            if (ad) {
                const onClose: WechatMinigame.RewardedVideoAdOnCloseCallback = (res) => {
                    ad.offClose(onClose);
                    ad.offError(onError);
                    if (res.isEnded) {
                        resolve();
                    } else {
                        reject();
                    }
                };
                const onError: WechatMinigame.GridAdOnErrorCallback = (err) => {
                    ad.offClose(onClose);
                    ad.offError(onError);
                    reject(err);
                };
                ad.onClose(onClose)
                ad.onError(onError)
                ad?.show().catch(() => {
                    ad.load().then(() => ad.show());
                })
            }
        });
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
