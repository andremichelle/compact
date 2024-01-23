import { Root, Router } from "../router.ts"
import { Playback } from "../playback.ts"
import css from "./Navigation.sass?inline"
import { DownloadEvent, Downloads } from "../downloads.ts"
import { Events, Html, TerminableOwner } from "jet-std"
import { createElement, Inject } from "jet-tsx"

export type NavigationProps = {
    lifeTime: TerminableOwner
    router: Router
    playback: Playback
    downloads: Downloads
}

export const Navigation = ({ lifeTime, router, downloads }: NavigationProps) => {
    const homeButton = Inject.ref<HTMLButtonElement>()
    const searchButton = Inject.ref<HTMLButtonElement>()
    const downloadedButton = Inject.ref<HTMLButtonElement>()
    const aboutButton = Inject.ref<HTMLButtonElement>()
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
                        title="Show offline available tracks">
                    <svg>
                        <use href="#downloaded"></use>
                    </svg>
                </button>
                <button ref={aboutButton}
                        onclick={() => location.hash = Root.about}
                        title="About">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path
                            d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z"
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
                } else if (path.root === Root.about) {
                    aboutButton.get().classList.add("active")
                }
            }
        })
    }
    lifeTime.own(router.subscribe(observer))
    observer()

    const button = downloadedButton.get()
    const updateCount = () => {
        const numTracks = downloads.numTracks()
        if (numTracks === 0) {
            button.removeAttribute("count")
        } else {
            button.setAttribute("count", numTracks.toString())
        }
    }
    lifeTime.own(downloads.subscribe((event: DownloadEvent) => {
        if (event.type === "added") {
            if (!button.classList.contains("highlight")) {
                button.classList.add("highlight")
            }
            updateCount()
        } else if (event.type === "removed") {
            updateCount()
        }
    }))
    updateCount()
    lifeTime.own(Events.subscribe(button, "animationend", () => button.classList.remove("highlight")))
    return section
}