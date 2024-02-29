import {typeId} from "../inherit";
import {defineType, getType, MetaInfo} from "../meta";
import {World} from "../world";
import {isBundle} from "./bundles";
import {isComponent} from "./components";

export class Entities {

    #table: { [key: string]: string[] } = {}

    #data: { [key: string]: EntityData } = {}

    query(...types: any[]): Entity[] {
        const include = types.map(t => {
            if (isQueryFn(t) && getType(t).type === "with") {
                t = t();
            }
            return this.#table[typeId(t)]
        }).filter(v => v);
        if (include.length == 0) {
            return [];
        }
        let first = include[0];
        for (let includeElement of include) {
            first = first.filter(v => includeElement.includes(v))
        }
        // without
        const exclude = types.filter(t => isQueryFn(t) && getType(t).type === "without").map(t => this.#table[typeId(t())]).filter(v => v);
        for (let excludeElement of exclude) {
            first = first.filter(v => !excludeElement.includes(v))
        }
        return Array.from(first).map(k => this.#data[k].id()).filter(v => v);
    }

    data(entity: Entity) {
        if (!this.#data[entity.id()]) {
            return undefined;
        }
        return this.#data[entity.id()];
    }

    get(id: string) {
        return this.#data[id]
    }

    insert(entityData: EntityData) {
        const entity = entityData.id();
        const id = entity.id();
        this.#data[id] = entityData;
        for (let type of entity.keys()) {
            if (!this.#table[type]) {
                this.#table[type] = [];
            }
            this.#table[type].push(id);
        }
    }

    remove(entity: Entity) {
        const id = entity.id();
        const entityData = this.#data[id];
        if (!entityData) {
            return;
        }
        delete this.#data[id];
        for (let type of entity.keys()) {
            if (!this.#table[type]) {
                continue;
            }
            this.#table[type] = this.#table[type].filter(v => v !== id);
        }
    }

    replace(entityData: EntityData) {
        this.remove(entityData.id());
        this.insert(entityData);
    }

}

export class Entity extends MetaInfo {

    metas: { [key: string]: string } = {};

    constructor() {
        super(Entity);
    }

    insert(target: any) {
        let type = typeId(target);
        if (this.metas[type]) {
            throw new Error("Has same Component " + type)
        }
        this.metas[type] = target.id();
    }

    update(target: any) {
        let type = typeId(target);
        if (!this.metas[type]) {
            throw new Error("Not Found Component " + type)
        }
        this.metas[type] = target.id();
    }

    keys() {
        return Object.keys(this.metas);
    }

    values() {
        return Object.values(this.metas);
    }

    get(type: string) {
        return this.metas[typeId(type)]
    }

}

export class EntityData {
    #world: World;
    #entity: Entity;

    constructor(world: World, entity: Entity) {
        this.#world = world;
        this.#entity = entity;
    }

    id() {
        return this.#entity;
    }

    getComponents() {
        return this.#entity.values().map(k => this.#world.get(k)).filter(v => isComponent(v))
    }

    get(type: any) {
        if (typeId(type) === typeId(Entity)) {
            return this.#entity;
        }
        const id = this.#entity.get(type);
        return this.#world.get(id);
    }

    list(){
        return this.#entity.values().map(k => this.#world.get(k));
    }

    insert(...args: any[]) {
        if (args.length == 0) {
            throw new Error("No Args")
        }
        for (let arg of args) {
            if (isBundle(arg)) {
                this.#world.bundles.insert(arg);
                for (let component of arg.getComponents()) {
                    this.#world.components.insert(component);
                    this.#entity.insert(component)
                }
            } else if (isComponent(arg)) {
                this.#world.components.insert(arg);
            } else {
                throw new Error("Not Bundle or Component");
            }
            this.#entity.insert(arg);
        }
        return this;
    }

}

export const queryWith = (type: any) => {
    const withFn = () => type;
    defineType(withFn, "Query", "with")
    return withFn;
}

export const queryWithout = (type: any) => {
    const withoutFn = () => type;
    defineType(withoutFn, "Query", "without")
    return withoutFn;
}

export const queryHas = (type: any) => {
    const hasFn = () => type;
    defineType(hasFn, "Query", "has")
    return hasFn;
}

export const isQueryFn = (type: any) => {
    return getType(type)?.kind === "Query";
}
