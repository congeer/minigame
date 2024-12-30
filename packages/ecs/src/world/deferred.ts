import { Constructor, Option, RustIter } from 'rustable';
import { Archetype } from '../archetype/base';
import { Entity } from '../entity/base';
import { WorldCell } from './cell';
import { ComponentId } from '../component/types';
import { Observers } from '../observer/observers';

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
}
