import {EntityData} from "./entity";
import {World} from "./world";

export interface SpawnCommand {
    spawn: (...args: any[]) => EntityData
}

export interface QueryCommand {
    query: (...types: any[]) => any[][]
    res: (res: any) => any
}


export interface WorldCommand {
    runWithWorld: (fn: (world: World) => void) => void
}

export const spawn = (world: World) => (...args: any[]) => {
    return world.spawn(...args)
}

export const query = (world: World) => (...args: any[]) => {
    return world.query(...args)
}

export const res = (world: World) => (res: any) => {
    return world.resource(res)
}

export const runWithWorld = (world: World) => (fn: (world: World) => void) => {
    return fn(world)
}
