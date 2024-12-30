import { derive, Option, RustIter } from 'rustable';
import { ComponentId } from './component/types';
import { Entity } from './entity/base';
import { Events } from './event/collections';
import { Event } from './event/base';
import { EventCursor } from './event/cursor';
import { SparseSet } from './storage/sparse_set';

export class RemovedComponentEvents {
  // private eventSets: SparseSet<ComponentId, Events<RemovedComponentEntity>> = new SparseSet();
  private eventSets: SparseSet<ComponentId, any> = new SparseSet();

  static new(): RemovedComponentEvents {
    return new RemovedComponentEvents();
  }

  update(): void {
    for (const [_, events] of this.eventSets.iter()) {
      events.update();
    }
  }

  iter(): RustIter<[ComponentId, Events<RemovedComponentEntity>]> {
    return this.eventSets.iter();
  }

  get(componentId: ComponentId): Option<Events<RemovedComponentEntity>> {
    return this.eventSets.get(componentId);
  }

  send(componentId: ComponentId, entity: Entity): void {
    this.eventSets
      .getOrInsertWith(componentId, () => new Events<RemovedComponentEntity>())
      .send(new RemovedComponentEntity(entity));
  }
}

@derive([Event])
export class RemovedComponentEntity {
  constructor(public entity: Entity) {}
}

export class RemovedComponentReader<T> {
  private reader: EventCursor<RemovedComponentEntity> = new EventCursor<RemovedComponentEntity>();

  static default<T>(): RemovedComponentReader<T> {
    return new RemovedComponentReader<T>();
  }

  get(): EventCursor<RemovedComponentEntity> {
    return this.reader;
  }

  getMut(): EventCursor<RemovedComponentEntity> {
    return this.reader;
  }
}
