import {Assets} from "pixi.js";

import config, {installFont} from "./config";
import {access, getFileByType, mkdir} from "./wechat/fs";
import {root, wx} from "./wechat/wx";

const getUrl = (path, version?) => {
    if (version) {
        const ext = path.split('.').pop();
        path = path.replace(`.${ext}`, `-${version}.${ext}`);
    }
    return `${config.baseURL}/${path}`;
}

const getVerName = (name, version?) => {
    if (version) {
        const ext = name.split('.').pop();
        name = name.replace(`.${ext}`, `-${version}.${ext}`);
    }
    return name;
}

const getResPath = async (type, name) => {
    if (config.platform === 'wechat') {
        const existed = await access(`${type}`);
        if (!existed) {
            await mkdir(`${type}`);
        }
    }
    return `${type}/${name}`;
}


const loadFont = ({name, path, version}) => {
    const url = getUrl(path);
    return new Promise<boolean>(async (resolve) => {
        if (config.platform === "wechat") {
            await getFileByType('font', name, version, url);
            const f = wx.loadFont(`${root}/${name}`);
            installFont(name, f)
        } else {
            Assets.add(name, url)
            const f = await Assets.load(name);
            const font = f.family;
            installFont(name, font)
        }
        loader.fileLoaded++;
        resolve(true)
    })
}

const loadTexture = ({name, path, version}) => {
    const url = getUrl(path, version);
    return new Promise<boolean>(async (resolve) => {
        if (config.platform === "wechat") {
            name = await getResPath('texture', getVerName(name, version));
            const pngUrl = url.substring(0, url.length - 4) + "png"
            const pngName = name.substring(0, name.length - 4) + "png"
            await getFileByType('texture', name, version, url);
            await getFileByType('texture', pngName, version, pngUrl);
            Assets.add(name, `${root}/${name}`)
        } else {
            Assets.add(name, url)
        }
        await Assets.load(name)
        loader.fileLoaded++;
        resolve(true)
    });
}

const loadOther = ({name, path, version, type}) => {
    const url = getUrl(path, version);
    return new Promise<boolean>(async (resolve) => {
        if (config.platform === "wechat") {
            const resPath = await getResPath(type, getVerName(name, version));
            await getFileByType(type, resPath, version, url);
            Assets.add(`${type}/${name}`, `${root}/${resPath}`)
        } else {
            Assets.add(`${type}/${name}`, url)
        }
        await Assets.load(`${type}/${name}`)
        loader.fileLoaded++;
        resolve(true)
    });
}


const loadSound = ({name, path, version}) => {
    const url = getUrl(path);
    return new Promise<boolean>(async (resolve) => {
        if (config.platform === "wechat") {
            name = await getResPath('sound', name);
            await getFileByType('sound', name, version, url);
        } else {
            Assets.add(name, url)
            await Assets.load(name)
        }
        loader.fileLoaded++;
        resolve(true)
    });
}

const loadLocal = ({name, path}) => {
    return new Promise<boolean>(async (resolve) => {
        Assets.add(name, path)
        await Assets.load(name)
        loader.fileLoaded++;
        resolve(true)
    });
}

const loader = {
    promises: [],
    fileList: [],
    fileLoaded: 0,
    reset() {
        Assets.reset();
        loader.promises = [];
        loader.fileList = [];
        loader.fileLoaded = 0;
    },
    load(file, arg1?, arg2?) {
        if (arguments.length > 1) {
            file = {
                name: arguments[0],
                path: arguments[1],
                type: 'local'
            }
        }
        loader.fileList.push(file);
        switch (file.type) {
            case 'font':
                loader.promises.push(loadFont(file));
                break;
            case 'texture':
                loader.promises.push(loadTexture(file));
                break;
            case 'script':
                loader.promises.push(loadOther(file));
                break;
            case 'sound':
                loader.promises.push(loadSound(file));
                break;
            case 'i18n':
                loader.promises.push(loadOther(file));
                break;
            case 'local':
                loader.promises.push(loadLocal(file));
                break;
            default:
                loader.promises.push(loadOther(file));
                break;
        }
        return loader.promises[loader.promises.length - 1];
    },
    result() {
        return Promise.all(loader.promises)
    },
}

export default loader;
