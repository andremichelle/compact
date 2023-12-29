import { int, Procedure, unitValue } from "@common/lang"
import { Arrays } from "@common/arrays.ts"

export type ProgressHandler = Procedure<unitValue>

export namespace Progress {
    export const split = (progress: ProgressHandler, count: int): ReadonlyArray<ProgressHandler> => {
        const collect = new Float32Array(count)
        return Arrays.create(index => (value: number) => {
            collect[index] = value
            progress(collect.reduce((total, value) => total + value, 0.0) / count)
        }, count)
    }
}