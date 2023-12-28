import "./main.sass"
import { IconLibrary } from "./audiotool/ui/IconLibrary.tsx"
import { App } from "./audiotool/ui/App.tsx"
import { Playback } from "./audiotool/playback.ts"
import { Downloads } from "./audiotool/downloads.ts"
import { Api } from "./audiotool/api.ts"

(async () => {
    const downloads = await Downloads.init()
    const api = new Api(downloads)
    const playback = new Playback(api)

    document.body.appendChild(IconLibrary())
    document.body.appendChild(App({ playback, api }))
})()