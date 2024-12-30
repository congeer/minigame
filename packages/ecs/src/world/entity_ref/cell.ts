import { Constructor, Err, None, Ok, Option, Result, TypeId, typeId, useTrait } from 'rustable';
import { Archetype } from '../../archetype/base';
import { MutUntyped, MutValue } from '../../change_detection/mut';
import { RefValue } from '../../change_detection/ref';
import { ComponentTicks, Tick, Ticks } from '../../change_detection/tick';
import { Component } from '../../component/base';
import { ComponentId } from '../../component/types';
import { Entity } from '../../entity/base';
import { EntityLocation } from '../../entity/location';
import { ReadOnlyQueryData } from '../../query/fetch';
import { WorldCell } from '../cell';
import { getComponent, getComponentAndTicks, getTicks } from './func';
import { GetEntityMutByIdError } from './types';

export class EntityCell {
  world: WorldCell;
  entity: Entity;
  location: EntityLocation;

  constructor(world: WorldCell, entity: Entity, location: EntityLocation) {
    this.world = world;
    this.entity = entity;
    this.location = location;
  }

  get id(): Entity {
    return this.entity;
  }

  get archetype(): Archetype {
    return this.world.archetypes.getUnchecked(this.location.archetypeId);
  }

  contains<T extends object>(component: Constructor<T>): boolean {
    return this.containsTypeId(typeId(component));
  }

  containsId(componentId: ComponentId): boolean {
    return this.archetype.contains(componentId);
  }

  containsTypeId(typeId: TypeId): boolean {
    const id = this.world.components.getId(typeId);
    return id.isSomeAnd((id) => this.containsId(id));
  }

  get<T extends object>(component: Constructor<T>): Option<T> {
    return this.world.components
      .getId(typeId(component))
      .andThen((componentId) =>
        getComponent(
          this.world,
          componentId,
          useTrait(component, Component).storageType(),
          this.entity,
          this.location,
        ).map((value) => value as T),
      );
  }

  getRef<T extends object>(component: Constructor<T>): Option<RefValue<T>> {
    const lastChangeTick = this.world.lastChangeTick;
    const changeTick = this.world.changeTick;
    return this.world.components
      .getId(typeId(component))
      .andThen((componentId) =>
        getComponentAndTicks(
          this.world,
          componentId,
          useTrait(component, Component).storageType(),
          this.entity,
          this.location,
        ).map(([value, cells]) => new RefValue<T>(value as T, Ticks.fromTickCells(cells, lastChangeTick, changeTick))),
      );
  }

  getChangeTicks<T extends object>(component: Constructor<T>): Option<ComponentTicks> {
    return this.world.components
      .getId(typeId(component))
      .andThen((componentId) =>
        getTicks(this.world, componentId, useTrait(component, Component).storageType(), this.entity, this.location),
      );
  }

  getChangeTicksById(componentId: ComponentId): Option<ComponentTicks> {
    return this.world.components
      .getInfo(componentId)
      .andThen((info) => getTicks(this.world, componentId, info.storageType, this.entity, this.location));
  }

  getMut<T extends object>(component: Constructor<T>): Option<MutValue<T>> {
    return this.getMutAssumeMutable<T>(component);
  }

  getMutAssumeMutable<T extends object>(component: Constructor<T>): Option<MutValue<T>> {
    return this.getMutUsingTicksAssumeMutable(component, this.world.lastChangeTick, this.world.changeTick);
  }

  getMutUsingTicksAssumeMutable<T extends object>(
    component: Constructor<T>,
    lastChangeTick: Tick,
    changeTick: Tick,
  ): Option<MutValue<T>> {
    const componentId = this.world.components.getId(typeId(component));
    return componentId.match({
      None: () => None,
      Some: (componentId) =>
        getComponentAndTicks(
          this.world,
          componentId,
          useTrait(component, Component).storageType(),
          this.entity,
          this.location,
        ).map(([value, cells]) => new MutValue<T>(value, Ticks.fromTickCells(cells, lastChangeTick, changeTick))),
    });
  }

  getComponents<T extends object, Q>(query: T): Option<Q> {
    const state = (query as ReadOnlyQueryData).getState(this.world.components);
    return state.match({
      None: () => None,
      Some: (state) =>
        this.world.archetypes.get(this.location.archetypeId).andThen((archetype) => {
          if ((query as ReadOnlyQueryData).matchesComponentSet(state, (id) => archetype.contains(id))) {
            const fetch = (query as ReadOnlyQueryData).initFetch(
              this.world,
              state,
              this.world.lastChangeTick,
              this.world.changeTick,
            );
            return this.world.storages.tables.get(this.location.tableId).map((table) => {
              (query as ReadOnlyQueryData).setArchetype(fetch, state, archetype, table);
              return (query as ReadOnlyQueryData).fetch(fetch, this.entity, this.location.tableRow);
            });
          }
          return None;
        }),
    });
  }

  getById(componentId: ComponentId): Option<any> {
    return this.world.components
      .getInfo(componentId)
      .andThen((info) => getComponent(this.world, componentId, info.storageType, this.entity, this.location));
  }

  getMutById(componentId: ComponentId): Result<MutUntyped, Error> {
    return this.world.components.getInfo(componentId).match({
      None: () => Err(new Error(GetEntityMutByIdError.InfoNotFound)),
      Some: (info) => {
        if (!info.mutable) return Err(new Error(GetEntityMutByIdError.ComponentIsImmutable));
        return getComponentAndTicks(this.world, componentId, info.storageType, this.entity, this.location).match({
          None: () => Err(new Error(GetEntityMutByIdError.ComponentNotFound)),
          Some: ([value, cells]) =>
            Ok(new MutUntyped(value, Ticks.fromTickCells(cells, this.world.lastChangeTick, this.world.changeTick))),
        });
      },
    });
  }

  spawnedBy(): string | undefined {
    return this.world.entities.entityGetSpawnedOrDespawnedBy(this.entity).unwrapOr(undefined);
  }
}
