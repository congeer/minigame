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

    getTicks() {
        if (this.isPresent()) {
            return new ComponentTicks(this.addedTicks, this.changedTicks);
        }
    }

    getWithTicks() {
        if (!this.isPresent()) {
            return [];
        }
        return [this.data, this.getTicks()]
    }

    get(lastRun: Tick, thisRun: Tick) {
        if (this.isPresent()) {
            const [data, ticks] = this.getWithTicks();
            return {
                value: data,
                ticks: Ticks.fromTickCells(ticks, lastRun, thisRun)
            };
        }
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

    remove() {
        if (!this.isPresent()) {
            return undefined;
        }
        const res = this.data;
        this.data = undefined;
        return [res, new ComponentTicks(this.addedTicks, this.changedTicks)]
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
            const componentInfo = components.getInfo(componentId);
            return new ResourceData(undefined, componentInfo.name, f(), new Tick(0), new Tick(0));
        })
    }

    checkChangeTicks(changeTick: Tick) {
        for (let info of this.resources.values()) {
            info.checkChangeTicks(changeTick);
        }
    }

}

export class Resource extends MetaInfo{

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
