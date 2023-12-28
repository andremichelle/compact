import { ApiV1 } from "./api.v1.ts"
import { Downloads } from "./downloads.ts"

export class Api {
    #downloads: Downloads

    constructor(downloads: Downloads) {this.#downloads = downloads}

    fetchCover(track: ApiV1.Track): string {
        return this.#downloads.get(track.key).match({
            none: () => ApiV1.coverURL(track),
            some: download => URL.createObjectURL(download.coverBlob)
        })
    }

    fetchMP3(track: ApiV1.Track): string {
        return this.#downloads.get(track.key).match({
            none: () => ApiV1.playMP3(track.key),
            some: download => URL.createObjectURL(download.mp3Blob)
        })
    }

    isOfflineAvailable(track: ApiV1.Track): boolean {return this.#downloads.get(track.key).nonEmpty()}

    makeOfflineAvailable(track: ApiV1.Track): Promise<void> {return this.#downloads.add(track)}
}