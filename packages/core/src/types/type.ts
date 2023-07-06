interface FileInfo {
    name: string;
    path: string;
    type: string;
    version?: string;
}

interface Loader {
    promises: Promise<any>[];
    fileList: FileInfo[];
    fileLoaded: number;

    reset(): void;

    load(file: FileInfo | string, arg1?: string, arg2?: string): void;

    result(): Promise<any>;
}

interface IAlign {
    direction?: 'landscape' | 'portrait'
    top?: number
    left?: number
    right?: number
    bottom?: number
}

interface Area {
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
}

interface IAdapter {
    baseURL: string;
    shareFn?: (opts: ShareOptions) => void

    share(opts: ShareOptions): any

    getCanvas(): HTMLCanvasElement

    saveFile(file: FileInfo): Promise<any>

    loadFont(file: FileInfo): Promise<any>

    loadSound(file: FileInfo): Promise<any>
}

interface Config {
    name: string;
    platform: Platform;
    version: string;
    resource: string;
    fonts: { [key: string]: string };
    unit: number;
    adapter: IAdapter;
    safeArea: Area;
    baseURL: string;
}

interface LuaAfterLoad {
    key: string,
    fn: AfterLuaLoadFn
}


interface ShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
    success?: () => void;
    fail?: () => void;
    complete?: () => void;
}

interface ShareManager {
    titles: string[];

    getTitle(): string;

    addTitle(titles: string[]): void;

    clearTitle(): void;

    share(options: ShareOptions): void;
}

interface Store {
    __type__: string

    [key: string]: any
}
