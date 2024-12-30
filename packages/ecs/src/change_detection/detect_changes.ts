import { Mut, None, Option, Some, stringify, trait } from 'rustable';
import { Tick, Ticks } from './tick';

/**
 * Types that can read change detection information.
 * This change detection is controlled by DetectChangesMut types.
 */
@trait
export class DetectChanges<T> {
  value: T = undefined!;
  ticks?: Ticks;
  changeBy?: string;
  /**
   * Returns true if this value was added after the system last ran.
   */
  isAdded(): boolean {
    if (!this.ticks) {
      return false;
    }
    return this.ticks.added.isNewerThan(this.ticks.lastRun, this.ticks.thisRun);
  }

  /**
   * Returns true if this value was added or mutably dereferenced
   * either since the last time the system ran or, if the system never ran,
   * since the beginning of the program.
   *
   * To check if the value was mutably dereferenced only,
   * use `this.isChanged() && !this.isAdded()`.
   */
  isChanged(): boolean {
    if (!this.ticks) {
      return false;
    }
    return this.ticks.changed.isNewerThan(this.ticks.lastRun, this.ticks.thisRun);
  }

  /**
   * Returns the change tick recording the time this data was most recently changed.
   * Note that components and resources are also marked as changed upon insertion.
   */
  lastChanged(): Tick {
    return this.ticks ? this.ticks.changed : new Tick(0);
  }

  /**
   * The location that last caused this to change.
   */
  changedBy(): string | undefined {
    return this.changeBy;
  }
}

/**
 * Types that implement reliable change detection.
 */
@trait
export class DetectChangesMut<T> extends DetectChanges<T> {
  /**
   * Flags this value as having been changed.
   *
   * Mutably accessing this smart pointer will automatically flag this value as having been changed.
   * However, mutation through interior mutability requires manual reporting.
   */
  setChanged(caller?: string): void {
    if (!this.ticks) {
      return;
    }
    this.ticks.changed.set(this.ticks.thisRun.get());
    this.changeBy = caller;
  }

  /**
   * Manually sets the change tick recording the time when this data was last mutated.
   *
   * Warning: This is a complex and error-prone operation, primarily intended for use with rollback networking strategies.
   * If you merely want to flag this data as changed, use setChanged instead.
   * If you want to avoid triggering change detection, use bypassChangeDetection instead.
   */
  setLastChanged(lastChanged: Tick, caller?: string): void {
    if (!this.ticks) {
      return;
    }
    this.ticks.changed.set(lastChanged.get());
    this.changeBy = caller;
  }
  /**
   * Manually bypasses change detection, allowing you to mutate the underlying value without updating the change tick.
   *
   * Warning: This is a risky operation, that can have unexpected consequences on any system relying on this code.
   * However, it can be an essential escape hatch when, for example,
   * you are trying to synchronize representations using change detection and need to avoid infinite recursion.
   */
  bypassChangeDetection(): Mut<T> {
    if (!this.value) {
      throw new Error('Not implemented');
    }
    return Mut.of({
      get: () => this.value,
      set: (value) => {
        this.value = value;
      },
    });
  }

  /**
   * Overwrites this smart pointer with the given value, if and only if current !== value.
   * Returns true if the value was overwritten, and returns false if it was not.
   *
   * This is useful to ensure change detection is only triggered when the underlying value
   * changes, instead of every time it is mutably accessed.
   */
  setIfNeq(value: T): boolean {
    let old = this.bypassChangeDetection();
    if (stringify(old[Mut.ptr]) !== stringify(value)) {
      old[Mut.ptr] = value;
      this.setChanged();
      return true;
    } else {
      return false;
    }
  }

  replaceIfNeq(value: T): Option<T> {
    let old = this.bypassChangeDetection();
    if (stringify(old[Mut.ptr]) !== stringify(value)) {
      const oldValue = old;
      old[Mut.ptr] = value;
      this.setChanged();
      return Some(oldValue);
    } else {
      return None;
    }
  }
}
