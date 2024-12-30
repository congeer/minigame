import { Component } from '../component/base';
import { ComponentStorage } from './types';

/**
 * Table storage implementation that stores components in a dense array
 * with a mapping from entity ID to array index.
 */
export class TableStorage<T extends Component> implements ComponentStorage<T> {
  private __components: T[] = [];
  private __entityToIndex = new Map<number, number>();
  private __indexToEntity = new Map<number, number>();

  insert(entityId: number, component: T): void {
    if (this.__entityToIndex.has(entityId)) {
      const index = this.__entityToIndex.get(entityId)!;
      this.__components[index] = component;
      return;
    }

    const index = this.__components.length;
    this.__components.push(component);
    this.__entityToIndex.set(entityId, index);
    this.__indexToEntity.set(index, entityId);
  }

  remove(entityId: number): void {
    const index = this.__entityToIndex.get(entityId);
    if (index === undefined) return;

    // If this is the last element, just pop it
    if (index === this.__components.length - 1) {
      this.__components.pop();
      this.__entityToIndex.delete(entityId);
      this.__indexToEntity.delete(index);
      return;
    }

    // Otherwise, swap with the last element and pop
    const lastIndex = this.__components.length - 1;
    const lastEntityId = this.__indexToEntity.get(lastIndex)!;

    // Move the last element to the removed position
    this.__components[index] = this.__components[lastIndex];
    this.__components.pop();

    // Update mappings
    this.__entityToIndex.set(lastEntityId, index);
    this.__entityToIndex.delete(entityId);
    this.__indexToEntity.set(index, lastEntityId);
    this.__indexToEntity.delete(lastIndex);
  }

  get(entityId: number): T | undefined {
    const index = this.__entityToIndex.get(entityId);
    return index !== undefined ? this.__components[index] : undefined;
  }

  has(entityId: number): boolean {
    return this.__entityToIndex.has(entityId);
  }

  getEntities(): number[] {
    return Array.from(this.__entityToIndex.keys());
  }

  getComponents(): T[] {
    return [...this.__components];
  }

  clear(): void {
    this.__components = [];
    this.__entityToIndex.clear();
    this.__indexToEntity.clear();
  }
}
