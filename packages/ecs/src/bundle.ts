import {EMPTY_VALUE} from "@minigame/utils";
import {ArchetypeId, Archetypes} from "./archetype";
import {BundleComponentStatus, ComponentStatus} from "./archetype_inner";
import {BundleInserter, BundleSpawner, InsertBundleResult} from "./bundle_inner";
import {Tick} from "./change_detection";
import {ComponentId, Components, isComponent, StorageType} from "./component";
import {Entities, Entity} from "./entity";
import {Creator, DefineOptions, inherit, inheritFunction, isInstance, typeId, TypeId} from "./inherit";
import {MetaInfo} from "./meta";
import {SparseSets, Storages, Table, TableId, TableRow} from "./storage";

export type BundleId = number;

export const isBundle = (target: any) => {
    return isInstance(target, Bundle);
}

export interface IBundle {
    componentIds(components: Components, storages: Storages, ids: (componentId: ComponentId) => void): void;

    fromComponents<T>(ctx: T, func: (t: T) => IBundle): IBundle;

    getComponents(func: (storageType: StorageType, component: any) => any): void;

}

export class Bundle extends MetaInfo implements IBundle {

    constructor() {
        super(Bundle);
    }

    fromComponents<T>(ctx: T, func: (t: T) => IBundle): IBundle {
        return func(ctx);
    }

    getComponents(func: (storageType: StorageType, component: any) => any) {
        Object.values(this).filter((c: any) => isComponent(c)).forEach((c: any) => {
            c.getComponents(func);
        })
    }

    componentIds(components: Components, storages: Storages, ids: (componentId: ComponentId) => void) {
        Object.values(this).filter((c: any) => isComponent(c)).forEach((c: any) => {
            c.componentIds(components, storages, ids);
        })
    }
}

export const bundle = function (target: any): typeof target {
    return inherit(target, Bundle);
}

export function defineBundle<B>(
    options: DefineOptions<B>
): Creator<B> {
    return inheritFunction(options, Bundle);
}

export class Bundles {
    bundleInfos: BundleInfo[] = [];
    bundleIds: Map<TypeId, BundleId> = new Map();
    dynamicBundleIds: Map<ComponentId[], [BundleId, StorageType[]]> = new Map();
    dynamicComponentBundleIds: Map<ComponentId, [BundleId, StorageType]> = new Map();

    get(bundleId: BundleId): BundleInfo | undefined {
        return this.bundleInfos[bundleId];
    }

    getId(typeId: TypeId): BundleId | undefined {
        return this.bundleIds.get(typeId);
    }

    initInfo(bundle: Bundle, components: Components, storages: Storages): BundleInfo {
        const bundleInfos = this.bundleInfos;
        let id = this.bundleIds.get(typeId(bundle));
        if (id === undefined) {
            const componentIds: ComponentId[] = [];
            bundle.componentIds(components, storages, (componentId: ComponentId) => {
                componentIds.push(componentId)
            });
            id = bundleInfos.length;
            const bundleInfo = new BundleInfo(bundle.constructor.name, components, componentIds, id);
            bundleInfos.push(bundleInfo);
        }
        return this.bundleInfos[id];
    }

    initDynamicInfo(components: Components, componentIds: ComponentId[]): [BundleInfo, StorageType[]] {
        const bundleInfos = this.bundleInfos;
        let dynamicBundle = this.dynamicBundleIds.get(componentIds);
        if (dynamicBundle === undefined) {
            dynamicBundle = initDynamicBundle(bundleInfos, components, componentIds);
            this.dynamicBundleIds.set([...componentIds], dynamicBundle);
        }
        const bundleInfo = bundleInfos[dynamicBundle[0]];
        return [bundleInfo, dynamicBundle[1]];
    }

    initComponentInfo(components: Components, componentId: ComponentId): [BundleInfo, StorageType] {
        const bundleInfos = this.bundleInfos;
        let dynamicComponentBundle = this.dynamicComponentBundleIds.get(componentId);
        if (dynamicComponentBundle === undefined) {
            const [id, storageTypes] = initDynamicBundle(bundleInfos, components, [componentId]);
            dynamicComponentBundle = [id, storageTypes[0]];
            this.dynamicComponentBundleIds.set(componentId, dynamicComponentBundle);
        }
        const bundleInfo = bundleInfos[dynamicComponentBundle[0]];
        return [bundleInfo, dynamicComponentBundle[1]];
    }

}

const initDynamicBundle = (bundleInfos: BundleInfo[], components: Components, componentIds: ComponentId[]): [BundleId, StorageType[]] => {
    const storageTypes = componentIds.map((id) => {
        const info = components.getInfo(id);
        if (info === undefined) {
            throw new Error(`initDynamicInfo called with component id ${id} which doesn't exist in this world`);
        }
        return info.storageType;
    });
    const id = bundleInfos.length;
    const bundleInfo = new BundleInfo("<dynamic bundle>", components, componentIds, id);
    bundleInfos.push(bundleInfo);
    return [id, storageTypes];
}

export class BundleInfo {
    id: BundleId;
    componentIds: ComponentId[];

    constructor(bundleTypeName: string, components: Components, componentIds: ComponentId[], id: BundleId) {
        let deduped = [...componentIds];
        deduped = [...new Set(deduped)].sort();

        if (deduped.length !== componentIds.length) {
            const seen = new Set();
            const dups = [];
            for (let id of componentIds) {
                if (seen.has(id)) {
                    dups.push(id);
                } else {
                    seen.add(id);
                }
            }
            const names = dups.map(id => components.getInfo(id).name).join(", ");
            throw new Error(`Bundle ${bundleTypeName} has duplicate components: ${names}`);
        }

        this.id = id;
        this.componentIds = componentIds;
    }

    get components() {
        return this.componentIds;
    }

    getBundleInserter(entities: Entities,
                      archetypes: Archetypes,
                      components: Components,
                      storages: Storages,
                      archetypeId: ArchetypeId,
                      changeTick: Tick) {
        const newArchetypeId = this.addBundleToArchetype(archetypes, storages, components, archetypeId);
        const archetypesPtr = archetypes.archetypes;
        if (newArchetypeId === archetypeId) {
            const archetype = archetypes.get(archetypeId);
            const tableId = archetype.tableId;
            return new BundleInserter(archetype, entities, this, storages.tables.get(tableId), storages.sparseSets, InsertBundleResult.sameArchetype(), archetypesPtr, changeTick)
        }

    }

    getBundleSpawner(entities: Entities,
                     archetypes: Archetypes,
                     components: Components,
                     storages: Storages,
                     changeTick: Tick) {
        const newArchetypeId = this.addBundleToArchetype(archetypes, storages, components, EMPTY_VALUE);
        const archetype = archetypes.get(newArchetypeId);
        const table = storages.tables.get(archetype.tableId);
        return new BundleSpawner(archetype, entities, this, table, storages.sparseSets, changeTick)
    }

    writeComponents(table: Table,
                    sparseSets: SparseSets,
                    bundleComponentStatus: BundleComponentStatus,
                    entity: Entity,
                    tableRow: TableRow,
                    changeTick: Tick,
                    bundle: Bundle
    ) {
        let bundleComponent = 0;
        bundle.getComponents((storageType: StorageType, component: any) => {
            const componentId = this.componentIds[bundleComponent];
            switch (storageType) {
                case StorageType.Table:
                    const column = table.getColumn(componentId)!;
                    const status = bundleComponentStatus.getStatus(bundleComponent);
                    switch (status) {
                        case ComponentStatus.Added:
                            column.initialize(tableRow, component, changeTick);
                            break;
                        case ComponentStatus.Mutated:
                            column.replace(tableRow, component, changeTick);
                            break;
                    }
                    break;
                case StorageType.SparseSet:
                    const sparseSet = sparseSets.get(componentId)!;
                    sparseSet.insert(entity, component, changeTick);
                    break;
            }
            bundleComponent += 1;
        })
    }

    addBundleToArchetype(archetypes: Archetypes, storages: Storages, components: Components, archetypeId: ArchetypeId) {
        const addBundleId = archetypes.get(archetypeId).edges.getAddBundle(this.id);
        if (addBundleId !== undefined) {
            return addBundleId;
        }
        const newTableComponents: ComponentId[] = [];
        const newSparseSetComponents: ComponentId[] = [];
        const bundleStatus: ComponentStatus[] = [];
        const currentArchetype = archetypes.get(archetypeId);
        for (let componentId of this.componentIds) {
            if (currentArchetype.contains(componentId)) {
                bundleStatus.push(ComponentStatus.Mutated);
            } else {
                bundleStatus.push(ComponentStatus.Added);
                const componentInfo = components.getInfo(componentId);
                switch (componentInfo.storageType) {
                    case StorageType.Table:
                        newTableComponents.push(componentId);
                        break;
                    case StorageType.SparseSet:
                        newSparseSetComponents.push(componentId);
                        break;
                }
            }
        }
        if (newTableComponents.length === 0 && newSparseSetComponents.length === 0) {
            const edges = currentArchetype.edges;
            edges.insertAddBundle(this.id, archetypeId, bundleStatus);
            return archetypeId;
        }
        let tableId: TableId = 0;
        let tableComponents: ComponentId[];
        let sparseSetComponents: ComponentId[];
        {
            const currentArchetype = archetypes.get(archetypeId);
            const tableComponentsFn = (): ComponentId[] => {
                if (newTableComponents.length === 0) {
                    tableId = currentArchetype.tableId;
                    return currentArchetype.tableComponents;
                } else {
                    newTableComponents.push(...currentArchetype.tableComponents);
                    newTableComponents.sort();
                    tableId = storages.tables.getIdOrInsert(newTableComponents, components);
                    return newTableComponents;
                }
            }
            tableComponents = tableComponentsFn();

            const sparseSetComponentsFn = (): ComponentId[] => {
                if (newSparseSetComponents.length === 0) {
                    return currentArchetype.sparseSetComponents;
                } else {
                    newSparseSetComponents.push(...currentArchetype.sparseSetComponents);
                    newSparseSetComponents.sort();
                    return newSparseSetComponents;
                }
            }
            sparseSetComponents = sparseSetComponentsFn();
        }
        const newArchetypeId = archetypes.getIdOrInsert(tableId, tableComponents, sparseSetComponents);
        archetypes.get(newArchetypeId).edges.insertAddBundle(this.id, newArchetypeId, bundleStatus);
        return newArchetypeId;
    }
}
