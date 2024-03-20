import {Tick} from "../change_detection";
import {MetaInfo} from "../meta";
import {Access} from "../query";
import {intoSystemConfigs, IntoSystemConfigs, SystemConfigs} from "../schedule/config";
import {SystemSet} from "../schedule/set";
import {World} from "../world";


export interface System extends IntoSystemConfigs {
    input: any[],

    name(): string

    defaultSystemSets(): SystemSet[];

    componentAccess(): Access;

    run(input: any[], world: World): any

    applyDeferred(world: World): void

    isExclusive(): boolean

    hasDeferred(): boolean

    initialize(world: World): void

    updateArchetypeComponentAccess(world: World): void

    checkChangeTick(changeTick: Tick): void

    getLastRun(): Tick

    setLastRun(lastRun: Tick): void
}

abstract class AbstractSystem extends MetaInfo implements System {
    abstract input: any[];

    abstract name(): string;

    abstract applyDeferred(world: World): void

    abstract isExclusive(): boolean

    abstract hasDeferred(): boolean

    abstract initialize(world: World): void

    abstract updateArchetypeComponentAccess(world: World): void

    abstract checkChangeTick(changeTick: Tick): void

    abstract getLastRun(): Tick

    abstract setLastRun(lastRun: Tick): void

    abstract runInner(input: any[], world: World): any

    abstract componentAccess(): Access;

    protected constructor(type: any) {
        super(type);
    }

    defaultSystemSets() {
        return [];
    }

    intoConfigs(): SystemConfigs {
        return intoSystemConfigs(this);
    }

    run(input: any[], world: World) {
        this.updateArchetypeComponentAccess(world);
        return this.runInner(input, world);
    }

}

interface ReadOnlySystem extends System {

    runReadOnly: (input: any[], world: World) => any

}

abstract class AbstractReadOnlySystem extends AbstractSystem implements ReadOnlySystem {

    runReadOnly(input: any[], world: World) {

        this.updateArchetypeComponentAccess(world);
        return this.runInner(input, world);
    }

}

export type Condition = ReadOnlySystem;

export const runSystemOnce = (world: World, system: System) => {
    return runSystemOnceWith(world, [], system);
}

export const runSystemOnceWith = (world: World, input: any[], system: System) => {
    system.initialize(world);
    const out = system.run(input, world);
    system.applyDeferred(world);
    return out;
}
