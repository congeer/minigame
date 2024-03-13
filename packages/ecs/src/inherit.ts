import {nanoid} from "nanoid";

export function isType(target: any, type: any) {
    if (target === type) {
        return true;
    }
    if (typeof target === 'object' && target instanceof type) {
        return true;
    }
    return typeof target === 'function' && target.prototype instanceof type;
}

export function isInstance(target: any, type: any) {
    return typeof target === 'object' && target instanceof type;
}

export function getClz(target: any) {
    if (typeof target === 'object') {
        return target.__proto__.constructor;
    }
    return target;
}

export const matchType = (target: any, type: any, msg?: string) => {
    if (!isType(target, type)) {
        throw new Error(msg ?? (target + " not match " + type.name))
    }
}

export const matchInstance = (target: any, type: any, msg?: string) => {
    if (!isInstance(target, type)) {
        if (isType(target, type)) {
            throw new Error(msg ?? target.name + " need to instantiate ");
        } else {
            throw new Error(msg ?? ((JSON.stringify(target) ?? target) + " not match " + type.name));
        }
    }
}

function inheritBase(targetType: any, parentType: any) {
    Object.setPrototypeOf(targetType.prototype, parentType.prototype);
    targetType.prototype.constructor = targetType;
}

function inheritStatic(targetType: any, sourceType: any) {
    Object.getOwnPropertyNames(sourceType).forEach((prop) => {
        if (prop === "length" || prop === "name" || prop === "prototype") {
            return;
        }
        Object.defineProperty(
            targetType,
            prop,
            Object.getOwnPropertyDescriptor(sourceType, prop) || Object.create(null)
        )
    })
}

function extendPrototype(targetType: any, sourceType: any) {
    Object.getOwnPropertyNames(sourceType).forEach((prop) => {
        if (prop === "constructor") {
            return;
        }
        Object.defineProperty(
            targetType,
            prop,
            Object.getOwnPropertyDescriptor(sourceType, prop) || Object.create(null)
        )
    })
}

function createConstructor(targetType: any, parentType: any) {
    const SubClass = class extends parentType {
        constructor(...args: any) {
            super(...args);
            let targetType1 = new targetType(...args);
            Object.getOwnPropertyNames(targetType1).forEach((prop) => {
                Object.defineProperty(
                    this,
                    prop,
                    Object.getOwnPropertyDescriptor(targetType1, prop) || Object.create(null)
                )
            })
        }
    }
    extendPrototype(SubClass.prototype, targetType.prototype);
    Object.defineProperty(SubClass, "name", {value: targetType.name})
    return SubClass;
}

export function inherit(targetType: any, parentType: any): any {
    let constructor = createConstructor(targetType, parentType);
    inheritStatic(constructor, targetType);
    return constructor;
}

function createConstructorFromFunction<T>(
    name: string,
    func: (...args: any) => T,
    methods: Methods<T>,
    parentType: new (...args: any) => any
): new (...args: any) => T & MethodsReturn<T> {
    const SubClass = class extends parentType {
        constructor(...args: any) {
            super(...args);
            let obj = func(...args);
            Object.getOwnPropertyNames(obj).forEach((prop) => {
                Object.defineProperty(
                    this,
                    prop,
                    Object.getOwnPropertyDescriptor(obj, prop) || Object.create(null)
                )
            })
        }
    }
    Object.keys(methods).forEach(prop => {
        Object.defineProperty(SubClass.prototype, prop, {
            value: function (...args: any[]) {
                return methods[prop](this, ...args)
            },
            writable: false,
        })
    })
    Object.defineProperty(SubClass, "name", {value: name})
    return SubClass as new (...args: any) => T & MethodsReturn<T>;
}

export function inheritFunction<T>(options: DefineOptions<T>, parentType: any): Creator<T> {
    const {name, initialData, methods} = options;
    if (!name) {
        throw new Error('`name` is a required option')
    }
    if (!initialData) {
        throw new Error('`initialData` is a required option')
    }
    const initFn = (typeof initialData == 'function'
        ? initialData : () => initialData) as (...args: any) => T
    const type = createConstructorFromFunction(name, initFn, methods || {}, parentType);
    const newVar = (...args: any) => new type(...args);
    newVar.prototype = type.prototype;
    return newVar;
}

const typeList: any[] = [];
const typeIdList: string[] = [];

export type TypeId = string;

export function typeId(type: any): TypeId {
    if (typeof type === "object") {
        type = type.__proto__.constructor;
    }
    const index = typeList.indexOf(type);
    if (index !== -1) {
        return typeIdList[index];
    } else {
        const id = nanoid();
        typeList.push(type);
        typeIdList.push(id);
        return id;
    }
}

export type Methods<T> = { [key: string]: (self: T, ...args: any) => any }

export type MethodsReturn<T> = { [Type in keyof Methods<T>]: (...args: any) => any }

export type InitialData<T> = T | ((...args: any) => T);

export type Creator<T> = { (...args: any): T & MethodsReturn<T>; prototype: any; };

export type DefineOptions<T> = {
    name: string,
    initialData: InitialData<T>,
    methods?: Methods<T>
}
