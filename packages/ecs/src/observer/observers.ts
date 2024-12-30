import { HashMap, None, Option, Some } from 'rustable';
import { ArchetypeFlags } from '../archetype/types';
import { ComponentId } from '../component/types';
import { CachedObservers } from './types';
import { ON_ADD, ON_INSERT, ON_REMOVE, ON_REPLACE } from '../world/component_constants';
import { DeferredWorld } from '../world/deferred';
import { Entity } from '../entity/base';

export class Observers {
  constructor(
    // Cached ECS observers to save a lookup most common triggers.
    public onAdd: CachedObservers = new CachedObservers(),
    public onInsert: CachedObservers = new CachedObservers(),
    public onReplace: CachedObservers = new CachedObservers(),
    public onRemove: CachedObservers = new CachedObservers(),
    // Map from trigger type to set of observers
    public cache: HashMap<ComponentId, CachedObservers> = new HashMap(),
  ) {}

  getObservers(eventType: ComponentId): CachedObservers {
    switch (eventType) {
      case ON_ADD:
        return this.onAdd;
      case ON_INSERT:
        return this.onInsert;
      case ON_REPLACE:
        return this.onReplace;
      case ON_REMOVE:
        return this.onRemove;
      default:
        return this.cache.get(eventType).unwrapOrElse(() => {
          const observers = new CachedObservers();
          this.cache.insert(eventType, observers);
          return observers;
        });
    }
  }

  tryGetObservers(eventType: ComponentId): Option<CachedObservers> {
    switch (eventType) {
      case ON_ADD:
        return Some(this.onAdd);
      case ON_INSERT:
        return Some(this.onInsert);
      case ON_REPLACE:
        return Some(this.onReplace);
      case ON_REMOVE:
        return Some(this.onRemove);
      default:
        return this.cache.get(eventType);
    }
  }

  static invoke<T>(
    world: DeferredWorld,
    eventType: ComponentId,
    target: Entity,
    components: Iterable<ComponentId>,
    data: T,
    propagate: { value: boolean },
  ): void {
    // TODO
  }

  static isArchetypeCached(eventType: ComponentId): Option<ArchetypeFlags> {
    switch (eventType) {
      case ON_ADD:
        return Some(ArchetypeFlags.ON_ADD_OBSERVER);
      case ON_INSERT:
        return Some(ArchetypeFlags.ON_INSERT_OBSERVER);
      case ON_REPLACE:
        return Some(ArchetypeFlags.ON_REPLACE_OBSERVER);
      case ON_REMOVE:
        return Some(ArchetypeFlags.ON_REMOVE_OBSERVER);
      default:
        return None;
    }
  }

  updateArchetypeFlags(componentId: ComponentId, flags: ArchetypeFlags): void {
    if (this.onAdd.componentObservers.containsKey(componentId)) {
      flags.insert(ArchetypeFlags.ON_ADD_OBSERVER);
    }
    if (this.onInsert.componentObservers.containsKey(componentId)) {
      flags.insert(ArchetypeFlags.ON_INSERT_OBSERVER);
    }
    if (this.onReplace.componentObservers.containsKey(componentId)) {
      flags.insert(ArchetypeFlags.ON_REPLACE_OBSERVER);
    }
    if (this.onRemove.componentObservers.containsKey(componentId)) {
      flags.insert(ArchetypeFlags.ON_REMOVE_OBSERVER);
    }
  }
}
