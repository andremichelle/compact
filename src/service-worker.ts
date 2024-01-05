const CACHE_NAME = "v1"

console.debug("sw-cache", CACHE_NAME)
caches.keys().then((cacheNames) => {
    console.debug(`sw-caches: [${cacheNames.join(", ")}]`)
    return Promise.all(cacheNames.map((cacheName) => {
        if (!cacheName.includes(CACHE_NAME)) {
            console.debug(`Delete cache: ${cacheName}`)
            return caches.delete(cacheName)
        }
        return false
    })).then((result: boolean[]) => {
        console.debug("sw validated")
        if (result.some(deleted => deleted)) {postMessage("cache-updated")}
    }, (reason) => console.debug(`sw failed to validate: '${reason}'`))
})

const installListener = (event: ExtendableEvent) => {
    console.debug("sw received install event.")
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(async (cache: Cache) => cache
                .addAll(await fetch("./cache.json")
                    .then(x => x.json()) as Array<string>))
            .then(() => console.debug(`Created cache: '${CACHE_NAME}'`))
            .catch(reason => console.warn("caching failed", reason))
    )
}

self.addEventListener("install", installListener as any)

const fetchListener = (event: FetchEvent) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response === undefined) {
                    return fetch(event.request).catch(() => new Response("Offline. Cache missed.", { status: 404 }))
                } else {
                    return response
                }
            })
            .catch(error => new Response(`Error handling fetch request: ${error}`, { status: 500 }))
    )
}

self.addEventListener("fetch", fetchListener as any)