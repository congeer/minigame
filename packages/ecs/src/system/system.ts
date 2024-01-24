import {QueryCommand} from "../commands";
import {MetaInfo} from "../meta";

// export type System = (world: World) => void;
export type System = (command: any) => void;

// export type Condition = (world: World) => boolean;
export type Condition = (command: QueryCommand) => boolean;


export const runOnce = (): Condition => {
    let hasRun = false;
    return () => {
        if (!hasRun) {
            hasRun = true;
            return true;
        }
        return false;
    }
}

export class SystemConfig extends MetaInfo {
    systems: any[] = [];
    conditions: Condition[] = [];

    constructor(...systems: any[]) {
        super(SystemConfig);
        this.systems = systems;
    }

    static new(...systems: any[]): SystemConfig {
        return new SystemConfig(...systems);
    }

    runIf(condition: Condition): SystemConfig {
        this.conditions.push(condition);
        return this;
    }

}
