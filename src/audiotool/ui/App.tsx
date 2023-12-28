import { Hotspot, HotspotUpdater } from "@jsx/utils.ts"
import { Html } from "@ui/html.ts"
import { Inject } from "@jsx/inject.ts"
import { Option } from "@common/option.ts"
import { Playback } from "../playback.ts"
import { Player } from "./Player.tsx"
import { TrackList } from "./TrackList.tsx"
import { Playlists } from "./Playlists.tsx"
import { ArtistCards } from "./ArtistCards.tsx"
import { Page, router } from "../router.ts"
import { SearchPage } from "./SearchPage.tsx"
import { ApiV1 } from "../api.v1.ts"
import css from "./App.sass?inline"
import { Api } from "../api.ts"

const artists = [
    "sandburgen", "kepz", "kurpingspace2", "sumad", "dabrig", "1n50mn1ac", "brainwalker", "retrorhythm", "eliatrix",
    "trancefreak12", "melancolia", "christian-chrom", "hipposandos", "markolmx", "ole", "chackoflakko", "sharkyyo",
    "banterclaus", "jordynth", "ewan_mcculloch", "snowfire", "shakey63", "meastrostromea", "jetdarc", "skyboundzoo",
    "borozo", "intracktion", "flying-baby-seal", "structure", "yafeelma", "nominal", "tophat", "fbs_cgman", "cgman",
    "oscarollie", "almate", "offbeatninja123", "cuddlexdude", "foxyfennec", "daftwill", "jambam", "tottenhauser",
    "amoeba", "opaqity", "808chunk", "joa", "trulsenstad", "tornsage", "infyuthsion", "nick123456", "beat123",
    "frigolito", "xavrockbeats", "nmgbeats", "pandasparks", "crazydruminator", "dove", "musicmanpw", "trance10",
    "vistamista", "djsolace1000", "naswalt", "mark-lewis_ndikintum", "synthinox", "traptaco", "dublion", "crashwarrior",
    "farcio", "inxile412", "zerod", "bluedude", "leadenshrew", "questionone", "ola", "heisten", "universecosmic",
    "no-worries-atmosphere", "rnzr", "nick123456", "physik", "zonemusic", "untamed", "theclient", "dracogotwings",
    "tomderry", "themp20q", "djcandie", "tteerabeats", "jewan", "31pablo", "looper", "dillonco", "callkay",
    "maddragon", "iwanbeflylo23", "martinstoj", "anotherevolution", "exist", "puppiez1006", "pimpmastaj"
]

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
        playback.active = Option.wrap(await ApiV1.fetchTrack(key))
    })

    // listen to page changes
    let page: Option<Page> = router(location.href)
    const trackListUpdater = Inject.ref<HotspotUpdater>()
    window.onhashchange = (event: HashChangeEvent) => {
        page = router(event.newURL)
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
    const searchPage = <SearchPage playback={playback} />
    return (
        <main className={Html.adoptStyleSheet(css, "audiotool")}>
            <Player api={api} playback={playback} />
            <section className="content">
                <Hotspot ref={trackListUpdater} render={() => {
                    return page.match({
                        none: () => artistCards,
                        some: page => {
                            if (page.type === "artists") {
                                return artistCards
                            } else if (page.type === "search") {
                                return searchPage
                            } else if (page.type === "tracks") {
                                if (page.request.scope === "playlists") {
                                    return <Playlists request={page.request} />
                                } else {
                                    return <TrackList api={api}
                                                      playback={playback}
                                                      request={page.request} />
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