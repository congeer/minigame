import {Option, Some} from "@minigame/utils";
import {IBundle} from "./bundle";
import {Tick} from "./change_detection";
import {
    Creator,
    DefineOptions,
    getClz,
    inherit,
    inheritFunction,
    isInstance,
    matchType,
    TypeId,
    typeId
} from "./inherit";
import {MetaInfo} from "./meta";
import {Resource, Storages} from "./storage";

export class Components {
    components: ComponentInfo[] = [];
    indices: Map<TypeId, ComponentId> = new Map();
    resourceIndices: Map<TypeId, ComponentId> = new Map();

    initComponent(typeId: TypeId, storages: Storages): ComponentId {
        const indices = this.indices;
        const components = this.components;
        let componentId = indices.get(typeId);
        if (componentId === undefined) {
            componentId = initComponentInner(components, storages, ComponentDescriptor.new(typeId));
            indices.set(typeId, componentId);
        }
        return componentId;
    }

    initComponentWithDescriptor(storages: Storages, descriptor: ComponentDescriptor): ComponentId {
        return initComponentInner(this.components, storages, descriptor);
    }

    len() {
        return this.components.length;
    }

    isEmpty() {
        return this.components.length === 0;
    }

    getInfo(id: ComponentId): Option<ComponentInfo> {
        return Some(this.components[id]);
    }

    getInfoUnchecked(id: ComponentId): ComponentInfo {
        return this.components[id];
    }

    getName(id: ComponentId): Option<string> {
        return this.getInfo(id).map(info => info.name);
    }

    getId(id: TypeId): Option<number> {
        return Some(this.indices.get(id));
    }

    componentId(component: Component) {
        return this.getId(typeId(component));
    }

    getResourceId(typeId: TypeId): Option<number> {
        return Some(this.resourceIndices.get(typeId));
    }

    resourceId<T>(res: T): Option<number> {
        return this.getResourceId(typeId(res));
    }

    initResource<T>(res: T): ComponentId {
        return this.getOrInsertResourceWith(typeId(res), () => ComponentDescriptor.newResource(res));
    }

    getOrInsertResourceWith(typeId: TypeId, func: () => ComponentDescriptor): ComponentId {
        const components = this.components;
        const res = this.resourceIndices.get(typeId);
        if (res) {
            return res;
        }
        const descriptor = func();
        const componentId = components.length;
        components.push(new ComponentInfo(componentId, descriptor));
        this.resourceIndices.set(typeId, componentId);
        return componentId;
    }

    iter() {
        return this.components;
    }

}

const initComponentInner = (components: ComponentInfo[], storages: Storages, descriptor: ComponentDescriptor): ComponentId => {
    const componentId = components.length;
    const info = new ComponentInfo(componentId, descriptor);
    if (info.storageType === StorageType.SparseSet) {
        storages.sparseSets.getOrInsert(info);
    }
    components.push(info);
    return componentId;
}

export const isComponent = (target: Component) => {
    return isInstance(target, Component);
}

export class Component extends MetaInfo implements IBundle {
    constructor() {
        super(Component);
    }

    getComponents(func: (storageType: StorageType, component: any) => any): void {
        func(storageType(this as any), this);
    }

    componentIds(components: Components, storages: Storages, ids: (componentId: number) => void): void {
        ids(components.initComponent(typeId(this), storages));
    }

    fromComponents<T, U extends IBundle>(ctx: T, func: (t: T) => U): U {
        return func(ctx);
    }

}

export const component = function (target: any): typeof target {
    return inherit(target, Component);
}

export function defineComponent<C>(
    options: DefineOptions<C>
): Creator<C> {
    return inheritFunction(options, Component);
}

export type ComponentId = number;

export enum StorageType {
    Table,
    SparseSet
}

export const storageType = <T extends Component>(component: new() => T, storageType?: StorageType) => {
    const clz = getClz(component);
    if (!storageType) {
        return clz.__storageType__ ?? StorageType.Table;
    }
    clz.__storageType__ = storageType;
}

export class ComponentDescriptor {
    name: string = "";
    storageType: StorageType = StorageType.Table;
    typeId?: TypeId;
    drop?: (value: any) => void

    static new(typeId: string) {
        const descriptor = new ComponentDescriptor();
        descriptor.name = descriptor.typeId = typeId;
        return descriptor;
    }

    static newWithCustom(name: string, typeId: string, storageType: StorageType, drop?: () => void) {
        const descriptor = new ComponentDescriptor();
        descriptor.name = name;
        descriptor.typeId = typeId;
        descriptor.storageType = storageType;
        descriptor.drop = drop;
        return descriptor;
    }

    static newResource<T>(res: T) {
        matchType(res, Resource);
        const descriptor = new ComponentDescriptor();
        descriptor.name = getClz(component).name;
        descriptor.typeId = typeId(res);
        descriptor.storageType = StorageType.Table;
        return descriptor;
    }

}

export class ComponentInfo {
    #id: ComponentId;
    _descriptor: ComponentDescriptor;

    constructor(id: ComponentId, descriptor: ComponentDescriptor) {
        this.#id = id;
        this._descriptor = descriptor;
    }

    get id() {
        return this.#id;
    }

    get name() {
        return this._descriptor.name;
    }

    get typeId() {
        return this._descriptor.typeId;
    }

    get storageType() {
        return this._descriptor.storageType;
    }

    get drop() {
        return this._descriptor.drop;
    }

}

export class ComponentTicks {
    added: Tick;
    changed: Tick;

    constructor(added: Tick, changed: Tick) {
        this.added = added;
        this.changed = changed;
    }

    static new(changeTick: Tick) {
        return new ComponentTicks(changeTick, changeTick);
    }

    isAdded(lastRun: Tick, thisRun: Tick) {
        return this.added.isNewerThan(lastRun, thisRun);
    }

    isChanged(lastRun: Tick, thisRun: Tick) {
        return this.changed.isNewerThan(lastRun, thisRun);
    }

    lastChangeTick() {
        return this.changed;
    }

    addedTick() {
        return this.added;
    }

    setChanged(changeTick: Tick) {
        this.changed = changeTick;
    }

}
