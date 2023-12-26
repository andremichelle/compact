import { Inject } from "@jsx/inject.ts"
import { Procedure } from "@common/lang.ts"
import { Html } from "@ui/html.ts"
import css from "./AuthorList.sass?inline"
import { ApiV1 } from "../api.v1.ts"

const className = Html.adoptStyleSheet(css, "author-list")

export type AuthorListProps = {
    populate?: Inject.Ref<Procedure<ReadonlyArray<ApiV1.User>>>
    users: ReadonlyArray<ApiV1.User>
}

export const AuthorList = ({ users, populate }: AuthorListProps) => {
    const render = (users: ReadonlyArray<ApiV1.User>) =>
        users.map(user => <a href={`#tracks/${user.key}`}>{user.name}</a>)
    const element = <div className={className}>{render(users)}</div>
    populate?.addTarget(users => {
        Html.empty(element)
        element.append(...render(users))
    })
    return element
}