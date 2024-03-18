import {EMPTY_VALUE, None, Option, Some} from "@minigame/utils";
import {AddBundle, ArchetypeSwapRemoveResult, ComponentStatus} from "./archetype_inner";
import {BundleId} from "./bundle";
import {ComponentId, StorageType} from "./component";
import {Entity, EntityLocation} from "./entity";
import {SparseSet, TableId, TableRow} from "./storage";
import {ImmutableSparseSet} from "./storage/sparse_set_inner";

export type ArchetypeRow = number;

export type ArchetypeId = number;

export class Edges {
    addBundle: AddBundle[] = [];
    removeBundle: Option<ArchetypeId>[] = []
    takeBundle: Option<ArchetypeId>[] = []

    getAddBundle(bundleId: BundleId): Option<ArchetypeId> {
        return this.getAddBundleInternal(bundleId).map(addBundle => addBundle.archetypeId);
    }

    getAddBundleInternal(bundleId: BundleId): Option<AddBundle> {
        return Some(this.addBundle[bundleId]);
    }

    insertAddBundle(bundleId: BundleId, archetypeId: ArchetypeId, bundleStatus: ComponentStatus[]) {
        this.addBundle[bundleId] = new AddBundle(archetypeId, bundleStatus);
    }

    getRemoveBundle(bundleId: BundleId): Option<ArchetypeId> {
        return this.removeBundle[bundleId];
    }

    insertRemoveBundle(bundleId: BundleId, archetypeId: Option<ArchetypeId>) {
        this.removeBundle[bundleId] = archetypeId;
    }

    getTakeBundle(bundleId: BundleId): Option<ArchetypeId> {
        return this.takeBundle[bundleId];
    }

    insertTakeBundle(bundleId: BundleId, archetypeId: Option<ArchetypeId>) {
        this.takeBundle[bundleId] = archetypeId;
    }

}

export class ArchetypeEntity {
    entity: Entity;
    tableRow: TableRow;

    constructor(entity: Entity, tableRow: TableRow) {
        this.entity = entity;
        this.tableRow = tableRow;
    }

    get id() {
        return this.entity;
    }

}

export type ArchetypeComponentId = number;

class ArchetypeComponentInfo {
    storageType: StorageType;
    archetypeComponentId: ArchetypeComponentId;

    constructor(storageType: StorageType, archetypeComponentId: ArchetypeComponentId) {
        this.storageType = storageType;
        this.archetypeComponentId = archetypeComponentId;
    }
}

export class Archetype {
    id: ArchetypeId;
    tableId: TableId;
    edges: Edges;
    entities: ArchetypeEntity[];
    _components: ImmutableSparseSet<ComponentId, ArchetypeComponentInfo>;

    constructor(id: ArchetypeId, tableId: TableId, tableComponents: [ComponentId, ArchetypeComponentId][], sparseSetComponents: [ComponentId, ArchetypeComponentId][]) {
        this.id = id;
        this.tableId = tableId;
        this.edges = new Edges();
        this.entities = [];
        const minTable = tableComponents.length;
        const minSparse = sparseSetComponents.length;
        const components = new SparseSet<ComponentId, ArchetypeComponentInfo>();
        for (const [componentId, archetypeComponentId] of tableComponents) {
            components.insert(componentId, new ArchetypeComponentInfo(StorageType.Table, archetypeComponentId));
        }
        for (const [componentId, archetypeComponentId] of sparseSetComponents) {
            components.insert(componentId, new ArchetypeComponentInfo(StorageType.SparseSet, archetypeComponentId));
        }
        this._components = components.toImmutable();
    }

    get tableComponents() {
        return this._components.iter().filter(([, info]) => info.storageType === StorageType.Table).map(([id]) => id);
    }

    get sparseSetComponents() {
        return this._components.iter().filter(([, info]) => info.storageType === StorageType.SparseSet).map(([id]) => id);
    }

    get components() {
        return this._components.indices();
    }

    entityTableRow(index: ArchetypeRow) {
        return this.entities[index];
    }

    setEntityTableRow(row: ArchetypeRow, tableRow: TableRow) {
        this.entities[row].tableRow = tableRow;
    }

    allocate(entity: Entity, tableRow: TableRow) {
        const archetypeRow = this.entities.length;
        this.entities.push(new ArchetypeEntity(entity, tableRow));
        return new EntityLocation(this.id, archetypeRow, this.tableId, tableRow);
    }

    swapRemove(row: ArchetypeRow) {
        const isLast = row === this.entities.length - 1;
        const entity = this.entities.splice(row, 1)[0];
        return new ArchetypeSwapRemoveResult(isLast ? None : Some(this.entities[row].entity), entity.tableRow);
    }

    len() {
        return this.entities.length;
    }

    isEmpty() {
        return this.entities.length === 0;
    }

    contains(componentId: ComponentId) {
        return this._components.contains(componentId);
    }

    getStorageType(componentId: ComponentId): Option<StorageType> {
        return this._components.get(componentId).map(info => info.storageType);
    }

    getArchetypeComponentId(componentId: ComponentId): Option<ArchetypeComponentId> {
        return this._components.get(componentId).map(info => info.archetypeComponentId);
    }

    clearEntities() {
        this.entities = [];
    }

}

export class ArchetypeGeneration {
    id: ArchetypeId;

    constructor(id: ArchetypeId) {
        this.id = id;
    }

    static initial() {
        return new ArchetypeGeneration(EMPTY_VALUE);
    }
}

class ArchetypeComponents {
    tableComponents: ComponentId[];
    sparseSetComponents: ComponentId[];

    constructor(tableComponents: ComponentId[], sparseSetComponents: ComponentId[]) {
        this.tableComponents = tableComponents;
        this.sparseSetComponents = sparseSetComponents;
    }
}

export class Archetypes {
    archetypes: Archetype[];
    archetypeComponentCount: number;
    byComponents: Map<ArchetypeComponents, ArchetypeId>;

    constructor() {
        this.archetypes = [];
        this.archetypeComponentCount = 0;
        this.byComponents = new Map();
        this.getIdOrInsert(EMPTY_VALUE, [], []);
    }

    generation(): ArchetypeGeneration {
        const id = this.archetypes.length;
        return new ArchetypeGeneration(id);
    }

    len() {
        return this.archetypes.length;
    }

    empty() {
        return this.archetypes[EMPTY_VALUE]
    }

    newArchetypeComponentId() {
        const id = this.archetypeComponentCount;
        this.archetypeComponentCount += 1;
        return id;
    }

    get(id: ArchetypeId): Archetype {
        return this.archetypes[id];
    }

    get2(a: ArchetypeId, b: ArchetypeId) {
        return [this.archetypes[a], this.archetypes[b]];
    }

    iter() {
        return this.archetypes;
    }

    getIdOrInsert(tableId: TableId, tableComponents: ComponentId[], sparseSetComponents: ComponentId[]): ArchetypeId {
        const archetypeIdentity = new ArchetypeComponents(tableComponents, sparseSetComponents);
        const archetypes = this.archetypes;
        const id = this.byComponents.get(archetypeIdentity);
        if (id !== undefined) {
            return id;
        }
        const newId = archetypes.length;
        const tableStart = this.archetypeComponentCount;
        this.archetypeComponentCount += tableComponents.length;
        const tableArchetypeComponents: [ComponentId, ArchetypeComponentId][] = tableComponents.map((componentId, i) => [componentId, tableStart + i]);
        const sparseStart = this.archetypeComponentCount;
        this.archetypeComponentCount += sparseSetComponents.length;
        const sparseSetArchetypeComponents: [ComponentId, ArchetypeComponentId][] = sparseSetComponents.map((componentId, i) => [componentId, sparseStart + i]);
        archetypes.push(new Archetype(newId, tableId, tableArchetypeComponents, sparseSetArchetypeComponents));
        this.byComponents.set(archetypeIdentity, newId);
        return newId;
    }

    archetypeComponentsLen() {
        return this.archetypeComponentCount;
    }

    clearEntities() {
        this.archetypes.forEach(archetype => archetype.clearEntities());
    }

}
