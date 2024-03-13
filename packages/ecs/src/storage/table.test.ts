import {Tick} from "../change_detection";
import {component, Components} from "../component";
import {Entity} from "../entity";
import {typeId} from "../inherit";
import {Storages} from "./storage";
import {TableRow} from "./table";
import {TableBuilder} from "./table_inner";

test("table", () => {
    @component
    class W<T> {
        data: T;

        constructor(data: T) {
            this.data = data;
        }
    }

    const components = new Components();
    const storages = new Storages();
    const componentId = components.initComponent(typeId(W<TableRow>), storages);
    const table = TableBuilder.new().addColumn(components.getInfo(componentId)).build();
    const entities = Array.from({length: 200}, (_, i) => Entity.fromRaw(i));
    for (let entity of entities) {
        const row = table.allocate(entity);
        const value = new W(entity.index);
        table.getColumn(componentId)!.initialize(row, value, new Tick(0));
    }

    expect(table.entityCount()).toBe(200);
})
