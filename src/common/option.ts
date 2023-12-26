import {
    Func,
    getOrProvide,
    isDefined,
    Nullable,
    Nullish,
    panic,
    Procedure,
    Provider,
    ValueOrProvider
} from "@common/lang"

export interface Option<T> {
    unwrap(fail?: string | Provider<string>): T
    unwrapOrElse(or: T | Provider<T>): T
    unwrapOrNull(): Nullable<T>
    match<R>(matchable: Option.Matchable<T, R>): R
    ifSome(procedure: Procedure<T>): void
    contains(value: T): boolean
    isEmpty(): boolean
    nonEmpty(): boolean
    map<U>(func: Func<T, U>): Option<U>
    mapOr<U>(func: Func<T, U>, or: U | Provider<U>): U
    flatMap<U>(func: Func<T, Option<U>>): Option<U>
    equals(other: Option<T>): boolean
}

export namespace Option {
    export interface Matchable<T, RETURN> {
        some: Func<T, RETURN>
        none: Provider<RETURN>
    }

    export const wrap = <T>(value: Nullish<T>): Option<T | never> => isDefined(value) ? new Some(value) : None

    export class Some<T> implements Option<T> {
        constructor(private readonly value: T) {
            if (!isDefined(value)) {panic(`Option.Some cannot be ${value}`)}
        }
        unwrap(): T { return this.value }
        unwrapOrElse(_: T): T { return this.value }
        unwrapOrNull(): Nullable<T> { return this.value }
        contains(value: T): boolean { return value === this.value }
        match<R>(matchable: Matchable<T, R>): R {return matchable.some(this.value)}
        ifSome(run: Procedure<T>): void {run(this.value)}
        isEmpty(): boolean { return false }
        nonEmpty(): boolean { return true }
        map<U>(callback: (value: T) => Nullable<U>): Option<U> {return Option.wrap(callback(this.value))}
        mapOr<U>(func: Func<T, U>, _or: U | Provider<U>): U {return func(this.value)}
        flatMap<U>(callback: (value: T) => Option<U>): Option<U> {return callback(this.value)}
        equals(other: Option<T>): boolean {return this.unwrapOrNull() == other.unwrapOrNull()}
        toString(): string {return `{Option.Some(${this.value})}`}
        get [Symbol.toStringTag]() {return this.toString()}
    }

    export const None: Option<never> = new class implements Option<never> {
        readonly unwrap = (fail?: ValueOrProvider<string>): never => panic(isDefined(fail) ? getOrProvide(fail) : "unwrap failed")
        readonly unwrapOrElse = <T>(value: ValueOrProvider<T>): T => getOrProvide(value)
        readonly unwrapOrNull = (): Nullable<never> => null
        readonly contains = (_: unknown): boolean => false
        readonly match = <R>(matchable: Matchable<never, R>): R => matchable.none()
        readonly ifSome = (_: Procedure<never>): void => {}
        readonly isEmpty = (): boolean => true
        readonly nonEmpty = (): boolean => false
        readonly map = <U>(_: (_: never) => U): Option<U> => None
        readonly mapOr = <U>(_: Func<never, U>, or: ValueOrProvider<U>): U => getOrProvide(or)
        readonly flatMap = (_: (_: never) => Option<never>): Option<never> => None
        readonly equals = (other: Option<never>): boolean => this.unwrapOrNull() == other.unwrapOrNull()
        readonly toString = (): string => "{Option.None}"
        get [Symbol.toStringTag]() {return this.toString()}
    }
}