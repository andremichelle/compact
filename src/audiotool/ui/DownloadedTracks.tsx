import { TrackListItem } from "./TrackListItem.tsx"
import { Playback } from "../playback.ts"
import { Html } from "@ui/html.ts"
import { int } from "@common/lang.ts"
import css from "./TrackList.sass?inline"
import { ListHeader } from "./ListHeader.tsx"
import { Api, Track } from "../api.ts"

const className = Html.adoptStyleSheet(css, "track-list")

export type DownloadedTracksProps = {
    api: Api
    playback: Playback
}

export const DownloadedTracks = ({ api, playback }: DownloadedTracksProps) => {
    return <section className={className}>
        <ListHeader name="Downloaded" />
        {api.downloads.tracks().map((track: Track, index: int) => (
            <TrackListItem api={api}
                           playback={playback}
                           track={track}
                           index={index} />
        ))}
    </section>
}