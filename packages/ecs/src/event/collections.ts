import { derive, RustIter, Vec } from 'rustable';
import { EventId, EventInstance } from './base';
import { Resource } from '../component/types';

export class EventSequence<E> extends Vec<EventInstance<E>> {
  // public events: Vec<EventInstance<E>> = Vec.new();
  public startEventCount: number = 0;

  static default<E>(): EventSequence<E> {
    return new EventSequence<E>();
  }

  // get(): Vec<EventInstance<E>> {
  //   return this.events.iter().collectInto((value) => Vec.from(value));
  // }

  // getMut(): Vec<EventInstance<E>> {
  //   return this.events;
  // }
}

@derive([Resource])
export class Events<E> {
  private eventsA: EventSequence<E>;
  private eventsB: EventSequence<E>;
  private eventCount: number;

  constructor() {
    this.eventsA = new EventSequence<E>();
    this.eventsB = new EventSequence<E>();
    this.eventCount = 0;
  }

  public oldestEventCount(): number {
    return this.eventsA.startEventCount;
  }

  public send(event: E): EventId {
    const eventId = new EventId(this.eventCount);
    const eventInstance = new EventInstance(eventId, event);
    this.eventsB.push(eventInstance);
    this.eventCount++;
    return eventId;
  }

  // public sendBatch(events: Iterable<E>): SendBatchIds<E> {
  //   const lastCount = this.eventCount;
  //   for (const event of events) {
  //     this.send(event);
  //   }
  //   return new SendBatchIds(lastCount, this.eventCount);
  // }

  // public getCursor(): EventCursor<E> {
  //   return new EventCursor<E>();
  // }

  // public getCursorCurrent(): EventCursor<E> {
  //   return new EventCursor<E>(this.eventCount);
  // }

  // public update(): void {
  //   [this.eventsA, this.eventsB] = [this.eventsB, this.eventsA];
  //   this.eventsB.clear();
  //   this.eventsB.startEventCount = this.eventCount;
  // }

  // public updateDrain(): IterableIterator<E> {
  //   [this.eventsA, this.eventsB] = [this.eventsB, this.eventsA];
  //   const iter = this.eventsB.drain();
  //   this.eventsB.startEventCount = this.eventCount;
  //   return iter;
  // }

  // public clear(): void {
  //   this.resetStartEventCount();
  //   this.eventsA.clear();
  //   this.eventsB.clear();
  // }

  // public len(): number {
  //   return this.eventsA.len() + this.eventsB.len();
  // }

  // public isEmpty(): boolean {
  //   return this.len() === 0;
  // }

  // public *drain(): IterableIterator<E> {
  //   this.resetStartEventCount();
  //   yield* this.eventsA.drain();
  //   yield* this.eventsB.drain();
  // }

  public iterCurrentUpdateEvents(): RustIter<E> {
    return this.eventsB.iter().map((instance) => instance.event);
  }

  // public getEvent(id: number): [E, EventId<E>] | undefined {
  //   if (id < this.oldestEventCount()) {
  //     return undefined;
  //   }
  //   const sequence = this.sequence(id);
  //   const index = id - sequence.startEventCount;
  //   const instance = sequence.get(index);
  //   return instance ? [instance.event, instance.eventId] : undefined;
  // }

  private sequence(id: number): EventSequence<E> {
    return id < this.eventsB.startEventCount ? this.eventsA : this.eventsB;
  }

  private resetStartEventCount(): void {
    this.eventsA.startEventCount = this.eventCount;
    this.eventsB.startEventCount = this.eventCount;
  }
}
