import {Tick} from "../change_detection";

export const checkSystemChangeTick = (lastRun: Tick, thisRun: Tick, systemName: string) => {
    if (lastRun.checkTick(thisRun)) {
        let age = thisRun.relativeTo(lastRun).get();
        console.warn(`System ${systemName} has not run for ${age} ticks. \
            Changes older than ${Tick.MAX.get() - 1} ticks will not be detected.`)
    }
}