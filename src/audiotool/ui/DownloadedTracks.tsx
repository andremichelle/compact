import { TrackListItem } from "./TrackListItem.tsx"
import { Playback } from "../playback.ts"
import { ListHeader } from "./ListHeader.tsx"
import { Api, Track } from "../api.ts"
import { createElement, Inject } from "jet-tsx"
import css from "./DownloadedTracks.sass?inline"
import { Html, int, TerminableOwner } from "jet-std"

const className = Html.adoptStyleSheet(css, "downloaded-tracks")

export type DownloadedTracksProps = {
    lifeTime: TerminableOwner
    api: Api
    playback: Playback
}

export const DownloadedTracks = ({ lifeTime, api, playback }: DownloadedTracksProps) => {
    const listRef = Inject.ref<HTMLDivElement>()
    const memoryLabel = Inject.value("")
    const section: HTMLElement = <section className={className}>
        <ListHeader name="Offline Available Tracks" />
        <div ref={listRef} className="list">
            {api.downloads.tracks().map((track: Track, index: int) => (
                <TrackListItem api={api}
                               playback={playback}
                               track={track}
                               index={index} />
            ))}
        </div>
        <div className="memory">{memoryLabel}</div>
    </section>
    const updateMemoryLabel = () => memoryLabel.value = `memory usage: ${api.downloads.memory() >> 20}MB`
    updateMemoryLabel()
    lifeTime.own(api.downloads.subscribe(event => {
        const element = listRef.get()
        if (event.type === "added") {
            element.append(
                <TrackListItem api={api}
                               playback={playback}
                               track={event.track}
                               index={api.downloads.numTracks()} />
            )
            updateMemoryLabel()
        } else if (event.type === "removed") {
            element.querySelector(`[data-track-key="${event.track.key}"]`)?.remove()
            updateMemoryLabel()
        }
    }))
    return section
}