import { DownloadedTrack, Downloads } from "./downloads.ts"
import { isDefined, Provider } from "@common/lang.ts"
import { ApiV1 } from "./api.v1.ts"

export const ApiUrl = "https://api.audiotool.com"

export type User = {
    key: string
    name: string
}

export type Playlist = {
    key: string
    name: string
    image: string
}

export type ListRequest = TrackListRequest | PlayListsRequest

export type TrackListRequest = {
    scope: "tracks"
    artistKey: string
    fetch: Provider<Promise<TrackListData>>
} | {
    scope: "playlist"
    playlistKey: string
    fetch: Provider<Promise<TrackListData>>
} | {
    scope: "genre"
    genreKey: string
    fetch: Provider<Promise<TrackListData>>
}

export type PlayListsRequest = {
    scope: "playlists"
    artistKey: string
    fetch: Provider<Promise<PlaylistsResponse>>
}

export type PlaylistsResponse = {
    name: string
    playlists: ReadonlyArray<Playlist>
}

export type Track = {
    key: string
    name: string
    bpm: number
    duration: number
    created: number
    mp3Url: string
    coverUrl: string
    genreKey: string
    genreName: string
    collaborators: ReadonlyArray<User>

    prev?: Track
    next?: Track
}

const mapV1Track = (track: ApiV1.TrackV1) => ({
    key: track.key,
    name: track.name,
    bpm: track.bpm,
    created: track.created,
    duration: track.duration,
    genreKey: track.genreKey,
    genreName: track.genreName,
    mp3Url: ApiV1.playMP3(track),
    coverUrl: ApiV1.coverURL(track),
    collaborators: track.collaborators.length === 0 && "user" in track ? [track.user as User] : track.collaborators
})

export class TrackListData {
    static async fetch(info: RequestInfo): Promise<TrackListData> {
        return ApiV1.fetchTracks(info)
            .then(response => new TrackListData(response.name, response.tracks.map(mapV1Track), response.next))
    }

    readonly #name: string
    readonly #tracks: ReadonlyArray<Track>
    readonly #next?: string

    constructor(name: string, tracks: ReadonlyArray<Track>, next?: string) {
        this.#name = name
        this.#tracks = tracks
        this.#next = next
    }

    get name(): string {return this.#name}
    get tracks(): ReadonlyArray<Track> {return this.#tracks}

    hasMore(): boolean {return isDefined(this.#next)}
    nextPage(): Promise<TrackListData> {
        return isDefined(this.#next)
            ? ApiV1.fetchTracks(this.#next)
                .then(response => new TrackListData(response.name, response.tracks.map(mapV1Track), response.next))
            : Promise.reject("eof")
    }
}

export class Api {
    #downloads: Downloads

    constructor(downloads: Downloads) {this.#downloads = downloads}

    async fetchTrack(key: string): Promise<Track> {
        return this.#downloads.get(key).match({
            none: () => fetch(`${ApiUrl}/track/${key}.json`)
                .then(x => x.json())
                .then(x => mapV1Track(x["track"])),
            some: (downloaded: DownloadedTrack) => Promise.resolve<Track>({
                ...downloaded,
                mp3Url: URL.createObjectURL(downloaded.mp3Blob),
                coverUrl: URL.createObjectURL(downloaded.coverBlob)
            })
        })
    }

    fetchMP3(track: Track): string {
        return this.#downloads.get(track.key).match({
            none: () => track.mp3Url,
            some: download => URL.createObjectURL(download.mp3Blob)
        })
    }

    fetchCover(track: Track): string {
        return this.#downloads.get(track.key).match({
            none: () => track.coverUrl,
            some: download => URL.createObjectURL(download.coverBlob)
        })
    }

    isOfflineAvailable(track: Track): boolean {return this.#downloads.get(track.key).nonEmpty()}

    makeOfflineAvailable(track: Track): Promise<void> {return this.#downloads.add(track)}
}