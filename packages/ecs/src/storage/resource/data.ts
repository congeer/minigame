import { ArchetypeComponentId } from '../../archetype/types';
import { MutUntyped } from '../../change_detection/mut';
import { ComponentTicks, Tick, Ticks } from '../../change_detection/tick';
import { BlobArray } from '../data_array';
import { None, Option, Some } from 'rustable';

export class ResourceData {
  private __data: BlobArray;
  private __addedTicks: Tick;
  private __changedTicks: Tick;
  private __typeName: string;
  private __id: ArchetypeComponentId;
  private __changedBy?: string;
  constructor(
    data: BlobArray,
    addedTicks: Tick,
    changedTicks: Tick,
    typeName: string,
    id: ArchetypeComponentId,
    caller?: string,
  ) {
    this.__data = data;
    this.__addedTicks = addedTicks;
    this.__changedTicks = changedTicks;
    this.__typeName = typeName;
    this.__id = id;
    this.__changedBy = caller;
  }

  isPresent(): boolean {
    return !this.__data.isEmpty();
  }

  get id(): ArchetypeComponentId {
    return this.__id;
  }

  getData(): Option<any> {
    if (this.isPresent()) {
      return Some(this.__data.get(0));
    }
    return None;
  }

  getTicks(): Option<ComponentTicks> {
    if (this.isPresent()) {
      return Some(new ComponentTicks(this.__addedTicks, this.__changedTicks));
    }
    return None;
  }

  getWithTicks(): Option<[any, ComponentTicks, string?]> {
    if (this.isPresent()) {
      return Some([this.__data.get(0), new ComponentTicks(this.__addedTicks, this.__changedTicks), this.__changedBy]);
    }
    return None;
  }

  getMut(lastRun: Tick, thisRun: Tick): Option<MutUntyped> {
    const result = this.getWithTicks();
    if (result.isSome()) {
      const [ptr, ticks, caller] = result.unwrap();
      return Some(new MutUntyped(ptr, Ticks.fromTickCells(ticks, lastRun, thisRun), caller));
    }
    return None;
  }

  insert(value: any, changeTick: Tick, caller?: string): void {
    if (this.isPresent()) {
      this.__data.replace(0, value);
    } else {
      this.__data.push(value);
      this.__addedTicks.set(changeTick.get());
    }
    this.__changedTicks.set(changeTick.get());
    this.__changedBy = caller;
  }

  insertWithTicks(value: any, changeTicks: ComponentTicks, caller?: string): void {
    if (this.isPresent()) {
      this.__data.replace(0, value);
    } else {
      this.__data.push(value);
    }
    this.__addedTicks.set(changeTicks.added.get());
    this.__changedTicks.set(changeTicks.changed.get());
    this.__changedBy = caller;
  }

  remove(): Option<[any, ComponentTicks, string?]> {
    if (!this.isPresent()) {
      return None;
    }
    const res = this.__data.swapRemove(0);
    const caller = this.__changedBy;
    return Some([res, new ComponentTicks(this.__addedTicks, this.__changedTicks), caller]);
  }

  removeAndDrop(): void {
    if (this.isPresent()) {
      this.__data.clear();
    }
  }

  checkChangeTicks(changeTick: Tick): void {
    this.__addedTicks.checkTick(changeTick);
    this.__changedTicks.checkTick(changeTick);
  }
}
