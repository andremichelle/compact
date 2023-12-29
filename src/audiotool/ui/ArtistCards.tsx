import { LoadingIndicator } from "./LoadingIndicator.tsx"
import { FailureIndicatorIndicator } from "./FailureIndicator.tsx"
import { ListHeader } from "./ListHeader.tsx"
import { ApiV1 } from "../api.v1.ts"
import { Html } from "@ui/html.ts"
import css from "./ArtistCards.sass?inline"
import { User } from "../api.ts"

const className = Html.adoptStyleSheet(css, "artist-cards")

export type ArtistCardsProps = { keys: ReadonlyArray<string> }

export const ArtistCards = ({ keys }: ArtistCardsProps) => {
    const element: HTMLElement = <section className={className} />
    const populate = (users: ReadonlyArray<User & { avatar: string }>) => {
        element.append(<ListHeader name="Popular Audiotool Artists" />)
        element.append(...users.toSorted(() => Math.sign(Math.random() * 2.0 - 1.0))
            .map(user => (
                <button onclick={() => location.hash = `tracks/${user.key}`}>
                    <img src={user.avatar} width={128} loading="lazy" />
                    <div>{user.name}</div>
                </button>
            )))
    }
    const fetch = async () => {
        const loadingIndicator = <LoadingIndicator title="loading artists" />
        element.append(loadingIndicator)
        return ApiV1.fetchUsers(...keys)
            .then((users: ReadonlyArray<User & { avatar: string }>) => populate(users))
            .catch(() => {
                if (element.isConnected) {
                    element.append(
                        <FailureIndicatorIndicator title="Could not load playlists"
                                                   onRetry={() => fetch()} />
                    )
                }
            })
            .finally(() => loadingIndicator.remove())
    }
    fetch().then(() => {})
    return element
}