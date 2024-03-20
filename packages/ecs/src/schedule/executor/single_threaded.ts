import {isApplyDeferred, SystemExecutor, SystemSchedule} from "./index";
import {World} from "../../world";
import {Condition} from "../../system";


export class SingleThreadedExecutor implements SystemExecutor {
    /// System sets whose conditions have been evaluated.
    evaluatedSets: any[] = [];
    /// Systems that have run or been skipped.
    completedSystems: number[] = [];
    /// Systems that have run but have not had their buffers applied.
    unappliedSystems: number[] = [];
    /// Setting when true applies deferred system buffers after all systems have run
    applyFinalDeferred: boolean = true;

    setCount: number = 0;
    sysCount: number = 0;

    kind(): string {
        return "SingleThreadedExecutor";
    }

    init(schedule: SystemSchedule): void {
        this.sysCount = schedule.systemIds.length;
        this.setCount = schedule.systems.length;
    }

    run(schedule: SystemSchedule, skipSystems: any[], world: World): void {
        for (let i = 0; i < schedule.systems.length; i++) {
            let shouldRun = this.completedSystems.indexOf(i) === -1;
            for (let setIdx of schedule.setsWithConditionsOfSystems[i]) {
                if (this.evaluatedSets.indexOf(setIdx) === -1) {
                    continue;
                }

                const setConditionsMet = evaluateAndFoldConditions(schedule.setConditions[setIdx], world);

                if (!setConditionsMet) {
                    schedule.systemsInSetsWithConditions[setIdx].forEach((sysIdx) => {
                        this.completedSystems.push(sysIdx);
                    });
                }

                shouldRun = shouldRun && setConditionsMet;
                this.evaluatedSets.push(setIdx);
            }


            const systemConditionsMet = evaluateAndFoldConditions(schedule.systemConditions[i], world);

            shouldRun = shouldRun && systemConditionsMet;

            this.completedSystems.push(i);

            if (!shouldRun) {
                continue;
            }

            const system = schedule.systems[i];

            if (isApplyDeferred(system)) {
                this.applyDeferred(schedule, world);
            } else {
                let res
                try {
                    res = system.run([], world);
                } catch (e) {
                    console.error(`Encountered a panic in system ${system.name}!`);
                    console.error(e);
                }
                this.unappliedSystems.push(i);
            }
        }
        if (this.applyFinalDeferred) {
            this.applyDeferred(schedule, world);
        }
        this.evaluatedSets = [];
        this.completedSystems = [];
    }

    setApplyFinalDeferred(applyFinalDeferred: boolean) {
        this.applyFinalDeferred = applyFinalDeferred;
    }

    private applyDeferred(schedule: SystemSchedule, world: World) {
        for (let i = 0; i < this.unappliedSystems.length; i++) {
            const systemIndex = this.unappliedSystems[i];
            const system = schedule.systems[systemIndex];
            system.applyDeferred(world);
        }
        this.unappliedSystems = [];
    }
}


const evaluateAndFoldConditions = (conditions: Condition[], world: World) => {
    for (const condition of conditions) {
        if (!condition.run([], world)) {
            return false;
        }
    }
    return true;
}
