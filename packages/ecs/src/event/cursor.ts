// import { Events } from "./collections";

export class EventCursor<E> {
  private lastEventCount: number = 0;

  // public read(events: Events<E>): EventIterator<E> {
  //   return this.readWithId(events).withoutId();
  // }

  // public readMut(events: Events<E>): EventMutIterator<E> {
  //   return this.readMutWithId(events).withoutId();
  // }

  // public readWithId(events: Events<E>): EventIteratorWithId<E> {
  //   return new EventIteratorWithId(this, events);
  // }

  // public readMutWithId(events: Events<E>): EventMutIteratorWithId<E> {
  //   return new EventMutIteratorWithId(this, events);
  // }

  // public len(events: Events<E>): number {
  //   return Math.min(events.eventCount - this.lastEventCount, events.len());
  // }

  // public missedEvents(events: Events<E>): number {
  //   return Math.max(events.oldestEventCount() - this.lastEventCount, 0);
  // }

  // public isEmpty(events: Events<E>): boolean {
  //   return this.len(events) === 0;
  // }

  // public clear(events: Events<E>): void {
  //   this.lastEventCount = events.eventCount;
  // }
}
