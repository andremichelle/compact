import { LoadingIndicator } from "./LoadingIndicator.tsx"
import { FailureIndicatorIndicator } from "./FailureIndicator.tsx"
import { TrackListItem } from "./TrackListItem.tsx"
import { Playback } from "../playback.ts"
import { Html } from "@ui/html.ts"
import { int } from "@common/lang.ts"
import { ListHeader } from "./ListHeader.tsx"
import { Api, Track, TrackListData, TrackListRequest } from "../api.ts"
import css from "./TrackList.sass?inline"

const className = Html.adoptStyleSheet(css, "track-list")

export type TrackListProps = {
    api: Api
    playback: Playback
    request: TrackListRequest
}

export const TrackList = ({ api, playback, request }: TrackListProps) => {
    let index: int = 0
    const element: HTMLElement = <section className={className} />
    const fetch = (request: TrackListRequest) => request.fetch()
        .then((response: TrackListData) => {
            if (!element.isConnected) {return}
            if (index === 0) {
                element.append(
                    <ListHeader name={response.name} link={
                        request.scope === "tracks"
                            ? {
                                label: "Show Artist's Playlists",
                                href: `#playlists/${request.artistKey}`
                            } : undefined} />
                )
            }
            const tracks: ReadonlyArray<Track> = response.tracks
            element.append(...tracks.map((track: Track) => (
                <TrackListItem api={api}
                               playback={playback}
                               track={track}
                               index={index++} />
            )))
            if (!response.hasMore()) {return}
            const moreEntriesIndicator = <LoadingIndicator title="loading more tracks" />
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    fetch({ ...request, fetch: () => response.nextPage() })
                        .finally(() => moreEntriesIndicator.remove())
                    observer.disconnect()
                }
            })
            element.append(moreEntriesIndicator)
            observer.observe(moreEntriesIndicator)
        })
        .catch(() => {
            if (element.isConnected) {
                element.append(<FailureIndicatorIndicator title="Could not load tracks"
                                                          onRetry={() => fetch(request)} />)
            }
        })
    const loadingIndicator = <LoadingIndicator title="loading tracks" />
    element.append(loadingIndicator)
    fetch(request).then(() => loadingIndicator.remove())
    return element
}