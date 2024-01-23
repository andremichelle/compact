import { AuthorList } from "./AuthorList.tsx"
import { dateToString, timespanToString } from "../time-conversion.ts"
import { Playback } from "../playback.ts"
import { Api, Track } from "../api.ts"
import css from "./TrackListItem.sass?inline"
import { Html, int } from "jet-std"
import { createElement } from "jet-tsx"

const className = Html.adoptStyleSheet(css, "track-list-item")

export type TrackListItemProps = {
    api: Api
    playback: Playback
    track: Track
    index: int
}

export const TrackListItem = ({ api, playback, track, index }: TrackListItemProps) => {
    const toggleTrackHandler = (event: Event) => {
        event.stopPropagation()
        playback.toggle(track)
    }
    const resolveClassName = (): string => {
        const classes: Array<string> = [className]
        if (playback.isActive(track)) {
            classes.push("active")
            if (playback.state === "buffering") {
                classes.push("buffering")
            } else if (playback.state === "playing" || playback.state === "progress") {
                classes.push("playing")
            }
        }
        if (api.downloads.get(track.key).nonEmpty()) {
            classes.push("downloaded")
        }
        return classes.join(" ")
    }
    return (
        <div className={resolveClassName()} data-track-key={track.key}>
            <button className="play" onclick={toggleTrackHandler}>
                <span className="index">{index + 1}</span>
            </button>
            <img src={api.fetchCover(track)}
                 onclick={toggleTrackHandler} />
            <div className="names">
                <div className="track">
                    <span onclick={toggleTrackHandler}>{track.name}</span>
                </div>
                <AuthorList users={track.collaborators} />
            </div>
            <div className="meta">
                <div className="date">
                    <svg>
                        <use href="#create" />
                    </svg>
                    <span>{dateToString(new Date(track.created))}</span>
                </div>
                <div className="duration">
                    <svg>
                        <use href="#duration" />
                    </svg>
                    <span>{timespanToString(track.duration)}</span>
                </div>
            </div>
            <a href={`#genre/${track.genreKey}`}
               className="genre"
               title={`Browse ${track.genreName}`}>{track.genreName}</a>
            <button className="download"
                    onclick={() => {api.downloads.toggle(track)}}
                    title="Download for offline usage">
                <svg>
                    <use href="#downloaded"></use>
                </svg>
            </button>
        </div>
    )
}