export function stringifyObject(obj: any) {
    const exists = [obj] // 存储已经处理过的，避免死循环
    const used: any[] = [] // 记录被用到的引用标记
    const stringifyObjectByKeys = (obj: any) => {
        if (Array.isArray(obj)) {
            const items: string[] = obj.map((item: any) => {
                if (item && typeof item === 'object') {
                    return stringifyObjectByKeys(item)
                } else {
                    return JSON.stringify(item)
                }
            })
            return '[' + items.join(',') + ']'
        }

        let str = '{'
        let keys = Object.keys(obj)
        let total = keys.length
        keys.sort()
        keys.forEach((key, i) => {
            let value = obj[key]
            str += key + ':'

            if (value && typeof value === 'object') {
                let index = exists.indexOf(value)
                if (index > -1) {
                    str += '#' + index
                    used.push(index)
                } else {
                    exists.push(value)
                    let num = exists.length - 1
                    str += '#' + num + stringifyObjectByKeys(value)
                }
            } else {
                str += JSON.stringify(value)
            }

            if (i < total - 1) {
                str += ','
            }
        })
        str += '}'
        return str
    }
    let str = stringifyObjectByKeys(obj)

    exists.forEach((item, i) => {
        if (!used.includes(i)) {
            str = str.replace(new RegExp(`:#${i}`, 'g'), ':')
        }
    })

    if (used.includes(0)) {
        str = '#0' + str
    }

    return str
}


export const stringify = (obj: any) => {
    if (obj === null || obj === undefined) {
        return '';
    }
    if (typeof obj === 'string') {
        return obj
    }
    if (typeof obj === 'number') {
        return obj + ''
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false'
    }
    if (typeof obj === 'object') {
        return stringifyObject(obj)
    }
    if (typeof obj === 'function') {
        return obj.toString()
    }
    if (typeof obj === 'symbol') {
        return obj.toString()
    }
    if (typeof obj === 'bigint') {
        return obj.toString()
    }
    return '';
}
