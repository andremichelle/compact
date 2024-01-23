import { DownloadedTrack, Downloads } from "./downloads.ts"
import { ApiV1 } from "./api.v1.ts"
import { int, isDefined, Provider } from "jet-std"

export const ApiUrl = "https://api.audiotool.com"

export type User = {
    readonly key: string
    readonly name: string
}

export type Playlist = {
    readonly key: string
    readonly name: string
    readonly image: string
}

export type ListRequest = TrackListRequest | PlayListsRequest

export type TrackListRequest = {
    readonly scope: "tracks"
    readonly artistKey: string
    readonly fetch: Provider<Promise<TrackListData>>
} | {
    readonly scope: "playlist"
    readonly playlistKey: string
    readonly fetch: Provider<Promise<TrackListData>>
} | {
    readonly scope: "genre"
    readonly genreKey: string
    readonly fetch: Provider<Promise<TrackListData>>
}

export type PlayListsRequest = {
    readonly scope: "playlists"
    readonly artistKey: string
    readonly fetch: Provider<Promise<PlaylistsResponse>>
}

export type PlaylistsResponse = {
    readonly name: string
    readonly playlists: ReadonlyArray<Playlist>
}

export type Track = {
    readonly key: string
    readonly name: string
    readonly bpm: number
    readonly duration: number
    readonly created: number
    readonly mp3Url: string
    readonly coverUrl: string
    readonly genreKey: string
    readonly genreName: string
    readonly collaborators: ReadonlyArray<User>

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

export const linkTracks = (tracks: ReadonlyArray<Track>, lastTrack?: Track): ReadonlyArray<Track> => {
    if (isDefined(lastTrack)) {
        lastTrack.next = tracks.at(0)
    }
    tracks.forEach((track: Track, index: int) => {
        track.prev = tracks[index - 1] ?? lastTrack
        track.next = tracks[index + 1]
    })
    return tracks
}

export class TrackListData {
    static async fetch(info: RequestInfo): Promise<TrackListData> {
        return ApiV1.fetchTracks(info)
            .then(response =>
                new TrackListData(response.name, linkTracks(response.tracks.map(mapV1Track)), response.next))
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
                .then(response => new TrackListData(
                    response.name,
                    linkTracks(response.tracks.map(mapV1Track), this.tracks.at(-1)),
                    response.next))
            : Promise.reject("eof")
    }
}

export class Api {
    readonly #downloads: Downloads

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

    get downloads(): Downloads {return this.#downloads}
}