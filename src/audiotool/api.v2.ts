import { int } from "@common/lang.ts"

const API_URL = "https://api.audiotool.com/v2"
const HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

export namespace ApiV2 {
    export type UserV2 = {
        id: string,
        name: string,
        registrationTime: string,
        description: string,
        numTracks: int,
        numFollowers: int
        numFollowing: int
        tags: Array<string>,
        avatarUri: string
    }

    export type PlaylistV2 = {
        id: string // key
        name: string
        createdTime: string
        description: string
        modifiedTime: string
        numComments: int
        numFavorites: int
        numTracks: int
        playDuration: string // 103176908.099940528s
        trackIds: ReadonlyArray<string>
        userId: string // user key
    }

    export type TrackV2 = {
        id: string
        name: string
        userId: string
        createdTime: string // 2012-07-09T17:11:11Z
        modifiedTime: string
        numDownloads: int
        numPlaybacks: int
        numFavorites: int
        numComments: int
        playDuration: string // 234.240s
        description: string
        tags: Array<string>
        coverUri?: string
        bpm: number
        genreId: string
        snapshotUri: string
        downloadAllowed: boolean
    }

    export const searchUser = async (query: string,
                                     limit: int = 10,
                                     abortSignal?: AbortSignal): Promise<ReadonlyArray<ApiV2.UserV2>> => {
        return fetch(`${API_URL}/audiotool.users.v1.UsersService/ListUsers`, {
            signal: abortSignal,
            headers: HEADERS,
            method: "POST",
            body: JSON.stringify({
                filter: `(user.name.contains("${query}") || user.id == "${query}")`,
                pageSize: limit,
                orderBy: "user.num_followers desc"
            })
        }).then(x => x.json(), () => []).then(x => x["users"] ?? [])
    }

    export const searchPlaylists = async (query: string,
                                          limit: int = 10,
                                          abortSignal?: AbortSignal): Promise<ReadonlyArray<PlaylistV2>> => {
        return fetch(`${API_URL}/audiotool.albums.v1.AlbumsService/ListAlbums`, {
            signal: abortSignal,
            headers: HEADERS,
            method: "POST",
            body: JSON.stringify({
                filter: `(album.name.contains("${query}") || album.id == "${query}")`,
                pageSize: limit,
                orderBy: "album.num_favorites desc"

            })
        }).then(x => x.json(), () => []).then(x => x["albums"] ?? [])
    }

    export const searchTracks = async (query: string, limit: int = 10,
                                       abortSignal?: AbortSignal): Promise<ReadonlyArray<TrackV2>> => {
        return fetch(`${API_URL}/audiotool.tracks.v1.TracksService/ListTracks`, {
            signal: abortSignal,
            headers: HEADERS,
            method: "POST",
            body: JSON.stringify({
                filter: `(track.name.contains("${query}") || track.id == "${query}")`,
                pageSize: limit,
                orderBy: "track.num_favorites desc"

            })
        }).then(x => x.json(), () => []).then(x => x["tracks"] ?? [])
    }
}