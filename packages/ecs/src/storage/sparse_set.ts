import {None, Option, Some} from "@minigame/utils";
import {Tick} from "../change_detection";
import {ComponentId, ComponentInfo, ComponentTicks} from "../component";
import {Entity} from "../entity";
import {ImmutableSparseSet} from "./sparse_set_inner";
import {Column, TableRow} from "./table";

export type EntityIndex = number;

export class ComponentSparseSet {
    dense: Column;
    entities: Entity[];
    sparse: Map<EntityIndex, TableRow>;

    constructor(componentInfo: ComponentInfo) {
        this.dense = Column.new(componentInfo);
        this.entities = [];
        this.sparse = new Map();
    }

    clear() {
        this.dense.clear();
        this.entities = [];
        this.sparse.clear();
    }

    len(): number {
        return this.dense.len();
    }

    isEmpty(): boolean {
        return this.dense.len() === 0;
    }

    insert(entity: Entity, value: any, changeTick: Tick) {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex !== undefined) {
            this.dense.replace(denseIndex, value, changeTick);
            return;
        }
        const denseLength = this.dense.len();
        this.dense.push(value, ComponentTicks.new(changeTick));
        this.sparse.set(entity.index, denseLength);
        this.entities.push(entity);
    }

    contains(entity: Entity) {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return false;
        }
        return this.entities[denseIndex] === entity;
    }

    get(entity: Entity): Option<any> {
        return Some(this.sparse.get(entity.index)).map(row => this.dense.getData(row));
    }

    getWithTicks(entity: Entity): Option<[any, ComponentTicks]> {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return None;
        }
        return Some([this.dense.getData(denseIndex), this.dense.getTicks(denseIndex)]);
    }

    getAddedTick(entity: Entity): Option<Tick> {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return None;
        }
        return Some(this.dense.getAddedTick(denseIndex));
    }

    getChangedTick(entity: Entity): Option<Tick> {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return None;
        }
        return Some(this.dense.getChangedTick(denseIndex));
    }

    getTicks(entity: Entity): Option<ComponentTicks> {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return None;
        }
        return Some(this.dense.getTicks(denseIndex));
    }

    removeAndForget(entity: Entity): Option<any[]> {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return None;
        }
        this.entities[denseIndex] = this.entities.pop()!;
        const isLast = denseIndex === this.dense.len() - 1;
        const value = this.dense.swapRemoveAndForget(denseIndex);
        if (!isLast) {
            const last = this.entities[denseIndex];
            this.sparse.set(last.index, denseIndex);
        }
        return Some(value);
    }

    remove(entity: Entity) {
        const denseIndex = this.sparse.get(entity.index);
        if (denseIndex === undefined) {
            return false;
        }
        this.entities[denseIndex] = this.entities.pop()!;
        const isLast = denseIndex === this.dense.len() - 1;
        this.dense.swapRemove(denseIndex);
        if (!isLast) {
            const last = this.entities[denseIndex];
            this.sparse.set(last.index, denseIndex);
        }
        return true;
    }

    checkChangeTick(changeTick: Tick) {
        this.dense.checkChangeTick(changeTick);
    }

}


export class SparseSet<I, V> {
    #dense: V[] = [];
    #indices: I[] = [];
    #sparse: Map<I, number> = new Map();

    len() {
        return this.#dense.length;
    }

    get(index: I): Option<V> {
        const denseIndex = this.#sparse.get(index);
        if (denseIndex === undefined) {
            return None;
        }
        return Some(this.#dense[denseIndex]);
    }

    getMust(index: I): V {
        return this.#dense[this.#sparse.get(index)!];
    }

    set(index: I, value: V): this {
        const denseIndex = this.#sparse.get(index);
        if (denseIndex !== undefined) {
            this.#dense[denseIndex] = value;
        }
        return this;
    }

    contains(index: I): boolean {
        return this.#sparse.has(index);
    }

    indices(): I[] {
        return this.#indices;
    }

    values(): V[] {
        return this.#dense;
    }

    iter(): [I, V][] {
        return this.#indices.map(index => {
            return [index, this.#dense[this.#sparse.get(index)!]];
        });
    }

    insert(index: I, value: V) {
        const denseIndex = this.#sparse.get(index);
        if (denseIndex !== undefined) {
            this.#dense[denseIndex] = value;
            return;
        }
        this.#sparse.set(index, this.#dense.length);
        this.#indices.push(index);
        this.#dense.push(value);
    }

    getOrInsertWith(index: I, func: () => V) {
        let denseIndex = this.#sparse.get(index);
        if (denseIndex !== undefined) {
            return this.#dense[denseIndex];
        }
        const value = func();
        denseIndex = this.#dense.length;
        this.#sparse.set(index, denseIndex);
        this.#indices.push(index);
        this.#dense.push(value);
        return this.#dense[denseIndex];
    }

    isEmpty() {
        return this.#dense.length === 0;
    }

    remove(index: I): Option<V> {
        const denseIndex = this.#sparse.get(index);
        if (denseIndex === undefined) {
            return None;
        }
        this.#sparse.delete(index);
        const isLast = denseIndex === this.#dense.length - 1;
        const value = this.#dense[denseIndex];
        this.#dense[denseIndex] = this.#dense.pop()!;
        this.#indices[denseIndex] = this.#indices.pop()!;
        if (!isLast) {
            const last = this.#indices[denseIndex];
            this.#sparse.set(last, denseIndex);
        }
        return Some(value);
    }

    clear() {
        this.#dense = [];
        this.#indices = [];
        this.#sparse.clear();
    }

    toImmutable() {
        return new ImmutableSparseSet<I, V>(this.#indices, this.#dense);
    }

}

export class SparseSets {
    sets: SparseSet<ComponentId, ComponentSparseSet> = new SparseSet<ComponentId, ComponentSparseSet>();

    len() {
        return this.sets.len();
    }

    isEmpty() {
        return this.sets.isEmpty();
    }

    iter(): [ComponentId, ComponentSparseSet][] {
        return this.sets.iter();
    }

    get(id: ComponentId): Option<ComponentSparseSet> {
        return this.sets.get(id);
    }

    getOrInsert(componentInfo: ComponentInfo) {
        return this.sets.getOrInsertWith(componentInfo.id, () => new ComponentSparseSet(componentInfo));
    }

    clearEntities() {
        for (let i = 0; i < this.sets.len(); i++) {
            const set = this.sets.values()[i];
            set.clear();
        }
    }

    checkChangeTicks(changeTick: Tick) {
        for (let i = 0; i < this.sets.len(); i++) {
            const set = this.sets.values()[i];
            set.checkChangeTick(changeTick);
        }
    }

}
