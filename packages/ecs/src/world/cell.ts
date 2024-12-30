import { Constructor, Option, typeId } from 'rustable';
import { Tick } from '../change_detection/tick';
import { ComponentId } from '../component/types';
import { Entity } from '../entity/base';
import { EntityLocation } from '../entity/location';
import { ComponentSparseSet } from '../storage/sparse_set';
import { Table } from '../storage/table/table';
import { World } from './base';
import { EntityCell } from './entity_ref/cell';

export class WorldCell {
  constructor(public world: World) {}

  get id() {
    return this.world.id;
  }

  get components() {
    return this.world.components;
  }

  get bundles() {
    return this.world.bundles;
  }

  get entities() {
    return this.world.entities;
  }

  get archetypes() {
    return this.world.archetypes;
  }

  get storages() {
    return this.world.storages;
  }

  get lastChangeTick() {
    return this.world.lastChangeTick;
  }

  get changeTick() {
    return this.world.changeTick;
  }

  get commands() {
    return this.world.commands;
  }

  incrementChangeTick() {
    const changeTick = this.world.changeTick;
    changeTick.set(changeTick.get() + 1);
    this.world.changeTick = changeTick;
    return new Tick(changeTick.get());
  }

  fetchSparseSet(componentId: number): Option<ComponentSparseSet> {
    return this.world.storages.sparseSets.get(componentId);
  }
  fetchTable(location: EntityLocation): Option<Table> {
    return this.world.storages.tables.get(location.tableId);
  }
  getEntity(entity: Entity): Option<EntityCell> {
    const location = this.entities.get(entity);
    return location.map((loc) => new EntityCell(this, entity, loc));
  }
  getResource<R extends object>(resource: Constructor<R>): Option<R> {
    return this.components.getResourceId(typeId(resource)).andThen((id) => this.getResourceById(id));
  }

  getResourceById(componentId: ComponentId): Option<any> {
    return this.world.storages.resources.get(componentId).andThen((resource) => resource.getData());
  }
}
