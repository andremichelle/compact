// noinspection JSUnusedGlobalSymbols

import { Func, int, Unhandled } from "@common/lang"

export class TimeSpan {
    static readonly startEstimator = (): Func<number, TimeSpan> => {
        const startTime: number = performance.now()
        return (progress: number): TimeSpan => {
            if (progress === 0.0) {return TimeSpan.POSITIVE_INFINITY}
            const runtime = (performance.now() - startTime)
            return TimeSpan.millis(runtime / progress - runtime)
        }
    }

    static readonly POSITIVE_INFINITY = new TimeSpan(Number.POSITIVE_INFINITY)
    static readonly millis = (value: number) => new TimeSpan(value)
    static readonly seconds = (value: number) => new TimeSpan(value * TimeSpan.#MILLI_SECONDS_PER_SECOND)
    static readonly minutes = (value: number) => new TimeSpan(value * TimeSpan.#MILLI_SECONDS_PER_MINUTE)
    static readonly hours = (value: number) => new TimeSpan(value * TimeSpan.#MILLI_SECONDS_PER_HOUR)
    static readonly days = (value: number) => new TimeSpan(value * TimeSpan.#MILLI_SECONDS_PER_DAY)

    static readonly #MILLI_SECONDS_PER_SECOND = 1_000
    static readonly #MILLI_SECONDS_PER_MINUTE = 60_000
    static readonly #MILLI_SECONDS_PER_HOUR = 3_600_000
    static readonly #MILLI_SECONDS_PER_DAY = 86_400_000

    readonly #ms: number

    private constructor(ms: number) {this.#ms = ms}

    millis(): number { return this.#ms }
    absSeconds(): number { return Math.abs(this.#ms) / TimeSpan.#MILLI_SECONDS_PER_SECOND }
    absMinutes(): number { return Math.abs(this.#ms) / TimeSpan.#MILLI_SECONDS_PER_MINUTE }
    absHours(): number { return Math.abs(this.#ms) / TimeSpan.#MILLI_SECONDS_PER_HOUR }
    absDays(): number { return Math.abs(this.#ms) / TimeSpan.#MILLI_SECONDS_PER_DAY }
    split(): { d: int, h: int, m: int, s: int } {
        return {
            d: Math.floor(this.absDays()),
            h: Math.floor(this.absHours()) % 24,
            m: Math.floor(this.absMinutes()) % 60,
            s: Math.floor(this.absSeconds()) % 60
        }
    }
    isNow(): boolean { return this.#ms === 0.0 }
    isPast(): boolean { return this.#ms < 0.0 }
    isFuture(): boolean { return this.#ms > 0.0 }
    toString(): string {
        if (isNaN(this.#ms)) {return "NaN"}
        if (!isFinite(this.#ms)) {return "∞"}
        const { d, h, m, s } = this.split()
        if (d > 0) {
            return [
                TimeSpan.#quantity("d", d), TimeSpan.#quantity("h", h),
                TimeSpan.#quantity("m", m), TimeSpan.#quantity("s", s)]
                .join(", ")
        } else if (h > 0) {
            return [
                TimeSpan.#quantity("h", h), TimeSpan.#quantity("m", m),
                TimeSpan.#quantity("s", s)]
                .join(", ")
        } else if (m > 0) {
            return [TimeSpan.#quantity("m", m), TimeSpan.#quantity("s", s)]
                .join(", ")
        } else if (s > 0) {
            return TimeSpan.#quantity("s", s)
        } else {
            return "now"
        }
    }

    static readonly #quantity = (name: "d" | "h" | "m" | "s", count: int): string => {
        switch (name) {
            case "d":
                return `${count} ${count < 2 ? "day" : "days"}`
            case "h":
                return `${count} ${count < 2 ? "hour" : "hours"}`
            case "m":
                return `${count} ${count < 2 ? "minute" : "minutes"}`
            case "s":
                return `${count} ${count < 2 ? "second" : "seconds"}`
            default:
                return Unhandled(name)
        }
    }
}