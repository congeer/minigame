import Adapter from "../adapter";
import {access, getFileByType, mkdir} from "./fs";
import {root, wx} from "./wx";

class WechatAdapter extends Adapter {

    constructor(url: string) {
        super(url);

    }

    share(opts): any {
        return wx.shareAppMessage(opts);
    }

    getCanvas(): HTMLCanvasElement {
        return GameGlobal.canvas;
    }

    async saveFile(file): Promise<string> {
        const url = await super.saveFile(file);
        const resPath = await getResPath(file.type, getVerName(file.name, file.version));
        await getFileByType(file.type, resPath, file.version, url);
        return `${root}/${resPath}`;
    }

    async loadFont(file): Promise<any> {
        const path = await this.saveFile(file);
        return wx.loadFont(path);
    }

    async loadSound(file): Promise<any> {
        await this.saveFile(file);
    }

}

const getResPath = async (type, name) => {
    const existed = await access(`${type}`);
    if (!existed) {
        await mkdir(`${type}`);
    }
    return `${type}/${name}`;
}

const getVerName = (name, version?) => {
    if (version) {
        const ext = name.split('.').pop();
        name = name.replace(`.${ext}`, `-${version}.${ext}`);
    }
    return name;
}

export default WechatAdapter;
