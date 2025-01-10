const CACHE_NAME = 'video-frames-cache';

// Intercetta le richieste di frame
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Controlla se la richiesta è relativa ai frame
    if (url.pathname.startsWith('/frames/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    // Restituisce il frame dalla cache o lo scarica e lo memorizza
                    return (
                        cachedResponse ||
                        fetch(event.request).then(networkResponse => {
                            cache.put(event.request, networkResponse.clone());
                            return networkResponse;
                        })
                    );
                });
            })
        );
    }
});

async function clearCache(cacheName) {
    if ('caches' in window) {
        const success = await caches.delete(cacheName);
        if (success) {
            console.log(`Cache "${cacheName}" pulita.`);
        } else {
            console.error(`Errore nella pulizia della cache "${cacheName}".`);
        }
    } else {
        console.error('Cache API non supportata.');
    }
}

// Funzione per memorizzare i frame nella cache
async function cacheFrames(frameFilenames) {
    const cache = await caches.open('video-frames-cache');
    
    // Cicla su ogni frame e salvalo nella cache
    for (const frameFilename of frameFilenames) {
        const frameUrl = `/frames/${frameFilename}`;

        // Controlla se il frame è già nella cache
        const cachedResponse = await cache.match(frameUrl);
        if (!cachedResponse) {
            // Se il frame non è nella cache, scaricalo dal server e salvalo
            fetch(frameUrl)
                .then(response => {
                    // Memorizza la risposta nella cache
                    cache.put(frameUrl, response);
                    console.log(`Frame ${frameFilename} aggiunto alla cache.`);
                })
                .catch(error => {
                    console.error(`Errore nel salvataggio del frame ${frameFilename} nella cache:`, error);
                });
        }
    }
}


// Funzione per ottenere il frame dalla cache
async function getFrameFromCache(frameFilename) {
    const cache = await caches.open('video-frames-cache');
    const frameUrl = `/frames/${frameFilename}`;
    
    // Controlla se il frame è già nella cache
    const cachedResponse = await cache.match(frameUrl);
    if (cachedResponse) {
        console.log(`Frame ${frameFilename} trovato nella cache.`);
        return cachedResponse;  // Restituisce la risposta (frame) dalla cache
    } else {
        console.log(`Frame ${frameFilename} non trovato nella cache.`);
        return null;  // Non trovato nella cache
    }
}