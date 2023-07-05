interface LoaderFn {
    (file: FileInfo): Promise<void>
}

interface LoadFontFn {
    (name: string, font: string): void;
}

interface AfterLuaLoadFn {
    (invoke: any): void;
}
