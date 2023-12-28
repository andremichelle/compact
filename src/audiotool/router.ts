import { Option } from "@common/option.ts"
import { ApiUrl, ListRequest, Track, TrackListData } from "./api.ts"
import { ApiV1 } from "./api.v1.ts"

export type Path = {
    root: "search"
} | {
    root: "downloaded"
} | {
    root: "artists"
} | {
    root: "tracks"
    request: ListRequest
}

export const shareURL = (track: Option<Track>) => {
    const url = new URL(location.href)
    track.ifSome(track => url.searchParams.set("track", track.key))
    navigator.clipboard.writeText(url.href).then(() => alert("URL to share now in clipboard"))
}

export const router = (url: string): Option<Path> => {
    const path: ReadonlyArray<string> = new URL(url).hash.substring(1).split("/")
    const scope = path[0]
    const key = path[1]
    switch (scope) {
        case "search":
            return Option.wrap({ root: "search" })
        case "downloaded":
            return Option.wrap({ root: "downloaded" })
        case "tracks":
            return Option.wrap({
                root: "tracks",
                request: {
                    scope: "tracks",
                    artistKey: key,
                    fetch: () => TrackListData.fetch(`${ApiUrl}/user/${key}/tracks.json?orderBy=created&cover=64&offset=0&limit=50`)
                }
            })
        case "playlists":
            return Option.wrap({
                root: "tracks",
                request: {
                    scope: "playlists",
                    artistKey: key,
                    fetch: () => ApiV1.fetchUserPlaylists(key)
                }
            })
        case "playlist":
            return Option.wrap({
                root: "tracks",
                request: {
                    scope: "playlist",
                    playlistKey: key,
                    fetch: () => TrackListData.fetch(`${ApiUrl}/album/${key}/tracks.json?cover=128&offset=0&limit=50`)
                }
            })
        case "genre":
            return Option.wrap({
                root: "tracks",
                request: {
                    scope: "genre",
                    genreKey: key,
                    fetch: () => TrackListData.fetch(`${ApiUrl}/tracks/query.json?cover=128&genre=${key}&offset=0&limit=50`)
                }
            })
    }
    return Option.None
}