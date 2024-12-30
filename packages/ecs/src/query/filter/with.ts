import { Constructor, implTrait, useTrait } from 'rustable';
import { Component } from '../../component/base';
import { Components } from '../../component/collections';
import { ComponentId, StorageType } from '../../component/types';
import { World } from '../../world/base';
import { FilteredAccess } from '../access';
import { WorldQuery } from '../world_query';
import { QueryFilter } from './base';

export class With {
  __isDense: boolean = false;
  constructor(public value: Constructor<any>) {
    const storageType = useTrait(value, Component).storageType();
    this.__isDense = storageType === StorageType.Table;
  }
  static of(value: Constructor<any>) {
    return new With(value);
  }
}

export interface With extends WorldQuery<void, void, boolean>, QueryFilter<void, void, boolean> {}

implTrait(With, WorldQuery, {
  isDense() {
    return this.__isDense;
  },
  shrink() {},
  shrinkFetch() {},
  initFetch() {},
  setArchetype() {},
  setTable() {},
  fetch() {},
  updateComponentAccess(state: ComponentId, access: FilteredAccess) {
    access.andWith(state);
  },
  initState(this: With, world: World) {
    world.registerComponent(this.value);
  },
  getState(this: With, components: Components) {
    return components.componentId(this.value);
  },
  matchesComponentSet(state: ComponentId, setContainsId: (componentId: ComponentId) => boolean) {
    return setContainsId(state);
  },
});

implTrait(With, QueryFilter, {
  isArchetypal() {
    return true;
  },
  filterFetch(_fetch: any, _entity: any, _tableRow: any) {
    return true;
  },
});
