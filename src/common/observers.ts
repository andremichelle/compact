import { Procedure } from "@common/lang.ts"
import { Subscription, Terminable } from "@common/terminable.ts"

export type Observer<VALUE> = Procedure<VALUE>

export interface Observable<VALUE> extends Terminable {
    subscribe(observer: Observer<VALUE>): Subscription
}

export class Notifier<T> implements Observable<T>, Terminable {
    readonly #observers: Set<Observer<T>> = new Set<Observer<T>>() // A set allows us to remove while iterating

    subscribe(observer: Observer<T>): Subscription {
        this.#observers.add(observer)
        return { terminate: (): unknown => this.#observers.delete(observer) }
    }

    notify(value: T): void {this.#observers.forEach((observer: Observer<T>) => observer(value))}

    terminate(): void {this.#observers.clear()}
}