import { Option } from "@common/option.ts"
import { Track } from "./api.ts"
import { int, isDefined, Nullable, unitValue } from "@common/lang.ts"
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
    added: number
}

const storeName = "tracks"

export type DownloadEvent =
    | { type: "fetching", track: Track, progress: unitValue }
    | { type: "cancelled", track: Track, reason: any }
    | { type: "added", track: Track }
    | { type: "removed", track: Track }

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
    readonly #downloaded: Map<string, DownloadedTrack>
    readonly #downloading: Map<string, AbortController>

    private constructor(id: IDBDatabase) {
        this.#id = id
        this.#notifier = new Notifier<DownloadEvent>()
        this.#downloaded = new Map<string, DownloadedTrack>()
        this.#downloading = new Map<string, AbortController>()
    }

    subscribe(observer: Observer<DownloadEvent>): Subscription {return this.#notifier.subscribe(observer)}

    async download(track: Track): Promise<void> {
        if (this.#downloaded.has(track.key) || this.#downloading.has(track.key)) {
            return Promise.reject("Already downloaded or downloading")
        }
        return this.#download(track).then(
            () => {
                console.debug(`"${track.name}" is now offline available`)
                this.#notifier.notify({ type: "added", track })
            },
            reason => {
                console.debug(`Download cancelled due to '${reason}'`)
                this.#notifier.notify({ type: "cancelled", track, reason })
            }).finally(() => this.#downloading.delete(track.key))
    }

    async remove(track: Track): Promise<void> {
        const downloading = this.#downloading.get(track.key)
        if (isDefined(downloading)) {
            downloading.abort("remove")
            return Promise.resolve()
        }
        return new Promise<void>((resolve, reject) => {
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.onerror = () => reject(transaction.error)
            transaction.oncomplete = () => {
                this.#downloaded.delete(track.key)
                this.#notifier.notify({ type: "added", track })
                resolve()
            }
            transaction.objectStore(storeName).delete(track.key)
            transaction.commit()
        })
    }

    tracks(): ReadonlyArray<Track> {
        return Array.from(this.#downloaded.values())
            .sort((a, b) => a.added - b.added)
            .map(track => ({
                ...track,
                mp3Url: URL.createObjectURL(track.mp3Blob),
                coverUrl: URL.createObjectURL(track.coverBlob)
            }))
    }

    numTracks(): int {return this.#downloaded.size}

    get(key: string): Option<DownloadedTrack> {return Option.wrap(this.#downloaded.get(key))}

    async #inventory(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.#downloaded.clear()
            const transaction = this.#id.transaction(storeName, "readonly")
            transaction.onerror = () => reject(transaction.error)
            const cursorRequest: IDBRequest<Nullable<IDBCursorWithValue>> =
                transaction.objectStore(storeName).openCursor()
            cursorRequest.onerror = () => reject(cursorRequest.error)
            cursorRequest.onsuccess = () => {
                const result = cursorRequest.result
                if (result === null) {
                    resolve()
                } else {
                    const downloaded = result.value as DownloadedTrack
                    this.#downloaded.set(downloaded.key, downloaded)
                    result.continue()
                }
            }
        })
    }

    async #download(track: Track): Promise<void> {
        this.#notifier.notify({ type: "fetching", track, progress: 0.0 })

        const key = track.key
        const abortController = new AbortController()
        const signal = abortController.signal
        this.#downloading.set(key, abortController)
        return Promise.all([
            fetch(track.mp3Url, { signal: signal }).then(x => x.blob()),
            fetch(track.coverUrl, { signal: signal }).then(x => x.blob())
        ]).then(([mp3Blob, coverBlob]) => {
            const downloadedTrack: DownloadedTrack = {
                key, mp3Blob, coverBlob,
                bpm: track.bpm,
                name: track.name,
                created: track.created,
                duration: track.duration,
                genreKey: track.genreKey,
                genreName: track.genreName,
                collaborators: track.collaborators,
                added: Date.now()
            }
            return new Promise<void>((resolve, reject) => {
                const transaction = this.#id.transaction(storeName, "readwrite")
                transaction.onerror = () => reject(transaction.error)
                transaction.oncomplete = () => {
                    if (abortController.signal.aborted) {
                        reject(abortController.signal.reason)
                    } else {
                        this.#downloaded.set(track.key, downloadedTrack)
                        resolve()
                    }
                }
                transaction.objectStore(storeName).add(downloadedTrack)
                transaction.commit()
            })
        })
    }
}