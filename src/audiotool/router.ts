import { Option } from "@common/option.ts"
import { ApiV1 } from "./api.v1.ts"

export type Page = {
    type: "search"
} | {
    type: "artists"
} | {
    type: "tracks"
    request: ApiV1.Request
}

export const shareURL = (track: Option<ApiV1.Track>) => {
    const url = new URL(location.href)
    track.ifSome(track => url.searchParams.set("track", track.key))
    navigator.clipboard.writeText(url.href).then(() => alert("URL to share now in clipboard"))
}

export const router = (url: string): Option<Page> => {
    const path: ReadonlyArray<string> = new URL(url).hash.substring(1).split("/")
    const scope = path[0]
    const key = path[1]
    switch (scope) {
        case "search":
            return Option.wrap({ type: "search" })
        case "tracks":
            return Option.wrap({
                type: "tracks",
                request: {
                    scope: "tracks",
                    artistKey: key,
                    fetch: () => ApiV1.fetchTracks(`${ApiV1.URL}/user/${key}/tracks.json?orderBy=created&cover=64&offset=0&limit=50`)
                }
            })
        case "playlists":
            return Option.wrap({
                type: "tracks",
                request: {
                    scope: "playlists",
                    artistKey: key,
                    fetch: () => ApiV1.fetchUserPlaylists(key)
                }
            })
        case "playlist":
            return Option.wrap({
                type: "tracks",
                request: {
                    scope: "playlist",
                    playlistKey: key,
                    fetch: () => ApiV1.fetchTracks(`${ApiV1.URL}/album/${key}/tracks.json?cover=128&offset=0&limit=50`)
                }
            })
        case "genre":
            return Option.wrap({
                type: "tracks",
                request: {
                    scope: "genre",
                    genreKey: key,
                    fetch: () => ApiV1.fetchTracks(`${ApiV1.URL}/tracks/query.json?cover=128&genre=${key}&offset=0&limit=50`)
                }
            })
    }
    return Option.None
}