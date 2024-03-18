interface MatchOption<T, U> {
    some: (val: T) => U;
    none: (() => U) | U;
}

const defaultMatchOption: MatchOption<any, any> = {
    some: (val) => val,
    none: undefined
};

export interface Option<T> {
    isSome(): boolean;

    isSomeAnd(fn: (val: T) => boolean): boolean;

    isNone(): boolean;

    match<U>(fn: Partial<MatchOption<T, U>>): U;

    map<U>(fn: (val: T) => U): Option<U>;

    mapOr<U>(def: U, fn: (val: T) => U): U;

    mapOrElse<U>(def: () => U, fn: (val: T) => U): U;

    andThen<U>(fn: (val: T) => Option<U>): Option<U>;

    orElse<U>(fn: () => Option<U>): Option<T | U>;

    or<U>(opt: Option<U>): Option<T | U>;

    and<U>(opt: Option<U>): Option<U>;

    filter(fn: (val: T) => boolean): Option<T>;

    unwrapOr(def: T): T;

    unwrapOrElse(fn: () => T): T;

    unwrap(): T | never;
}

interface OptSome<T> extends Option<T> {
    unwrap(): T;

    map<U>(fn: (val: T) => U): OptSome<U>;

    or<U>(opt: Option<U>): Option<T>;

    and<U>(opt: Option<U>): Option<U>;
}

class OptSomeImpl<T> implements OptSome<T> {
    readonly #val: T;

    constructor(val: T) {
        this.#val = val;
    }

    isSome(): boolean {
        return true;
    };

    isNone(): boolean {
        return false;
    }

    isSomeAnd(fn: (val: T) => boolean): boolean {
        return fn(this.#val);
    }

    match<U>(fn: Partial<MatchOption<T, U>>): U {
        const {some} = {...defaultMatchOption, ...fn};
        return some(this.#val);
    }

    map<U>(fn: (val: T) => U): OptSome<U> {
        return new OptSomeImpl<U>(fn(this.#val));
    }

    mapOr<U>(_def: U, fn: (val: T) => U): U {
        return fn(this.#val);
    }

    mapOrElse<U>(_def: () => U, fn: (val: T) => U): U {
        return fn(this.#val);
    }

    andThen<U>(fn: (val: T) => Option<U>): Option<U> {
        return fn(this.#val);
    }

    orElse<U>(_fn: () => Option<U>): Option<T> {
        return this;
    }

    or<U>(_opt: Option<U>): Option<T> {
        return this;
    }

    and<U>(opt: Option<U>): Option<U> {
        return opt;
    }

    filter(fn: (val: T) => boolean): Option<T> {
        return fn(this.#val) ? this : None;
    }

    unwrapOr(_def: T): T {
        return this.#val;
    }

    unwrapOrElse(_fn: () => T): T {
        return this.#val;
    }

    unwrap(): T {
        return this.#val;
    }
}

interface OptNone<T> extends Option<T> {
    unwrap(): never;

    map<U>(fn: (val: T) => U): OptNone<U>;

    or<U>(opt: Option<U>): Option<U>;

    and<U>(opt: Option<U>): OptNone<U>;
}

class OptNoneImpl<T> implements OptNone<T> {
    isSome(): boolean {
        return false;
    }

    isNone(): boolean {
        return true;
    }

    isSomeAnd(_: (val: T) => boolean): boolean {
        return false;
    }

    match<U>(matchObject: Partial<MatchOption<T, U>>): U {
        const {none} = {...defaultMatchOption, ...matchObject};

        if (typeof none === 'function') {
            return (none as () => U)();
        }

        return none;
    }

    map<U>(_fn: (val: T) => U): OptNone<U> {
        return None;
    }

    mapOr<U>(def: U, _fn: (val: T) => U): U {
        return def;
    }

    mapOrElse<U>(fn: () => U, _fn: (val: T) => U): U {
        return fn();
    }

    andThen<U>(_fn: (val: T) => Option<U>): OptNone<U> {
        return None;
    }

    orElse<U>(fn: () => Option<U>): Option<U> {
        return fn();
    }

    or<U>(opt: Option<U>): Option<U> {
        return opt;
    }

    and<U>(_opt: Option<U>): OptNone<U> {
        return None;
    }

    filter(_: (val: T) => boolean): OptNone<T> {
        return None;
    }

    unwrapOr(def: T): T {
        if (def == null) {
            throw new Error('Cannot call unwrapOr with a missing value.');
        }

        return def;
    }

    unwrapOrElse(fn: () => T): T {
        return fn();
    }

    unwrap(): never {
        throw new ReferenceError('Trying to unwrap None.');
    }
}

export function Some<T>(val?: T | undefined): Option<T> {
    return typeof val === 'undefined' || val === null
        ? None
        : new OptSomeImpl(val);
}

export const None = new OptNoneImpl<any>();

export function isSome<T>(val: Option<T>): val is OptSome<T> {
    return val.isSome();
}

export function isNone<T>(val: Option<T>): val is OptNone<T> {
    return val.isNone();
}
