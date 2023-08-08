import {AdOptions} from "../ad";
import {Adapter} from "../adapter";
import type {FileInfo} from "../assets";
import type {ShareOptions} from "../share";
import {access, getFileByType, mkdir} from "./fs";
import {root, wx} from "./wx";

class WechatAdapter extends Adapter {

    adConfigMap: { [key: string]: any } = {};

    defaultAdConfig: any | undefined;

    constructor(url: string) {
        super(url);

    }

    initAds(options: { [key: string]: AdOptions }): any {
        for (let k in options) {
            const option = options[k];
            if (!option.wechat) {
                continue;
            }
            this.adConfigMap[k] = option.wechat;
            if (k === 'default') {
                this.defaultAdConfig = option.wechat;
            }
        }
    }

    initAd(option: AdOptions): any {
        if (!option.wechat) {
            return;
        }
        this.defaultAdConfig = option.wechat;
    }

    private initOneAd(option: any) {
        return wx.createRewardedVideoAd({...option, multiton:true});
    }

    showAd(key?: string): Promise<void> {
        const config = key ? this.adConfigMap[key] : this.defaultAdConfig;
        const ad = this.initOneAd(config);
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
        const name = file.type === "font" || file.type === "sound" ? file.name : getVerName(file.name, file.version);
        const resPath = await getResPath(file.type, name);
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
