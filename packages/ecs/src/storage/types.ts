import { Component } from '../component/base';

export interface ComponentStorage<T extends Component = Component> {
  // Insert a component for an entity
  insert(entityId: number, component: T): void;

  // Remove a component for an entity
  remove(entityId: number): void;

  // Get a component for an entity
  get(entityId: number): T | undefined;

  // Check if an entity has this component
  has(entityId: number): boolean;

  // Get all entities that have this component
  getEntities(): number[];

  // Get all components
  getComponents(): T[];

  // Clear all data
  clear(): void;
}
