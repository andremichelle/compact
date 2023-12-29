import { Hotspot, HotspotUpdater } from "@jsx/utils.ts"
import { Html } from "@ui/html.ts"
import { Inject } from "@jsx/inject.ts"
import { Option } from "@common/option.ts"
import { Playback } from "../playback.ts"
import { Player } from "./Player.tsx"
import { TrackList } from "./TrackList.tsx"
import { Playlists } from "./Playlists.tsx"
import { ArtistCards } from "./ArtistCards.tsx"
import { Router } from "../router.ts"
import { SearchPage } from "./SearchPage.tsx"
import css from "./App.sass?inline"
import { Api } from "../api.ts"
import { artists } from "../artists.ts"
import { DownloadedTracks } from "./DownloadedTracks.tsx"
import { Navigation } from "./Navigation.tsx"
import { TerminableOwner } from "@common/terminable.ts"
import { Events } from "@common/events.ts"

document.title = "audiotool compact・music browser"

export type AppProps = {
    lifeTime: TerminableOwner
    playback: Playback,
    api: Api
}

export const App = ({ lifeTime, playback, api }: AppProps) => {
    const router = new Router()

    router.readAndForgetTrackKeyFromSharedURL()
        .ifSome(async (key: string) => playback.active = Option.wrap(await api.fetchTrack(key)))

    const trackListUpdater = Inject.ref<HotspotUpdater>()
    lifeTime.own(router.subscribe(() => trackListUpdater.get().update()))

    // old school dom manipulation for list-player states
    lifeTime.own(playback.subscribe(event => {
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
    }))

    lifeTime.own(api.downloads.subscribe(event => {
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
        } else if (event.type === "cancelled") {
            document.querySelectorAll(`[data-track-key="${event.key}"]`)
                .forEach(element => element.classList.remove("downloading"))
        }
    }))

    lifeTime.own(Events.subscribe(window, "keydown", (event: KeyboardEvent) => {
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
    }))

    // keep them here to be persistent
    const artistCards = <ArtistCards keys={artists} />
    const searchPage = <SearchPage api={api} playback={playback} />
    return (
        <main className={Html.adoptStyleSheet(css, "audiotool")}>
            <Player lifeTime={lifeTime} api={api} playback={playback} />
            <section className="content">
                <Hotspot ref={trackListUpdater} render={() => {
                    return router.path.match({
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
            <Navigation lifeTime={lifeTime} router={router} playback={playback} />
        </main>
    )
}