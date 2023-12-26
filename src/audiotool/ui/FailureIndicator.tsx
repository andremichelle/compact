import { Html } from "@ui/html.ts"
import { Provider } from "@common/lang.ts"
import css from "./FailureIndicator.sass?inline"

const className = Html.adoptStyleSheet(css, "failure-indicator")

export type FailureIndicatorProps = {
    title: string
    onRetry: Provider<Promise<unknown>>
}

export const FailureIndicatorIndicator = ({ title, onRetry }: FailureIndicatorProps) => {
    let clicked = false
    const element = (
        <div className={className}>
            <span>{title}</span>
            <button onclick={() => {
                if (clicked) {return}
                clicked = true
                onRetry().finally(() => element.remove())
            }}>
                Retry
            </button>
        </div>
    )
    return element
}