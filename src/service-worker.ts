const CACHE_VERSION = "V.001"

console.debug("sw-cache", CACHE_VERSION)
const validateCacheVersion = async () => {
    console.debug(`validate cache: ${CACHE_VERSION}`)
    return caches.keys().then((cacheNames) => {
        console.debug(`sw-caches: [${cacheNames.join(", ")}]`)
        return Promise.all(cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_VERSION) {
                console.debug(`Obsolete cache: ${cacheName}`)
                return caches.delete(cacheName)
            }
            return false
        })).then((result: boolean[]) => {
            console.debug("sw validated")
            if (result.some(deleted => deleted)) {
                self.clients.matchAll()
                    .then(clients => {
                        console.debug(`Found ${clients.length} clients. [${clients.map(c => c.url)}]`)
                        clients.forEach(client => client.postMessage("cache-updated"))
                    })
            }
        }, (reason) => console.debug(`sw failed to validate: '${reason}'`))
    })
}

const installListener = (event: ExtendableEvent) => {
    console.debug("sw received install event.")
    event.waitUntil(validateCacheVersion().finally(() =>
        caches
            .open(CACHE_VERSION)
            .then(async (cache: Cache) => cache
                .addAll(await fetch("./cache.json")
                    .then(x => x.json()) as Array<string>))
            .then(() => console.debug(`Created cache: '${CACHE_VERSION}'`))
            .catch(reason => console.warn("caching failed", reason))))
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

const activateListener = (event: ExtendableEvent) => {
    console.debug("sw activate")
    event.waitUntil(validateCacheVersion().finally(() => self.clients.matchAll()
        .then(clients => clients.forEach(client => client.postMessage({
            type: "CACHE_VERSION",
            version: CACHE_VERSION
        })))))
}

self.addEventListener("activate", activateListener as any)