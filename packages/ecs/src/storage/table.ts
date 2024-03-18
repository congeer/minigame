import {None, Option, Some} from "@minigame/utils";
import {Tick} from "../change_detection";
import {ComponentId, ComponentInfo, Components, ComponentTicks} from "../component";
import {Entity} from "../entity";
import {ImmutableSparseSet} from "./sparse_set_inner";
import {TableBuilder, TableMoveResult} from "./table_inner";


export type TableId = number;

export type TableRow = number;

export class Column {
    _len: number = 0;
    data: any[] = [];
    addedTicks: Tick[] = [];
    changedTicks: Tick[] = [];
    drop?: (value: any) => void;

    constructor(componentInfo: ComponentInfo) {
        this.drop = componentInfo._descriptor.drop;
    }

    static new(componentInfo: ComponentInfo) {
        return new Column(componentInfo);
    }

    initialize(row: TableRow, value: any, tick: Tick) {
        if (row >= this.len()) {
            throw new Error("Row out of range");
        }
        this.data[row] = value;
        this.addedTicks[row] = tick;
        this.changedTicks[row] = tick;
    }

    initializeFrom(other: Column, src: TableRow, dst: TableRow) {
        if (dst >= this.len()) {
            throw new Error("Row out of range");
        }
        const [data, {added, changed}] = other.swapRemoveAndForget(src);
        this.data[dst] = data;
        this.addedTicks[dst] = added;
        this.changedTicks[dst] = changed;
    }

    replace(row: TableRow, value: any, tick: Tick) {
        if (row >= this.len()) {
            throw new Error("Row out of range");
        }
        this.data[row] = value;
        this.changedTicks[row] = tick;
    }

    swapRemove(row: TableRow) {
        this._len -= 1;
        const data = this.data[row];
        if (this.drop) {
            this.drop(data);
        }
        this.data[row] = this.data[this.len() - 1];
        this.addedTicks[row] = this.addedTicks[this.len() - 1];
        this.changedTicks[row] = this.changedTicks[this.len() - 1];
        this.data.pop();
        this.addedTicks.pop();
        this.changedTicks.pop();
    }

    swapRemoveAndForget(row: TableRow) {
        this._len -= 1;
        const data = this.data[row];
        this.data[row] = this.data[this.len() - 1];
        const added = this.addedTicks[row];
        this.addedTicks[row] = this.addedTicks[this.len() - 1];
        const changed = this.changedTicks[row];
        this.changedTicks[row] = this.changedTicks[this.len() - 1];
        this.data.pop();
        this.addedTicks.pop();
        this.changedTicks.pop();
        return [data, new ComponentTicks(added, changed)]
    }


    get(row: TableRow): Option<[any, ComponentTicks]> {
        const index = row;
        if (index < this.len()) {
            return Some([this.data[index], new ComponentTicks(this.addedTicks[index], this.changedTicks[index])]);
        }
        return None
    }

    getData(row: TableRow) {
        const index = row;
        if (index < this.len()) {
            return this.data[index];
        }
    }

    getAddedTick(row: TableRow) {
        return this.addedTicks[row];
    }

    getChangedTick(row: TableRow) {
        return this.changedTicks[row];
    }

    getTicks(row: TableRow) {
        const index = row;
        return new ComponentTicks(this.addedTicks[index], this.changedTicks[index]);
    }

    push(value: any, ticks: ComponentTicks) {
        let index = this.len();
        this.data[index] = value;
        this._len += 1;
        this.addedTicks[index] = ticks.added;
        this.changedTicks[index] = ticks.changed;
    }

    checkChangeTick(changeTick: Tick) {
        for (let i = 0; i < this.len(); i++) {
            this.addedTicks[i].checkTick(changeTick);
        }
        for (let i = 0; i < this.len(); i++) {
            this.changedTicks[i].checkTick(changeTick);
        }
    }

    clear() {
        this._len = 0;
        this.data = [];
        this.addedTicks = [];
        this.changedTicks = [];
    }

    len() {
        return this._len;
    }

    setLen(len: number) {
        this._len = len;
    }

}

export class Table {
    columns: ImmutableSparseSet<ComponentId, Column>;
    entities: Entity[];

    constructor(columns: ImmutableSparseSet<ComponentId, Column>, entities: Entity[] = []) {
        this.columns = columns;
        this.entities = entities;
    }

    static new(immutableSparseSet: ImmutableSparseSet<ComponentId, Column>) {
        return new Table(immutableSparseSet);
    }

    swapRemove(row: TableRow): Option<Entity> {
        this.columns.values().forEach(column => {
            column.swapRemove(row);
        });
        const isLast = row === this.entities.length - 1;
        if (isLast) {
            this.entities.pop();
            return None;
        } else {
            const entity = this.entities[row];
            this.entities[row] = this.entities.pop()!;
            return Some(entity);
        }
    }

    allocate(entity: Entity) {
        const index = this.entities.length;
        this.entities.push(entity);
        this.columns.values().forEach(column => {
            column.setLen(this.entities.length);
            column.data.push(undefined);
            column.addedTicks.push(new Tick(0));
            column.changedTicks.push(new Tick(0));
        });
        return index;
    }

    moveToAndForgetMissing(row: TableRow, newTable: Table) {
        const isLast = row === this.entities.length - 1;
        const entity = this.entities[row];
        this.entities[row] = this.entities.pop()!;
        let newRow = newTable.allocate(entity);
        const columnsIter = this.columns.iter();
        for (let i = 0; i < columnsIter.length; i++) {
            const [componentId, column] = columnsIter[i];
            const newColumn = newTable.getColumn(componentId);
            if (newColumn.isSome()) {
                newColumn.unwrap().initializeFrom(column, row, newRow);
            } else {
                column.swapRemoveAndForget(row);
            }
        }
        return TableMoveResult.new(newRow, isLast ? undefined : entity);
    }

    moveToAndDropMissing(row: TableRow, newTable: Table) {
        const isLast = row === this.entities.length - 1;
        const entity = this.entities[row];
        this.entities[row] = this.entities.pop()!;
        let newRow = newTable.allocate(entity);
        const columnsIter = this.columns.iter();
        for (let i = 0; i < columnsIter.length; i++) {
            const [componentId, column] = columnsIter[i];
            const newColumn = newTable.getColumn(componentId);
            if (newColumn.isSome()) {
                newColumn.unwrap().initializeFrom(column, row, newRow);
            } else {
                column.swapRemove(row);
            }
        }
        return TableMoveResult.new(newRow, isLast ? undefined : entity);
    }

    moveToSuperset(row: TableRow, newTable: Table) {
        const isLast = row === this.entities.length - 1;
        const entity = this.entities[row];
        this.entities[row] = this.entities.pop()!;
        let newRow = newTable.allocate(entity);
        const columnsIter = this.columns.iter();
        for (let i = 0; i < columnsIter.length; i++) {
            const [componentId, column] = columnsIter[i];
            const newColumn = newTable.getColumn(componentId);
            if (newColumn.isSome()) {
                newColumn.unwrap().initializeFrom(column, row, newRow);
            }
        }
        return TableMoveResult.new(newRow, isLast ? undefined : entity);
    }

    getColumn(componentId: ComponentId): Option<Column> {
        return this.columns.get(componentId);
    }

    getColumnUnchecked(componentId: ComponentId): Column {
        return this.columns.getUnchecked(componentId);
    }

    hasColumn(componentId: ComponentId) {
        return this.columns.contains(componentId);
    }

    entityCount() {
        return this.entities.length;
    }

    componentCount() {
        return this.columns.len();
    }

    isEmpty() {
        return this.entities.length === 0;
    }

    checkChangeTicks(changeTick: Tick) {
        this.columns.values().forEach(column => {
            column.checkChangeTick(changeTick);
        });

    }

    iter() {
        return this.columns.values();
    }

    clear() {
        this.columns.values().forEach(column => {
            column.clear();
        });
        this.entities = [];
    }

}

export class Tables {
    tables: Table[] = [];
    tableIds: Map<ComponentId[], TableId>;

    constructor(tables: Table[] = [TableBuilder.new().build()], tableIds: Map<ComponentId[], TableId> = new Map()) {
        this.tables = tables;
        this.tableIds = tableIds;
    }

    len() {
        return this.tables.length;
    }

    isEmpty() {
        return this.tables.length === 0;
    }

    get(id: TableId) {
        return this.tables[id];
    }

    get2(a: TableId, b: TableId) {
        return [this.tables[a], this.tables[b]];
    }

    getIdOrInsert(componentIds: ComponentId[], components: Components) {
        let tables = this.tables;
        let key = componentIds;
        let value = this.tableIds.get(key);
        if (value) {
            return value;
        }
        let table = TableBuilder.new();
        for (let i = 0; i < componentIds.length; i++) {
            table.addColumn(components.getInfoUnchecked(componentIds[i]));
        }
        tables.push(table.build());
        let tableId = tables.length - 1;
        this.tableIds.set(key, tableId);
        return tableId;
    }

    iter() {
        return this.tables;
    }

    clear() {
        this.tables.forEach(table => {
            table.clear();
        });
    }

    checkChangeTicks(changeTick: Tick) {
        this.tables.forEach(table => {
            table.checkChangeTicks(changeTick);
        })
    }

}
