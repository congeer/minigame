import { implTrait, Mut, None, Option, Some, trait } from 'rustable';
import { Archetype } from '../archetype/base';
import { Tick } from '../change_detection/tick';
import { Components } from '../component/collections';
import { ComponentId } from '../component/types';
import { Entity } from '../entity/base';
import { Table } from '../storage/table/table';
import { TableRow } from '../storage/table/types';
import { World } from '../world/base';
import { WorldCell } from '../world/cell';
import { FilteredAccess } from './access';

/**
 * A query that can be run on a World to get a set of components.
 */
@trait
export class WorldQuery<Item = any, Fetch = any, State = any> {
  isDense(): boolean {
    return false;
  }
  /**
   * This function manually implements subtyping for the query items.
   */
  shrink(_item: Item): Item {
    throw new Error('Not implemented');
  }

  /**
   * This function manually implements subtyping for the query fetches.
   */
  shrinkFetch(_fetch: Fetch): Fetch {
    throw new Error('Not implemented');
  }
  /**
   * Initializes the fetch for the query.
   */
  initFetch(_world: WorldCell, _state: State, _lastRun: Tick, _thisRun: Tick): Fetch {
    throw new Error('Not implemented');
  }
  /**
   * Sets the archetype for the fetch.
   */
  setArchetype(_fetch: Fetch, _state: State, _archetype: Archetype, _table: Table): void {
    throw new Error('Not implemented');
  }

  /**
   * Sets the table for the fetch.
   */
  setTable(_fetch: Fetch, _state: State, _table: Table): void {
    throw new Error('Not implemented');
  }

  /**
   * Sets the access for the query.
   */
  setAccess(_state: State, _access: FilteredAccess): void {
    // Implementation not provided
  }

  /**
   * Fetches the query item for the given entity and table row.
   * @param fetch The fetch object.
   * @param entity The entity to fetch for.
   * @param tableRow The table row of the entity.
   * @returns The fetched item.
   */
  fetch(_fetch: Fetch, _entity: Entity, _tableRow: TableRow): Item {
    throw new Error('Not implemented');
  }

  /**
   * Updates the component access for the given state.
   * @param state The query state.
   * @param access The filtered access to update.
   */
  updateComponentAccess(_state: State, _access: Mut<FilteredAccess>): void {
    throw new Error('Not implemented');
  }

  /**
   * Initializes the query state.
   */
  initState(_world: World): State {
    throw new Error('Not implemented');
  }

  getState(_components: Components): Option<State> {
    throw new Error('Not implemented');
  }

  matchesComponentSet(_state: State, _setContainsId: (componentId: ComponentId) => boolean): boolean {
    throw new Error('Not implemented');
  }
}

implTrait(Array<WorldQuery>, WorldQuery, {
  shrink(item: any): any {
    return this.map((q) => q.shrink(item));
  },
  shrinkFetch(fetch: any): any {
    return this.map((q) => q.shrinkFetch(fetch));
  },
  initFetch(world: WorldCell, state: any, lastRun: Tick, thisRun: Tick): any {
    return this.map((q) => q.initFetch(world, state, lastRun, thisRun));
  },
  setArchetype(fetch: any, state: any, archetype: Archetype, table: Table): void {
    this.forEach((q) => q.setArchetype(fetch, state, archetype, table));
  },
  setTable(fetch: any, state: any, table: Table): void {
    this.forEach((q) => q.setTable(fetch, state, table));
  },
  setAccess(state: any, access: FilteredAccess): void {
    this.forEach((q) => q.setAccess(state, access));
  },
  fetch(fetch: any, entity: Entity, tableRow: TableRow): any {
    return this.map((q) => q.fetch(fetch, entity, tableRow));
  },
  updateComponentAccess(state: any, access: Mut<FilteredAccess>): void {
    this.forEach((q) => q.updateComponentAccess(state, access));
  },
  getState(components: Components): Option<any> {
    const ret = [];
    for (const q of this) {
      const state = q.getState(components);
      if (state.isNone()) {
        return None;
      }
      ret.push(state.unwrap());
    }
    return Some(ret);
  },
  matchesComponentSet(state: any, setContainsId: (componentId: ComponentId) => boolean): boolean {
    return this.some((q) => q.matchesComponentSet(state, setContainsId));
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Array<T> extends WorldQuery {}
}
