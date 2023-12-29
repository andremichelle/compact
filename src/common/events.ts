import { Subscription } from "@common/terminable"

export class Events {
    static subscribe<K extends keyof WindowEventMap>(
        eventTarget: EventTarget,
        type: K,
        listener: (ev: WindowEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): Subscription {
        eventTarget.addEventListener(type, listener as EventListener, options)
        return { terminate: () => eventTarget.removeEventListener(type, listener as EventListener, options) }
    }

    static subscribeAny(
        eventTarget: EventTarget,
        type: string,
        listener: (event: Event) => void,
        options?: boolean | AddEventListenerOptions
    ): Subscription {
        eventTarget.addEventListener(type, listener as EventListener, options)
        return { terminate: (): void => eventTarget.removeEventListener(type, listener as EventListener, options) }
    }
}