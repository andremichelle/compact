import { Playback } from "../playback.ts"
import css from "./PlaybackProgress.sass?inline"
import { Html } from "jet-std"
import { createElement } from "jet-tsx"

const className = Html.adoptStyleSheet(css, "playback-progress")

export type PlaybackProgressType = { playback: Playback }

export const PlaybackProgress = ({ playback }: PlaybackProgressType) => {
    const bar = <div className="bar" />
    playback.subscribe(event => {
        if (event.state === "progress") {
            bar.style.setProperty("--progress", event.progress.toString())
        } else if (event.state === "buffering") {
            bar.classList.add("buffering")
        } else {
            bar.classList.remove("buffering")
        }
    })
    return (
        <div className={className}>
            <div className="socket" onclick={(event: MouseEvent) => {
                const target: HTMLDivElement = event.currentTarget as HTMLDivElement
                const clientRect = target.getBoundingClientRect()
                const position = (event.clientX - clientRect.left) / clientRect.width
                playback.active.ifSome(track => playback.playTrackFrom(track, position))
            }}>{bar}</div>
        </div>
    )
}