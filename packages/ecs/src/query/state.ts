import { FixedBitSet, logger } from '@minigame/utils';
import { deepClone, Err, iter, Mut, None, Ok, Option, Result, RustIter, Some, Vec } from 'rustable';
import { Archetype } from '../archetype/base';
import { ArchetypeGeneration, ArchetypeId } from '../archetype/types';
import { Tick } from '../change_detection/tick';
import { ComponentId } from '../component/types';
import { Entity } from '../entity/base';
import { TableId } from '../storage/table/types';
import { World } from '../world/base';
import { WorldCell } from '../world/cell';
import { Access, FilteredAccess } from './access';
import { QueryBuilder } from './builder';
import { QueryData } from './fetch';
import { QueryFilter } from './filter/base';
import { QueryEntityError } from './error';

/**
 * An ID for either a table or an archetype. Used for Query iteration.
 *
 * Query iteration is exclusively dense (over tables) or archetypal (over archetypes) based on whether
 * the query filters are dense or not. This is represented by the `QueryState::isDense` field.
 */
export class StorageId {
  constructor(
    public tableId: TableId,
    public archetypeId: ArchetypeId,
  ) {}
}

/**
 * Provides scoped access to a World state according to a given QueryData and QueryFilter.
 */
export class QueryState {
  constructor(
    private __queryData: QueryData,
    private __queryFilter: QueryFilter,
    private __worldId: number,
    private __archetypeGeneration: ArchetypeGeneration,
    private __matchedTables: FixedBitSet,
    private __matchedArchetypes: FixedBitSet,
    private __componentAccess: FilteredAccess,
    private __matchedStorageIds: Vec<StorageId>,
    private __isDense: boolean,
    private __fetchState: any,
    private __filterState: any,
  ) {}

  static new(data: QueryData, filter: QueryFilter, world: World): QueryState {
    const state = QueryState.newUninitialized(data, filter, world);
    state.updateArchetypes(world);
    return state;
  }

  static tryNew(data: QueryData, filter: QueryFilter, world: World): Option<QueryState> {
    const state = QueryState.tryNewUninitialized(data, filter, world);
    if (state.isSome()) {
      state.unwrap().updateArchetypes(world);
      return state;
    }
    return None;
  }

  static newWithAccess(data: QueryData, filter: QueryFilter, world: World, access: Mut<Access>): QueryState {
    const state = QueryState.newUninitialized(data, filter, world);
    for (const archetype of world.archetypes.iter()) {
      if (state.newArchetypeInternal(archetype)) {
        state.updateArchetypeComponentAccess(archetype, access);
      }
    }
    state.__archetypeGeneration = world.archetypes.generation();

    if (state.__componentAccess.access().hasReadAllResources()) {
      access.readAllResources();
    } else {
      for (const componentId of state.__componentAccess.access().resourceReads()) {
        access.addResourceRead(world.initializeResourceInternal(componentId).id);
      }
    }

    if (state.__componentAccess.access().hasWriteAllResources()) {
      access.writeAllResources();
    } else {
      for (const componentId of state.__componentAccess.access().resourceWrites()) {
        access.addResourceWrite(world.initializeResourceInternal(componentId).id);
      }
    }

    return state;
  }

  static newUninitialized(data: QueryData, filter: QueryFilter, world: World): QueryState {
    const fetchState = data.initState(world);
    const filterState = filter.initState(world);
    return QueryState.fromStatesUninitialized(data, filter, world.id, fetchState, filterState);
  }

  static tryNewUninitialized(data: QueryData, filter: QueryFilter, world: World): Option<QueryState> {
    const fetchState = data.getState(world.components);
    if (fetchState.isNone()) {
      return None;
    }

    const filterState = filter.getState(world.components);
    if (filterState.isNone()) {
      return None;
    }

    return Some(QueryState.fromStatesUninitialized(data, filter, world.id, fetchState.unwrap(), filterState.unwrap()));
  }

  static fromStatesUninitialized(
    data: QueryData,
    filter: QueryFilter,
    worldId: number,
    fetchState: any,
    filterState: any,
  ): QueryState {
    let componentAccess = new FilteredAccess();
    data.updateComponentAccess(
      fetchState,
      Mut.of({
        get: () => componentAccess,
        set: (a) => (componentAccess = a),
      }),
    );

    let filterComponentAccess = new FilteredAccess();
    filter.updateComponentAccess(
      filterState,
      Mut.of({
        get: () => filterComponentAccess,
        set: (a) => (filterComponentAccess = a),
      }),
    );

    componentAccess.extend(filterComponentAccess);

    const isDense = data.isDense() && filter.isDense();

    return new QueryState(
      data,
      filter,
      worldId,
      ArchetypeGeneration.initial(),
      new FixedBitSet(),
      new FixedBitSet(),
      componentAccess,
      Vec.new(),
      isDense,
      fetchState,
      filterState,
    );
  }

  static fromBuilder(builder: QueryBuilder): QueryState {
    const fetchState = builder.queryData.initState(builder.world);
    const filterState = builder.queryFilter.initState(builder.world);
    builder.queryData.setAccess(fetchState, builder.access());

    const state = new QueryState(
      builder.queryData,
      builder.queryFilter,
      builder.world.id,
      ArchetypeGeneration.initial(),
      new FixedBitSet(),
      new FixedBitSet(),
      deepClone(builder.access()),
      Vec.new(),
      builder.isDense(),
      fetchState,
      filterState,
    );

    state.updateArchetypes(builder.world);
    return state;
  }

  /**
   * Returns true if the query matches no entities.
   */
  isEmpty(world: World, lastRun: Tick, thisRun: Tick): boolean {
    this.validateWorld(world.id);
    return this.isEmptyUnsafeWorldCell(world.asWorldCell(), lastRun, thisRun);
  }

  /**
   * Returns true if the given Entity matches the query.
   * This is always guaranteed to run in O(1) time.
   */
  contains(entity: Entity, world: World, lastRun: Tick, thisRun: Tick): boolean {
    return this.getUncheckedManual(world.asWorldCell(), entity, lastRun, thisRun).isOk();
  }

  isEmptyUnsafeWorldCell(world: WorldCell, lastRun: Tick, thisRun: Tick): boolean {
    return this.iterUncheckedManual(world, lastRun, thisRun).next().isNone();
  }

  /**
   * Updates the state's internal view of the World's archetypes.
   */
  updateArchetypes(world: World) {
    this.validateWorld(world.id);
    this.updateArchetypesUnsafeWorldCell(world.asWorldCell());
  }

  /**
   * Returns the components accessed by this query.
   */
  get componentAccess(): FilteredAccess {
    return this.__componentAccess;
  }

  /**
   * Returns the tables matched by this query.
   */
  get matchedTables(): RustIter<TableId> {
    return iter(this.__matchedTables.ones());
  }

  /**
   * Returns the archetypes matched by this query.
   */
  get matchedArchetypes(): RustIter<ArchetypeId> {
    return iter(this.__matchedArchetypes.ones());
  }

  /**
   * Updates the state's internal view of the world's archetypes.
   */
  updateArchetypesUnsafeWorldCell(world: WorldCell) {
    this.validateWorld(world.id);
    if (this.__componentAccess.required.isEmpty()) {
      const archetypes = world.archetypes;
      const oldGeneration = this.__archetypeGeneration;
      this.__archetypeGeneration = archetypes.generation();

      for (let i = oldGeneration.id; i < archetypes.len(); i++) {
        this.newArchetypeInternal(archetypes.getUnchecked(i));
      }
    } else {
      if (this.__archetypeGeneration.id === world.archetypes.generation().id) {
        return;
      }

      const potentialArchetypes = iter(this.__componentAccess.required.ones())
        .filterMap((componentId) =>
          world.archetypes
            .componentIndex()
            .get(componentId)
            .map((index) => Vec.from(index.keys())),
        )
        .minByKey((v) => v.len());

      if (potentialArchetypes.isSome()) {
        for (const archetypeId of potentialArchetypes.unwrap()) {
          if (archetypeId < this.__archetypeGeneration.id) {
            continue;
          }
          const archetype = world.archetypes.getUnchecked(archetypeId);
          this.newArchetypeInternal(archetype);
        }
      }
      this.__archetypeGeneration = world.archetypes.generation();
    }
  }

  /**
   * Validates that the given WorldId matches the World used to create this QueryState.
   */
  validateWorld(worldId: number) {
    if (this.__worldId !== worldId) {
      throw new Error(
        `Encountered a mismatched World. This QueryState was created from ${this.__worldId}, but a method was called using ${worldId}.`,
      );
    }
  }

  /**
   * Processes a new archetype and updates the internal state.
   * @param archetype The archetype to process.
   * @param access The access to update.
   * @returns void
   */
  newArchetype(archetype: Archetype, access: Mut<Access>): void {
    // SAFETY: The caller ensures that `archetype` is from the World the state was initialized from.
    const matches = this.newArchetypeInternal(archetype);
    if (matches) {
      // SAFETY: The caller ensures that `archetype` is from the World the state was initialized from.
      this.updateArchetypeComponentAccess(archetype, access);
    }
  }

  /**
   * Process the given Archetype to update internal metadata about the Tables and Archetypes that are matched by this query.
   */
  private newArchetypeInternal(archetype: Archetype): boolean {
    if (
      this.__queryData.matchesComponentSet(this.__fetchState, (id) => archetype.contains(id)) &&
      this.__queryFilter.matchesComponentSet(this.__filterState, (id) => archetype.contains(id)) &&
      this.matchesComponentSet((id) => archetype.contains(id))
    ) {
      const archetypeIndex = archetype.id;
      if (!this.__matchedArchetypes.contains(archetypeIndex)) {
        this.__matchedArchetypes.growAndInsert(archetypeIndex);
        if (!this.__isDense) {
          this.__matchedStorageIds.push(new StorageId(0, archetype.id));
        }
      }

      const tableIndex = archetype.tableId;
      if (!this.__matchedTables.contains(tableIndex)) {
        this.__matchedTables.growAndInsert(tableIndex);
        if (this.__isDense) {
          this.__matchedStorageIds.push(new StorageId(archetype.tableId, 0));
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Returns true if this query matches a set of components.
   */
  matchesComponentSet(setContainsId: (componentId: ComponentId) => boolean): boolean {
    return this.__componentAccess.filterSets
      .iter()
      .any(
        (set) =>
          iter(set.with.ones()).all((index) => setContainsId(index)) &&
          iter(set.without.ones()).all((index) => !setContainsId(index)),
      );
  }

  updateArchetypeComponentAccess(archetype: Archetype, access: Mut<Access>): void {
    const [componentReadsAndWrites, componentReadsAndWritesInverted] = this.componentAccess
      .access()
      .componentReadsAndWrites();
    const [componentWrites, componentWritesInverted] = this.componentAccess.access().componentWrites();

    if (!componentReadsAndWritesInverted && !componentWritesInverted) {
      iter(componentReadsAndWrites).forEach((id) => {
        const archetypeComponentId = archetype.getArchetypeComponentId(id);
        if (archetypeComponentId.isSome()) {
          access.addComponentRead(archetypeComponentId.unwrap());
        }
      });
      iter(componentWrites).forEach((id) => {
        const archetypeComponentId = archetype.getArchetypeComponentId(id);
        if (archetypeComponentId.isSome()) {
          access.addComponentWrite(archetypeComponentId.unwrap());
        }
      });
      return;
    }

    for (const [componentId, archetypeComponentId] of archetype.componentsWithArchetypeComponentId()) {
      if (this.componentAccess.access().hasComponentRead(componentId)) {
        access.addComponentRead(archetypeComponentId);
      }
      if (this.componentAccess.access().hasComponentWrite(componentId)) {
        access.addComponentWrite(archetypeComponentId);
      }
    }
  }

  transmute(newD: QueryData, world: WorldCell): QueryState {
    return this.transmuteFiltered(newD, [], world);
  }

  transmuteFiltered<NewD extends QueryData, NewF extends QueryFilter>(
    newD: NewD,
    newF: NewF,
    world: WorldCell,
  ): QueryState {
    this.validateWorld(world.id);

    let componentAccess = new FilteredAccess();
    const fetchState = newD.getState(world.components);
    const filterState = newF.getState(world.components);

    newD.setAccess(fetchState, this.__componentAccess);
    newD.updateComponentAccess(
      fetchState,
      Mut.of({
        get: () => componentAccess,
        set: (a) => (componentAccess = a),
      }),
    );

    let filterComponentAccess = new FilteredAccess();
    newF.updateComponentAccess(
      filterState,
      Mut.of({
        get: () => filterComponentAccess,
        set: (a) => (filterComponentAccess = a),
      }),
    );

    componentAccess.extend(filterComponentAccess);

    if (!componentAccess.isSubset(this.__componentAccess)) {
      throw new Error(
        `Transmuted state for ${newD.constructor.name}, ${newF.constructor.name} attempts to access terms that are not allowed by original state ${this.__queryData.constructor.name}, ${this.__queryFilter.constructor.name}.`,
      );
    }

    return new QueryState(
      newD,
      newF,
      this.__worldId,
      this.__archetypeGeneration,
      this.__matchedTables.clone(),
      this.__matchedArchetypes.clone(),
      deepClone(this.__componentAccess),
      deepClone(this.__matchedStorageIds),
      this.__isDense,
      fetchState,
      filterState,
    );
  }

  join(orderD: QueryData, newD: QueryData, world: WorldCell, other: QueryState): QueryState {
    return this.joinFiltered(orderD, [], newD, [], world, other);
  }

  joinFiltered<OtherD extends QueryData, OtherF extends QueryFilter, NewD extends QueryData, NewF extends QueryFilter>(
    orderD: OtherD,
    orderF: OtherF,
    newD: NewD,
    newF: NewF,
    world: WorldCell,
    other: QueryState,
  ): QueryState {
    if (this.__worldId !== other.__worldId) {
      throw new Error('Joining queries initialized on different worlds is not allowed.');
    }
    this.validateWorld(world.id);

    let componentAccess = new FilteredAccess();
    const newFetchState = newD.getState(world.components);
    const newFilterState = newF.getState(world.components);

    newD.setAccess(newFetchState, this.__componentAccess);
    newD.updateComponentAccess(
      newFetchState,
      Mut.of({
        get: () => componentAccess,
        set: (a) => (componentAccess = a),
      }),
    );

    let newFilterComponentAccess = new FilteredAccess();
    newF.updateComponentAccess(
      newFilterState,
      Mut.of({
        get: () => newFilterComponentAccess,
        set: (a) => (newFilterComponentAccess = a),
      }),
    );

    componentAccess.extend(newFilterComponentAccess);

    let joinedComponentAccess = deepClone(this.__componentAccess);
    joinedComponentAccess.extend(other.__componentAccess);

    if (!componentAccess.isSubset(joinedComponentAccess)) {
      throw new Error(
        `Joined state for ${newD.constructor.name}, ${newF.constructor.name} attempts to access terms that are not allowed by state ${this.__queryData.constructor.name}, ${this.__queryFilter.constructor.name} joined with ${orderD.constructor.name}, ${orderF.constructor.name}.`,
      );
    }

    if (this.__archetypeGeneration !== other.__archetypeGeneration) {
      logger.warn(
        'You have tried to join queries with different archetype_generations. This could lead to unpredictable results.',
      );
    }

    const isDense = this.__isDense && other.__isDense;

    let matchedTables = this.__matchedTables.clone();
    let matchedArchetypes = this.__matchedArchetypes.clone();
    matchedTables.intersectWith(other.__matchedTables);
    matchedArchetypes.intersectWith(other.__matchedArchetypes);

    const matchedStorageIds = isDense
      ? iter(matchedTables.ones())
          .map((id) => new StorageId(id, 0))
          .collectInto((v) => Vec.from(v))
      : iter(matchedArchetypes.ones())
          .map((id) => new StorageId(0, id))
          .collectInto((v) => Vec.from(v));

    return new QueryState(
      newD,
      newF,
      this.__worldId,
      this.__archetypeGeneration,
      matchedTables,
      matchedArchetypes,
      joinedComponentAccess,
      matchedStorageIds,
      isDense,
      newFetchState,
      newFilterState,
    );
  }

  /**
   * Gets the query result for the given World and Entity.
   */
  get(world: World, entity: Entity): Result<any, QueryEntityError> {
    this.updateArchetypes(world);
    return this.getUncheckedManual(world.asWorldCell(), entity, world.lastChangeTick, world.changeTick);
  }

  getMany(world: World, entities: Entity[]): Result<any[], QueryEntityError> {
    this.updateArchetypes(world);
    return this.getManyReadOnlyManual(world.asWorldCell(), entities, world.lastChangeTick, world.changeTick);
  }

  getMut(world: World, entity: Entity): Result<any, QueryEntityError> {
    this.updateArchetypes(world);
    const changeTick = world.changeTick;
    const lastChangeTick = world.lastChangeTick;
    return this.getUncheckedManual(world.asWorldCell(), entity, lastChangeTick, changeTick);
  }

  getManyMut(world: World, entities: Entity[]): Result<any[], QueryEntityError> {
    this.updateArchetypes(world);
    const changeTick = world.changeTick;
    const lastChangeTick = world.lastChangeTick;
    return this.getManyUncheckedManual(world.asWorldCell(), entities, lastChangeTick, changeTick);
  }

  getUnchecked(world: WorldCell, entity: Entity): Result<any, QueryEntityError> {
    this.updateArchetypesUnsafeWorldCell(world);
    return this.getUncheckedManual(world, entity, world.lastChangeTick, world.changeTick);
  }

  getUncheckedManual(world: WorldCell, entity: Entity, lastRun: Tick, thisRun: Tick): Result<any, QueryEntityError> {
    const locationOp = world.entities.get(entity);
    if (locationOp.isNone()) {
      return Err(QueryEntityError.NoSuchEntity(entity, world));
    }

    const location = locationOp.unwrap();
    if (!this.__matchedArchetypes.contains(location.archetypeId)) {
      return Err(QueryEntityError.QueryDoesNotMatch(entity, world));
    }

    const archetype = world.archetypes.getUnchecked(location.archetypeId);
    let fetch = this.__queryData.initFetch(world, this.__fetchState, lastRun, thisRun);
    let filter = this.__queryFilter.initFetch(world, this.__filterState, lastRun, thisRun);
    const table = world.storages.tables.getUnchecked(location.tableId);

    this.__queryData.setArchetype(fetch, this.__fetchState, archetype, table);
    this.__queryFilter.setArchetype(filter, this.__filterState, archetype, table);

    if (this.__queryFilter.filterFetch(filter, entity, location.tableRow)) {
      return Ok(this.__queryData.fetch(fetch, entity, location.tableRow));
    } else {
      return Err(QueryEntityError.QueryDoesNotMatch(entity, world));
    }
  }

  getManyReadOnlyManual(
    world: WorldCell,
    entities: Entity[],
    lastRun: Tick,
    thisRun: Tick,
  ): Result<any[], QueryEntityError> {
    const values: any[] = new Array(entities.length);
    for (let i = 0; i < entities.length; i++) {
      const result = this.getUncheckedManual(world, entities[i], lastRun, thisRun);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }
      values[i] = result.unwrap();
    }
    return Ok(values);
  }

  getManyUncheckedManual(
    world: WorldCell,
    entities: Entity[],
    lastRun: Tick,
    thisRun: Tick,
  ): Result<any[], QueryEntityError> {
    // Verify that all entities are unique
    for (let i = 0; i < entities.length; i++) {
      for (let j = 0; j < i; j++) {
        if (entities[i] === entities[j]) {
          return Err(QueryEntityError.AliasedMutability(entities[i]));
        }
      }
    }

    const values: any[] = new Array(entities.length);
    for (let i = 0; i < entities.length; i++) {
      const result = this.getUncheckedManual(world, entities[i], lastRun, thisRun);
      if (result.isErr()) {
        return Err(result.unwrapErr());
      }
      values[i] = result.unwrap();
    }

    return Ok(values);
  }
}
