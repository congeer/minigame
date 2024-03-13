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

    get(index: I) {
        const denseIndex = this.#sparse.get(index);
        if (denseIndex !== undefined) {
            return this.#dense[denseIndex];
        }
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
