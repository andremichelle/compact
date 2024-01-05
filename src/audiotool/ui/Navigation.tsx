import { Root, Router } from "../router.ts"
import { Playback } from "../playback.ts"
import { Html } from "@ui/html.ts"
import { Inject } from "@jsx/inject.ts"
import { TerminableOwner } from "@common/terminable.ts"
import css from "./Navigation.sass?inline"
import { DownloadEvent, Downloads } from "../downloads.ts"
import { Events } from "@common/events.ts"

export type NavigationProps = {
    lifeTime: TerminableOwner
    router: Router
    playback: Playback
    downloads: Downloads
}

export const Navigation = ({ lifeTime, router, playback, downloads }: NavigationProps) => {
    const homeButton = Inject.ref<HTMLButtonElement>()
    const searchButton = Inject.ref<HTMLButtonElement>()
    const downloadedButton = Inject.ref<HTMLButtonElement>()
    const downloadCount = Inject.attribute("")
    const section: HTMLElement = (
        <section className={Html.adoptStyleSheet(css, "navigation")}>
            <nav>
                <button ref={homeButton}
                        onclick={() => location.hash = Root.home}
                        title="Home">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.48907C3 9.18048 3.14247 8.88917 3.38606 8.69972L11.3861 2.47749C11.7472 2.19663 12.2528 2.19663 12.6139 2.47749L20.6139 8.69972C20.8575 8.88917 21 9.18048 21 9.48907V20Z"
                            fill="currentColor"></path>
                    </svg>
                </button>
                <button ref={searchButton}
                        onclick={() => location.hash = Root.search}
                        title="Search Audiotool">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"
                            fill="currentColor"></path>
                    </svg>
                </button>
                <button ref={downloadedButton}
                        onclick={() => location.hash = Root.downloaded}
                        title="Show offline available tracks"
                        count={downloadCount}>
                    <svg>
                        <use href="#downloaded"></use>
                    </svg>
                </button>
                <button onclick={() => router.copyPathAndTrackKeyURL(playback.active)}
                        title="Copy URL to clipboard">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M13.1202 17.0228L8.92129 14.7324C8.19135 15.5125 7.15261 16 6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C7.15255 8 8.19125 8.48746 8.92118 9.26746L13.1202 6.97713C13.0417 6.66441 13 6.33707 13 6C13 3.79086 14.7909 2 17 2C19.2091 2 21 3.79086 21 6C21 8.20914 19.2091 10 17 10C15.8474 10 14.8087 9.51251 14.0787 8.73246L9.87977 11.0228C9.9583 11.3355 10 11.6629 10 12C10 12.3371 9.95831 12.6644 9.87981 12.9771L14.0788 15.2675C14.8087 14.4875 15.8474 14 17 14C19.2091 14 21 15.7909 21 18C21 20.2091 19.2091 22 17 22C14.7909 22 13 20.2091 13 18C13 17.6629 13.0417 17.3355 13.1202 17.0228ZM6 14C7.10457 14 8 13.1046 8 12C8 10.8954 7.10457 10 6 10C4.89543 10 4 10.8954 4 12C4 13.1046 4.89543 14 6 14ZM17 8C18.1046 8 19 7.10457 19 6C19 4.89543 18.1046 4 17 4C15.8954 4 15 4.89543 15 6C15 7.10457 15.8954 8 17 8ZM17 20C18.1046 20 19 19.1046 19 18C19 16.8954 18.1046 16 17 16C15.8954 16 15 16.8954 15 18C15 19.1046 15.8954 20 17 20Z"
                            fill="currentColor"></path>
                    </svg>
                </button>
            </nav>
        </section>)
    const observer = () => {
        section.querySelector(".active")?.classList.remove("active")
        router.path.match({
            none: () => homeButton.get().classList.add("active"),
            some: path => {
                if (path.root === Root.search) {
                    searchButton.get().classList.add("active")
                } else if (path.root === Root.downloaded) {
                    downloadedButton.get().classList.add("active")
                }
            }
        })
    }
    lifeTime.own(router.subscribe(observer))
    observer()

    const button = downloadedButton.get()
    lifeTime.own(downloads.subscribe((event: DownloadEvent) => {
        if (event.type === "added") {
            if (!button.classList.contains("highlight")) {
                button.classList.add("highlight")
            }
            downloadCount.value = downloads.numTracks().toString()
        } else if (event.type === "removed") {
            downloadCount.value = downloads.numTracks().toString()
        }
    }))
    lifeTime.own(Events.subscribe(button, "animationend", () => button.classList.remove("highlight")))
    downloadCount.value = downloads.numTracks().toString()

    return section
}