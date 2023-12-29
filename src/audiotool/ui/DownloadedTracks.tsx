import { TrackListItem } from "./TrackListItem.tsx"
import { Playback } from "../playback.ts"
import { Html } from "@ui/html.ts"
import { int } from "@common/lang.ts"
import css from "./TrackList.sass?inline"
import { ListHeader } from "./ListHeader.tsx"
import { Api, Track } from "../api.ts"
import { TerminableOwner } from "@common/terminable.ts"

const className = Html.adoptStyleSheet(css, "track-list")

export type DownloadedTracksProps = {
    lifeTime: TerminableOwner
    api: Api
    playback: Playback
}

export const DownloadedTracks = ({ lifeTime, api, playback }: DownloadedTracksProps) => {
    const section: HTMLElement = <section className={className}>
        <ListHeader name="Downloaded" />
        {api.downloads.tracks().map((track: Track, index: int) => (
            <TrackListItem api={api}
                           playback={playback}
                           track={track}
                           index={index} />
        ))}
    </section>
    lifeTime.own(api.downloads.subscribe(event => {
        if (event.type === "added") {
            section.append(
                <TrackListItem api={api}
                               playback={playback}
                               track={event.track}
                               index={api.downloads.numTracks()} />
            )
        }
    }))
    return section
}