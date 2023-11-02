import {MetaInfo} from "../meta";
import {World} from "../world";

export type System = (world: World) => void;

export type Condition = (world: World) => boolean;

export const runOnce = () => {
    let hasRun = false;
    return (world: World) => {
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
