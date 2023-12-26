// noinspection JSUnusedGlobalSymbols

export interface Terminable {terminate(): void}

export interface TerminableOwner {
    own<T extends Terminable>(terminable: T): T
    ownAll<T extends Terminable>(...terminables: Array<T>): void
}

// alias
export type Subscription = Terminable

export const Terminable = {
    Empty: { terminate(): void {} },
    many(...terminables: Terminable[]): Terminable {
        return { terminate(): void {while (terminables.length > 0) {terminables.pop()!.terminate()}} }
    }
} as const

export class Terminator implements TerminableOwner, Terminable {
    readonly #terminables: Terminable[] = []

    own<T extends Terminable>(terminable: T): T {
        this.#terminables.push(terminable)
        return terminable
    }

    ownAll<T extends Terminable>(...terminables: Array<T>): void {
        for (const terminable of terminables) {this.#terminables.push(terminable)}
    }

    terminate(): void {while (this.#terminables.length > 0) {this.#terminables.pop()!.terminate()}}
}