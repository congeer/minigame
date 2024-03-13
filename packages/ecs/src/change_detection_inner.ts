import {Tick} from "./change_detection";
import {ComponentTicks} from "./component";

export class Ticks {
    added: Tick;
    changed: Tick;
    lastRun: Tick;
    thisRun: Tick;

    constructor(added: Tick, changed: Tick, lastRun: Tick, thisRun: Tick) {
        this.added = added;
        this.changed = changed;
        this.lastRun = lastRun;
        this.thisRun = thisRun;
    }

    static fromTickCells(cells: ComponentTicks, lastRun: Tick, thisRun: Tick) {
        return new Ticks(cells.added, cells.changed, lastRun, thisRun);
    }
}
