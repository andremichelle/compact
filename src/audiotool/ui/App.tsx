import { Hotspot, HotspotUpdater } from "@jsx/utils.ts"
import { Html } from "@ui/html.ts"
import { Inject } from "@jsx/inject.ts"
import { Option } from "@common/option.ts"
import { Playback } from "../playback.ts"
import { Player } from "./Player.tsx"
import { TrackList } from "./TrackList.tsx"
import { Playlists } from "./Playlists.tsx"
import { ArtistCards } from "./ArtistCards.tsx"
import { Path, router } from "../router.ts"
import { SearchPage } from "./SearchPage.tsx"
import css from "./App.sass?inline"
import { Api } from "../api.ts"
import { artists } from "../artists.ts"
import { DownloadedTracks } from "./DownloadedTracks.tsx"

document.title = "audiotool compact・music browser"

export type AppProps = { playback: Playback, api: Api }

export const App = ({ playback, api }: AppProps) => {
    // read url and resolve page
    const url = new URL(location.href)
    const params = url.searchParams
    const track = Option.wrap(params.get("track"))
    track.ifSome(async (key: string) => {
        params.delete("track")
        history.replaceState(null, "", url)
        playback.active = Option.wrap(await api.fetchTrack(key))
    })

    // listen to path changes
    let path: Option<Path> = router(location.href)
    const trackListUpdater = Inject.ref<HotspotUpdater>()
    window.onhashchange = (event: HashChangeEvent) => {
        path = router(event.newURL)
        trackListUpdater.get().update()
    }

    // old school dom manipulation for list-player states
    playback.subscribe(event => {
        if (event.state === "changed") {
            document.querySelectorAll("[data-track-key].active")
                .forEach(element => element.classList.remove("active", "buffering", "playing", "error"))
            event.track.ifSome(track => document.querySelectorAll(`[data-track-key="${track.key}"]`)
                .forEach(element => {
                    element.classList.add("active")
                    element.firstElementChild?.scrollIntoView({ behavior: "smooth", block: "center" })
                }))
        } else if (event.state === "buffering") {
            document.querySelectorAll("[data-track-key].active")
                .forEach(element => element.classList.add("buffering"))
        } else if (event.state === "playing") {
            document.querySelectorAll("[data-track-key].active")
                .forEach(element => {
                    element.classList.remove("buffering")
                    element.classList.add("playing")
                })
        } else if (event.state === "paused") {
            document.querySelectorAll("[data-track-key].active")
                .forEach(element => element.classList.remove("playing"))
        }
    })

    api.downloads.subscribe(event => {
        if (event.type === "added") {
            document.querySelectorAll(`[data-track-key="${event.key}"]`)
                .forEach(element => {
                    element.classList.remove("downloading")
                    element.classList.add("downloaded")
                })
        } else if (event.type === "removed") {
            document.querySelectorAll(`[data-track-key="${event.key}"]`)
                .forEach(element => element.classList.remove("downloaded"))
        } else if (event.type === "fetching") {
            document.querySelectorAll(`[data-track-key="${event.key}"]`)
                .forEach(element => element.classList.add("downloading"))
        }
    })

    window.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.code === "ArrowRight") {
            playback.nextTrack()
        } else if (event.code === "ArrowLeft") {
            playback.prevTrack()
        } else if (event.code === "Space") {
            if (event.target instanceof HTMLInputElement) {
                return
            }
            event.preventDefault()
            playback.togglePlay()
        }
    })

    // keep them here to be persistent
    const artistCards = <ArtistCards keys={artists} />
    const searchPage = <SearchPage api={api} playback={playback} />
    return (
        <main className={Html.adoptStyleSheet(css, "audiotool")}>
            <Player api={api} playback={playback} />
            <section className="content">
                <Hotspot ref={trackListUpdater} render={() => {
                    return path.match({
                        none: () => artistCards,
                        some: path => {
                            if (path.root === "artists") {
                                return artistCards
                            } else if (path.root === "search") {
                                return searchPage
                            } else if (path.root === "downloaded") {
                                return <DownloadedTracks api={api} playback={playback} />
                            } else if (path.root === "tracks") {
                                if (path.request.scope === "playlists") {
                                    return <Playlists request={path.request} />
                                } else {
                                    return <TrackList api={api}
                                                      playback={playback}
                                                      request={path.request} />
                                }
                            }
                        }
                    })
                }} />
            </section>
            <footer>
                <span>
                    <span style={{ fontStyle: "italic" }}>compact</span>
                    is a mobile friendly audiotool music navigator coded by andré michelle・</span>
                <a href="https://github.com/andremichelle/compact" target="github">source code on github</a>
            </footer>
        </main>
    )
}