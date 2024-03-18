import {Archetype} from "./archetype";
import {SpawnBundleStatus} from "./archetype_inner";
import {Bundle, BundleInfo} from "./bundle";
import {Tick} from "./change_detection";
import {Entities, Entity, EntityLocation} from "./entity";
import {SparseSets, Table} from "./storage";

export class BundleInserter {

    archetype: Archetype;
    entities: Entities;
    bundleInfo: BundleInfo;
    table: Table;
    sparseSets: SparseSets;
    result: InsertBundleResult;
    archetypes: Archetype[];
    changeTick: Tick;

    constructor(archetype: Archetype, entities: Entities, bundleInfo: BundleInfo, table: Table, sparseSets: SparseSets, result: InsertBundleResult, archetypes: Archetype[], changeTick: Tick) {
        this.archetype = archetype;
        this.entities = entities;
        this.bundleInfo = bundleInfo;
        this.table = table;
        this.sparseSets = sparseSets;
        this.result = result;
        this.archetypes = archetypes;
        this.changeTick = changeTick;
    }

    insert(entity: Entity, location: EntityLocation, bundle: Bundle): EntityLocation {
        switch (this.result.type) {
            case InsertBundleResultType.SameArchetype:
                return this.sameArchetype(entity, location, bundle);
            case InsertBundleResultType.NewArchetypeSameTable:
                return this.newArchetypeSameTable(location, entity, bundle);
            case InsertBundleResultType.NewArchetypeNewTable:
                return this.newArchetypeNewTable(entity, location, bundle);
        }
    }

    private newArchetypeSameTable(location: EntityLocation, entity: Entity, bundle: Bundle) {
        const result = this.archetype.swapRemove(location.archetypeRow);
        result.swappedEntity.match({
            some: swappedEntity => {
                const swappedLocation = this.entities.get(swappedEntity).unwrap();
                this.entities.set(
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
        const newLocation = this.result.newArchetype!.allocate(entity, result.tableRow);
        this.entities.set(entity.index, newLocation);
        const addBundle = this.result.newArchetype!.edges.getAddBundleInternal(this.bundleInfo.id).unwrap();
        this.bundleInfo.writeComponents(
            this.table,
            this.sparseSets,
            addBundle,
            entity,
            result.tableRow,
            this.changeTick,
            bundle
        )
        return newLocation;
    }

    private sameArchetype(entity: Entity, location: EntityLocation, bundle: Bundle) {
        const addBundle = this.archetype.edges.getAddBundleInternal(this.bundleInfo.id).unwrap();
        this.bundleInfo.writeComponents(
            this.table,
            this.sparseSets,
            addBundle,
            entity,
            location.tableRow,
            this.changeTick,
            bundle
        )
        return location;
    }

    private newArchetypeNewTable(entity: Entity, location: EntityLocation, bundle: Bundle) {
        const result = this.archetype.swapRemove(location.archetypeRow);
        result.swappedEntity.match({
            some: swappedEntity => {
                const swappedLocation = this.entities.get(swappedEntity).unwrap();
                this.entities.set(
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
        const moveResult = this.table.moveToSuperset(result.tableRow, this.result.newTable!);
        const newLocation = this.result.newArchetype!.allocate(entity, moveResult.newRow);
        this.entities.set(entity.index, newLocation);

        const swapEntity = moveResult.swappedEntity;
        if (swapEntity) {
            const swappedLocation = this.entities.get(swapEntity).unwrap();

            const swappedArchetypeFn = (): Archetype => {
                if (this.archetype.id === swappedLocation.archetypeId) {
                    return this.archetype;
                } else if (this.result.newArchetype!.id === swappedLocation.archetypeId) {
                    return this.result.newArchetype!;
                } else {
                    return this.archetypes[swappedLocation.archetypeId];
                }
            }
            const swappedArchetype = swappedArchetypeFn();
            this.entities.set(
                swapEntity.index,
                new EntityLocation(
                    swappedLocation.archetypeId,
                    swappedLocation.archetypeRow,
                    swappedLocation.tableId,
                    swappedLocation.tableRow,
                )
            )
            swappedArchetype.setEntityTableRow(swappedLocation.archetypeRow, result.tableRow);
        }
        const addBundle = this.result.newArchetype!.edges.getAddBundleInternal(this.bundleInfo.id).unwrap();
        this.bundleInfo.writeComponents(
            this.table,
            this.sparseSets,
            addBundle,
            entity,
            result.tableRow,
            this.changeTick,
            bundle
        )
        return newLocation;
    }
}

export enum InsertBundleResultType {
    SameArchetype,
    NewArchetypeSameTable,
    NewArchetypeNewTable
}

export class InsertBundleResult {
    type: InsertBundleResultType;
    newArchetype?: Archetype;
    newTable?: Table;

    constructor(type: InsertBundleResultType, newArchetype?: Archetype, newTable?: Table) {
        this.type = type;
        this.newArchetype = newArchetype;
        this.newTable = newTable;
    }

    static sameArchetype() {
        return new InsertBundleResult(InsertBundleResultType.SameArchetype);
    }

    static newArchetypeSameTable(newArchetype: Archetype) {
        return new InsertBundleResult(InsertBundleResultType.NewArchetypeSameTable, newArchetype);
    }

    static newArchetypeNewTable(newArchetype: Archetype, newTable: Table) {
        return new InsertBundleResult(InsertBundleResultType.NewArchetypeNewTable, newArchetype, newTable);
    }
}

export class BundleSpawner {

    archetype: Archetype;
    entities: Entities;
    bundleInfo: BundleInfo;
    table: Table;
    sparseSets: SparseSets;
    changeTick: Tick;

    constructor(archetype: Archetype, entities: Entities, bundleInfo: BundleInfo, table: Table, sparseSets: SparseSets, changeTick: Tick) {
        this.archetype = archetype;
        this.entities = entities;
        this.bundleInfo = bundleInfo;
        this.table = table;
        this.sparseSets = sparseSets;
        this.changeTick = changeTick;
    }

    spawn(bundle: Bundle): Entity {
        const entity = this.entities.alloc();
        this.spawnNonExistent(entity, bundle);
        return entity;
    }

    spawnNonExistent(entity: Entity, bundle: Bundle): EntityLocation {
        const tableRow = this.table.allocate(entity);
        const location = this.archetype.allocate(entity, tableRow);
        this.bundleInfo.writeComponents(
            this.table,
            this.sparseSets,
            new SpawnBundleStatus(),
            entity,
            tableRow,
            this.changeTick,
            bundle
        )
        return location;
    }
}
