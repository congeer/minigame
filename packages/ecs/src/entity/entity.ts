import {INVALID_VALUE} from "@minigame/utils";
import {deepCopy} from "@minigame/utils";
import {ArchetypeId, ArchetypeRow} from "../archetype";
import {MetaInfo} from "../meta";
import {EntityIndex, TableId, TableRow} from "../storage";
import {AllocAtWithoutReplacement} from "./entity_inner";

export class Entity extends MetaInfo {

    static PLACEHOLDER = Number.MAX_SAFE_INTEGER;

    index: number = 0;
    generation: number = 0;

    constructor() {
        super(Entity);
    }

    static fromRawAndGeneration(index: number, generation: number) {
        const entity = new Entity();
        entity.index = index;
        entity.generation = generation;
        return entity;
    }

    static fromRaw(index: number) {
        return Entity.fromRawAndGeneration(index, 1);
    }

    toBits() {
        return this.generation.toString() + "/" + this.index.toString();
    }

    static fromBits(bits: string) {
        const [generation, index] = bits.split("/");
        return Entity.fromRawAndGeneration(parseInt(index), parseInt(generation));
    }

    static tryFromBits(bits: string) {
        try {
            const [index, generation] = bits.split("/");
            return Entity.fromRawAndGeneration(parseInt(index), parseInt(generation));
        } catch (e) {
            return undefined;
        }
    }

}

export class EntityLocation {
    static INVALID = new EntityLocation(INVALID_VALUE, INVALID_VALUE, INVALID_VALUE, INVALID_VALUE);
    archetypeId: ArchetypeId;
    archetypeRow: ArchetypeRow;
    tableId: TableId;
    tableRow: TableRow;

    constructor(archetypeId: ArchetypeId, archetypeRow: ArchetypeRow, tableId: TableId, tableRow: TableRow) {
        this.archetypeId = archetypeId;
        this.archetypeRow = archetypeRow;
        this.tableId = tableId;
        this.tableRow = tableRow;
    }
}

export class ReserveEntitiesIterator {
    meta: EntityMeta[] = [];
    indexIter: number[] = [];
    indexRange: number[] = [];

    next() {
        const next = this.indexIter[Symbol.iterator]().next();
        if (next) {
            return Entity.fromRawAndGeneration(next.value, this.meta[next.value].generation);
        } else {
            return Entity.fromRaw(this.indexRange[Symbol.iterator]().next().value);
        }
    }

}

export class Entities {
    meta: EntityMeta[] = [];
    pending: number[] = [];
    freeCursor: number = 0;
    length: number = 0;

    reserveEntities(count: number) {

    }

    reserveEntity() {
        const n = this.freeCursor--;
        if (n > 0) {
            const index = this.pending[n - 1];
            return Entity.fromRawAndGeneration(index, this.meta[index].generation);
        } else {
            return Entity.fromRaw(this.meta.length - n);
        }
    }

    verifyFlushed() {

    }

    alloc(): Entity {
        this.verifyFlushed();
        this.length += 1;
        const index = this.pending.pop();
        if (index !== undefined) {
            this.freeCursor = this.pending.length;
            return Entity.fromRawAndGeneration(index, this.meta[index].generation);
        } else {
            const index = this.meta.length;
            this.meta.push(deepCopy(EntityMeta.EMPTY));
            return Entity.fromRaw(index);
        }
    }

    allocAt(entity: Entity): EntityLocation | undefined {
        this.verifyFlushed();
        const locFn = () => {
            if (entity.index > this.meta.length) {
                this.pending.push(...Array.from({length: entity.index - this.meta.length}, (_, i) => i + this.meta.length));
                this.freeCursor = this.pending.length;
                this.meta.push(...Array.from({length: entity.index - this.meta.length}, () => EntityMeta.EMPTY));
                this.length += 1;
                return undefined;
            } else if (this.pending.includes(entity.index)) {
                const index = this.pending.indexOf(entity.index);
                this.pending.splice(index, 1);
                this.freeCursor = this.pending.length;
                this.length += 1;
                return undefined;
            } else {
                return this.meta[entity.index].location;
            }
        }
        const loc = locFn();
        this.meta[entity.index].generation = entity.generation;
        return loc;
    }

    allocAtWithoutReplacement(entity: Entity) {
        this.verifyFlushed();
        const resultFn = () => {
            if (entity.index > this.meta.length) {
                this.pending.push(...Array.from({length: entity.index - this.meta.length}, (_, i) => i + this.meta.length));
                this.freeCursor = this.pending.length;
                this.meta.push(...Array.from({length: entity.index - this.meta.length}, () => EntityMeta.EMPTY));
                this.length += 1;
                return AllocAtWithoutReplacement.didNotExist();
            } else if (this.pending.includes(entity.index)) {
                const index = this.pending.indexOf(entity.index);
                this.pending.splice(index, 1);
                this.freeCursor = this.pending.length;
                this.length += 1;
                return AllocAtWithoutReplacement.didNotExist();
            } else {
                const currentMeta = this.meta[entity.index];
                if (currentMeta.location.archetypeId === INVALID_VALUE) {
                    return AllocAtWithoutReplacement.didNotExist();
                } else if (currentMeta.generation === entity.generation) {
                    return AllocAtWithoutReplacement.exists(currentMeta.location);
                } else {
                    return AllocAtWithoutReplacement.existsWithWrongGeneration();
                }
            }
        }
        const result = resultFn();
        this.meta[entity.index].generation = entity.generation;
        return result;
    }

    free(entity: Entity) {
        this.verifyFlushed();
        const meta = this.meta[entity.index];
        if (meta.generation !== entity.generation) {
            return;
        }
        meta.generation += 1;
        if (meta.generation === 1) {
            console.warn("Entity(" + entity.index + ") generation wrapped on Entities::free, aliasing may occur");
        }
        const loc = meta.location;
        meta.location = EntityMeta.EMPTY.location;
        this.pending.push(entity.index);
        this.freeCursor = this.pending.length;
        this.length -= 1;
        return loc;
    }

    reserve(additional: number) {
        this.verifyFlushed();
        const freelistSize = this.freeCursor;
        const shortfall = additional - freelistSize;
        if (shortfall > 0) {
            this.meta.push(...Array.from({length: shortfall}, () => EntityMeta.EMPTY));
        }
    }

    contains(entity: Entity) {
        return this.resolveFromId(entity.index)?.generation === entity.generation;
    }

    clear() {
        this.meta = [];
        this.pending = [];
        this.freeCursor = 0;
        this.length = 0;
    }

    get(entity: Entity) {
        const meta = this.meta[entity.index];
        if (!meta || meta.generation !== entity.generation || meta.location.archetypeId === INVALID_VALUE) {
            return undefined;
        }
        return meta.location;
    }


    len() {
        return this.length;
    }

    set(index: EntityIndex, entityLocation: EntityLocation) {
        this.meta[index].location = entityLocation;
    }

    reserveGenerations(index: number, generations: number) {
        if (index >= this.meta.length) {
            return false;
        }
        const meta = this.meta[index];
        if (meta.location.archetypeId === INVALID_VALUE) {
            meta.generation = meta.generation + generations;
            return true;
        } else {
            return false;
        }
    }

    resolveFromId(index: number) {
        const entityMeta = this.meta[index];
        if (entityMeta) {
            return Entity.fromRawAndGeneration(index, entityMeta.generation);
        } else {
            const freeCursor = this.freeCursor;
            const numPending = -freeCursor;
            if (index < this.meta.length + numPending) {
                return Entity.fromRaw(index);
            } else {
                return undefined;
            }
        }
    }

    needsFlush() {
        return this.freeCursor !== this.pending.length;
    }

    flush(init: (entity: Entity, location: EntityLocation, setLocation: (location: EntityLocation) => void) => void) {
        const currentFreeCursor = this.freeCursor;
        const newFreeCursor = currentFreeCursor >= 0 ? currentFreeCursor : (() => {
            const oldMetaLen = this.meta.length;
            const newMetaLen = oldMetaLen + -currentFreeCursor;
            this.meta.push(...Array.from({length: newMetaLen - oldMetaLen}, () => EntityMeta.EMPTY));
            this.length += -currentFreeCursor;
            for (let i = oldMetaLen; i < newMetaLen; i++) {
                const meta = this.meta[i];
                init(Entity.fromRawAndGeneration(i, meta.generation), meta.location, location => {
                    meta.location = location
                });
            }
            this.freeCursor = 0;
            return 0;
        })();
        this.length += this.pending.length - newFreeCursor;
        this.pending.splice(newFreeCursor).forEach(index => {
            const meta = this.meta[index];
            init(Entity.fromRawAndGeneration(index, meta.generation), meta.location, location => {
                meta.location = location
            });
        });

    }

    flushAsInvalid() {
        this.flush((entity, location) => {
            location.archetypeId = INVALID_VALUE;
        });
    }

    flushAndReserveInvalidAssumingNoEntities(count: number) {
        this.freeCursor = 0;
        this.meta = Array.from({length: count}, () => EntityMeta.EMPTY);
        this.length = count;
    }

    totalCount() {
        return this.meta.length;
    }

    isEmpty() {
        return this.length === 0;
    }

}

export class EntityMeta {
    static EMPTY = new EntityMeta(EntityLocation.INVALID, 1);
    location: EntityLocation;
    generation: number;

    constructor(location: EntityLocation, generation: number) {
        this.location = location;
        this.generation = generation;
    }
}
