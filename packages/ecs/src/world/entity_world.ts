import {None, Option, Some} from "@minigame/utils";
import {Archetype, ArchetypeId, Archetypes} from "../archetype";
import {Bundle, BundleInfo} from "../bundle";
import {BundleInserter} from "../bundle_inner";
import {Component, ComponentId, Components, ComponentTicks, StorageType, storageType} from "../component";
import {Entities, Entity, EntityLocation} from "../entity";
import {TypeId, typeId} from "../inherit";
import {RemovedComponentEvents} from "../removal_detection";
import {Storages} from "../storage";
import {World} from "./index";

export class EntityWorld {
    world: World;
    entity: Entity;
    location: EntityLocation;

    constructor(world: World, entity: Entity, location: EntityLocation) {
        this.world = world;
        this.entity = entity;
        this.location = location;
    }

    id() {
        return this.entity;
    }

    archetype(): Archetype {
        return this.world.archetypes.get(this.location.archetypeId);
    }

    contains<T>(component: T): boolean {
        return this.containsTypeId(typeId(component));
    }

    containsId(componentId: ComponentId): boolean {
        return this.archetype()?.contains(componentId);
    }

    containsTypeId(typeId: TypeId): boolean {
        return this.world.components.getId(typeId).match({some: id => this.containsId(id), none: false});
    }

    get<T extends Component>(component: new() => T): Option<T> {
        return this.world.components.getId(typeId(component)).match({
            none: None,
            some: (componentId) => getComponent(this.world, componentId, storageType(component), this.entity, this.location)
        });
    }

    getChangeTicks(component: any): Option<ComponentTicks> {
        return this.world.components.getId(typeId(component))
            .andThen(componentId =>
                getTicks(this.world, componentId, storageType(component), this.entity, this.location));
    }

    getChangeTicksById(componentId: ComponentId): Option<ComponentTicks> {
        return this.world.components.getInfo(componentId)
            .andThen(info =>
                getTicks(this.world, componentId, info.storageType, this.entity, this.location));
    }

    getById(componentId: ComponentId): Option<unknown> {
        return this.world.components.getInfo(componentId)
            .andThen(info =>
                getComponent(this.world, componentId, info.storageType, this.entity, this.location));
    }

    insert<T extends Bundle>(bundle: T): EntityWorld {
        const changeTick = this.world.changeTick;
        const bundleInfo = this.world.bundles.initInfo(bundle, this.world.components, this.world.storages);
        const bundleInserter = bundleInfo.getBundleInserter(
            this.world.entities,
            this.world.archetypes,
            this.world.components,
            this.world.storages,
            this.location.archetypeId,
            changeTick,
        )
        this.location = bundleInserter.insert(this.entity, this.location, bundle);
        return this;
    }

    insertById(id: ComponentId, component: any): EntityWorld {
        const changeTick = this.world.changeTick;

        const bundles = this.world.bundles;
        const components = this.world.components;

        const [bundleInfo, storageType] = bundles.initComponentInfo(components, id);
        const bundlerInserter = bundleInfo.getBundleInserter(
            this.world.entities,
            this.world.archetypes,
            this.world.components,
            this.world.storages,
            this.location.archetypeId,
            changeTick,
        );

        this.location = insertDynamicBundle(
            bundlerInserter,
            this.entity,
            this.location,
            [component],
            [storageType],
        )

        return this;
    }

    insertByIds(ids: ComponentId[], comps: any[]): EntityWorld {
        const changeTick = this.world.changeTick;

        const bundles = this.world.bundles;
        const components = this.world.components;

        const [bundleInfo, storageTypes] = bundles.initDynamicInfo(components, ids);
        const bundlerInserter = bundleInfo.getBundleInserter(
            this.world.entities,
            this.world.archetypes,
            this.world.components,
            this.world.storages,
            this.location.archetypeId,
            changeTick,
        );

        this.location = insertDynamicBundle(
            bundlerInserter,
            this.entity,
            this.location,
            comps,
            storageTypes,
        )

        return this;
    }

    take<T extends Bundle>(bundle: T): Option<T> {
        const archetypes = this.world.archetypes;
        const storages = this.world.storages;
        const components = this.world.components;
        const entities = this.world.entities;
        const removedComponents = this.world.removedComponents;

        const bundleInfo = this.world.bundles.initInfo<T>(bundle, components, storages);
        const oldLocation = this.location;
        const newArchetypeIdOption = removeBundleFromArchetype(
            archetypes,
            storages,
            components,
            oldLocation.archetypeId,
            bundleInfo,
            false,
        );
        if (newArchetypeIdOption.isNone()) {
            return None;
        }
        const newArchetypeId = newArchetypeIdOption.unwrap();
        if (newArchetypeId === oldLocation.archetypeId) {
            return None;
        }
        const bundleComponents = [...bundleInfo.components];
        const entity = this.entity;
        const result = bundle.fromComponents(storages, (storages) => {
            const componentId = bundleComponents.shift()!;
            return takeComponent(
                storages,
                components,
                removedComponents,
                componentId,
                entity,
                oldLocation
            )
        });

        moveEntityFromRemove(
            entity,
            (location) => this.location = location,
            oldLocation.archetypeId,
            oldLocation,
            entities,
            archetypes,
            storages,
            newArchetypeId,
        );

        return Some(result as T);
    }

}


function getComponent(world: World, componentId: ComponentId, storageType: any, entity: Entity, location: EntityLocation): Option<any> {
    if (storageType === "Table") {
        const components = world.fetchTable(location, componentId);
        return components.map(val => val.getData(location.tableRow));
    } else {
        return world.fetchSparseSet(componentId).andThen(val => val.get(entity));
    }
}

function getComponentAndTicks(world: World, componentId: ComponentId, storageType: StorageType, entity: Entity, location: EntityLocation): Option<[any, ComponentTicks]> {
    if (storageType === StorageType.Table) {
        return world.fetchTable(location, componentId).map(val => [val.getData(location.tableRow), new ComponentTicks(val.getAddedTick(location.tableRow), val.getChangedTick(location.tableRow))]);
    } else {
        return world.fetchSparseSet(componentId).andThen(val => val.getWithTicks(entity));
    }
}

function getTicks(world: World, componentId: ComponentId, storageType: StorageType, entity: Entity, location: EntityLocation): Option<ComponentTicks> {
    if (storageType === StorageType.Table) {
        return world.fetchTable(location, componentId).map(val => new ComponentTicks(val.getAddedTick(location.tableRow), val.getChangedTick(location.tableRow)));
    } else {
        return world.fetchSparseSet(componentId).andThen(val => val.getTicks(entity));
    }
}

function insertDynamicBundle(
    bundleInserter: BundleInserter,
    entity: Entity,
    location: EntityLocation,
    components: any[],
    storageTypes: StorageType[],
): EntityLocation {

    class DynamicInsertBundle extends Bundle {
        components: any[];
        storageTypes: StorageType[];

        constructor(components: any[], storageTypes: StorageType[]) {
            super();
            this.components = components;
            this.storageTypes = storageTypes;
        }

        getComponents(func: (storageType: StorageType, component: any) => void) {
            for (let i = 0; i < this.components.length; i++) {
                func(this.storageTypes[i], this.components[i]);
            }
        }

        componentIds(components: Components, storages: Storages, ids: (componentId: ComponentId) => void) {
            for (let i = 0; i < this.components.length; i++) {
                ids(components.getId(typeId(this.components[i])).unwrap());
            }
        }
    }

    const bundle = new DynamicInsertBundle(components, storageTypes);

    return bundleInserter.insert(entity, location, bundle);
}

function removeBundleFromArchetype(
    archetypes: Archetypes,
    storages: Storages,
    components: Components,
    archetypeId: ArchetypeId,
    bundleInfo: BundleInfo,
    intersection: boolean,
): Option<ArchetypeId> {
    const edges = archetypes.get(archetypeId)!.edges;
    const removeBundleResult = intersection ? edges.getRemoveBundle(bundleInfo.id) : edges.getTakeBundle(bundleInfo.id);

    const result = removeBundleResult.orElse(() => {
        let nextTableComponents;
        let nextSparseSetComponents
        let nextTableId;
        {
            const currentArchetype = archetypes.get(archetypeId)!;

            const removedTableComponents: ComponentId[] = [];
            const removedSparseSetComponents: ComponentId[] = [];
            for (const componentId of [...bundleInfo.components]) {
                if (currentArchetype.contains(componentId)) {
                    const componentInfo = components.getInfo(componentId).unwrap();
                    if (componentInfo.storageType === StorageType.Table) {
                        removedTableComponents.push(componentId);
                    } else {
                        removedSparseSetComponents.push(componentId);
                    }
                } else if (!intersection) {
                    currentArchetype.edges.insertTakeBundle(bundleInfo.id, None);
                    return None;
                }
            }

            removedTableComponents.sort();
            removedSparseSetComponents.sort();

            nextTableComponents = currentArchetype.tableComponents;
            nextSparseSetComponents = currentArchetype.sparseSetComponents;
            nextTableComponents = sortedRemove(nextTableComponents, removedTableComponents);
            nextSparseSetComponents = sortedRemove(nextSparseSetComponents, removedSparseSetComponents);

            nextTableId = removedTableComponents.length === 0
                ? currentArchetype.tableId
                : storages.tables.getIdOrInsert(nextTableComponents, components);
        }
        return Some(archetypes.getIdOrInsert(nextTableId, nextTableComponents, nextSparseSetComponents));
    })
    const currentArchetype = archetypes.get(archetypeId)!;
    if (intersection) {
        currentArchetype.edges.insertRemoveBundle(bundleInfo.id, result);
    } else {
        currentArchetype.edges.insertTakeBundle(bundleInfo.id, result);
    }
    return result;
}


function sortedRemove<T>(source: T[], remove: T[]): T[] {
    let removeIndex = 0;
    return source.filter((value) => {
        while (removeIndex < remove.length && value > remove[removeIndex]) {
            removeIndex += 1;
        }
        return removeIndex < remove.length ? value !== remove[removeIndex] : true;
    });
}


function moveEntityFromRemove(
    entity: Entity,
    setSelfLocation: (location: EntityLocation) => void,
    oldArchetypeId: ArchetypeId,
    oldLocation: EntityLocation,
    entities: Entities,
    archetypes: Archetypes,
    storages: Storages,
    newArchetypeId: ArchetypeId,
) {
    const oldArchetype = archetypes.get(oldArchetypeId);
    const removeResult = oldArchetype.swapRemove(oldLocation.archetypeRow);
    removeResult.swappedEntity.match({
        some: (swappedEntity) => {
            const swappedLocation = entities.get(swappedEntity).unwrap();
            entities.set(
                swappedEntity.index,
                new EntityLocation(
                    swappedLocation.archetypeId,
                    swappedLocation.archetypeRow,
                    swappedLocation.tableId,
                    swappedLocation.tableRow,
                )
            )
        }
    })
    const oldTableRow = removeResult.tableRow;
    const oldTableId = oldArchetype.tableId;
    const newArchetype = archetypes.get(newArchetypeId);

    let newLocation;
    if (oldTableId === newArchetype.tableId) {
        newLocation = newArchetype.allocate(entity, oldTableRow);
    } else {
        const oldTable = storages.tables.get(oldTableId);
        const newTable = storages.tables.get(newArchetype.tableId);

        const moveResult = oldTable.moveToAndForgetMissing(oldTableRow, newTable);

        newLocation = newArchetype.allocate(entity, moveResult.newRow);

        if (moveResult.swappedEntity) {
            const swappedLocation = entities.get(moveResult.swappedEntity).unwrap();
            entities.set(
                moveResult.swappedEntity.index,
                new EntityLocation(
                    swappedLocation.archetypeId,
                    swappedLocation.archetypeRow,
                    swappedLocation.tableId,
                    oldLocation.tableRow,
                )
            );
            archetypes.get(swappedLocation.archetypeId).setEntityTableRow(swappedLocation.archetypeRow, oldTableRow);
        }
    }

    setSelfLocation(newLocation);
    entities.set(entity.index, newLocation);
}

function takeComponent(
    storages: Storages,
    components: Components,
    removedComponents: RemovedComponentEvents,
    componentId: ComponentId,
    entity: Entity,
    location: EntityLocation,
) {
    const componentInfo = components.getInfoUnchecked(componentId);
    removedComponents.send(componentId, entity);
    if (componentInfo.storageType === StorageType.Table) {
        const table = storages.tables.get(location.tableId);
        const components = table.getColumn(componentId).unwrap();
        return components.getData(location.tableRow);
    } else {
        return storages.sparseSets.get(componentId).unwrap().removeAndForget(entity).unwrap();
    }
}
