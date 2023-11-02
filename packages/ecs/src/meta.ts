import {nanoid} from "nanoid";
import {typeId} from "./inherit";

export class Meta {
    readonly id: string;
    readonly kind: string;
    readonly type: string;

    constructor(id: string, kind: string, type: string) {
        this.id = id;
        this.kind = kind;
        this.type = type;
        Object.defineProperty(this, "id", {
            writable: false
        })
        Object.defineProperty(this, "kind", {
            writable: false
        })
        Object.defineProperty(this, "type", {
            writable: false
        })
    }

    static kind(type: string, name: string) {
        return new Meta("", type, name);
    }

    static new(type: string, name: string) {
        return new Meta(nanoid(), type, name);
    }

}

export class MetaInfo {

    #_meta_: Meta;
    static _type_: any;

    constructor(kind: any) {
        // @ts-ignore
        const type = this.__proto__.constructor;
        const _type = typeId(type);
        const _kind = typeId(kind);
        this.#_meta_ = Meta.new(_kind, _type ?? _kind)
        defineType(type, _kind, _type);
    }

    id() {
        return this.#_meta_.id;
    }

    kind() {
        return this.#_meta_.kind;
    }

    key() {
        return this.#_meta_.type;
    }

    static key() {
        return this._type_?.type;
    }

}

export function defineType(target: any, type: any, name?: any) {
    const meta = Meta.kind(type, name ?? type);
    const descriptor = Object.getOwnPropertyDescriptor(target, "_type_");
    if (descriptor) {
        descriptor.value = meta;
    } else {
        Object.defineProperty(target, "_type_", {
            value: meta,
            enumerable: false,
            writable: false,
        })
    }
}

export function getType(target: any) {
    return target._type_;
}

export const metaType = (target: any) => {
    return target._meta_.type;
}

