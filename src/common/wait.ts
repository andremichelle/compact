// noinspection JSUnusedGlobalSymbols

import { TimeSpan } from "@common/time-span.ts"
import { Exec } from "@common/lang.ts"

export namespace Wait {
    export const frame = (): Promise<void> => new Promise(resolve => requestAnimationFrame(() => resolve()))
    export const frames = (numFrames: number): Promise<void> => new Promise(resolve => {
        let count = numFrames
        const callback = () => {if (--count <= 0) {resolve()} else {requestAnimationFrame(callback)}}
        requestAnimationFrame(callback)
    })
    export const timeSpan = <T = void>(time: TimeSpan, result?: T): Promise<T> =>
        new Promise(resolve => setTimeout(() => resolve(result as T), time.millis()))
    export const event = (target: EventTarget, type: string): Promise<void> =>
        new Promise<void>(resolve => target.addEventListener(type, resolve as Exec, { once: true }))
}