import { TrackListItem } from "./TrackListItem.tsx"
import { Playback } from "../playback.ts"
import { Html } from "@ui/html.ts"
import { int } from "@common/lang.ts"
import { ListHeader } from "./ListHeader.tsx"
import { Api, Track } from "../api.ts"
import { TerminableOwner } from "@common/terminable.ts"
import { Inject } from "@jsx/inject.ts"
import css from "./DownloadedTracks.sass?inline"

const className = Html.adoptStyleSheet(css, "downloaded-tracks")

export type DownloadedTracksProps = {
    lifeTime: TerminableOwner
    api: Api
    playback: Playback
}

export const DownloadedTracks = ({ lifeTime, api, playback }: DownloadedTracksProps) => {
    const listRef = Inject.ref<HTMLDivElement>()
    const memoryLabel = Inject.text("")
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