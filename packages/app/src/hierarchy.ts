import {component, Entity, EntityData, isBundle, isComponent, World} from "@minigame/ecs";
import {App} from "./app";
import {Plugin} from "./plugin";

@component
export class Parent {
    parent: HierarchyEntityData;

    constructor(parent: HierarchyEntityData) {
        this.parent = parent;
    }
}

@component
export class Children {
    children: HierarchyEntityData[] = [];

    append(child: HierarchyEntityData) {
        this.children.push(child);
    }

}


export class EntityChildrenSpawner {
    #world: World;
    #parent: HierarchyEntityData;

    constructor(world: World, parentEntityData: HierarchyEntityData) {
        this.#world = world;
        this.#parent = parentEntityData;
    }

    spawn(...args: any[]): EntityData {
        if (args.length == 0) {
            throw new Error("No Args")
        }
        const entity = new Entity();
        args.push(new Parent(this.#parent));
        for (let arg of args) {
            if (isBundle(arg)) {
                this.#world.bundles.insert(arg);
                for (let component of arg.getComponents()) {
                    this.#world.components.insert(component);
                    entity.insert(component)
                }
            } else if (isComponent(arg)) {
                this.#world.components.insert(arg);
            } else {
                throw new Error("Not Bundle or Component");
            }
            entity.insert(arg);
        }
        const entityData = new HierarchyEntityData(this.#world, entity);
        this.#world.entities.insert(entityData)
        let children = this.#parent.get(Children);
        if (!children) {
            this.#parent.insert(new Children());
            children = this.#parent.get(Children);
        }
        children.append(entityData);
        this.#world.entities.replace(this.#parent);
        return entityData;
    }

    parent() {
        return this.#parent;
    }

}


export class HierarchyEntityData extends EntityData {
    #world: World;

    constructor(world: World, entity: Entity) {
        super(world, entity);
        this.#world = world;
    }

    withChildren(fn: (spawner: EntityChildrenSpawner) => void) {
        let entityChildrenInsert = new EntityChildrenSpawner(this.#world, this);
        fn(entityChildrenInsert);
        return this;
    }

}

export type HierarchySpawnCommand = {
    spawn: (...args: any[]) => HierarchyEntityData
}

export const hierarchySpawnCommandRegister = (world: World) => {
    return {
        spawn: (...args: any[]) => {
            if (args.length == 0) {
                throw new Error("No Args")
            }
            const entity = new Entity();
            for (let arg of args) {
                entity.insert(arg);
                if (isBundle(arg)) {
                    world.bundles.insert(arg);
                    for (let component of arg.getComponents()) {
                        world.components.insert(component);
                        entity.insert(component)
                    }
                } else if (isComponent(arg)) {
                    world.components.insert(arg);
                } else {
                    throw new Error("Not Bundle or Component");
                }
            }
            const entityData = new HierarchyEntityData(world, entity);
            world.entities.insert(entityData)
            return entityData;
        }
    }
}


export class HierarchyPlugin extends Plugin {
    build(app: App): void {
        app.replaceCommand(hierarchySpawnCommandRegister);
    }

    name() {
        return "HierarchyPlugin"
    }

}
