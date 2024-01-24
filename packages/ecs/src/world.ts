import {query, res, runWithWorld, spawn} from "./commands";
import {Bundles, Components, Entities, Entity, EntityData, isBundle, isComponent, isQueryFn} from "./entity";
import {hierarchySpawn} from "./entity/hierarchy";
import {Storages} from "./storage";
import {Schedule, Schedules} from "./system";


// const getEntityFromTree = function (list: EntityData[], entity: Entity): EntityData | undefined {
//     for (let entityDatum of list) {
//         if (entityDatum.id() === entity) {
//             return entityDatum;
//         }
//         const entityFromTree = getEntityFromTree(entityDatum.children, entity);
//         if (entityFromTree) {
//             return entityFromTree;
//         }
//     }
// }

export class World {
    entities: Entities;
    components: Components;
    bundles: Bundles;
    commands: {
        [key: string]: any
    } = {}

    storages: Storages;

    _changeTick: number = 0;

    constructor() {
        this.entities = new Entities();
        this.components = new Components();
        this.bundles = new Bundles();
        this.storages = new Storages();
        this.registerCommand("spawn", hierarchySpawn);
        this.registerCommand("query", query);
        this.registerCommand("res", res);
        this.registerCommand("runWithWorld", runWithWorld);
    }

    tick(t: number) {
        this._changeTick += 1;
        for (let key in this.storages.map) {
            this.storages.map[key]._lastTick_ = t;
            this.storages.map[key]._currentTick_ = this._changeTick;
        }
    }

    query(...types: any[]): any[][] {
        const entities = this.entities.query(...types);
        return entities.map(entity => {
            const data = this.entity(entity);
            return types.filter(t => !isQueryFn(t)).map(t => data!.get(t));
        })
    }

    entity(entity: Entity): EntityData | undefined {
        return this.entities.data(entity);
    }

    addSchedule(scheduleLabel: any, schedule: Schedule) {
        let schedules = this.resourceWithInit(Schedules) as Schedules;
        schedules.insert(scheduleLabel, schedule)
    }

    runSchedule(scheduleLabel: any) {
        let schedules = this.resourceWithInit(Schedules) as Schedules;
        schedules.get(scheduleLabel)?.run(this);
    }

    registerCommand(name: string, command: (world: World) => (args: any) => any) {
        this.commands[name] = command(this);
    }

    spawn(...args: any[]): EntityData {
        if (args.length == 0) {
            throw new Error("No Args")
        }
        const entity = new Entity();
        for (let arg of args) {
            entity.insert(arg);
            if (isBundle(arg)) {
                this.bundles.insert(arg);
                for (let component of arg.getComponents()) {
                    this.components.insert(component);
                    entity.insert(component)
                }
            } else if (isComponent(arg)) {
                this.components.insert(arg);
            } else {
                throw new Error("Not Bundle or Component");
            }
        }
        const entityData = new EntityData(this, entity);
        this.entities.insert(entityData)
        return entityData;
    }

    initResource(type: any) {
        const data = new type();
        data._changeTick_ = this._changeTick;
        return this.storages.insert(data);
    }

    insertResource(res: any) {
        res._changeTick_ = this._changeTick;
        return this.storages.insert(res);
    }

    resource(res: any): any {
        return this.storages.get(res);
    }

    resourceWithInit(type: any): any {
        let res = this.resource(type);
        if (!res) {
            return this.initResource(type);
        }
        return this.resource(type);
    }

    get(id: string, ...types: any[]): any {
        const component = this.components.get(id);
        if (component) {
            return component;
        }
        const bundle = this.bundles.get(id);
        if (bundle) {
            return bundle;
        }
        const entity = this.entities.get(id);
        if (entity) {
            if (types.length > 0) {
                return types.map(t => entity!.get(t))
            } else {
                return entity;
            }
        }
    }
}
