import { Constructor, Default, hasTrait, useTrait } from 'rustable';
import { World } from './base';

export class FromWorld {
  static fromWorld<T extends object>(_world: World): T {
    throw new Error('Not Implemented');
  }
}

export function fromWorld<T extends object>(world: World, target: Constructor<T>): T {
  if (hasTrait(target, FromWorld)) {
    return useTrait(target, FromWorld).fromWorld(world);
  }
  if (hasTrait(target, Default)) {
    return useTrait(target, Default).default();
  }
  return new target();
}
