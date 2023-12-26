// noinspection JSUnusedGlobalSymbols

// Warning, those number types do not truncate decimal places and handle overflows.
export type byte = number
export type short = number
export type int = number
export type float = number
export type double = number
export type long = bigint
export type unitValue = number // 0...1

export type NumberArray =
    ReadonlyArray<number>
    | Float32Array
    | Float64Array
    | Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
export type FloatArray = Float32Array | Float64Array | number[]
export type Primitive = boolean | byte | short | int | long | float | double | string
export type Sign = -1 | 0 | 1
export type Nullish<T> = T | undefined | null
export type Class<T = object> = Function & { prototype: T }
export type Exec = () => void
export type Provider<T> = () => T
export type ValueOrProvider<T> = T | Provider<T>
export type Procedure<T> = (value: T) => void
export type Predicate<T> = (value: T) => boolean
export type Func<U, T> = (value: U) => T
export type Comparator<T> = (a: T, b: T) => number
export type Comparable<T> = { compareTo: (other: T) => number }
export type Equality<T> = { equals: (other: T) => boolean }
export type Nullable<T> = T | null
export type AnyFunc = (...args: any[]) => any
export type Stringifiable = { toString(): String }
export const isDefined = <T>(value: Nullish<T>): value is T => value !== undefined && value !== null
export const asDefined = <T>(value: Nullish<T>, fail: string = "asDefined failed"): T => value === null || value === undefined ? panic(fail) : value
export const isInstanceOf = <T>(obj: unknown, clazz: Class<T>): obj is T => obj instanceof clazz
export const tryProvide = <T>(provider: Provider<T>): T => {try {return provider()} catch (reason) {return panic(String(reason))}}
export const getOrProvide = <T>(value: ValueOrProvider<T>): T => value instanceof Function ? value() : value
export const safeWrite = (object: any, property: string, value: any): void => property in object ? object[property] = value : undefined
export const safeExecute = <F extends AnyFunc>(func: Nullish<F>, ...args: Parameters<F>): Nullish<ReturnType<F>> => func?.apply(null, args)
export const Unhandled = <R>(empty: never): R => {throw new Error(`Unhandled ${empty}`)}
export const panic = (issue: string = ""): never => {throw new Error(issue)}
export const assert = (condition: boolean, fail: ValueOrProvider<string>): void => condition ? undefined : panic(getOrProvide(fail))
export const canWrite = (obj: unknown, key: string): boolean => {
    while (isDefined(obj)) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key)
        if (isDefined(descriptor)) {
            return typeof descriptor.set === "function"
        }
        obj = Object.getPrototypeOf(obj)
    }
    return false
}