import {Creator, DefineOptions, inherit, inheritFunction, isInstance, matchType} from "../inherit";
import {MetaInfo} from "../meta";

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

export function defineComponent<C>(
    options: DefineOptions<C>
): Creator<C> {
    return inheritFunction(options, Component);
}
