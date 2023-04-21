import config, {install, Platform} from "../config";
import ShareManager from "../share";
import WechatAdapter from "./adapter";

const isWechat = () => {
    const hasWx = typeof wx === "object";
    if (hasWx) {
        const systemInfo = wx.getSystemInfoSync?.();
        if (systemInfo && systemInfo.platform) {
            return true;
        }
    }
    return false;
}

const _wx = (isWechat() ? wx : {}) as typeof wx

if (isWechat()) {
    GameGlobal.asyncStorage = true;
    wx.setKeepScreenOn({keepScreenOn: true})
    wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline'],
    });
    install({platform: Platform.Wechat});
    config.adapter = new WechatAdapter("");
    const callBack = () => {
        const width = GameGlobal.canvas.width;
        const height = (GameGlobal.canvas.width * 4) / 5;
        return {
            title: ShareManager.getTitle(),
            imageUrl: GameGlobal.canvas.toTempFilePathSync({
                x: 0,
                y: (GameGlobal.canvas.height - height) / 2,
                width: width,
                height: height,
            }),
        };
    };
    wx.onShareAppMessage(callBack);
    wx.onShareTimeline && wx.onShareTimeline(callBack);
    const systemInfo = wx.getSystemInfoSync();
    config.safeArea = systemInfo.safeArea;
    config.unit = config.safeArea.width > config.safeArea.height ? config.safeArea.height / 1000 : config.safeArea.width / 1000;
}

const root = _wx?.env?.USER_DATA_PATH

export {
    _wx as wx,
    root,
    isWechat
}
