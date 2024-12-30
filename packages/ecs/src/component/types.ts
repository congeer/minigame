import { hasTrait, None, Option, Some, trait, typeId, TypeId } from 'rustable';

export enum StorageType {
  /** Optimized for query iteration */
  Table = 'Table',
  /** Optimized for component insertion and removal */
  SparseSet = 'SparseSet',
}

export class ComponentDescriptor {
  name: string;
  storageType: StorageType;
  typeId: Option<TypeId>;
  mutable: boolean;
  drop: Option<(value: any) => void>;

  constructor(component: any) {
    this.name = component.name;
    this.storageType = component[storageSymbol] ?? StorageType.Table;
    this.typeId = Some(typeId(component));
    this.mutable = component[mutSymbol] ?? true;
    this.drop = component[dropSymbol] ? Some(component.drop) : None;
  }

  static new(component: any): ComponentDescriptor {
    return new ComponentDescriptor(component);
  }
}

export type ComponentId = number;

export type ComponentConstructor<T> = () => T;

@trait
export class Resource {}

export const isResource = (component: any): boolean => {
  return hasTrait(component, Resource);
};

export const validResource = (component: any) => {
  if (!hasTrait(component, Resource)) {
    throw new Error(`Component ${component.name} does not implement Resource trait`);
  }
};

export const storageSymbol = Symbol('COMPONENT_STORAGE');

export const dropSymbol = Symbol('COMPONENT_DROP');

export const mutSymbol = Symbol('COMPONENT_MUT');

export class RequiredComponentsError extends Error {
  static DuplicateRegistration(requiree: ComponentId, required: ComponentId) {
    return new RequiredComponentsError(`Component ${requiree} already directly requires component ${required}`);
  }

  static ArchetypeExists(component: ComponentId) {
    return new RequiredComponentsError(`Archetype for component ${component} already exists`);
  }

  constructor(message: string) {
    super(message);
  }
}
