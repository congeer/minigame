import { Constructor, implTrait, iter, Option, trait, typeId, useTrait, Vec } from 'rustable';
import { Component } from '../component/base';
import { Components } from '../component/collections';
import { RequiredComponents } from '../component/required_components';
import { ComponentId, StorageType } from '../component/types';
import { Storages } from '../storage/storages';

@trait
export class DynamicBundle {
  getComponents(ids: (storageType: StorageType, component: Component) => void) {
    if (Symbol.iterator in this) {
      for (const item of this as any) {
        ids(useTrait(item.constructor as Constructor<Component>, Component).storageType(), item);
      }
      return;
    } else {
      throw new Error('Bundle does not implement Component trait');
    }
  }
}

@trait
export class Bundle extends DynamicBundle {
  static componentIds(_components: Components, _storages: Storages, _ids: (componentId: ComponentId) => void) {
    throw new Error('Method not implemented.');
  }
  static getComponentIds(_components: Components, _ids: (id: Option<ComponentId>) => void): void {
    throw new Error('Method not implemented.');
  }
  static fromComponents<T>(_ctx: T, _func: (t: T) => Bundle): any {
    throw new Error('Method not implemented.');
  }
  static registerRequiredComponents(
    _components: Components,
    _storages: Storages,
    _requiredComponents: RequiredComponents,
  ): void {
    throw new Error('Method not implemented.');
  }
}

implTrait(Component, DynamicBundle, {
  getComponents(this: Component, ids: (storageType: StorageType, component: Component) => void) {
    ids(useTrait(this.constructor as Constructor<Component>, Component).storageType(), this);
  },
});

implTrait(Component, Bundle, {
  componentIds(components: Components, storages: Storages, ids: (componentId: ComponentId) => void) {
    ids(components.registerComponent(this as any, storages));
  },
  getComponentIds(components: Components, ids: (id: Option<ComponentId>) => void): void {
    ids(components.getId(typeId(this)));
  },
  fromComponents<T>(ctx: T, func: (t: T) => Bundle): any {
    func(ctx);
    return this;
  },
  registerRequiredComponents(components: Components, storages: Storages, requiredComponents: RequiredComponents): void {
    const componentId = components.registerComponent(this as any, storages);
    Component.registerRequiredComponents(componentId, components, storages, requiredComponents, 0, Vec.new());
  },
});

export interface BundleOptions {
  [key: string]: Constructor<any>;
}

export function bundle(options: BundleOptions) {
  return function (target: Constructor<any>) {
    implTrait(target, DynamicBundle, {
      getComponents(this: any, ids: (storageType: StorageType, component: Component) => void) {
        Object.keys(options).forEach((key) => {
          ids(useTrait(options[key], Component).storageType(), this[key]);
        });
      },
    });

    implTrait(target, Bundle, {
      componentIds(components: Components, storages: Storages, ids: (componentId: ComponentId) => void) {
        Object.keys(options).forEach((key) => {
          useTrait(options[key], Bundle).componentIds(components, storages, ids);
        });
      },
      getComponentIds(components: Components, ids: (id: Option<ComponentId>) => void): void {
        Object.keys(options).forEach((key) => {
          useTrait(options[key], Bundle).getComponentIds(components, ids);
        });
      },
      fromComponents<T>(ctx: T, func: (t: T) => Bundle): any {
        Object.keys(options).forEach((key) => {
          useTrait(options[key], Bundle).fromComponents(ctx, func);
        });
        return this;
      },
      registerRequiredComponents(
        components: Components,
        storages: Storages,
        requiredComponents: RequiredComponents,
      ): void {
        Object.keys(options).forEach((key) => {
          useTrait(options[key], Bundle).registerRequiredComponents(components, storages, requiredComponents);
        });
      },
    });
  };
}

export function iterBundle(iterator: Iterable<any>) {
  const options: BundleOptions = {};
  for (const [index, component] of iter(iterator).enumerate()) {
    options[index] = (component as any).constructor;
  }
  @bundle(options)
  class IterableBundle {
    [index: number]: any;
  }
  const ib = new IterableBundle();
  for (const [index, component] of iter(iterator).enumerate()) {
    ib[index] = component;
  }
  return ib;
}
