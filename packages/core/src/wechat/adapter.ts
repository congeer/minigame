import Adapter from "../adapter";
import {access, getFileByType, mkdir} from "./fs";
import {root, wx} from "./wx";

class WechatAdapter extends Adapter {

    constructor(url: string) {
        super(url);

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
