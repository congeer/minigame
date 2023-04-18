import {utils} from "pixi.js";

const storeEvent = new utils.EventEmitter()

let storeHandle = undefined;

const createStore = (store: any, name = "default") => {
    const queue = new WeakSet()
    const handle = {
        get(target: any, k: any) {
            let v = target[k]
            if (v && typeof v === 'object' && !queue.has(v)) {
                v = target[k] = new Proxy(v, handle)
                queue.add(v)
            }
            return v
        },

        set(target: any, k: any, v: any) {
            if (target[k] === v) return true
            if (v && typeof v === 'object' && !queue.has(v)) {
                v = new Proxy(JSON.parse(JSON.stringify(v)), handle)
                queue.add(v)
            }
            target[k] = v
            if (target.__type__) {
                storeEvent.emit(target.__type__, target, k, v)
            }
            if (storeHandle) {
                clearTimeout(storeHandle)
            }
            storeHandle = setTimeout(() => {
                storeHandle = undefined;
                localStorage.setItem(name, JSON.stringify(store))
            }, 100)
            return true
        }
    }
    localStorage.setItem(name, JSON.stringify(store))
    return new Proxy<typeof store>(store, handle);
}

export {
    storeEvent,
    createStore
}
