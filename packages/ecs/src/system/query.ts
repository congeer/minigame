import { Tick } from '../change_detection/tick';
import { QueryState } from '../query/state';
import { WorldCell } from '../world/cell';

export class Query {
  // SAFETY: Must have access to the components registered in `state`.
  private world: WorldCell;
  private state: QueryState;
  private lastRun: Tick;
  private thisRun: Tick;

  constructor(world: WorldCell, state: QueryState, lastRun: Tick, thisRun: Tick) {
    this.world = world;
    this.state = state;
    this.lastRun = lastRun;
    this.thisRun = thisRun;
  }
}
