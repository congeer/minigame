import {EMPTY_VALUE, Option} from "@minigame/utils";
import {ArchetypeId} from "./archetype";
import {Entity} from "./entity";
import {TableRow} from "./storage";

export enum ComponentStatus {
    Added,
    Mutated
}

export interface BundleComponentStatus {
    getStatus(index: number): ComponentStatus
}

export class AddBundle implements BundleComponentStatus {
    archetypeId: ArchetypeId = EMPTY_VALUE;
    bundleStatus: ComponentStatus[] = [];

    constructor(archetypeId: ArchetypeId, bundleStatus: ComponentStatus[]) {
        this.archetypeId = archetypeId;
        this.bundleStatus = bundleStatus;
    }

    getStatus(index: number): ComponentStatus {
        return this.bundleStatus[index];
    }
}

export class SpawnBundleStatus implements BundleComponentStatus {
    getStatus(_: number): ComponentStatus {
        return ComponentStatus.Added;
    }
}

export class ArchetypeSwapRemoveResult {

    swappedEntity: Option<Entity>;
    tableRow: TableRow;

    constructor(swappedEntity: Option<Entity>, tableRow: TableRow) {
        this.swappedEntity = swappedEntity;
        this.tableRow = tableRow;
    }
}
