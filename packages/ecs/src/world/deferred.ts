import { Constructor, Option, Result, RustIter, useTrait } from 'rustable';
import { Archetype } from '../archetype/base';
import { ComponentId } from '../component/types';
import { Entity } from '../entity/base';
import { Observers } from '../observer/observers';
import { Traversal } from '../traversal';
import { WorldCell } from './cell';
import { EntityFetchError, intoEntityFetch } from './entry_fetch';

export class DeferredWorld {
  constructor(public world: WorldCell) {}

  get commands() {
    return this.world.commands;
  }

  resource<R extends object>(R: Constructor<R>): R {
    return this.getResource(R).expect(`Resource ${R.name} does not exist`);
  }

  getResource<R extends object>(R: Constructor<R>): Option<R> {
    return this.world.getResource(R);
  }

  getEntity(entities: any): Result<any, EntityFetchError> {
    const cell = this.world;

    // SAFETY: `this` gives read access to the entire world, and prevents mutable access.
    return intoEntityFetch(entities).fetchRef(cell);
  }

  triggerOnAdd(archetype: Archetype, entity: Entity, targets: RustIter<ComponentId>) {
    if (archetype.hasAddHook()) {
      for (const componentId of targets) {
        const hooks = this.world.components.getInfoUnchecked(componentId).hooks;
        hooks.onAddHook.map((hook) => hook(new DeferredWorld(this.world), entity, componentId));
      }
    }
  }

  triggerOnInsert(archetype: Archetype, entity: Entity, targets: RustIter<ComponentId>) {
    if (archetype.hasInsertHook()) {
      for (const componentId of targets) {
        const hooks = this.world.components.getInfoUnchecked(componentId).hooks;
        hooks.onInsertHook.map((hook) => hook(new DeferredWorld(this.world), entity, componentId));
      }
    }
  }

  triggerOnReplace(archetype: Archetype, entity: Entity, targets: RustIter<ComponentId>) {
    if (archetype.hasReplaceHook()) {
      for (const componentId of targets) {
        const hooks = this.world.components.getInfoUnchecked(componentId).hooks;
        hooks.onReplaceHook.map((hook) => hook(new DeferredWorld(this.world), entity, componentId));
      }
    }
  }

  triggerOnRemove(archetype: Archetype, entity: Entity, targets: RustIter<ComponentId>) {
    if (archetype.hasRemoveHook()) {
      for (const componentId of targets) {
        const hooks = this.world.components.getInfoUnchecked(componentId).hooks;
        hooks.onRemoveHook.map((hook) => hook(new DeferredWorld(this.world), entity, componentId));
      }
    }
  }

  triggerObservers(event: ComponentId, target: Entity, components: Iterable<ComponentId>): void {
    Observers.invoke<void>(this, event, target, components, undefined, { value: false });
  }

  triggerObserversWithData<E, T extends object>(
    t: Constructor<T>,
    event: ComponentId,
    target: Entity,
    components: ComponentId[],
    data: E,
    propagate: { value: boolean },
  ): void {
    let currentTarget = target;
    while (true) {
      Observers.invoke<E>(this, event, currentTarget, components, data, propagate);
      if (!propagate.value) {
        break;
      }
      const op = this.getEntity(currentTarget)
        .ok()
        .andThen((entity) => entity.getComponents(t))
        .andThen((item) => useTrait(t, Traversal).traverse(item, data));
      if (op.isSome()) {
        currentTarget = op.unwrap();
      } else {
        break;
      }
    }
  }
}
