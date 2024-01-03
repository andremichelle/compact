import { ListHeader } from "./ListHeader.tsx"
import { Html } from "@ui/html.ts"
import css from "./ArtistCards.sass?inline"
import { ApiV1 } from "../api.v1.ts"
import { Inject } from "@jsx/inject.ts"

const className = Html.adoptStyleSheet(css, "artist-cards")

export type ArtistCardsProps = { keys: ReadonlyArray<string> }

export const ArtistCards = ({ keys }: ArtistCardsProps) => {
    return <section className={className}>
        <ListHeader name="Popular Audiotool Artists" />
        {keys.toSorted(() => Math.sign(Math.random() * 2.0 - 1.0)).map((key: string) => {
            const imgSrc = Inject.attribute(Html.EmptyGif)
            const nameText = Inject.text("")
            const button: Element = (
                <button onclick={() => location.hash = `tracks/${key}`}>
                    <img src={imgSrc} width={128} loading="lazy" />
                    <div>{nameText}</div>
                </button>
            )
            const intersectionObserver = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    intersectionObserver.unobserve(button)
                    ApiV1.fetchUsers(key).then(([user]) => {
                        imgSrc.value = user.avatar
                        nameText.value = user.name
                    })
                }
            })
            intersectionObserver.observe(button)
            return button
        })}
    </section>
}