import {matchType} from "../inherit";
import {Resource} from "./resource";

export class Storages {
    map: { [key: string]: Resource } = {};

    get(type: any) {
        matchType(type, Resource);
        const key = type.key();
        if (!key) {
            return;
        }
        return this.map[key]
    }

    insert(res: any) {
        matchType(res, Resource);
        const key = res.key();
        const proxyRes = new Proxy(res, {
            set(target: any, k: string, v: any): boolean {
                if (target[k] === v) return true
                target[k] = v
                if (!k.startsWith("_") && !k.endsWith("_") && target._currentTick_ !== undefined) {
                    target._changeTick_ = target._currentTick_;
                }
                return true
            }
        })
        if (this.map[key]) {
            throw new Error("Repeat Resource " + key)
        } else {
            this.map[key] = proxyRes;
        }
        return proxyRes;
    }

}
