import {MetaInfo} from "../meta";
import {inherit, inheritFunction, isInstance, isType, matchType} from "../inherit";
import {isComponent} from "./components";

export class Bundles {

    #table: { [key: string]: Bundle } = {};

    insert(bundle: any) {
        matchType(bundle, Bundle)
        this.#table[bundle.id()] = bundle;
    }

    get(id: string) {
        return this.#table[id];
    }

}

export const isBundle = (target: any) => {
    return isInstance(target, Bundle);
}

export class Bundle extends MetaInfo {

    constructor() {
        super(Bundle);
    }

    getComponents() {
        return Object.values(this).filter((c: any) => isComponent(c))
    }
}

export const bundle = function (target: any): typeof target {
    return inherit(target, Bundle);
}

export const defineBundle = (name: string, obj: () => any) => {
    return inheritFunction(name, obj, Bundle);
}
