import {typeId} from "../inherit";
import {defineType, getType, Meta, MetaInfo} from "../meta";
import {World} from "../world";
import {Bundles, isBundle} from "./bundles";
import {Components, isComponent} from "./components";

export class Entities {

    #table: { [key: string]: string[] } = {}

    #map: { [key: string]: Entity } = {}

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
        return Array.from(first).map(k => this.#map[k]).filter(v => v);
    }

    get(id: string) {
        return this.#map[id]
    }

    insert(entity: Entity) {
        const id = entity.id();
        this.#map[id] = entity;
        for (let type of entity.keys()) {
            if (!this.#table[type]) {
                this.#table[type] = [];
            }
            this.#table[type].push(id);
        }
    }
}

export class Entity extends MetaInfo {

    #metas: { [key: string]: string } = {};

    constructor() {
        super(Entity);
    }

    insert(target: any) {
        let type = typeId(target);
        if (this.#metas[type]) {
            throw new Error("Has same Component " + type)
        }
        this.#metas[type] = target.id();
    }

    keys() {
        return Object.keys(this.#metas);
    }

    values() {
        return Object.values(this.#metas);
    }

    get(type: string) {
        return this.#metas[typeId(type)]
    }

}

export class EntityData {
    #world: World;
    #entities: Entities;
    #components: Components;
    #bundles: Bundles;
    #entity: Entity;
    children: EntityData[] = [];

    constructor(world: World, entity: Entity, entities: Entities, bundles: Bundles, components: Components) {
        this.#world = world;
        this.#entities = entities;
        this.#bundles = bundles;
        this.#components = components;
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

    insert(...args: any[]) {
        if (args.length == 0) {
            throw new Error("No Args")
        }
        for (let arg of args) {
            this.#entity.insert(arg);
            if (isBundle(arg)) {
                this.#bundles.insert(arg);
                for (let component of arg.getComponents()) {
                    this.#components.insert(component);
                    this.#entity.insert(component)
                }
            } else if (isComponent(arg)) {
                this.#components.insert(arg);
            } else {
                throw new Error("Not Bundle or Component");
            }
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

export const isQueryFn = (type: any) => {
    return getType(type)?.kind === "Query";
}
