import { ApiV2 } from "../api.v2.ts"
import css from "./SearchPage.sass?inline"
import { Playback } from "../playback.ts"
import { Api } from "../api.ts"
import { Html } from "jet-std"
import { createElement, Inject } from "jet-tsx"

const className = Html.adoptStyleSheet(css, "search-page")

export type SearchPageProps = {
    api: Api
    playback: Playback
}

export const SearchPage = ({ api, playback }: SearchPageProps) => {
    const inputRef = Inject.ref<HTMLInputElement>()
    const resultRef = Inject.ref<HTMLDivElement>()
    const handleInput = (() => {
        let id: ReturnType<typeof setTimeout>
        let abortController: AbortController | null = null
        return () => {
            clearTimeout(id)
            id = setTimeout(async () => {
                const inputElement = inputRef.get()
                if (!inputElement.isConnected) {return}
                inputElement.classList.add("searching")
                const query = inputElement.value
                abortController?.abort()
                abortController = new AbortController()
                const [users, playlists, tracks] = await Promise.all([
                    ApiV2.searchUser(query, 10, abortController.signal),
                    ApiV2.searchPlaylists(query, 10, abortController.signal),
                    ApiV2.searchTracks(query, 10, abortController.signal)
                        .then(v2 => Promise.all(v2.map(track => api.fetchTrack(track.id))))
                ])
                const result = resultRef.get()
                Html.empty(result)
                result.append(...users.map(user => (
                    <div>
                        <svg>
                            <use href="#user"></use>
                        </svg>
                        <a href={`#tracks/${user.id}`}>{user.name}</a>
                    </div>
                )))
                result.append(...playlists.map(playlist => (
                    <div>
                        <svg>
                            <use href="#playlist"></use>
                        </svg>
                        <a href={`#playlist/${playlist.id}`}>{playlist.name}</a>
                    </div>
                )))
                result.append(...tracks.map(track => (
                    <div>
                        <svg>
                            <use href="#track"></use>
                        </svg>
                        <a onclick={(event: Event) => {
                            event.preventDefault()
                            playback.toggle(track)
                        }}>{track.name}</a>
                    </div>
                )))
                inputElement.classList.remove("searching")
                abortController = null
            }, 250)
        }
    })()
    return (
        <div className={className}>
            <input ref={inputRef}
                   type="search"
                   autofocus
                   oninput={handleInput}
                   placeholder="Search user, playlists, tracks..." />
            <div ref={resultRef} className="result"></div>
        </div>
    )
}