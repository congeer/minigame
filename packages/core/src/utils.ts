import {DisplayObject} from "@pixi/display";
import {Container, Sprite} from "pixi.js";
import config from "./config";

export const createPromise = function <T>(): [Promise<T>, (v: T | PromiseLike<T>) => void, (v?: Error) => void] {
    let resolve: (v: T | PromiseLike<T>) => void = () => {
    }
    let reject: (v?: Error) => void = () => {
    }

    const promise = new Promise<T>((_resolve, _reject) => {
        resolve = _resolve
        reject = _reject
    })

    return [promise, resolve, reject]
}

export const delay = (t = 0) => {
    return new Promise(resolve => {
        setTimeout(resolve, t)
    })
}

export function mixin<T extends new (...args: any[]) => unknown>(ctor: T, ...bases: any[]) {
    bases.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                ctor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
            )
        })
    })
    return ctor
}

export const unit = (num: number, multiplier?: number) => {
    if (multiplier) {
        return Math.floor(config.unit * num / multiplier) * multiplier
    } else {
        return config.unit * num
    }
}

export function alignGlobal(target: DisplayObject, opts?: IAlign) {
    align(target, undefined, opts)
}

export function align<T extends Container>(target: DisplayObject, parent?: T, opts?: IAlign) {
    const delta = {x: 0, y: 0}
    const rect = target.getBounds(false)
    const {direction} = opts || {}

    const p = parent ? parent.getBounds(false) : {...config.safeArea, x: 0, y: 0, height: config.safeArea.height};

    const parentX = parent ? p.x : config.safeArea.left;
    if (opts?.left !== undefined) {
        delta.x = opts.left - rect.left + parentX
    } else if (opts?.right !== undefined) {
        delta.x = p.width - opts.right - rect.right + parentX
    } else if (direction === 'portrait' || direction === undefined) {
        delta.x = (p.width - rect.left - rect.right) / 2 + parentX
    }

    const parentY = parent ? p.y : config.safeArea.top;
    if (opts?.top !== undefined) {
        delta.y = opts.top - rect.top + parentY;
    } else if (opts?.bottom !== undefined) {
        delta.y = p.height - opts.bottom - rect.bottom + parentY
    } else if (direction === 'landscape' || direction === undefined) {
        delta.y = (p.height - rect.top - rect.bottom) / 2 + parentY
    }


    target.x += delta.x / (parent?.scale?.x ?? 1)
    target.y += delta.y / (parent?.scale?.y ?? 1)
}

export const spriteSize = (sprite: Sprite, size: number) => {
    sprite.scale.x = sprite.scale.y = Math.min(size / sprite.texture.width, size / sprite.texture.height);
}
