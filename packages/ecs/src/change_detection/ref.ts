import { derive } from 'rustable';
import { DetectChanges } from './detect_changes';
import { Tick, Ticks } from './tick';

export interface RefValue<T> extends DetectChanges<T> {}
/**
 * Shared borrow of an entity's component with access to change detection.
 */
@derive(DetectChanges)
export class RefValue<T> {
  _value: T;
  _ticks: Ticks;

  constructor(value: T, ticks: Ticks) {
    this._value = value;
    this._ticks = ticks;
  }

  static new<T>(value: T, added: Tick, lastChanged: Tick, lastRun: Tick, thisRun: Tick): RefValue<T>;
  static new<T>(value: T, ticks: Ticks): RefValue<T>;
  static new<T>(value: T, arg2: any, arg3?: any, arg4?: any, arg5?: any) {
    if (arguments.length === 5) {
      const ticks = new Ticks(arg2, arg3, arg4, arg5);
      return new RefValue(value, ticks);
    } else {
      return new RefValue(value, arg2);
    }
  }
  /**
   * Returns the value wrapped by this type
   */
  get value(): T {
    return this._value;
  }
  get ticks(): Ticks {
    return this._ticks;
  }

  /**
   * Map Ref to a different type using f
   */
  map<U>(f: (value: T) => U): RefValue<U> {
    return new RefValue<U>(f(this.value), this._ticks);
  }
}
