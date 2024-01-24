import {World} from "../world";
import {Bundles, isBundle} from "./bundles";
import {component, Components, isComponent} from "./components";
// import {defineCommand} from "../commands";
import {Entities, Entity, EntityData} from "./entities";

@component
export class Parent {

}

@component
export class Children {

}


export class EntityChildrenSpawner {
    #world: World;
    #entities: Entities;
    #components: Components;
    #bundles: Bundles;
    #entity: Entity;
    #children: EntityData[];

    constructor(world: World, entity: Entity, entities: Entities, bundles: Bundles, components: Components, children: EntityData[]) {
        this.#world = world;
        this.#entities = entities;
        this.#bundles = bundles;
        this.#components = components;
        this.#entity = entity;
        this.#children = children;
    }

    spawn(...args: any[]): EntityData {
        if (args.length == 0) {
            throw new Error("No Args")
        }
        const entity = new Entity();
        for (let arg of args) {
            entity.insert(arg);
            if (isBundle(arg)) {
                this.#bundles.insert(arg);
                for (let component of arg.getComponents()) {
                    this.#components.insert(component);
                    entity.insert(component)
                }
            } else if (isComponent(arg)) {
                this.#components.insert(arg);
            } else {
                throw new Error("Not Bundle or Component");
            }
        }
        this.#entities.insert(entity)
        const entityData = new EntityData(this.#world, entity, this.#entities, this.#bundles, this.#components);
        this.#children.push(entityData);
        return entityData;
    }

    parent() {
        return this.#entity;
    }

}



//
// export const withChildren = defineCommand({
//     name: "withChildren",
//
// })
