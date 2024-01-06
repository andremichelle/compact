import "./main.sass"
import { IconLibrary } from "./audiotool/ui/IconLibrary.tsx"
import { App } from "./audiotool/ui/App.tsx"
import { Playback } from "./audiotool/playback.ts"
import { Downloads } from "./audiotool/downloads.ts"
import { Api } from "./audiotool/api.ts"
import { Terminator } from "@common/terminable.ts"

(async () => {
    // A lifeTime is not really necessary at this level,
    // but this is the suggested pattern to terminate components.
    const lifeTime = new Terminator()
    window.onunload = () => lifeTime.terminate()

    // Prevents the default context menu
    window.addEventListener("contextmenu", event => event.preventDefault())

    const downloads = await Downloads.init()
    const api = new Api(downloads)
    const playback = new Playback(api)

    document.body.appendChild(IconLibrary())
    document.body.appendChild(App({ lifeTime, playback, api }))
})()

const CACHE_VERSION = "V.004"

console.debug(`PROD: ${import.meta.env.PROD}`)
console.debug(`CACHE: ${CACHE_VERSION}`)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    console.debug("register ServiceWorker...")
    navigator.serviceWorker.register("./service-worker.js", { type: "module" })
        .then((registration: ServiceWorkerRegistration) =>
                console.debug("ServiceWorker registration successful with scope: ", registration.scope),
            err => console.warn("ServiceWorker registration failed: ", err))
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
        const data = event.data
        console.log(`received data from sw`, data)
        if (data?.type === "CACHE_VERSION") {
            if (CACHE_VERSION !== data?.version) {
                alert("New version detected. Please reload.")
            }
        }
    })
}