import {Assets} from "pixi.js";

import config, {installFont} from "./config";

const loadFont: LoaderFn = async (file) => {
    const font = await config.adapter.loadFont(file);
    installFont(file.name, font);
    loader.fileLoaded++;
}

const loadTexture: LoaderFn = async (file) => {
    const {name, type} = file;
    const pngFile = {
        ...file,
        name: file.name.substring(0, file.name.length - 4) + "png",
        path: file.path.substring(0, file.path.length - 4) + "png",
    }
    await config.adapter.saveFile(pngFile)
    const path = await config.adapter.saveFile(file);
    Assets.add(`${type}/${name}`, path)
    await Assets.load(`${type}/${name}`)
    loader.fileLoaded++;
}

const loadOther: LoaderFn = async (file) => {
    const {name, type} = file;
    const path = await config.adapter.saveFile(file);
    Assets.add(`${type}/${name}`, path)
    await Assets.load(`${type}/${name}`)
    loader.fileLoaded++;
}


const loadSound: LoaderFn = async (file) => {
    await config.adapter.loadSound(file);
    loader.fileLoaded++;
}

const loadLocal: LoaderFn = async ({name, path}) => {
    Assets.add(name, path)
    await Assets.load(name)
    loader.fileLoaded++;
}

const loader: Loader = {
    promises: [],
    fileList: [],
    fileLoaded: 0,
    reset() {
        Assets.reset();
        loader.promises = [];
        loader.fileList = [];
        loader.fileLoaded = 0;
    },
    load(file: FileInfo | string, arg1?: string, arg2?: string) {
        if (typeof file === 'string') {
            file = {
                name: arguments[0],
                path: arguments[1],
                type: 'local'
            }
        }
        if (typeof file === 'object') {
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
        }
    },
    result() {
        return Promise.all(loader.promises)
    },
}

export default loader;
