import { Constructor, hasTrait, None, Option, Some } from 'rustable';
import { Tick } from '../change_detection/tick';
import { Component } from '../component/base';
import { Access } from '../query/access';
import { World } from '../world/base';
import { WorldCell } from '../world/cell';
import { SystemMeta } from './types';

const ERROR_UNINITIALIZED = "System's state was not found. Did you forget to initialize this system before running it?";

/**
 * The state of a FunctionSystem
 */
interface FunctionSystemState<P> {
  param: P;
  worldId: number;
}

export function systemFn<T extends (...args: any[]) => any>(
  paramTypes: Constructor<any>[],
  func: T,
): FunctionSystem<T> {
  return new FunctionSystem(func, paramTypes);
}

/**
 * The function system implementation
 */
export class FunctionSystem<T extends (...args: any[]) => any> {
  state: Option<FunctionSystemState<any>>;
  meta: SystemMeta;
  archetypeGeneration: number;

  constructor(
    public func: T,
    public paramTypes: Constructor<any>[],
  ) {
    this.state = None;
    this.meta = SystemMeta.new(func.name || 'anonymous_system');
    this.archetypeGeneration = 0;
  }

  name(): string {
    return this.meta.name;
  }

  componentAccess(): Access {
    return this.meta.componentAccessSet;
  }

  archetypeComponentAccess(): Access {
    return this.meta.archetypeComponentAccess;
  }

  isSend(): boolean {
    return true;
  }

  isExclusive(): boolean {
    return false;
  }

  hasDeferred(): boolean {
    return this.meta.hasDeferred;
  }

  withName(newName: string): this {
    this.meta.name = newName;
    return this;
  }

  run(_input: void, world: World): any {
    const changeTick = world.changeTick;
    const paramState = this.state.expect(ERROR_UNINITIALIZED).param;
    const params = this.getSystemParams(paramState, this.meta, world, changeTick);
    const out = this.func(params);
    this.meta.lastRun = changeTick;
    return out;
  }

  validateParam(world: World): boolean {
    const paramState = this.state.expect(ERROR_UNINITIALIZED).param;
    const isValid = this.validateSystemParams(paramState, this.meta, world);
    if (!isValid) {
      this.meta.advanceParamWarnPolicy();
    }
    return isValid;
  }

  initialize(world: World): void {
    if (this.state.isSome()) {
      const state = this.state.unwrap();
      if (state.worldId !== world.id) {
        throw new Error('System built with a different world than the one it was added to.');
      }
    } else {
      this.state = Some({
        param: this.initSystemParams(world),
        worldId: world.id,
      });
    }
    this.meta.lastRun = world.changeTick;
  }

  updateArchetypeComponentAccess(_world: WorldCell): void {
    // This method is called with WorldCell, but we need World
    // We can access the World through WorldCell.world
    const world = _world.world;
    const state = this.state.expect(ERROR_UNINITIALIZED);
    if (state.worldId !== world.id) {
      throw new Error(
        'Encountered a mismatched World. A System cannot be used with Worlds other than the one it was initialized with.',
      );
    }

    const archetypes = world.archetypes;
    const oldGeneration = this.archetypeGeneration;
    this.archetypeGeneration = archetypes.len();

    for (let i = oldGeneration; i < archetypes.len(); i++) {
      const archetype = archetypes.get(i);
      if (archetype.isSome()) {
        this.updateSystemParamsArchetype(state.param, archetype.unwrap(), this.meta);
      }
    }
  }

  getSystemParams(paramState: any, _meta: SystemMeta, _world: World, _changeTick: Tick): any {
    // This needs to be implemented based on your system parameter implementation
    return paramState;
  }

  validateSystemParams(_paramState: any, _meta: SystemMeta, _world: World): boolean {
    // This needs to be implemented based on your system parameter validation logic
    return true;
  }

  initSystemParams(world: World): any {
    const params: any[] = [];

    return params;
  }

  updateSystemParamsArchetype(paramState: any, archetype: any, meta: SystemMeta): void {
    // Update component access for the new archetype
    for (const [index, paramType] of this.paramTypes.entries()) {
      if (hasTrait(paramType, Component)) {
        const componentId = archetype.components.get(index);
        if (componentId.isSome()) {
          const id = componentId.unwrap();
          meta.archetypeComponentAccess.__componentReadAndWrites.growAndInsert(id);
          meta.archetypeComponentAccess.__componentWrites.growAndInsert(id);
        }
      }
    }
  }
}
