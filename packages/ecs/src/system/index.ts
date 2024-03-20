import {System} from "./system";

export * from './system';




export const intoSystem = (system: any):System => {
    // return new (system.name);
    return system;
}

export const system = intoSystem;
