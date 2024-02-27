import {EntityData} from "./entity";
import {World} from "./world";

export type CommandRegister = (world: World) => Command

export type Command = { [key: string]: (args: any) => any }

export type CommandEnhance = {
    key: string
    before: (world: World, ...args: any[]) => void
    after: (world: World, ret: any) => any
}

export type SpawnCommand = {
    spawn: (...args: any[]) => EntityData
}

export const spawnCommandRegister: CommandRegister = (world) => {
    return {
        spawn: (...args: any[]) => {
            return world.spawn(...args)
        }
    }
}

export type QueryCommand = {
    query: (...types: any[]) => any[][]
    res: (res: any) => any
}

export const queryCommandRegister: CommandRegister = (world) => {
    return {
        query: (...types: any[]) => {
            return world.query(...types)
        },
        res: (res: any) => {
            return world.resource(res)
        }
    }
}

export type RunWithWorldCommand = {
    runWithWorld: (fn: (world: World) => void) => void
}

export const runWithWorldCommandRegister: CommandRegister = (world) => {
    return {
        runWithWorld: (fn: (world: World) => void) => {
            return fn(world)
        }
    }
}
