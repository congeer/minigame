const isWx = () => {
    const hasWx = typeof wx === "object";
    if (hasWx) {
        const systemInfo = wx.getSystemInfoSync?.();
        if (systemInfo && systemInfo.platform) {
            return true;
        }
    }
    return false;
}

const _wx = (isWx() ? wx : {}) as typeof wx

if (isWx()) {
    GameGlobal.asyncStorage = true;
}

const root = _wx?.env?.USER_DATA_PATH

export {
    _wx as wx,
    root,
    isWx
}
