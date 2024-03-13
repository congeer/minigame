import {stringifyObject} from "./stringfy";

const stringHash = (str: string) => {
    let hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export const hash = (obj: any) => {
    if (obj === null || obj === undefined) {
        return -1;
    }
    if (typeof obj === 'string') {
        return stringHash(obj)
    }
    if (typeof obj === 'number') {
        return obj
    }
    if (typeof obj === 'boolean') {
        return obj ? 1 : 0
    }
    if (typeof obj === 'object') {
        return stringHash(stringifyObject(obj))
    }
    if (typeof obj === 'function') {
        return stringHash(obj.toString())
    }
    if (typeof obj === 'symbol') {
        return stringHash(obj.toString())
    }
    if (typeof obj === 'bigint') {
        return stringHash(obj.toString())
    }
    if (typeof obj === 'undefined') {
        return -1
    }
    return 0;
}
