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

console.debug(`PROD: ${import.meta.env.PROD}`)

if (import.meta.env.PROD && "serviceWorker" in navigator) {
    console.debug("register ServiceWorker...")
    navigator.serviceWorker.register("./service-worker.js", { type: "module" })
        .then((registration: ServiceWorkerRegistration) => {
                registration.addEventListener("message", (event: Event) => {
                    console.log(`received from registration`, event)
                    if ("data" in event && event.data === "cache-updated") {
                        alert("New version detected. Please reload.")
                    }
                })
                console.debug("ServiceWorker registration successful with scope: ", registration.scope)
            },
            err => console.warn("ServiceWorker registration failed: ", err))
    navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
        console.log(`received from sw`, event.data)
        if (event.data === "cache-updated") {
            alert("New version detected. Please reload.")
        }
    })
}