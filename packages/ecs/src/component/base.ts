import { hasTrait, trait, Vec } from 'rustable';
import { Storages } from '../storage/storages';
import { ComponentCloneHandler } from './clone_handler';
import { Components } from './collections';
import { ComponentHooks } from './hooks';
import { RequiredComponents } from './required_components';
import { ComponentId, storageSymbol, StorageType } from './types';
import { TraitValid } from '@minigame/utils';

@trait
export class Component extends TraitValid {
  static [storageSymbol]?: StorageType;
  static registerRequiredComponents(
    _componentId: number,
    _components: Components,
    _storages: Storages,
    _requiredComponents: RequiredComponents,
    _inheritanceDepth: number,
    _recursionCheckStack: Vec<ComponentId>,
  ): void {}
  static registerComponentHooks(_hooks: ComponentHooks): void {}
  static getComponentCloneHandler(): ComponentCloneHandler {
    return ComponentCloneHandler.Default();
  }

  static isComponent(component: any): boolean {
    return hasTrait(component, Component);
  }
  static validComponent(component: any): void {
    if (!hasTrait(component, Component)) {
      throw new Error(`Component ${component.name} does not implement Component trait`);
    }
  }
  static storageType(): StorageType {
    return this[storageSymbol] ?? StorageType.Table;
  }
}
