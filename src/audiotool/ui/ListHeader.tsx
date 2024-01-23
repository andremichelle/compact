import css from "./ListHeader.sass?inline"
import { Html, isDefined } from "jet-std"
import { createElement } from "jet-tsx"

const className = Html.adoptStyleSheet(css, "list-header")

export type ListHeaderProps = {
    name: string
    link?: {
        label: string
        href: string
    }
}

export const ListHeader = ({ name, link }: ListHeaderProps) => (
    <header className={className}>
        <h1>{name}</h1>
        {isDefined(link) ? <a href={link.href}>{link.label}</a> : false}
    </header>
)