import { EMPTY_VALUE } from '@minigame/utils';
import { Constructor } from 'rustable';
import { Archetype } from '../archetype/base';
import { SpawnBundleStatus } from '../archetype/types';
import { Tick } from '../change_detection/tick';
import { Entity } from '../entity/base';
import { Entities } from '../entity/collections';
import { EntityLocation } from '../entity/location';
import { Table } from '../storage/table/table';
import { World } from '../world/base';
import { ON_ADD, ON_INSERT } from '../world/component_constants';
import { BundleInfo } from './info';
import { BundleId, InsertMode } from './types';

export class BundleSpawner {
  constructor(
    public world: World,
    public bundleInfo: BundleInfo,
    public table: Table,
    public archetype: Archetype,
    public changeTick: Tick,
  ) {}

  static new<B extends object>(bundle: Constructor<B>, world: World, changeTick: Tick): BundleSpawner {
    let bundleId = world.bundles.registerInfo<B>(bundle, world.components, world.storages);
    return this.newWithId(world, bundleId, changeTick);
  }

  static newWithId(world: World, bundleId: BundleId, changeTick: Tick): BundleSpawner {
    const bundleInfo = world.bundles.get(bundleId).unwrap();
    const newArchetypeId = bundleInfo.insertBundleIntoArchetype(
      world.archetypes,
      world.storages,
      world.components,
      world.observers,
      EMPTY_VALUE,
    );
    const archetype = world.archetypes.get(newArchetypeId).unwrap();
    const table = world.storages.tables.get(archetype.tableId).unwrap();
    return new BundleSpawner(world, bundleInfo, table, archetype, changeTick);
  }

  spawn<B extends object>(bundle: B, caller?: string): Entity {
    const entity = this.entities().alloc();
    this.spawnNonExistent(entity, bundle, caller);
    return entity;
  }

  spawnNonExistent<B extends object>(entity: Entity, bundle: B, caller?: string): EntityLocation {
    const bundleInfo = this.bundleInfo;
    const location = (() => {
      const table = this.table;
      const archetype = this.archetype;
      const entities = this.world.entities;
      const sparseSets = this.world.storages.sparseSets;
      const tableRow = table.allocate(entity);
      const location = archetype.allocate(entity, tableRow);
      bundleInfo.writeComponents(
        table,
        sparseSets,
        new SpawnBundleStatus(),
        bundleInfo.requiredComponents,
        entity,
        tableRow,
        this.changeTick,
        bundle,
        InsertMode.Replace,
        caller,
      );
      entities.set(entity.index, location);
      return location;
    })();

    const deferredWorld = this.world.intoDeferred();
    const archetype = this.archetype;

    deferredWorld.triggerOnAdd(archetype, entity, bundleInfo.iterContributedComponents());
    if (archetype.hasAddObserver()) {
      deferredWorld.triggerObservers(ON_ADD, entity, bundleInfo.iterContributedComponents());
    }
    deferredWorld.triggerOnInsert(archetype, entity, bundleInfo.iterContributedComponents());
    if (archetype.hasInsertObserver()) {
      deferredWorld.triggerObservers(ON_INSERT, entity, bundleInfo.iterContributedComponents());
    }

    return location;
  }

  entities(): Entities {
    return this.world.entities;
  }

  flushCommands(): void {
    this.world.flush();
  }
}
