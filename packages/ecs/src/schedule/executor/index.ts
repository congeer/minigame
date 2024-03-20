import {typeId} from "../../inherit";
import {Condition, System} from "../../system";
import {World} from "../../world";
import {NodeId} from "../graph_utils";

export class SystemSchedule {
    systemIds: NodeId[];
    // Indexed by system node id.
    systems: System[];
    // Indexed by system node id.
    systemConditions: Condition[][];
    // Indexed by system node id.
    systemDependencies: number[];
    // Indexed by system node id.
    systemDependents: number[][];
    // Indexed by system node id.
    setsWithConditionsOfSystems: number[][];
    // List of system set node ids.
    setIds: NodeId[];
    // Indexed by system set node id.
    setConditions: Condition[][];
    // Indexed by system set node id.
    systemsInSetsWithConditions: number[][];

    constructor(systemIds: NodeId[] = [],
                systems: System[] = [],
                systemConditions: Condition[][] = [],
                systemDependencies: number[] = [],
                systemDependents: number[][] = [],
                setsWithConditionsOfSystems: number[][] = [],
                setIds: NodeId[] = [],
                setConditions: Condition[][] = [],
                systemsInSetsWithConditions: number[][] = []) {
        this.systemIds = systemIds;
        this.systems = systems;
        this.systemConditions = systemConditions;
        this.systemDependencies = systemDependencies;
        this.systemDependents = systemDependents;
        this.setsWithConditionsOfSystems = setsWithConditionsOfSystems;
        this.setIds = setIds;
        this.setConditions = setConditions;
        this.systemsInSetsWithConditions = systemsInSetsWithConditions;
    }

}

export type SystemExecutor = {
    kind(): string
    init(schedule: SystemSchedule): void
    run(schedule: SystemSchedule, skipSystems: any[], world: World): void
    setApplyFinalDeferred(apply: boolean): void
}

export const applyDeferred = () => {

}


export const isApplyDeferred = (system: System) => {
    return typeId(system) === typeId(applyDeferred);
}
