export class Access {
    reads_and_writes: Set<number>;
    writes: Set<number>;
    reads_all: boolean;
    writes_all: boolean;
    archetypal: Set<number>;

    constructor() {
        this.reads_and_writes = new Set();
        this.writes = new Set();
        this.reads_all = false;
        this.writes_all = false;
        this.archetypal = new Set();
    }

    isCompatible(accessB: Access) {
        if (this.reads_all) {
            return !accessB.hasAnyWrite();
        }
        if (accessB.reads_all) {
            return !this.hasAnyWrite();
        }
        if (this.writes_all) {
            return !accessB.hasAnyRead();
        }
        if (accessB.writes_all) {
            return !this.hasAnyRead();
        }

        // return this.writes.isDisjoint(accessB.reads_and_writes) && accessB.writes.isDisjoint(this.reads_and_writes);
        return Array.from(this.writes).filter(x => accessB.reads_and_writes.has(x)).length === 0 &&
            Array.from(accessB.writes).filter(x => this.reads_and_writes.has(x)).length === 0;
    }


    getConflicts(accessB: Access) {
        let conflicts = new Set<number>();
        if (this.reads_all) {
            for (const write of accessB.writes) {
                conflicts.add(write);
            }
        }
        if (accessB.reads_all) {
            for (const write of this.writes) {
                conflicts.add(write);
            }
        }
        if (this.writes_all) {
            for (const read of accessB.reads_and_writes) {
                conflicts.add(read);
            }
        }
        if (accessB.writes_all) {
            for (const read of this.reads_and_writes) {
                conflicts.add(read);
            }
        }
        for (const write of this.writes) {
            if (accessB.reads_and_writes.has(write)) {
                conflicts.add(write);
            }
        }
        for (const read of this.reads_and_writes) {
            if (accessB.writes.has(read)) {
                conflicts.add(read);
            }
        }
        return Array.from(conflicts);
    }

    private hasAnyWrite() {
        return false;
    }

    private hasAnyRead() {
        return false;
    }
}
