import { Clone, Constructor, derive, HashMap } from 'rustable';
import { BundleInfo } from '../bundle/info';
import { Tick } from '../change_detection/tick';
import { Entity } from '../entity/base';
import { SparseSets } from '../storage/sparse_set';
import { Storages } from '../storage/storages';
import { Table } from '../storage/table/table';
import { TableRow } from '../storage/table/types';
import { Components } from './collections';
import { ComponentId, StorageType } from './types';

/**
 * Function type for constructing a required component
 */
export type RequiredComponentConstructor = (
  table: Table,
  sparseSets: SparseSets,
  changeTick: Tick,
  tableRow: TableRow,
  entity: Entity,
  caller?: string,
) => void;

/**
 * Represents a required component with its constructor and inheritance depth
 */
@derive([Clone])
export class RequiredComponent {
  constructor(
    public __constructor: RequiredComponentConstructor,
    public inheritanceDepth: number,
  ) {}
}

export interface RequiredComponent extends Clone {}

/**
 * The collection of metadata for components that are required for a given component.
 */
export class RequiredComponents {
  readonly components = new HashMap<ComponentId, RequiredComponent>();

  /**
   * Registers a required component.
   *
   * If the component is already registered, it will be overwritten if the given inheritance depth
   * is smaller than the depth of the existing registration. Otherwise, the new registration will be ignored.
   */
  registerDynamic(componentId: ComponentId, constructor: RequiredComponentConstructor, inheritanceDepth: number): void {
    this.components.get(componentId).match({
      Some: (component) => {
        if (component.inheritanceDepth > inheritanceDepth) {
          component.__constructor = constructor;
          component.inheritanceDepth = inheritanceDepth;
        }
      },
      None: () => {
        this.components.insert(componentId, new RequiredComponent(constructor, inheritanceDepth));
      },
    });
  }

  /**
   * Registers a required component.
   *
   * If the component is already registered, it will be overwritten if the given inheritance depth
   * is smaller than the depth of the existing registration. Otherwise, the new registration will be ignored.
   */
  register<C extends object>(
    components: Components,
    storages: Storages,
    constructor: Constructor<C>,
    inheritanceDepth: number,
  ): void {
    const componentId = components.registerComponent<C>(constructor, storages);
    this.registerById(componentId, () => new constructor(), inheritanceDepth);
  }

  /**
   * Registers the Component with the given ID as required if it exists.
   */
  registerById<C>(componentId: ComponentId, customCreator: () => C, inheritanceDepth: number): void {
    const erased: RequiredComponentConstructor = (
      table: Table,
      sparseSets: SparseSets,
      changeTick: Tick,
      tableRow: TableRow,
      entity: Entity,
      caller?: string,
    ) => {
      const component = customCreator();
      BundleInfo.initializeRequiredComponent(
        table,
        sparseSets,
        changeTick,
        tableRow,
        entity,
        componentId,
        StorageType.Table,
        component,
        caller,
      );
    };

    this.registerDynamic(componentId, erased, inheritanceDepth);
  }

  /**
   * Iterates the ids of all required components. This includes recursive required components.
   */
  iterIds(): ComponentId[] {
    return Array.from(this.components.keys());
  }

  /**
   * Removes components that are explicitly provided in a given Bundle. These components should
   * be logically treated as normal components, not "required components".
   */
  removeExplicitComponents(components: Iterable<ComponentId>): void {
    for (const component of components) {
      this.components.remove(component);
    }
  }

  /**
   * Merges required_components into this collection. This only inserts a required component
   * if it did not already exist.
   */
  merge(requiredComponents: RequiredComponents): void {
    for (const [id, component] of requiredComponents.components) {
      if (!this.components.containsKey(id)) {
        this.components.insert(id, component.clone());
      }
    }
  }

  toString(): string {
    return `RequiredComponents(${Array.from(this.components.keys()).join(', ')})`;
  }
}
