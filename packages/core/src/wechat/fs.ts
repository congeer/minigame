import {root, wx} from './wx';

const fs = wx?.getFileSystemManager?.();

export async function getFileByType(type, name, version, url: string) {
    const v = localStorage.getItem(`${type}/${name}`);
    if (!version || v === version) {
        const exists = await access(name);
        if (!exists) {
            await downloadFile(url, name);
        }
    } else {
        await downloadFile(url, name);
        localStorage.setItem(`${type}/${name}`, version);
    }
}


export function access(path: string) {
    return new Promise<boolean>((resolve) => {
        fs.access({
            path: `${root}/${path}`,
            success: () => resolve(true),
            fail: (err) => {
                console.error(err)
                resolve(false)
            }
        })
    })
}

export function save(src: string, dst: string) {
    return new Promise<string>((resolve, reject) => {
        fs.saveFile({
            tempFilePath: src,
            filePath: `${root}/${dst}`,
            success: ({savedFilePath}) => resolve(savedFilePath),
            fail: (err) => reject(err)
        })
    })
}

export function mkdir(path: string, recursive = true) {
    return new Promise<boolean>((resolve) => {
        fs.mkdir({
            dirPath: `${root}/${path}`,
            recursive,
            success: () => resolve(true),
            fail: (err) => {
                console.error(err)
                resolve(false)
            }
        })
    })
}

export function read(opts: {
    path: string
    encoding?: 'ascii' | 'base64' | 'binary' | 'hex' | 'utf-8' | 'utf8'
    position?: number
    length?: number
}) {
    return new Promise<string | ArrayBuffer>((resolve, reject) => {
        fs.readFile({
            filePath: `${root}/${opts.path}`,
            encoding: opts.encoding,
            position: opts.position,
            length: opts.length,
            success: ({data}) => resolve(data),
            fail: (err) => reject(err)
        })
    })
}

export function downloadFile(url: string, path: string) {
    return new Promise<string>((resolve, reject) =>
        wx.downloadFile({
            url: url,
            success(res) {
                if (res.statusCode === 200) {
                    save(res.tempFilePath, path).then((res) => {
                        resolve(res)
                    })
                }
            }, fail(err) {
                reject(err)
            }
        })
    );
}

