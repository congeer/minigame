import {MetaInfo} from "../meta";
import {inherit, inheritFunction, isInstance, isType, matchType} from "../inherit";

export class Components {

    #table: { [key: string]: Component } = {};

    insert(component: any) {
        matchType(component, Component)
        this.#table[component.id()] = component;
    }

    get(id: string) {
        return this.#table[id];
    }

}

export const isComponent = (target: Component) => {
    return isInstance(target, Component);
}

export class Component extends MetaInfo {
    constructor() {
        super(Component);
    }
}

export const component = function (target: any): typeof target {
    return inherit(target, Component);
}

export const defineComponent = (name: string, obj: () => any) => {
    return inheritFunction(name, obj, Component);
}
