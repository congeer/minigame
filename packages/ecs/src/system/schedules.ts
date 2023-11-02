import {inherit, isInstance, isType, matchType} from "../inherit";
import {MetaInfo} from "../meta";
import {resource} from "../storage";
import {World} from "../world";
import {System, SystemConfig} from "./system";

export class Schedule {

    #systems: SystemConfig[] = [];

    _lastTick: number = 0;

    constructor(...systems: (System | SystemConfig)[]) {
        this.addSystems(...systems);
    }

    addSystems(...systems: (System | SystemConfig)[]) {
        systems.forEach(system => {
            if (isType(system, SystemConfig)) {
                this.#systems.push(system as SystemConfig);
            } else {
                this.#systems.push(SystemConfig.new(system as System));
            }
        });
    }

    configureSets(...sets: any[]) {

    }

    run(world: World) {
        world.tick(this._lastTick);
        this.#systems.forEach(s => runSystemConfig(s, world))
        this._lastTick = world._changeTick;
    }
}

function runSystemConfig(config: SystemConfig, world: World) {
    for (let condition of config.conditions) {
        if (!condition(world)) {
            return;
        }
    }
    for (let system of config.systems) {
        if (isType(system, SystemConfig)) {
            runSystemConfig(system, world);
        } else {
            system(world);
        }
    }
}


export class ScheduleLabel extends MetaInfo {
    constructor() {
        super(ScheduleLabel);
    }

}

export const scheduleLabel = function (target: any): typeof target {
    return inherit(target, ScheduleLabel)
}

export const isScheduleLabel = (target: any) => {
    return isInstance(target, ScheduleLabel);
}

@resource
export class Schedules {

    schedules: { [key: string]: Schedule } = {};

    get(label: any): Schedule {
        matchType(label, ScheduleLabel);
        const key = label.key();
        return this.schedules[key];
    }

    insert(label: any, schedule: Schedule) {
        matchType(label, ScheduleLabel);
        const key = label.key();
        this.schedules[key] = schedule;
    }

}
