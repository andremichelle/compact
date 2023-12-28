import { Option } from "@common/option.ts"
import { Notifier } from "@common/observers.ts"
import { isDefined, Procedure, unitValue } from "@common/lang.ts"
import { Subscription } from "@common/terminable.ts"
import { Api, Track } from "./api.ts"

export type PlaybackEvent = {
    state: "changed"
    track: Option<Track>
} | {
    state: "buffering"
} | {
    state: "playing"
} | {
    state: "progress"
    progress: unitValue
    elapsedInSeconds: number
    durationInSeconds: number
} | {
    state: "paused"
} | {
    state: "error"
    reason: string
} | {
    state: "idle"
}

export class Playback {
    readonly #api: Api
    readonly #audio: HTMLAudioElement
    readonly #notifier: Notifier<PlaybackEvent>

    #active: Option<Track> = Option.None
    #state: PlaybackEvent["state"] = "idle"

    constructor(api: Api) {
        this.#api = api
        this.#audio = new Audio()
        this.#audio.crossOrigin = "true"
        this.#notifier = new Notifier<PlaybackEvent>()
    }

    toggle(track: Track): void {
        if (this.isActive(track)) {
            if (this.#audio.paused) {
                this.#audio.play().catch(() => {})
            } else {
                this.#audio.pause()
            }
            return
        }
        this.active = Option.wrap(track)
        this.#notify({
            state: "progress",
            progress: 1.0,
            elapsedInSeconds: 0,
            durationInSeconds: track.duration / 1000
        })
        this.#audio.play().catch(() => {})
    }

    nextTrack(): void {this.#active.ifSome(track => {if (track.next) {this.toggle(track.next)}})}
    prevTrack(): void {this.#active.ifSome(track => {if (track.prev) {this.toggle(track.prev)}})}
    togglePlay(): void {this.#active.ifSome(track => {this.toggle(track)})}

    playTrackFrom(track: Track, progress: unitValue): void {
        const durationInSeconds = track.duration / 1000
        if (this.isActive(track)) {
            this.#notify({
                state: "progress",
                progress,
                elapsedInSeconds: durationInSeconds * progress,
                durationInSeconds
            })
            this.#notify({ state: "buffering" })
            this.#audio.currentTime = durationInSeconds * progress
            if (this.#audio.paused) {
                this.#audio.play().catch()
            }
            return
        }
        this.active = Option.wrap(track)
        this.#notify({ state: "buffering" })
        this.#audio.play().catch(() => {})
        this.#audio.currentTime = durationInSeconds * progress
    }

    eject(): void {this.active = Option.None}

    subscribe(observer: Procedure<PlaybackEvent>): Subscription {return this.#notifier.subscribe(observer)}

    get state(): PlaybackEvent["state"] {return this.#state}
    get active(): Option<Track> {return this.#active}
    set active(track: Option<Track>) {
        this.#unwatchAudio()
        this.#active = track
        this.#active.ifSome(track => {
            this.#audio.src = this.#api.fetchMP3(track)
            this.#watchAudio(track)
        })
        this.#notify({ state: "changed", track })
    }

    isActive(track: Track): boolean {return this.#active.unwrapOrNull()?.key === track.key}

    #watchAudio(track: Track): void {
        this.#audio.onended = () => this.active.ifSome(track => {if (isDefined(track.next)) {this.toggle(track.next)}})
        this.#audio.onplay = () => this.#notify({ state: this.#canPlayImmediately() ? "playing" : "buffering" })
        this.#audio.onpause = () => this.#notify({ state: "paused" })
        this.#audio.onerror = (event, _source, _lineno, _colno, error) => this.#notify({
            state: "error",
            reason: error?.message ?? event instanceof Event ? "Unknown" : event
        })
        this.#audio.onstalled = () => {
            if (this.#state !== "paused") {
                this.#notify({ state: "buffering" })
            }
        }
        this.#audio.ontimeupdate = () => {
            if (this.#state === "buffering") {
                this.#notify({ state: "playing" })
            }
            const elapsedInSeconds = this.#audio.currentTime
            if (elapsedInSeconds > 0.0) {
                const durationInSeconds = track.duration / 1000
                this.#notify({
                    state: "progress",
                    progress: elapsedInSeconds / durationInSeconds,
                    elapsedInSeconds,
                    durationInSeconds
                })
            }
        }
    }

    #unwatchAudio(): void {
        this.#audio.onended = null
        this.#audio.onplay = null
        this.#audio.onpause = null
        this.#audio.onerror = null
        this.#audio.onstalled = null
        this.#audio.ontimeupdate = null
    }

    #notify(event: PlaybackEvent) {
        this.#state = event.state
        this.#notifier.notify(event)
    }

    #canPlayImmediately(): boolean {
        const buffered = this.#audio.buffered
        const currentTime = this.#audio.currentTime
        for (let index = 0; index < buffered.length; index++) {
            if (buffered.start(index) <= currentTime && currentTime < buffered.end(index)) {
                return true
            }
        }
        return false
    }
}