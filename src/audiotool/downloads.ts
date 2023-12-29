import { Option } from "@common/option.ts"
import { Track } from "./api.ts"
import { isDefined, unitValue } from "@common/lang.ts"
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
    | { type: "cancelled", key: string, reason: any }
    | { type: "added", key: string }
    | { type: "removed", key: string }

export class TrackDownloader {
    readonly #abortController: AbortController
    readonly #promise: Promise<void>

    constructor(downloads: Downloads, track: Track) {
        downloads.progress(track.key, 0.0)
        this.#abortController = new AbortController()
        const signal = this.#abortController.signal
        this.#promise = Promise.all([
            fetch(track.mp3Url, { signal: signal }).then(x => x.blob()),
            fetch(track.coverUrl, { signal: signal }).then(x => x.blob())
        ]).then(([mp3Blob, coverBlob]) => downloads.add({
            key: track.key, mp3Blob, coverBlob,
            bpm: track.bpm,
            name: track.name,
            created: track.created,
            duration: track.duration,
            genreKey: track.genreKey,
            genreName: track.genreName,
            collaborators: track.collaborators
        })).then(() => {if (signal.aborted) {throw signal.reason}})
    }

    get promise(): Promise<void> {return this.#promise}

    abort(): void {this.#abortController.abort()}
}

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
    readonly #downloading: Map<string, TrackDownloader>

    private constructor(id: IDBDatabase) {
        this.#id = id
        this.#notifier = new Notifier<DownloadEvent>()
        this.#downloaded = new Map<string, DownloadedTrack>()
        this.#downloading = new Map<string, TrackDownloader>()
    }

    subscribe(observer: Observer<DownloadEvent>): Subscription {return this.#notifier.subscribe(observer)}

    async download(track: Track): Promise<void> {
        if (this.#downloaded.has(track.key) || this.#downloading.has(track.key)) {
            return Promise.reject("Already downloaded or downloading")
        }
        const downloader = new TrackDownloader(this, track)
        this.#downloading.set(track.key, downloader)
        return downloader.promise.catch(reason => this.#notifier.notify({ type: "cancelled", key: track.key, reason }))
    }

    async remove(track: Track): Promise<void> {
        const downloading = this.#downloading.get(track.key)
        if (isDefined(downloading)) {
            downloading.abort()
            this.#downloading.delete(track.key)
            return Promise.resolve()
        }
        return new Promise<void>((resolve, reject) => {
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.onerror = () => reject(transaction.error)
            transaction.oncomplete = () => {
                this.#downloaded.delete(track.key)
                this.#notifier.notify({ type: "added", key: track.key })
                resolve()
            }
            transaction.objectStore(storeName).delete(track.key)
            transaction.commit()
        })
    }

    async add(track: DownloadedTrack): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.onerror = () => {
                console.warn(`Could not download ${track.key} due to ${transaction.error}`)
                this.#downloading.delete(track.key)
                reject(transaction.error)
            }
            transaction.oncomplete = () => {
                this.#downloading.delete(track.key)
                this.#downloaded.set(track.key, track)
                this.#notifier.notify({ type: "added", key: track.key })
                resolve()
            }
            transaction.objectStore(storeName).add(track)
            transaction.commit()
        })
    }

    progress(key: string, progress: unitValue): void {this.#notifier.notify({ type: "fetching", key, progress })}

    tracks(): ReadonlyArray<Track> {
        return Array.from(this.#downloaded.values()).map(track => ({
            ...track,
            mp3Url: URL.createObjectURL(track.mp3Blob),
            coverUrl: URL.createObjectURL(track.coverBlob)
        }))
    }

    get(key: string): Option<DownloadedTrack> {return Option.wrap(this.#downloaded.get(key))}

    async #inventory(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.#downloaded.clear()
            const transaction = this.#id.transaction(storeName, "readonly")
            transaction.onerror = () => reject(transaction.error)
            const cursorRequest: IDBRequest<IDBCursorWithValue | null> = transaction.objectStore(storeName).openCursor()
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
            cursorRequest.onerror = () => reject(cursorRequest.error)
        })
    }
}