import { Exec, Func, isDefined, Provider } from "@common/lang.ts"
import { Inject } from "@jsx/inject.ts"

export type HotspotUpdater = { update: Exec }

export type HotSpotProps = { render: Provider<Element>, ref: Inject.Ref<HotspotUpdater> }

export const Hotspot = ({ render, ref }: HotSpotProps) => {
    let current: Element = render()
    const updater = {
        update: () => {
            if (current.isConnected) {
                const next = render()
                current.replaceWith(next)
                current = next
            }
        }
    }
    ref.addTarget(updater)
    return current
}

export type AwaitProps<T> = {
    className?: string
    promise: Provider<Promise<T>>,
    loading: Provider<Element>,
    success: Func<T, Element>,
    failure: Func<{ reason: any, retry: Exec }, Element>
}

export const Await = <T>({ className, promise, loading, success, failure }: AwaitProps<T>) => {
    const start = () => {
        let current: Element = loading()
        const replace = (next: Element) => {
            current.replaceWith(next)
            current = next
        }
        promise().then(result => {
            if (current.isConnected) {
                replace(success(result))
            }
        }, reason => {
            if (current.isConnected) {
                replace(failure({ reason, retry: () => replace(start()) }))
            }
        })
        return current
    }
    // we put this in a container to keep an exchangeable element
    const contents = document.createElement("div")
    contents.style.display = "contents"
    if (isDefined(className)) {
        contents.className = className
    }
    contents.appendChild(start())
    return contents
}