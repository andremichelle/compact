import { Option } from "@common/option.ts"
import { Track } from "./api.ts"
import { unitValue } from "@common/lang.ts"
import { Notifier, Observer } from "@common/observers.ts"
import { Subscription } from "@common/terminable.ts"

export type DownloadedTrack = {
    key: string
    name: string
    created: number
    mp3Blob: Blob
    coverBlob: Blob
    collaborators: ReadonlyArray<{ key: string, name: string }>
    bpm: number
    genreKey: string
    genreName: string
    duration: number
}

const storeName = "tracks"

export type DownloadEvent =
    | { type: "fetching", key: string, progress: unitValue }
    | { type: "added", key: string }
    | { type: "removed", key: string }

export class Downloads {
    static readonly init = async (): Promise<Downloads> => new Promise((resolve, reject) => {
        const dbName = "compact-offline"
        const dbVersion = 1
        const request: IDBOpenDBRequest = indexedDB.open(dbName, dbVersion)
        request.onupgradeneeded = (_event: IDBVersionChangeEvent) => {
            const db: IDBDatabase = request.result
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "key" })
            }
        }
        request.onerror = () => reject(request.error)
        request.onsuccess = async () => {
            const downloads = new Downloads(request.result)
            try {
                await downloads.#inventory()
                resolve(downloads)
            } catch (reason) {
                reject(reason)
            }
        }
    })

    readonly #id: IDBDatabase
    readonly #notifier: Notifier<DownloadEvent>
    readonly #map: Map<string, DownloadedTrack>

    private constructor(id: IDBDatabase) {
        this.#id = id
        this.#notifier = new Notifier<DownloadEvent>()
        this.#map = new Map<string, DownloadedTrack>()
    }

    subscribe(observer: Observer<DownloadEvent>): Subscription {return this.#notifier.subscribe(observer)}

    async download(track: Track): Promise<void> {
        // TODO Test if they are already downloading
        if (this.#map.has(track.key)) {return Promise.reject("Already downloaded")}
        this.#notifier.notify({ type: "fetching", key: track.key, progress: 0.0 })
        return Promise.all([
            fetch(track.mp3Url).then(x => x.blob()),
            fetch(track.coverUrl).then(x => x.blob())
        ]).then(([mp3Blob, coverBlob]) => new Promise<void>((resolve, reject) => {
            const downloaded: DownloadedTrack = {
                key: track.key, mp3Blob, coverBlob,
                bpm: track.bpm,
                name: track.name,
                created: track.created,
                duration: track.duration,
                genreKey: track.genreKey,
                genreName: track.genreName,
                collaborators: track.collaborators
            }
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.onerror = () => reject(transaction.error)
            transaction.oncomplete = () => {
                this.#map.set(track.key, downloaded)
                this.#notifier.notify({ type: "added", key: track.key })
                resolve()
            }
            transaction.objectStore(storeName).add(downloaded)
            transaction.commit()
        }))
    }

    async remove(track: Track): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.onerror = () => reject(transaction.error)
            transaction.oncomplete = () => {
                this.#map.delete(track.key)
                this.#notifier.notify({ type: "removed", key: track.key })
                resolve()
            }
            transaction.objectStore(storeName).delete(track.key)
            transaction.commit()
        })
    }

    tracks(): ReadonlyArray<Track> {
        return Array.from(this.#map.values()).map(track => ({
            ...track,
            mp3Url: URL.createObjectURL(track.mp3Blob),
            coverUrl: URL.createObjectURL(track.coverBlob)
        }))
    }

    get(key: string): Option<DownloadedTrack> {return Option.wrap(this.#map.get(key))}

    async #inventory(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.#map.clear()
            const transaction = this.#id.transaction(storeName, "readonly")
            transaction.onerror = () => reject(transaction.error)
            const cursorRequest: IDBRequest<IDBCursorWithValue | null> = transaction.objectStore(storeName).openCursor()
            cursorRequest.onsuccess = () => {
                const result = cursorRequest.result
                if (result === null) {
                    resolve()
                } else {
                    const downloaded = result.value as DownloadedTrack
                    this.#map.set(downloaded.key, downloaded)
                    result.continue()
                }
            }
            cursorRequest.onerror = () => reject(cursorRequest.error)
        })
    }
}