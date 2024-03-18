import {None, Option, Some} from './option';

interface MatchResult<T, E, U> {
    ok: (val: T) => U;
    err: (val: E) => U;
}

const defaultMatchResult: MatchResult<any, any, any> = {
    ok: (val: any) => val,
    err: (val: any) => val,
}

export interface Result<T, E extends Error> {
    isOk(): boolean;

    isErr(): boolean;

    ok(): Option<T>;

    err(): Option<E>;

    unwrap(): T | never;

    unwrapOr(opt: T): T;

    unwrapOrElse(fn: (err: E) => T): T;

    unwrapOrThrow(): T;

    unwrapErr(): E | never;

    match<U>(fn: Partial<MatchResult<T, E, U>>): U;

    map<U>(fn: (val: T) => U): Result<U, E>;

    mapErr<U extends Error>(fn: (err: E) => U): Result<T, U>;

    andThen<U>(fn: (val: T) => Result<U, E>): Result<U, E>;

    orElse<U>(fn: (err: E) => Result<U, E>): Result<T, E> | Result<U, E>;
}

interface ResOk<T, E extends Error = never> extends Result<T, E> {
    unwrap(): T;

    unwrapOr(opt: T): T;

    unwrapOrElse(fn: (err: E) => T): T;

    unwrapErr(): never;

    match<U>(fn: Partial<MatchResult<T, never, U>>): U;

    map<U>(fn: (val: T) => U): ResOk<U, never>;

    mapErr<U extends Error>(fn: (err: E) => U): ResOk<T, never>;

    andThen<U>(fn: (val: T) => Result<U, E>): Result<U, E>;

    orElse<U>(fn: (err: E) => Result<U, E>): Result<T, E>;
}

export function Ok<T, E extends Error = never>(val: T): ResOk<T, E> {
    return new ResOkImpl(val);
}

class ResOkImpl<T, E extends Error> implements ResOk<T, E> {
    #val: T;

    constructor(val: T) {
        this.#val = val;
    }

    isOk(): boolean {
        return true;
    }

    isErr(): boolean {
        return false;
    }

    ok(): Option<T> {
        return Some(this.#val);
    }

    err(): Option<E> {
        return None;
    }

    unwrap(): T {
        return this.#val;
    }

    unwrapOr(opt: T): T {
        return this.#val;
    }

    unwrapOrElse(_fn: (err: E) => T): T {
        return this.#val;
    }

    unwrapOrThrow(): T {
        return this.#val;
    }

    unwrapErr(): never {
        throw new ReferenceError('Cannot unwrap Err value of Result.Ok');
    }

    match<U>(matchObject: Partial<MatchResult<T, never, U>>): U {
        const {ok} = {...defaultMatchResult, ...matchObject};
        return ok(this.#val);
    }

    map<U>(fn: (val: T) => U): ResOk<U, never> {
        return Ok(fn(this.#val));
    }

    mapErr<U extends Error>(_fn: (err: E) => U): ResOk<T, never> {
        return Ok(this.#val);
    }

    andThen<U>(fn: (val: T) => Result<U, E>): Result<U, E> {
        return fn(this.#val);
    }

    orElse<U>(_fn: (err: E) => Result<U, E>): ResOk<T, E> {
        return Ok(this.#val);
    }

}

interface ResErr<T, E extends Error> extends Result<T, E> {
    unwrap(): never;

    unwrapOr(opt: T): T;

    unwrapOrElse(fn: (err: E) => T): T;

    unwrapErr(): E;

    match<U>(fn: Partial<MatchResult<never, E, U>>): U;

    map<U>(fn: (val: T) => U): ResErr<never, E>;

    mapErr<U extends Error>(fn: (err: E) => U): ResErr<never, U>;

    andThen<U>(fn: (val: T) => Result<U, E>): ResErr<never, E>;

    orElse<U>(fn: (err: E) => Result<U, E>): Result<U, E>;
}

class ResErrImpl<T, E extends Error> implements ResErr<T, E> {
    #err: E;

    constructor(err: E) {
        this.#err = err;
    }

    isOk(): boolean {
        return false;
    }

    isErr(): boolean {
        return true;
    }

    ok(): Option<T> {
        return None;
    }

    err(): Option<E> {
        return Some(this.#err);
    }

    unwrap(): never {
        throw new ReferenceError('Cannot unwrap Ok value of Result.Err');
    }

    unwrapOr(opt: T): T {
        return opt;
    }

    unwrapOrElse(fn: (err: E) => T): T {
        return fn(this.#err);
    }

    unwrapOrThrow(): never {
        throw this.#err;
    }

    unwrapErr(): E {
        return this.#err;
    }

    match<U>(matchObject: Partial<MatchResult<never, E, U>>): U {
        const {err} = {...defaultMatchResult, ...matchObject};
        return err(this.#err);
    }

    map<U>(_fn: (_val: T) => U): ResErr<never, E> {
        return Err(this.#err);
    }

    mapErr<U extends Error>(fn: (err: E) => U): ResErr<never, U> {
        return Err(fn(this.#err));
    }

    andThen<U>(_fn: (val: T) => Result<U, E>): ResErr<never, E> {
        return Err(this.#err);
    }

    orElse<U>(fn: (err: E) => Result<U, E>): Result<U, E> {
        return fn(this.#err);
    }

}

export function Err<T, E extends Error>(err: E): ResErr<T, E> {
    return new ResErrImpl(err);
}

export function isOk<T, E extends Error>(val: Result<T, E>): val is ResOk<T> {
    return val.isOk();
}

export function isErr<T, E extends Error>(val: Result<T, E>): val is ResErr<T, E> {
    return val.isErr();
}
