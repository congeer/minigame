import { Tick } from '../change_detection/tick';
import { QueryData } from '../query/fetch';
import { QueryFilter } from '../query/filter/base';
import { WorldCell } from '../world/cell';

export class Query<D extends QueryData, F extends QueryFilter = {}> {
  // SAFETY: Must have access to the components registered in `state`.
  private world: WorldCell;
  private state: QueryState<D, F>;
  private lastRun: Tick;
  private thisRun: Tick;

  constructor(world: WorldCell, state: QueryState<D, F>, lastRun: Tick, thisRun: Tick) {
    this.world = world;
    this.state = state;
    this.lastRun = lastRun;
    this.thisRun = thisRun;
  }
}
