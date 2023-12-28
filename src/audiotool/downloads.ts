import { ApiV1 } from "./api.v1.ts"
import { Option } from "@common/option.ts"

type DownloadedTrack = {
    id: string
    name: string
    created: number
    mp3Blob: Blob
    coverBlob: Blob
    collaborators: ReadonlyArray<{ key: string, name: string, avatar: string }>
    bpm: number
    genreKey: string
    genreName: string
    duration: number
}

const storeName = "tracks"

export class Downloads {
    static readonly init = async (): Promise<Downloads> => new Promise((resolve, reject) => {
        const dbName = "compact-offline"
        const dbVersion = 1
        const request: IDBOpenDBRequest = indexedDB.open(dbName, dbVersion)
        request.onupgradeneeded = (_event: IDBVersionChangeEvent) => {
            const db: IDBDatabase = request.result
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id" })
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
    readonly #map: Map<string, DownloadedTrack>

    private constructor(id: IDBDatabase) {
        this.#id = id
        this.#map = new Map<string, DownloadedTrack>()
    }

    async add(track: ApiV1.Track): Promise<void> {
        return Promise.all([
            fetch(ApiV1.coverURL(track)).then(x => x.blob()),
            fetch(ApiV1.playMP3(track.key)).then(x => x.blob())
        ]).then(([coverBlob, mp3Blob]) => {
            const downloaded: DownloadedTrack = {
                id: track.key, mp3Blob, coverBlob,
                bpm: track.bpm,
                name: track.name,
                created: track.created,
                duration: track.duration,
                genreKey: track.genreKey,
                genreName: track.genreName,
                collaborators: track.collaborators
            }
            const transaction = this.#id.transaction(storeName, "readwrite")
            transaction.objectStore(storeName).add(downloaded)
            transaction.commit()
            return downloaded
        }).then((downloaded: DownloadedTrack) => {
            this.#map.set(track.key, downloaded)
            console.debug(`${downloaded.name} added.`)
        })
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
                    for (const [id, track] of this.#map) {console.debug(id, track)}
                    resolve()
                } else {
                    const downloaded = result.value as DownloadedTrack
                    this.#map.set(downloaded.id, downloaded)
                    result.continue()
                }
            }
            cursorRequest.onerror = () => reject(cursorRequest.error)
        })
    }
}