import { int, Provider } from "@common/lang.ts"
import { Html } from "@ui/html.ts"

export namespace ApiV1 {
    export const URL = "https://api.audiotool.com"

    export type Track = {
        key: string
        name: string
        created: number
        coverUrl?: string
        snapshotUrl: string
        collaborators: ReadonlyArray<User>
        bpm: number
        genreKey: string
        genreName: string
        duration: number
        // unused properties
        // -----------------
        // id: number
        // modified: number
        // user: User
        // template: boolean
        // published: boolean
        // pksUrl: string
        // isNextTrack: boolean
        // joinPolicy: number
        // license: number
    } & {
        prev?: Track
        next?: Track
    }

    export type User = {
        key: string
        name: string
        avatar: string
    }

    export type Playlist = {
        key: string
        name: string
        image: string
    }

    export type Request = TrackListRequest | PlayListsRequest

    export type TrackListRequest = {
        scope: "tracks"
        artistKey: string
        fetch: Provider<Promise<TrackListResponse>>
    } | {
        scope: "playlist"
        playlistKey: string
        fetch: Provider<Promise<TrackListResponse>>
    } | {
        scope: "genre"
        genreKey: string
        fetch: Provider<Promise<TrackListResponse>>
    }

    export type PlayListsRequest = {
        scope: "playlists"
        artistKey: string
        fetch: Provider<Promise<PlaylistsResponse>>
    }

    export type TrackListResponse = {
        name: string
        tracks: ReadonlyArray<ApiV1.Track>
        next?: string
    }

    export type PlaylistsResponse = {
        name: string
        playlists: ReadonlyArray<ApiV1.Playlist>
    }

    export const fetchUsers = async (...keys: ReadonlyArray<string>): Promise<ReadonlyArray<ApiV1.User>> =>
        Promise.all(keys.map(key => fetch(`${URL}/user/${key}.json`).then(x => x.json())))

    export const fetchTrack = async (trackKey: string): Promise<Track> => {
        return fetch(`${ApiV1.URL}/track/${trackKey}.json`)
            .then(x => x.json())
            .then(x => x["track"] as ApiV1.Track)
    }

    export const fetchTracks = async (info: RequestInfo, lastTrack?: ApiV1.Track): Promise<ApiV1.TrackListResponse> =>
        fetch(info)
            .then(x => x.json())
            .then((json: ApiV1.TrackListResponse) => {
                const tracks = json.tracks
                tracks.forEach((track: ApiV1.Track, index: int) => {
                    if (track.collaborators.length === 0 && "user" in track) {
                        // very old track
                        track.collaborators = [track.user as ApiV1.User]
                    }
                    track.prev = tracks[index - 1]
                    track.next = tracks[index + 1]
                    track.collaborators
                })
                if (lastTrack !== undefined) {
                    tracks[0].prev = lastTrack
                    lastTrack.next = tracks[0]
                }
                return json
            })

    // TODO Replace with JSON Api (if any public exists)
    export const fetchUserPlaylists = async (userKey: string): Promise<ApiV1.PlaylistsResponse> =>
        fetch(`${URL}/browse/user/${userKey}/albums/`)
            .then(x => x.text())
            .then(x => {
                const documentElement = new DOMParser().parseFromString(x, "text/xml").documentElement
                const artistName = documentElement.getAttribute("subtitle") ?? "Untitled"
                return {
                    name: `${artistName}'s Playlists`,
                    playlists: Array.from(documentElement.children)
                        .map((element: Element) => {
                            let uri = element.getAttribute("uri")!
                            uri = uri.slice(0, -1)
                            uri = uri.slice(uri.lastIndexOf("/") + 1)
                            const image = element.getAttribute("image")
                            return ({
                                key: uri,
                                name: element.getAttribute("title") ?? "Untitled",
                                image: image === null ? Html.EmptyGif : `${location.protocol}${image}`
                            })
                        })
                }
            })
}