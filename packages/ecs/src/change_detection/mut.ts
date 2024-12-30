import { derive, implFrom, Mut, Option } from 'rustable';
import { DetectChanges, DetectChangesMut } from './detect_changes';
import { RefValue } from './ref';
import { Tick, Ticks } from './tick';

export interface MutValue<T> extends DetectChangesMut<T>, DetectChanges<T> {}

/**
 * Unique mutable borrow of an entity's component or resource
 */
@derive([DetectChangesMut])
export class MutValue<T> {
  __value: Mut<T>;
  __ticks: Ticks;
  __changeBy?: string;

  constructor(value: Mut<T>, ticks: Ticks, changeBy?: string) {
    this.__value = value;
    this.__ticks = ticks;
    this.__changeBy = changeBy;
  }

  static new<T>(value: Mut<T>, added: Tick, lastChanged: Tick, lastRun: Tick, thisRun: Tick): MutValue<T>;
  static new<T>(value: Mut<T>, ticks: Ticks): MutValue<T>;
  static new<T>(value: Mut<T>, arg2: any, arg3?: any, arg4?: any, arg5?: any) {
    if (arguments.length === 5) {
      const ticks = new Ticks(arg2, arg3, arg4, arg5);
      return new MutValue(value, ticks);
    } else {
      return new MutValue(value, arg2);
    }
  }

  get value(): T {
    return this.__value[Mut.ptr];
  }

  get ticks(): Ticks {
    return this.__ticks;
  }

  set value(value: T) {
    this.setChanged();
    this.__value[Mut.ptr] = value;
  }

  get changeBy(): string | undefined {
    return this.__changeBy;
  }

  set changeBy(value: string) {
    this.__changeBy = value;
  }

  /**
   * Convert to a Ref, losing mutable access
   */
  asRef(): RefValue<T> {
    return RefValue.new(
      this.__value[Mut.ptr],
      this.__ticks.added,
      this.__ticks.changed,
      this.__ticks.lastRun,
      this.__ticks.thisRun,
    );
  }

  reborrow(): MutValue<T> {
    return MutValue.new(
      this.__value,
      this.__ticks.added,
      this.__ticks.changed,
      this.__ticks.lastRun,
      this.__ticks.thisRun,
    );
  }

  filterMapUnchanged<U>(f: (value: Mut<T>) => Option<Mut<U>>): Option<MutValue<U>> {
    return f(this.__value).map((value) => {
      return MutValue.new(value, this.__ticks.added, this.__ticks.changed, this.__ticks.lastRun, this.__ticks.thisRun);
    });
  }

  mapUnchanged<U>(f: (value: Mut<T>) => Mut<U>): MutValue<U> {
    return MutValue.new(
      f(this.__value),
      this.__ticks.added,
      this.__ticks.changed,
      this.__ticks.lastRun,
      this.__ticks.thisRun,
    );
  }
}

export interface MutUntyped extends DetectChangesMut<unknown>, DetectChanges<unknown> {}

/**
 * Unique mutable borrow of resources or an entity's component.
 * Similar to Mut, but not generic over the component type
 */
@derive([DetectChangesMut])
export class MutUntyped {
  __value: Mut<unknown>;
  __ticks: Ticks;
  __changeBy?: string;

  constructor(value: Mut<unknown>, ticks: Ticks, changeBy?: string) {
    this.__value = value;
    this.__ticks = ticks;
    this.__changeBy = changeBy;
  }

  static new(value: Mut<unknown>, added: Tick, lastChanged: Tick, lastRun: Tick, thisRun: Tick): MutUntyped;
  static new(value: Mut<unknown>, ticks: Ticks): MutUntyped;
  static new(value: Mut<unknown>, arg2: any, arg3?: any, arg4?: any, arg5?: any) {
    if (arguments.length === 5) {
      const ticks = new Ticks(arg2, arg3, arg4, arg5);
      return new MutUntyped(value, ticks);
    } else {
      return new MutUntyped(value, arg2);
    }
  }
  get ticks(): Ticks {
    return this.__ticks;
  }

  get value(): unknown {
    return this.__value[Mut.ptr];
  }

  set value(value: unknown) {
    this.setChanged();
    this.__value[Mut.ptr] = value;
  }

  get changeBy(): string | undefined {
    return this.__changeBy;
  }

  set changeBy(value: string) {
    this.__changeBy = value;
  }
  /**
   * Returns a MutUntyped with a smaller lifetime
   */
  reborrow(): MutUntyped {
    return new MutUntyped(this.__value, this.__ticks);
  }

  /**
   * Turn this MutUntyped into a Mut by mapping the inner pointer to another value,
   * without flagging a change
   */
  mapUnchanged<T>(f: (ptr: Mut<unknown>) => Mut<T>): MutValue<T> {
    return MutValue.new(
      f(this.__value),
      this.__ticks.added,
      this.__ticks.changed,
      this.__ticks.lastRun,
      this.__ticks.thisRun,
    );
  }

  /**
   * Transforms this MutUntyped into a Mut<T> with the same lifetime
   */
  withType<T>(): MutValue<T> {
    return MutValue.new(
      this.__value as Mut<T>,
      this.__ticks.added,
      this.__ticks.changed,
      this.__ticks.lastRun,
      this.__ticks.thisRun,
    );
  }
}

implFrom(MutUntyped, MutValue, {
  from(source: MutValue<any>): MutUntyped {
    return MutUntyped.new(
      source.__value,
      source.__ticks.added,
      source.__ticks.changed,
      source.__ticks.lastRun,
      source.__ticks.thisRun,
    );
  },
});
