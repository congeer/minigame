import {Assets} from "pixi.js";

export type FileInfo = {
    name: string;
    path: string;
    type: string;
    version?: string;
}

class Adapter {

    baseURL: string;

    shareFn: (opts) => void

    constructor(baseUrl) {
        this.baseURL = baseUrl;
    }

    share(opts): any {
        return this.shareFn && this.shareFn(opts);
    }

    getCanvas() {
        const canvas = document.createElement('canvas');
        document.body.appendChild(canvas);
        return canvas;
    }

    async saveFile(file: FileInfo) {
        if (file.type === "font" || file.type === "sound") {
            return this.getUrl(file.path);
        }
        return this.getUrl(file.path, file.version);
    }

    async loadFont(file: FileInfo) {
        const url = this.getUrl(file.path);
        Assets.add(file.name, url);
        const f = await Assets.load(file.name);
        return f.family;
    }

    async loadSound(file: FileInfo) {
        const url = this.getUrl(file.path);
        Assets.add(file.name, url);
        await Assets.load(file.name);
    }

    protected getUrl(path, version?) {
        if (version) {
            const ext = path.split('.').pop();
            path = path.replace(`.${ext}`, `-${version}.${ext}`);
        }
        return `${this.baseURL}/${path}`;
    }

}


class WebAdapter extends Adapter {

    resizeFn = {};

    constructor(baseUrl) {
        super(baseUrl);
        window.addEventListener("resize", this.onresize.bind(this));
        document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top)')
        document.documentElement.style.setProperty('--sar', 'env(safe-area-inset-right)')
        document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom)')
        document.documentElement.style.setProperty('--sal', 'env(safe-area-inset-left)')
    }

    destroy() {
        for (let key in this.resizeFn) {
            delete this.resizeFn[key];
        }
        window.removeEventListener("resize", this.onresize)
    }

    addResize(key, fn) {
        this.resizeFn[key] = fn;
    }

    private onresize() {
        for (let key in this.resizeFn) {
            this.resizeFn[key]();
        }
    }

}

export default Adapter;

export {WebAdapter};
