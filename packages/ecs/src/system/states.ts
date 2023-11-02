import {inherit, isType, matchType, typeId} from "../inherit";
import {MetaInfo} from "../meta";
import {resource} from "../storage";
import {World} from "../world";
import {scheduleLabel} from "./schedules";

@scheduleLabel
export class OnEnter {
    state: any;

    constructor(state: any) {
        matchType(state, StateValue);
        this.state = state;
    }

    static on(state: any): OnEnter {
        return new OnEnter(state);
    }

    key() {
        return `"OnEnter(${this.state.key()},${this.state.value})`
    }

}

@scheduleLabel
export class OnExit {
    state: any;

    constructor(state: any) {
        this.state = state;
    }

    static on(state: any): OnExit {
        return new OnExit(state);
    }
}

@scheduleLabel
export class OnTransition {
    from: any;
    to: any;

    constructor(from: any, to: any) {
        this.from = from;
        this.to = to;
    }

    static on(from: any, to: any): OnTransition {
        return new OnTransition(from, to);
    }

}

const valueCache: any = {}

export class StateValue extends MetaInfo {
    readonly value: number;

    constructor(value: number) {
        super(StateValue)
        this.value = value;
    }

    static new(value: number) {
        return new this(value);
    }

    static for(states: any): typeof StateValue {
        const key = typeId(states);
        const cache = valueCache[key];
        if (cache) {
            return cache;
        }
        const SubState = class {
        };
        Object.defineProperty(SubState, "name", {value: key})
        const value = inherit(SubState, StateValue);
        value.prototype.states = states;
        valueCache[key] = value;
        return value
    }

    equals(value: any) {
        if (value === this) {
            return true;
        }
        if (!isType(value, StateValue)) {
            return false;
        }
        return value.value === this.value;
    }

}

const stateCache: any = {};

@resource
export class State {
    prevState: StateValue;
    currentState: StateValue;

    constructor(states: any) {
        const value = states.default();
        matchType(value, StateValue);
        this.prevState = this.currentState = value;
    }

    isInit() {
        return this.prevState.equals(this.currentState);
    }

    set(state: StateValue) {
        if (this.currentState.key() !== state.key()) {
            throw new Error("Next State Not " + this.currentState.key())
        }
        this.prevState = this.currentState;
        this.currentState = state;
    }

    get() {
        return this.currentState;
    }

    static for(states: any): typeof State {
        const key = typeId(states);
        const cache = stateCache[key];
        if (cache) {
            return cache;
        }
        const SubState = class {
        };
        Object.defineProperty(SubState, "name", {value: key})
        const state = inherit(SubState, State);
        stateCache[key] = state;
        return state
    }
}

export function inState(value: any) {
    matchType(value, StateValue);
    const res = State.for(value.states);
    return function (world: World) {
        return world.resource(res).get().equals(value);
    }
}

export function runEnterSchedule(states: any) {
    return function (world: World) {
        world.runSchedule(OnEnter.on(states.default()))
    }
}

export function applyStateTransition(states: any) {
    return function (world: World) {
        const state = world.resource(State.for(states));
        if (!state.isInit() && state.isChanged()) {
            world.runSchedule(OnExit.on(state.prevState));
            world.runSchedule(OnTransition.on(state.prevState, state.currentState));
            world.runSchedule(OnEnter.on(state.currentState));
        }
    }
}

@resource
export class States {

    constructor() {
        throw new Error("Please use static properties!");
    }

    static default() {
        const type = StateValue.for(this);
        return type.new(0);
    }

}

export const states = (targetType: any): any => {
    return inherit(targetType, States) as any;
}

export const enumerate = (targetType: any) => {
    if (targetType._init_) {
        return targetType;
    }
    let it = 0;
    let numbersToJump: any = {};
    let duplicatedValues = false
    const stateValue = StateValue.for(targetType);
    visitAll(targetType, function (obj: any, key: any) {
        if (obj[key] instanceof Function) return;
        if (obj[key] !== null && Object.prototype.toString.call(obj[key]) === '[object Number]') {
            if (numbersToJump[obj[key]] !== undefined) {
                duplicatedValues = true
            }
            numbersToJump[obj[key]] = true
        }
    })
    if (duplicatedValues) throw new Error('key-enum: duplicated values on declared object')


    let min = Number.MAX_VALUE;
    let dv: any;
    visitAll(targetType, function (obj: any, key: any) {
        if (obj[key] instanceof Function) return;
        while (numbersToJump[it] !== undefined) it++
        if (obj[key] === null || obj[key] === undefined) obj[key] = it++
    })
    visitAll(targetType, function (obj: any, key: any) {
        if (obj[key] instanceof Function) return;
        let number = parseInt(obj[key]);
        if (isNaN(number)) {
            return;
        }
        const value = stateValue.new(number);
        if (number < min) {
            min = number;
            dv = value;
        }
        targetType[key] = value;
    })
    targetType.default = () => dv;
    targetType._init_ = true;
    return targetType;
}


function visitAll(list: any, cb: any) {
    for (let key in list) {
        if (key.startsWith("_")) continue
        if (!isNaN(parseInt(key))) continue
        if (!list.hasOwnProperty(key)) continue
        if (Object.prototype.toString.call(list[key]) !== '[object Object]') {
            cb(list, key)
        }
    }
}
