import { LoadingIndicator } from "./LoadingIndicator.tsx"
import { FailureIndicatorIndicator } from "./FailureIndicator.tsx"
import css from "./Playlists.sass?inline"
import { ListHeader } from "./ListHeader.tsx"
import { PlayListsRequest, PlaylistsResponse } from "../api.ts"
import { Html } from "jet-std"
import { createElement } from "jet-tsx"

const className = Html.adoptStyleSheet(css, "playlists")

export type PlaylistsProps = { request: PlayListsRequest }

export const Playlists = ({ request }: PlaylistsProps) => {
    const element: HTMLElement = <section className={className} />
    const fetch = (request: PlayListsRequest) => request.fetch()
        .then((response: PlaylistsResponse) => {
            if (!element.isConnected) {return}
            element.append(
                <ListHeader name={response.name} link={{
                    label: "Show Artists Tracks",
                    href: `#tracks/${request.artistKey}`
                }} />
            )
            element.append(...response.playlists.map(playlist => (
                <button onclick={() => location.hash = `playlist/${playlist.key}`}>
                    <img src={playlist.image} />
                    <div>{playlist.name}</div>
                </button>
            )))
        })
        .catch(() => {
            if (element.isConnected) {
                element.append(<FailureIndicatorIndicator title="Could not load playlists"
                                                          onRetry={() => fetch(request)} />)
            }
        })
    const loadingIndicator = <LoadingIndicator title="loading playlists" />
    element.append(loadingIndicator)
    fetch(request).then(() => loadingIndicator.remove())
    return element
}