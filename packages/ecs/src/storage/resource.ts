import {None, Option, Some} from "@minigame/utils";
import {ArchetypeComponentId} from "../archetype";
import {Tick} from "../change_detection";
import {Ticks} from "../change_detection_inner";
import {ComponentId, Components, ComponentTicks} from "../component";
import {inherit, isType} from "../inherit";
import {MetaInfo} from "../meta";
import {SparseSet} from "./sparse_set";

export class ResourceData {
    data: any;
    addedTicks: Tick;
    changedTicks: Tick;
    typeName: string;
    id: ArchetypeComponentId;

    constructor(data: any, typeName: string, id: ArchetypeComponentId, addedTicks: Tick, changedTicks: Tick) {
        this.data = data;
        this.typeName = typeName;
        this.id = id;
        this.addedTicks = addedTicks;
        this.changedTicks = changedTicks;
    }

    isPresent() {
        return this.data !== undefined;
    }

    getData() {
        return this.data;
    }

    getTicks():Option<ComponentTicks> {
        if (!this.isPresent()) {
            return None;
        }
        return Some(new ComponentTicks(this.addedTicks, this.changedTicks));
    }

    getWithTicks():Option<[any, ComponentTicks]> {
        if (!this.isPresent()) {
            return None;
        }
        return Some([this.data, this.getTicks().unwrap()]);
    }

    get(lastRun: Tick, thisRun: Tick): Option<[any, Ticks]> {
        if (!this.isPresent()) {
            return None;
        }
        const [data, ticks] = this.getWithTicks().unwrap();
        return Some([data, Ticks.fromTickCells(ticks, lastRun, thisRun)]);
    }

    insert(value: any, changeTick: Tick) {
        this.data = value;
        this.addedTicks = changeTick;
        this.changedTicks = changeTick;
    }

    insertWithTicks(value: any, changeTicks: ComponentTicks) {
        this.data = value;
        this.addedTicks = changeTicks.added;
        this.changedTicks = changeTicks.changed;
    }

    remove(): Option<[any, ComponentTicks]> {
        if (!this.isPresent()) {
            return None;
        }
        const res = this.data;
        this.data = undefined;
        return Some([res, new ComponentTicks(this.addedTicks, this.changedTicks)])
    }

    removeAndDrop() {
        if (this.isPresent()) {
            this.data = undefined;
        }
    }

    checkChangeTicks(changeTick: Tick) {
        this.addedTicks.checkTick(changeTick);
        this.changedTicks.checkTick(changeTick);
    }
}

export class Resources {
    resources: SparseSet<ComponentId, ResourceData> = new SparseSet<ComponentId, ResourceData>();

    len() {
        return this.resources.len();
    }

    iter() {
        return this.resources.iter();
    }

    isEmpty() {
        return this.resources.isEmpty();
    }

    get(id: ComponentId) {
        return this.resources.get(id);
    }

    clear() {
        this.resources.clear();
    }

    initializeWith(componentId: ComponentId, components: Components, f: () => ArchetypeComponentId) {
        return this.resources.getOrInsertWith(componentId, () => {
            const componentInfo = components.getInfo(componentId).unwrap();
            return new ResourceData(void 0, componentInfo.name, f(), new Tick(0), new Tick(0));
        })
    }

    checkChangeTicks(changeTick: Tick) {
        for (let info of this.resources.values()) {
            info.checkChangeTicks(changeTick);
        }
    }

}

export class Resource extends MetaInfo {

    constructor() {
        super(Resource);
    }

}

export const resource = function (target: any): typeof target {
    return inherit(target, Resource)
}

export const isResource = (target: any) => {
    return isType(target, Resource)
}
