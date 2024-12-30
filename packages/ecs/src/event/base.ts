import { trait } from 'rustable';
import { Component } from '../component/base';
import { Traversal } from '../traversal';

@trait
export class Event extends Component {
  traversal?: Traversal<this>;
  autoPropagate?: boolean;
}

export class EventId {
  constructor(
    public id: number,
    public caller?: Location,
  ) {}

  toString(): string {
    return `event<${this.constructor.name.split('::').pop()}>#${this.id}`;
  }
}

export class EventInstance<E> {
  constructor(
    public eventId: EventId,
    public event: E,
  ) {}
}
