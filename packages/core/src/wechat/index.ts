import config, {install} from "../config";
import ShareManager from "../share";
import WechatAdapter from "./adapter";
import {isWechat, wx} from "./wx";


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

export {
    isWechat,
}
