import {deepCopy, None, Option} from "@minigame/utils";
import {nanoid} from "nanoid";
import {Archetypes} from "../archetype";
import {Bundles} from "../bundle";
import {CHECK_TICK_THRESHOLD, Tick} from "../change_detection";
import {Component, ComponentId, Components, ComponentTicks} from "../component";
import {Entities, Entity, EntityLocation} from "../entity";
import {typeId} from "../inherit";
import {RemovedComponentEvents} from "../removal_detection";
import {Schedule, Schedules} from "../schedule";
import {Resource, ResourceData, Storages} from "../storage";
import {EntityWorld} from "./entity_world";

export class World {
    _id: string;
    entities: Entities;
    components: Components;
    archetypes: Archetypes;
    storages: Storages;
    bundles: Bundles;


    _changeTick: number;
    lastChangeTick: Tick;
    lastCheckTick: Tick;
    removedComponents: RemovedComponentEvents;

    constructor() {
        this._id = nanoid();
        this.entities = new Entities();
        this.components = new Components();
        this.archetypes = new Archetypes();
        this.storages = new Storages();
        this.bundles = new Bundles();
        this.removedComponents = new RemovedComponentEvents();

        this._changeTick = 1;
        this.lastChangeTick = new Tick(0);
        this.lastCheckTick = new Tick(0);
    }

    asReadOnly() {
        return deepCopy(this);
    }

    checkChangeTicks() {
        const changeTick = this.changeTick;
        if (changeTick.relativeTo(this.lastCheckTick).get() < CHECK_TICK_THRESHOLD) {
            return;
        }
        const {tables, sparseSets, resources} = this.storages;
        tables.checkChangeTicks(changeTick);
        sparseSets.checkChangeTicks(changeTick);
        resources.checkChangeTicks(changeTick);

        const schedules = this.getResource<Schedules>(Schedules);
        schedules.match({
            some: (schedules) => {
                schedules.checkChangeTicks(changeTick);
            }
        })

        this.lastCheckTick = changeTick;
    }

    incrementChangeTick() {
        const prevTick = this._changeTick;
        this._changeTick += 1;
        return new Tick(prevTick)
    }

    get changeTick() {
        return new Tick(this._changeTick);
    }

    set changeTick(t: Tick) {
        this._changeTick = t.tick;
    }

    lastChangeTickScope<T>(lastChangeTick: Tick, f: (world: World) => T): T {
        const guard = new LastTickGuard(this, this.lastChangeTick);
        guard.world.lastChangeTick = lastChangeTick;
        const ret = f(this);
        guard.drop();
        return ret;
    }

    // ---- Schedule Start----

    addSchedule(schedule: Schedule) {
        const schedules = this.getResourceOrInsertWith(Schedules, () => new Schedules());
        schedules.insert(schedule)
    }

    tryScheduleScope(label: any, f: (world: World, schedule: Schedule) => any) {
        try {
            return this.scheduleScope(label, f);
        } catch (e) {
            console.error(e);
        }
    }

    scheduleScope(label: any, f: (world: World, schedule: Schedule) => any) {
        const schedules = this.getResourceOrInsertWith<Schedules>(Schedules, () => new Schedules());
        return schedules.remove(label).match({
            some: (schedule) => {
                const ret = f(this, schedule);
                const old = schedules.insert(schedule);
                if (old) {
                    console.warn(`Schedule ${label} was inserted during a call to World.schedule_scope its value has been overwritten`)
                }
                return ret;
            },
            none: () => {
                throw new Error(`Schedule ${label} not found`)
            }
        });
    }

    tryRunSchedule(label: any) {
        return this.tryScheduleScope(label, (world, schedule) => {
            schedule.run(world);
        })
    }

    runSchedule(label: any) {
        this.scheduleScope(label, (world, schedule) => {
            schedule.run(world);
        })
    }

    // ---- Schedule End----


    allowAmbiguousComponent<T extends Component>(component: new() => T, world: World) {
        const schedules = world.removeResource<Schedules>(Schedules).unwrapOrElse(() => new Schedules());
        schedules.allowAmbiguousComponent(component, world);
        world.insertResource(schedules);
    }

    allowAmbiguousResource<T extends Resource>(res: new() => T, world: World) {
        const schedules = world.removeResource<Schedules>(Schedules).unwrapOrElse(() => new Schedules());
        schedules.allowAmbiguousResource(res, world);
        world.insertResource(schedules);
    }

    initComponent<T extends Component>(component: new() => T): ComponentId {
        return this.components.initComponent(typeId(component), this.storages);
    }

    getEntity(entity: Entity): Option<EntityWorld> {
        return this.entities.get(entity).map(location => new EntityWorld(this.asReadOnly(), entity, location));
    }

    entity(entity: Entity) {

    }

    // ---- Resource Start----

    getResourceById(id: ComponentId): Option<any> {
        return this.storages.resources.get(id).andThen(v => v.getData());
    }

    getResource<T>(resType: new() => T): Option<T> {
        const componentId = this.components.initResource(resType);
        return this.getResourceById(componentId);
    }

    getResourceOrInsertWith<T>(resType: new() => T, func: () => T): T {
        const changeTick = this.changeTick;
        const lastChangeTick = this.lastChangeTick;

        const componentId = this.components.initResource(resType);
        let data = this.initializeResourceInternal(componentId);
        if (!data.isPresent()) {
            data.insert(func(), changeTick);
        }

        return data.get(lastChangeTick, changeTick).unwrap()[0];
    }

    protected initializeResourceInternal(componentId: ComponentId): ResourceData {
        const archetypes = this.archetypes;
        return this.storages.resources.initializeWith(componentId, this.components, () => {
            return archetypes.newArchetypeComponentId();
        })
    }

    initializeResource<T>(res: new() => T): ComponentId {
        const componentId = this.components.initResource(res);
        this.initializeResourceInternal(componentId);
        return componentId;
    }

    insertResource<T>(value: T) {
        const componentId = this.components.initResource(value);
        this.insertResourceById(componentId, value);
    }

    insertResourceById<T>(id: ComponentId, value: T) {
        const changeTick = this.changeTick;
        this.initializeResourceInternal(id).insert(value, changeTick);
    }

    initResource<T extends Resource>(res: new() => T): ComponentId {
        const componentId = this.components.initResource(res);
        if (this.storages.resources.get(componentId).mapOr(true, (v) => v.isPresent())) {
            const value = fromWorld(res, this);
            this.insertResourceById(componentId, value);
        }
        return componentId;
    }

    removeResource<T>(resType: new() => T): Option<T> {
        const componentId = this.components.getResourceId(typeId(resType));
        if (componentId.isNone()) {
            return None;
        }
        return this.storages.resources.get(componentId.unwrap()).andThen(v => v.remove()).map(v => v[0]);
    }

    containsResource<T>(resType: new() => T): boolean {
        return this.components.getResourceId(typeId(resType))
            .andThen(componentId => this.storages.resources.get(componentId))
            .map(v => v.isPresent())
            .unwrapOr(false);
    }

    isResourceAdded<T>(resType: new() => T): boolean {
        return this.components.getResourceId(typeId(resType))
            .map(componentId => this.isResourceAddedById(componentId))
            .unwrapOr(false);
    }

    isResourceAddedById(id: ComponentId): boolean {
        return this.storages.resources.get(id)
            .andThen(res => res.getTicks()
                .map(ticks => ticks.isAdded(this.lastChangeTick, this.changeTick)))
            .unwrapOr(false);
    }

    isResourceChanged<T>(resType: new() => T): boolean {
        return this.components.getResourceId(typeId(resType))
            .map(componentId => this.isResourceChangedById(componentId))
            .unwrapOr(false);
    }

    isResourceChangedById(id: ComponentId): boolean {
        return this.storages.resources.get(id)
            .andThen(res => res.getTicks().map(ticks => ticks.isChanged(this.lastChangeTick, this.changeTick)))
            .unwrapOr(false);
    }

    getResourceChangeTicks<T>(resType: new() => T): Option<ComponentTicks> {
        return this.components.getResourceId(typeId(resType))
            .andThen(componentId => this.getResourceChangeTicksById(componentId))
    }

    getResourceChangeTicksById(id: ComponentId): Option<ComponentTicks> {
        return this.storages.resources.get(id).andThen(v => v.getTicks());
    }

    // ---- Resource End----

    clearAll() {
        this.clearEntities();
        this.clearResources();
    }

    clearEntities() {
        this.storages.tables.clear();
        this.storages.sparseSets.clearEntities();
        this.archetypes.clearEntities();
        this.entities.clear();
    }

    clearResources() {
        this.storages.resources.clear();
    }

    toString() {
        return `World id: ${this._id} ` +
            `entity_count: ${this.entities.len()} ` +
            `archetype_count: ${this.archetypes.len()} ` +
            `component_count: ${this.components.len()} ` +
            `resource_count: ${this.storages.resources.len()}`
    }

    fetchTable(location: EntityLocation, componentId: ComponentId) {
        return this.storages.tables.get(location.tableId).getColumn(componentId);
    }

    fetchSparseSet(componentId: ComponentId) {
        return this.storages.sparseSets.get(componentId);
    }

    flush() {
        const emptyArchetype = this.archetypes.empty();
        const table = this.storages.tables.get(emptyArchetype.tableId);
        this.entities.flush((entity, location, setLocation) => {
            setLocation(emptyArchetype.allocate(entity, table.allocate(entity)));
        })
    }
}

class LastTickGuard {
    lastTick: Tick;
    world: World;

    constructor(world: World, lastTick: Tick) {
        this.world = world;
        this.lastTick = lastTick;
    }

    drop() {
        this.world.lastChangeTick = this.lastTick;
    }
}

export type FromWorld<T> = {
    fromWorld(world: World): T;
}

export const fromWorld = <T>(target: FromWorldType<T> | (new() => T), world: World): T => {
    if ('fromWorld' in target) {
        return target.fromWorld(world);
    } else {
        return new target();
    }
}

export const implFromWorld = (target: any, fromWorld: (world: World) => any): typeof target => {
    target.fromWorld = fromWorld;
    return target;
}


export type FromWorldType<T> = ((new() => T) & FromWorld<T>);
