// noinspection JSUnusedGlobalSymbols

import { Predicate } from "@common/lang.ts"

export namespace Predicates {
    export const alwaysTrue: Predicate<unknown> = () => true
    export const alwaysFalse: Predicate<unknown> = () => false
    export const definedPredicate: Predicate<unknown> = (value: unknown) => value !== null && value !== undefined
}