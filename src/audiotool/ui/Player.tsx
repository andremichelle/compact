import { Html } from "@ui/html.ts"
import { Playback, PlaybackEvent } from "../playback.ts"
import { Inject } from "@jsx/inject.ts"
import { Procedure } from "@common/lang.ts"
import { AuthorList } from "./AuthorList.tsx"
import { PlaybackProgress } from "./PlaybackProgress.tsx"
import { timespanToString } from "../time-conversion.ts"
import { Api, User } from "../api.ts"
import css from "./Player.sass?inline"
import { TerminableOwner } from "@common/terminable.ts"

export type PlayerProps = {
    lifeTime: TerminableOwner
    api: Api,
    playback: Playback
}

export const Player = ({ lifeTime, api, playback }: PlayerProps) => {
    const headerClasses = Inject.classes("cover")
    const stateClasses = Inject.classes("state")
    const coverHref = Inject.attribute(Html.EmptyGif)
    const profileLink = Inject.attribute("#")
    const trackName = Inject.text("")
    const playbackElapsed = Inject.text("00:00")
    const playbackDuration = Inject.text("00:00")
    const populateUserList = Inject.ref<Procedure<ReadonlyArray<User>>>()
    const element = (
        <section className={Html.adoptStyleSheet(css, "player")}>
            <div className="center">
                <header className={headerClasses}
                        onclick={() => playback.active.ifSome(track => playback.toggle(track))}>
                    <img src={coverHref} />
                    <img src={coverHref} />
                    <div className={stateClasses} />
                </header>
                <div className="info">
                    <div className="meta">
                        <a className="name" href={profileLink} target="audiotool"
                           title="Visit Audiotool Track Profile">{trackName}</a>
                        <AuthorList populate={populateUserList} users={[]} />
                    </div>
                    <div className="time">
                        <span>{playbackElapsed}</span>
                        <PlaybackProgress playback={playback} />
                        <span>{playbackDuration}</span>
                    </div>
                </div>
            </div>
        </section>
    )
    lifeTime.own(playback.subscribe((event: PlaybackEvent) => {
        if (event.state === "changed") {
            event.track.match({
                none: () => {
                    coverHref.value = ""
                    trackName.value = ""
                    populateUserList.get()([])
                    playbackElapsed.value = timespanToString(0)
                    playbackDuration.value = timespanToString(0)
                    headerClasses.remove("active")
                    profileLink.value = "#"
                },
                some: track => {
                    coverHref.value = api.fetchCover(track)
                    trackName.value = track.name
                    populateUserList.get()(track.collaborators)
                    playbackDuration.value = timespanToString(track.duration)
                    headerClasses.add("active")
                    profileLink.value = `https://www.audiotool.com/track/${track.key}`
                }
            })
        } else if (event.state === "progress") {
            playbackElapsed.value = timespanToString(event.elapsedInSeconds * 1000)
        } else if (event.state === "buffering") {
            stateClasses.add("buffering")
        } else if (event.state === "playing") {
            stateClasses.add("playing")
            stateClasses.remove("buffering")
        } else if (event.state === "paused") {
            stateClasses.remove("playing")
        }
    }))
    return element
}