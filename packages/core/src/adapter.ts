import {Assets} from "pixi.js";
import {AdOptions} from "./ad";
import type {FileInfo} from "./assets";

export interface ShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
    success?: () => void;
    fail?: () => void;
    complete?: () => void;
}

export interface IAdapter {
    baseURL: string;

    share(opts: ShareOptions): any

    showAd(key?: string): any

    initAds(options: { [key: string]: AdOptions }): any

    initAd(option: AdOptions): any

    getCanvas(): HTMLCanvasElement

    saveFile(file: FileInfo): Promise<any>

    loadFont(file: FileInfo): Promise<any>

    loadSound(file: FileInfo): Promise<any>
}

export class Adapter implements IAdapter {

    baseURL: string;

    constructor(baseUrl: string) {
        this.baseURL = baseUrl;
    }

    share(opts: ShareOptions) {
    }

    showAd(key?: string): any {
        // do nothing
    }

    initAds(options: { [key: string]: AdOptions }): any {
        // do nothing
    }

    initAd(option: AdOptions): any {
        // do nothing
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

    protected getUrl(path: string, version?: string) {
        if (version) {
            const ext = path.split('.').pop();
            path = path.replace(`.${ext}`, `-${version}.${ext}`);
        }
        return `${this.baseURL}/${path}`;
    }

}


export class WebAdapter extends Adapter {

    resizeFn: { [key: string]: () => void } = {};

    constructor(baseUrl: string) {
        super(baseUrl);
        window.addEventListener("resize", this.onresize.bind(this));
    }

    share(opts: ShareOptions) {
        super.share(opts);
    }

    destroy() {
        for (let key in this.resizeFn) {
            delete this.resizeFn[key];
        }
        window.removeEventListener("resize", this.onresize)
    }

    addResize(key: string, fn: () => void) {
        this.resizeFn[key] = fn;
    }

    private onresize() {
        for (let key in this.resizeFn) {
            this.resizeFn[key]();
        }
    }

}

