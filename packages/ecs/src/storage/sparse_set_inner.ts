import {Option, Some} from "@minigame/utils";

export class ImmutableSparseSet<I, V> {
    #dense: V[] = [];
    #indices: I[] = [];
    #sparse: Map<I, number> = new Map();

    constructor(indices: I[], dense: V[]) {
        this.#indices = indices;
        this.#dense = dense;
        indices.forEach((index, i) => {
            this.#sparse.set(index, i);
        });
    }

    len(): number {
        return this.#dense.length;
    }

    get(index: I): Option<V> {
        return Some(this.#sparse.get(index)).map(denseIndex => this.#dense[denseIndex]);
    }

    getUnchecked(index: I): V {
        return this.#dense[this.#sparse.get(index)!];
    }

    contains(index: I) {
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

}
