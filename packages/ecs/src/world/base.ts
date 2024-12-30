import { Constructor, Err, implTrait, Mut, None, Ok, Option, Result, Some, typeId } from 'rustable';
import { Archetype } from '../archetype/base';
import { Archetypes } from '../archetype/collections';
import { Bundles } from '../bundle/collections';
import { BundleSpawner } from '../bundle/spawner';
import { CHECK_TICK_THRESHOLD } from '../change_detection/constants';
import { ComponentTicks, Tick } from '../change_detection/tick';
import { Components } from '../component/collections';
import { ComponentHooks } from '../component/hooks';
import { ComponentInfo } from '../component/info';
import { RequiredComponents } from '../component/required_components';
import { ComponentDescriptor, ComponentId, RequiredComponentsError } from '../component/types';
import { Entity } from '../entity/base';
import { Entities } from '../entity/collections';
import { EntityLocation } from '../entity/location';
import { Observers } from '../observer/observers';
import { RemovedComponentEvents } from '../removal_detection';
import { Schedule } from '../schedule/base';
import { Schedules } from '../schedule/collections';
import { ResourceData } from '../storage/resource/data';
import { Storages } from '../storage/storages';
import { RunSystemOnce } from '../system/base';
import { Commands } from '../system/commands';
import { IntoSystem } from '../system/into';
import { WorldCell } from './cell';
import { CommandQueue } from './command_queue';
import { ON_ADD, ON_INSERT, ON_REMOVE, ON_REPLACE, OnAdd, OnInsert, OnRemove, OnReplace } from './component_constants';
import { DeferredWorld } from './deferred';
import { EntityCell } from './entity_ref/cell';
import { EntityMut } from './entity_ref/mut';
import { EntityRef } from './entity_ref/ref';
import { EntityWorld } from './entity_ref/world';
import { intoEntityFetch } from './entry_fetch';
import { fromWorld } from './from';

let wordId = 0;

export class World {
  id: number;
  entities: Entities;
  components: Components;
  archetypes: Archetypes;
  storages: Storages;
  bundles: Bundles;
  observers: Observers;
  removedComponents: RemovedComponentEvents;

  __changeTick: number;
  __lastChangeTick: Tick;
  __lastCheckTick: Tick;
  __lastTriggerId: number;

  __command_queue: CommandQueue;

  static new() {
    return new World();
  }

  constructor() {
    this.id = wordId++;
    this.entities = new Entities();
    this.components = new Components();
    this.archetypes = new Archetypes();
    this.storages = new Storages();
    this.bundles = new Bundles();
    this.observers = new Observers();
    this.removedComponents = new RemovedComponentEvents();

    this.__changeTick = 1;
    this.__lastChangeTick = new Tick(0);
    this.__lastCheckTick = new Tick(0);
    this.__lastTriggerId = 0;

    this.__command_queue = new CommandQueue();

    this.bootstrap();
  }

  bootstrap(): void {
    if (ON_ADD !== this.registerComponent<OnAdd>(OnAdd)) {
      throw new Error('ON_ADD should be 0');
    }
    if (ON_INSERT !== this.registerComponent<OnInsert>(OnInsert)) {
      throw new Error('ON_INSERT should be 1');
    }
    if (ON_REPLACE !== this.registerComponent<OnReplace>(OnReplace)) {
      throw new Error('ON_REPLACE should be 2');
    }
    if (ON_REMOVE !== this.registerComponent<OnRemove>(OnRemove)) {
      throw new Error('ON_REMOVE should be 3');
    }
  }

  get changeTick() {
    return new Tick(this.__changeTick);
  }

  set changeTick(t: Tick) {
    this.__changeTick = t.tick;
  }

  get lastChangeTick() {
    return this.__lastChangeTick;
  }

  get commands() {
    return new Commands(this.__command_queue, this.entities);
  }

  registerComponent<T extends object>(component: Constructor<T>): ComponentId {
    return this.components.registerComponent(component, this.storages);
  }

  registerComponentHooks<T extends object>(component: Constructor<T>): ComponentHooks {
    const index = this.registerComponent(component);
    if (this.archetypes.archetypes.iter().any((a) => a.contains(index))) {
      throw new Error(
        `Components hooks cannot be modified if the component already exists in an archetype, use registerComponent if ${component.name} may already be in use`,
      );
    }
    return this.components.getHooks(index).unwrap();
  }

  registerComponentHooksById(id: ComponentId): Option<ComponentHooks> {
    if (this.archetypes.archetypes.iter().any((a) => a.contains(id))) {
      throw new Error(
        `Components hooks cannot be modified if the component already exists in an archetype, use registerComponent if the component with id ${id} may already be in use`,
      );
    }
    return this.components.getHooks(id);
  }

  registerRequiredComponents<T extends object, R extends object>(
    component: Constructor<T>,
    requiredComponent: Constructor<R>,
  ): void {
    this.tryRegisterRequiredComponents<T, R>(component, requiredComponent).unwrap();
  }

  registerRequiredComponentsWith<T extends object, R extends object>(
    component: Constructor<T>,
    requiredComponent: Constructor<R>,
    requiredComponentFn: () => R,
  ): void {
    this.tryRegisterRequiredComponentsWith<T, R>(component, requiredComponent, requiredComponentFn).unwrap();
  }

  tryRegisterRequiredComponents<T extends object, R extends object>(
    component: Constructor<T>,
    requiredComponent: Constructor<R>,
  ): Result<void, RequiredComponentsError> {
    return this.tryRegisterRequiredComponentsWith<T, R>(component, requiredComponent, () => new requiredComponent());
  }

  tryRegisterRequiredComponentsWith<T extends object, R extends object>(
    component: Constructor<T>,
    requiredComponent: Constructor<R>,
    constructor: () => R,
  ): Result<void, RequiredComponentsError> {
    const requiree = this.registerComponent(component);
    if (this.archetypes.componentIndex().containsKey(requiree)) {
      return Result.Err(RequiredComponentsError.ArchetypeExists(requiree));
    }
    const required = this.registerComponent(requiredComponent);
    this.components.registerRequiredComponents(requiree, required, constructor);
    return Result.Ok(undefined);
  }

  getRequiredComponents<C extends object>(component: Constructor<C>): Option<RequiredComponents> {
    return this.components
      .componentId(component)
      .andThen((id) => this.components.getInfo(id))
      .map((info) => info.requiredComponents);
  }

  getRequiredComponentsById(id: ComponentId): Option<RequiredComponents> {
    return this.components.getInfo(id).map((info) => info.requiredComponents);
  }

  registerComponentWithDescriptor(descriptor: ComponentDescriptor): ComponentId {
    return this.components.registerComponentWithDescriptor(this.storages, descriptor);
  }

  componentId<T extends object>(component: Constructor<T>): Option<ComponentId> {
    return this.components.componentId(typeId(component));
  }

  registerResource<R extends object>(resource: Constructor<R>): ComponentId {
    return this.components.registerResource(resource);
  }

  resourceId<T extends object>(resource: Constructor<T>): Option<ComponentId> {
    return this.components.getResourceId(typeId(resource));
  }

  entity(entity: Entity): EntityWorld {
    return this.getEntityMut(entity).unwrap();
  }

  inspectEntity(entity: Entity): Iterable<ComponentInfo> {
    const entityLocation = this.entities.get(entity).unwrapOrElse<EntityLocation>(() => {
      throw new Error(`Entity ${entity} does not exist`);
    });

    const archetype = this.archetypes.get(entityLocation.archetypeId).unwrapOrElse<Archetype>(() => {
      throw new Error(`Archetype ${entityLocation.archetypeId} does not exist`);
    });

    return archetype.components.filterMap((id) => this.components.getInfo(id));
  }

  getOrSpawn(entity: Entity, caller?: string): Option<EntityWorld> {
    return this.getOrSpawnWithCaller(entity, caller);
  }

  protected getOrSpawnWithCaller(entity: Entity, caller?: string): Option<EntityWorld> {
    this.flush();
    const result = this.entities.allocAtWithoutReplacement(entity);
    return result.match({
      Exists: (location) => Some(new EntityWorld(this, entity, location)),
      DidNotExist: () => Some(this.spawnAtEmptyInternal(entity, caller)),
      ExistsWithWrongGeneration: () => None,
    });
  }

  getEntity<T>(entity: T): Result<any, Error> {
    const fetch = intoEntityFetch(entity);
    return fetch.fetchRef(this.asWorldCell());
  }

  getEntityMut<T>(entity: T): Result<any, Error> {
    const fetch = intoEntityFetch(entity);
    return fetch.fetchMut(this.asWorldCell());
  }

  iterEntities(): Iterable<EntityRef> {
    const worldCell = this.asWorldCell();
    return this.archetypes.archetypes.iter().flatMap((archetype) => {
      return archetype.entities.enumerate().map(([archetypeRow, archetypeEntity]) => {
        const entity = archetypeEntity.id;
        const location: EntityLocation = {
          archetypeId: archetype.id,
          archetypeRow: archetypeRow,
          tableId: archetype.tableId,
          tableRow: archetypeEntity.tableRow,
        };
        const cell = new EntityCell(worldCell, entity, location);
        return EntityRef.new(cell);
      });
    });
  }

  iterEntitiesMut(): Iterable<EntityMut> {
    const worldCell = this.asWorldCell();
    return this.archetypes.archetypes.iter().flatMap((archetype) => {
      return archetype.entities.enumerate().map(([archetypeRow, archetypeEntity]) => {
        const entity = archetypeEntity.id;
        const location: EntityLocation = {
          archetypeId: archetype.id,
          archetypeRow: archetypeRow,
          tableId: archetype.tableId,
          tableRow: archetypeEntity.tableRow,
        };
        const cell = new EntityCell(worldCell, entity, location);
        return new EntityMut(cell);
      });
    });
  }

  spawnEmpty(caller?: string): EntityWorld {
    this.flush();
    const entity = this.entities.alloc();
    // SAFETY: entity was just allocated
    return this.spawnAtEmptyInternal(entity, caller ?? 'spawnEmpty');
  }

  spawn<B extends object>(bundle: B, caller?: string): EntityWorld {
    this.flush();
    const changeTick = this.changeTick;
    const entity = this.entities.alloc();
    const entityLocation = (() => {
      const bundleSpawner = BundleSpawner.new(bundle.constructor as Constructor<B>, this, changeTick);
      return bundleSpawner.spawnNonExistent(entity, bundle, caller ?? 'spawn');
    })();
    return new EntityWorld(this, entity, entityLocation);
  }

  spawnAtEmptyInternal(entity: Entity, caller?: string): EntityWorld {
    const archetype = this.archetypes.empty();
    const tableRow = this.storages.tables.getUnchecked(archetype.tableId).allocate(entity);
    const location = archetype.allocate(entity, tableRow);
    this.entities.set(entity.index, location);
    if (caller) {
      this.entities.setSpawnedOrDespawnedBy(entity.index, caller);
    }
    return new EntityWorld(this, entity, location);
  }

  // spawnBatch<I extends Iterable<Bundle>>(iter: I): SpawnBatchIter<I> {
  //   this.flush();
  //   return new SpawnBatchIter(this, iter[Symbol.iterator](), 'spawnBatch');
  // }

  get<T extends object>(component: Constructor<T>, entity: Entity): Option<T> {
    return this.getEntity(entity).match({
      Ok: (entityRef) => entityRef.get(component),
      Err: () => None,
    });
  }

  // getMut<T extends object>(component: Constructor<T>, entity: Entity): Option<MutValue<T>> {
  //   return this.getEntityMut(entity).match({
  //     Ok: (entityRef) => entityRef.getMut(component),
  //     Err: () => None,
  //   });
  // }

  despawn(entity: Entity, caller?: string): boolean {
    return this.despawnWithCaller(entity, caller ?? 'despawn', true);
  }

  tryDespawn(entity: Entity, caller?: string): boolean {
    return this.despawnWithCaller(entity, caller ?? 'despawn', false);
  }

  protected despawnWithCaller(entity: Entity, caller: string, logWarning: boolean): boolean {
    this.flush();
    const entityResult = this.getEntityMut(entity);
    return entityResult.match({
      Ok: (entityMut: EntityWorld) => {
        entityMut.despawnWithCaller(caller);
        return true;
      },
      Err: () => {
        if (logWarning) {
          console.warn(`error: ${caller}: Could not despawn entity ${entity}`);
        }
        return false;
      },
    });
  }

  clearTrackers(): void {
    this.removedComponents.update();
    this.__lastChangeTick = this.incrementChangeTick();
  }
  // query<D extends QueryDataConstructor>(): QueryState<D, void> {
  //   return this.queryFiltered<D, void>();
  // }
  // queryFiltered<D extends QueryDataConstructor, F extends QueryFilter>(): QueryState<D, F> {
  //   return QueryState.new(this);
  // }
  // tryQuery<D extends QueryDataConstructor>(): Option<QueryState<D, void>> {
  //   return this.tryQueryFiltered<D, void>();
  // }
  // tryQueryFiltered<D extends QueryDataConstructor, F extends QueryFilter>(): Option<QueryState<D, F>> {
  //   return QueryState.tryNew(this);
  // }
  // removed<T extends object>(component: Constructor<T>): Iterable<Entity> {
  //   const componentId = this.components.getId(typeId(component));
  //   return componentId.match({
  //     Some: (id) => this.removedWithId(id),
  //     None: () => [],
  //   });
  // }

  removedWithId(componentId: ComponentId): Iterable<Entity> {
    return this.removedComponents.get(componentId).match({
      Some: (removed) =>
        removed
          .iterCurrentUpdateEvents()
          .map((event) => event.entity)
          .collect(),
      None: () => [],
    });
  }

  registerResourceWithDescriptor(descriptor: ComponentDescriptor): ComponentId {
    return this.components.registerResourceWithDescriptor(descriptor);
  }

  initResource<R extends object>(res: Constructor<R>, caller?: string): ComponentId {
    const componentId = this.components.registerResource(res);
    if (this.storages.resources.get(componentId).mapOr(true, (v) => v.isPresent())) {
      const value = fromWorld(this, res);
      this.insertResourceById(componentId, value, caller);
    }
    return componentId;
  }

  insertResource<R extends object>(value: R, caller?: string) {
    this.insertResourceWithCaller(value, caller);
  }

  insertResourceWithCaller<R extends object>(value: R, caller?: string) {
    const componentId = this.components.registerResource(value.constructor as Constructor<R>);
    this.insertResourceById(componentId, value, caller);
  }

  removeResource<R extends object>(res: Constructor<R>): Option<R> {
    const componentId = this.components.getResourceId(typeId(res));
    if (componentId.isNone()) {
      return None;
    }
    return this.storages.resources
      .get(componentId.unwrap())
      .andThen((v) => v.remove())
      .map((v) => v[0]);
  }

  containsResource<R extends object>(res: Constructor<R>): boolean {
    return this.components
      .getResourceId(typeId(res))
      .andThen((componentId) => this.storages.resources.get(componentId))
      .map((v) => v.isPresent())
      .unwrapOr(false);
  }

  containsResourceById(componentId: ComponentId): boolean {
    return this.storages.resources.get(componentId).isSomeAnd((resourceData) => resourceData.isPresent());
  }

  isResourceAdded<R extends object>(resource: Constructor<R>): boolean {
    return this.components
      .getResourceId(typeId(resource))
      .isSomeAnd((componentId) => this.isResourceAddedById(componentId));
  }

  isResourceAddedById(componentId: ComponentId): boolean {
    return this.storages.resources
      .get(componentId)
      .andThen((resource) => resource.getTicks().map((ticks) => ticks.isAdded(this.lastChangeTick, this.changeTick)))
      .unwrapOr(false);
  }

  isResourceChanged<R extends object>(resource: Constructor<R>): boolean {
    return this.components
      .getResourceId(typeId(resource))
      .map((componentId) => this.isResourceChangedById(componentId))
      .unwrapOr(false);
  }

  isResourceChangedById(componentId: ComponentId): boolean {
    return this.storages.resources
      .get(componentId)
      .andThen((res) => res.getTicks().map((ticks) => ticks.isChanged(this.__lastChangeTick, this.changeTick)))
      .unwrapOr(false);
  }

  getResourceChangeTicks<R>(resource: Constructor<R>): Option<ComponentTicks> {
    return this.components
      .getResourceId(typeId(resource))
      .andThen((componentId) => this.getResourceChangeTicksById(componentId));
  }

  getResourceChangeTicksById(componentId: ComponentId): Option<ComponentTicks> {
    return this.storages.resources.get(componentId).andThen((v) => v.getTicks());
  }

  resource<R extends object>(resource: Constructor<R>): R {
    const res = this.getResource(resource);
    if (res.isSome()) {
      return res.unwrap();
    }
    throw new Error(
      `Requested resource ${resource.name} does not exist in the 'World'. ` +
        `Did you forget to add it using 'app.insertResource' / 'app.initResource'? ` +
        `Resources are also implicitly added via 'app.addEvent', ` +
        `and can be added by plugins.`,
    );
  }

  getResource<R extends object>(resource: Constructor<R>): Option<R> {
    return new WorldCell(this).getResource(resource);
  }

  protected initializeResourceInternal(componentId: ComponentId): ResourceData {
    const archetypes = this.archetypes;
    return this.storages.resources.initializeWith(componentId, this.components, () => {
      return archetypes.newArchetypeComponentId();
    });
  }

  insertResourceById<T extends object>(id: ComponentId, value: T, caller?: string) {
    const changeTick = this.changeTick;
    const data = this.initializeResourceInternal(id);
    data.insert(value, changeTick, caller);
    return id;
  }

  checkChangeTicks() {
    const changeTick = this.changeTick;
    if (changeTick.relativeTo(this.__lastCheckTick).get() < CHECK_TICK_THRESHOLD) {
      return;
    }
    const { tables, sparseSets, resources } = this.storages;
    tables.checkChangeTicks(changeTick);
    sparseSets.checkChangeTicks(changeTick);
    resources.checkChangeTicks(changeTick);

    const schedules = this.getResource(Schedules);
    schedules.match({
      Some: (schedules) => {
        schedules.checkChangeTicks(changeTick);
      },
    });

    this.__lastCheckTick = changeTick;
  }

  incrementChangeTick() {
    const prevTick = this.__changeTick;
    this.__changeTick += 1;
    return new Tick(prevTick);
  }

  lastChangeTickScope<T>(lastChangeTick: Tick, f: (world: World) => T): T {
    const guard = new LastTickGuard(this, this.__lastChangeTick);
    guard.world.__lastChangeTick = lastChangeTick;
    const ret = f(this);
    guard.drop();
    return ret;
  }

  addSchedule(schedule: Schedule) {
    const schedules = this.getResourceOrInit(Schedules);
    schedules.insert(schedule);
  }

  tryScheduleScope(label: any, f: (world: World, schedule: Schedule) => any) {
    const schedule = this.getResource(Schedules).andThen((s) => s.remove(label));
    if (schedule.isNone()) {
      return Err(`The schedule with the label ${label} was not found.`);
    }
    const value = f(this, schedule.unwrap());
    const old = this.resource(Schedules).insert(schedule.unwrap());
    if (old.isSome()) {
      console.warn(
        `Schedule ${label} was inserted during a call to World.schedule_scope its value has been overwritten`,
      );
    }
    return Ok(value);
  }

  scheduleScope(label: any, f: (world: World, schedule: Schedule) => any) {
    return this.tryScheduleScope(label, f).unwrap();
  }

  tryRunSchedule(label: any) {
    return this.tryScheduleScope(label, (world, schedule) => {
      schedule.run(world);
    });
  }

  runSchedule(label: any) {
    this.scheduleScope(label, (world, schedule) => {
      schedule.run(world);
    });
  }

  // ---- Schedule End----

  allowAmbiguousComponent<T extends object>(component: Constructor<T>, world: World) {
    const schedules = world.removeResource<Schedules>(Schedules).unwrapOrElse(() => new Schedules());
    schedules.allowAmbiguousComponent(component, world);
    world.insertResource(schedules);
  }

  allowAmbiguousResource<T extends object>(res: Constructor<T>, world: World) {
    const schedules = world.removeResource<Schedules>(Schedules).unwrapOrElse(() => new Schedules());
    schedules.allowAmbiguousResource(res, world);
    world.insertResource(schedules);
  }

  // initComponent<T extends Component>(component: new () => T): ComponentId {
  //   return this.components.initComponent(typeId(component), this.storages);
  // }

  // getResourceById(id: ComponentId): Option<any> {
  //   return this.storages.resources.get(id).andThen((v) => v.getData());
  // }

  getResourceOrInsertWith<R extends object>(resType: Constructor<R>, func: () => R, caller?: string): R {
    const changeTick = this.changeTick;
    const lastChangeTick = this.__lastChangeTick;
    const componentId = this.components.registerResource(resType);
    let data = this.initializeResourceInternal(componentId);
    if (!data.isPresent()) {
      data.insert(func(), changeTick, caller);
    }
    const value = data.getMut(lastChangeTick, changeTick).unwrap();
    // TODO: return proxy value with tick
    return value as R;
  }

  getResourceOrInit<R extends object>(resType: Constructor<R>, caller?: string): R {
    const changeTick = this.changeTick;
    const lastChangeTick = this.__lastChangeTick;
    const componentId = this.components.registerResource(resType);
    let data = this.initializeResourceInternal(componentId);
    if (!data.isPresent()) {
      const value = fromWorld(this, resType);
      data.insert(value, changeTick, caller);
    }
    const mutData = data.getMut(lastChangeTick, changeTick).unwrap();
    // TODO: return proxy value with tick
    return mutData as R;
  }

  clearAll() {
    this.clearEntities();
    this.clearResources();
  }

  clearEntities() {
    this.storages.tables.clear();
    this.storages.sparseSets.clearEntities();
    this.archetypes.clearEntities();
    this.entities.clear();
  }

  clearResources() {
    this.storages.resources.clear();
  }

  toString() {
    return (
      `World id: ${this.id} ` +
      `entity_count: ${this.entities.len()} ` +
      `archetype_count: ${this.archetypes.len()} ` +
      `component_count: ${this.components.len()} ` +
      `resource_count: ${this.storages.resources.len()}`
    );
  }

  fetchTable(location: EntityLocation, componentId: ComponentId) {
    return this.storages.tables.getUnchecked(location.tableId).getColumn(componentId);
  }

  fetchSparseSet(componentId: ComponentId) {
    return this.storages.sparseSets.get(componentId);
  }

  flush() {
    this.flushEntities();
    this.flushCommands();
  }

  intoDeferred(): DeferredWorld {
    return new DeferredWorld(this.asWorldCell());
  }

  flushEntities() {
    const emptyArchetype = this.archetypes.emptyMut();
    const table = this.storages.tables.getUnchecked(emptyArchetype.tableId);
    // PERF: consider pre-allocating space for flushed entities
    this.entities.flush((entity, location) => {
      location[Mut.ptr] = emptyArchetype.allocate(entity, table.allocate(entity));
    });
  }

  flushCommands() {
    if (!this.__command_queue.isEmpty()) {
      this.__command_queue.applyOrDropQueued(Some(this));
    }
  }

  asWorldCell(): WorldCell {
    return new WorldCell(this);
  }
}

class LastTickGuard {
  lastTick: Tick;
  world: World;

  constructor(world: World, lastTick: Tick) {
    this.world = world;
    this.lastTick = lastTick;
  }

  drop() {
    this.world.__lastChangeTick = this.lastTick;
  }
}

implTrait(World, RunSystemOnce, {
  runSystemOnceWith(system: object, input: any): Result<any, Error> {
    if (!IntoSystem.is(system)) {
      throw new Error('System must implement IntoSystem.');
    }
    const into = (system as IntoSystem).intoSystem();
    into.initialize(this);
    if (into.validateParam(this)) {
      return Ok(into.run(input, this));
    } else {
      return Err(new Error(into.name() + 'InvalidParam'));
    }
  },
});

export interface World extends RunSystemOnce {}
