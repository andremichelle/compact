import { int } from "@common/lang.ts"
import { Html } from "@ui/html.ts"
import { ApiUrl, PlaylistsResponse, User } from "./api.ts"

export namespace ApiV1 {
    export const playMP3 = (track: ApiV1.TrackV1): string => `${ApiUrl}/track/${track.key}/play.mp3?ref=compact`
    export const coverURL = (track: TrackV1): string => `${location.protocol}${track.coverUrl ?? track.snapshotUrl}`

    export type TrackV1 = {
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
        user?: User
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
        prev?: TrackV1
        next?: TrackV1
    }

    export type TrackListResponse = {
        name: string
        tracks: ReadonlyArray<ApiV1.TrackV1>
        next?: string
    }

    export const fetchUsers = async (...keys: ReadonlyArray<string>): Promise<ReadonlyArray<User & {
        avatar: string
    }>> =>
        Promise.all(keys.map(key => fetch(`${ApiUrl}/user/${key}.json`).then(x => x.json())))

    export const fetchTracks = async (info: RequestInfo, lastTrack?: ApiV1.TrackV1): Promise<ApiV1.TrackListResponse> =>
        fetch(info)
            .then(x => x.json())
            .then((json: ApiV1.TrackListResponse) => {
                const tracks = json.tracks
                tracks.forEach((track: ApiV1.TrackV1, index: int) => {
                    if (track.collaborators.length === 0 && "user" in track) {
                        // very old track
                        track.collaborators = [track.user as User]
                    }
                    track.prev = tracks[index - 1]
                    track.next = tracks[index + 1]
                })
                if (lastTrack !== undefined) {
                    tracks[0].prev = lastTrack
                    lastTrack.next = tracks[0]
                }
                return json
            })

    // TODO Replace with JSON Api (if any public exists)
    export const fetchUserPlaylists = async (userKey: string): Promise<PlaylistsResponse> =>
        fetch(`${ApiUrl}/browse/user/${userKey}/albums/`)
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