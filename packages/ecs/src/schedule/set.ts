import {None, Option} from "@minigame/utils";
import {inherit, isInstance, TypeId} from "../inherit";
import {MetaInfo} from "../meta";
import {IntoSystemSetConfigs, SystemSetConfigs} from "./config";

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

export class SystemSet extends MetaInfo implements IntoSystemSetConfigs {

    name(): string {
        return "";
    }

    intoConfigs(): SystemSetConfigs {
        return SystemSetConfigs.newSet(this);
    }

    constructor() {
        super(SystemSet);
    }

    systemType(): Option<TypeId> {
        return None;
    }

    isAnonymous(): boolean {
        return false;
    }


}

export class AnonymousSet extends SystemSet {
    _id: number;

    constructor(id: number) {
        super();
        this._id = id;
    }

    isAnonymous(): boolean {
        return true;
    }
}
