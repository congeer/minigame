import { Components } from '../../src/component/collections';
import { Storages } from '../../src/storage/storages';
import { Table } from '../../src/storage/table/table';
import { TableBuilder } from '../../src/storage/table/builder';
import { ComponentId } from '../../src/component/types';
import { Component } from '../../src/component/base';
import { Entity } from '../../src/entity/base';
import { TableRow } from '../../src/storage/table/types';
import { Tick } from '../../src/change_detection/tick';
import { derive } from 'rustable';

describe('Table', () => {
  let components: Components;
  let storages: Storages;
  let componentId: ComponentId;
  let table: Table;

  @derive([Component])
  class W<T> {
    constructor(public value: T) {}
  }

  beforeEach(() => {
    components = new Components();
    storages = new Storages();
    componentId = components.registerComponent<W<TableRow>>(W<TableRow>, storages);
    table = TableBuilder.new().addColumn(components.getInfo(componentId).unwrap()).build();
  });

  test('should allocate entities and initialize data', () => {
    const entities = Array.from({ length: 200 }, (_, i) => Entity.fromRaw(i));

    for (const entity of entities) {
      const row = table.allocate(entity);
      const value: W<TableRow> = new W(row);
      table.getColumnUnchecked(componentId).initialize(row, value, new Tick(0));
    }

    expect(table.entityCount()).toBe(200);
  });
});
