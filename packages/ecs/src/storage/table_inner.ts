import {ComponentId, ComponentInfo} from "../component";
import {Entity} from "../entity";
import {SparseSet} from "./sparse_set";
import {Column, Table, TableRow} from "./table";

export class TableBuilder {
    columns: SparseSet<ComponentId, Column> = new SparseSet<ComponentId, Column>();

    static new() {
        return new TableBuilder();
    }

    addColumn(componentInfo: ComponentInfo) {
        this.columns.insert(componentInfo.id, Column.new(componentInfo));
        return this;
    }

    build() {
        return Table.new(this.columns.toImmutable());
    }
}

export class TableMoveResult {
    swappedEntity?: Entity;
    newRow: TableRow;

    constructor(newRow: TableRow, swappedEntity?: Entity) {
        this.newRow = newRow;
        this.swappedEntity = swappedEntity;
    }

    static new(newRow: TableRow, swappedEntity?: Entity) {
        return new TableMoveResult(newRow, swappedEntity);
    }
}
