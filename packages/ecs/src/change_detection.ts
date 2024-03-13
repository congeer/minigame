/// The (arbitrarily chosen) minimum number of world tick increments between `check_tick` scans.
///
/// Change ticks can only be scanned when systems aren't running. Thus, if the threshold is `N`,
/// the maximum is `2 * N - 1` (i.e. the world ticks `N - 1` times, then `N` times).
///
/// If no change is older than `u32::MAX - (2 * N - 1)` following a scan, none of their ages can
/// overflow and cause false positives.
// (518,400,000 = 1000 ticks per frame * 144 frames per second * 3600 seconds per hour)
export const CHECK_TICK_THRESHOLD: number = 518_400_000;


/// The maximum change tick difference that won't overflow before the next `check_tick` scan.
///
/// Changes stop being detected once they become this old.
export const MAX_CHANGE_AGE: number = Number.MAX_VALUE - (2 * CHECK_TICK_THRESHOLD - 1);

export class Tick {
    static MAX: Tick = new Tick(MAX_CHANGE_AGE);

    tick: number = 0;

    constructor(tick: number) {
        this.tick = tick;
    }

    get() {
        return this.tick;
    }

    set(tick: number) {
        this.tick = tick;
    }

    isNewerThan(lastRun: Tick, thisRun: Tick) {
        const ticksSinceInsert = Math.min(thisRun.relativeTo(this).tick, MAX_CHANGE_AGE);
        const ticksSinceSystem = Math.min(thisRun.relativeTo(lastRun).tick, MAX_CHANGE_AGE);
        return ticksSinceInsert < ticksSinceSystem;
    }

    relativeTo(other: Tick) {
        const tick = this.tick - other.tick;
        return new Tick(tick);
    }

    checkTick(tick: Tick) {
        const age = this.relativeTo(tick);
        if (age.get() > Tick.MAX.get()) {
            this.tick = tick.relativeTo(Tick.MAX).tick;
            return true;
        } else {
            return false;
        }
    }
}
