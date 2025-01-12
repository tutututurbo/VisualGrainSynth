const CACHE_NAME = 'video-frames-cache';
const AUDIO_CACHE_NAME = 'audio-samples-cache';
// Evento install
self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache aperta durante l\'installazione del Service Worker');
        })
    );
});

// Evento activate
self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Cache vecchia eliminata:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercetta le richieste di frame
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Controlla se la richiesta è relativa ai frame
    if (url.pathname.startsWith('/frames/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                alert("Service worker is running");
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

// Funzione per memorizzare i frame nella cache
async function cacheFrames(frameFilenames) {
    const cache = await caches.open(CACHE_NAME);
    
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

async function clearCache(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    keys.forEach(async request => {
        await cache.delete(request); // Elimina ogni elemento
        console.log(`Eliminato dalla cache: ${request.url}`);
    });
}

// Funzione per ottenere il numero di frame dalla cache
async function getFrameFromCache(frameFilename) {
    const cache = await caches.open(CACHE_NAME);
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


// ======================================== AUDIO CACHE ========================================


/**
 * Estrai e salva l'audio del video nella cache denominata "audio-samples-cache".
 * @param {File} videoFile Il file video caricato dall'utente.
 */
async function saveAudioToCache(videoFile) {
    try {
        const audioContext = new AudioContext();

        // Leggi il file come array buffer
        const arrayBuffer = await videoFile.arrayBuffer();

        // Decodifica l'audio dal video
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Crea un audio blob con i dati decodificati
        const audioBlob = await createAudioBlob(audioBuffer, audioContext.sampleRate);

        // Aggiungi l'audio alla cache
        const cache = await caches.open('audio-samples-cache');
        const response = new Response(audioBlob, { headers: { 'Content-Type': 'audio/wav' } });
        await cache.put('/audio-sample', response);

        console.log('Audio salvato nella cache con successo.');
    } catch (error) {
        console.error('Errore durante il salvataggio dell\'audio:', error);
    }
}

async function getAudioFromCache() {
    try {
        // Apri la cache
        const cache = await caches.open('audio-samples-cache');

        // Recupera l'audio dalla cache
        const response = await cache.match('/audio-sample');
        if (!response) {
            console.error('Audio non trovato nella cache.');
            return;
        }

        // Ottieni il blob audio
        const audioBlob = await response.blob();

        // Usa l'audio: esempio di riproduzione
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
      //  audio.play();

        // Decodifica e accedi ai campioni audio (facoltativo)
        const audioContext = new AudioContext();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log('Campioni audio:', audioBuffer.getChannelData(0)); // Canale 0
    } catch (error) {
        console.error('Errore durante l\'accesso all\'audio dalla cache:', error);
    }
}


/**
 * Crea un blob audio dal buffer audio.
 * @param {AudioBuffer} audioBuffer Il buffer audio decodificato.
 * @param {number} sampleRate La frequenza di campionamento.
 * @returns {Blob} Il blob audio creato.
 */
async function createAudioBlob(audioBuffer, sampleRate) {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const audioData = new Float32Array(length * numberOfChannels);

    // Copia i dati dei canali nel buffer audio
    for (let channel = 0; channel < numberOfChannels; channel++) {
        audioBuffer.copyFromChannel(audioData.subarray(channel * length, (channel + 1) * length), channel);
    }

    // Crea un file WAV con i dati audio
    const wavBuffer = createWavFile(audioData, sampleRate, numberOfChannels);
    return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Crea un file WAV dai dati audio.
 * @param {Float32Array} audioData I dati audio in virgola mobile.
 * @param {number} sampleRate La frequenza di campionamento.
 * @param {number} numberOfChannels Il numero di canali audio.
 * @returns {ArrayBuffer} Il buffer WAV creato.
 */
function createWavFile(audioData, sampleRate, numberOfChannels) {
    const bytesPerSample = 2; // 16-bit audio
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const buffer = new ArrayBuffer(44 + audioData.length * bytesPerSample);
    const view = new DataView(buffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');

    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true); // BitsPerSample

    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, audioData.length * bytesPerSample, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
        const sample = Math.max(-1, Math.min(1, audioData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += bytesPerSample;
    }

    return buffer;
}

/**
 * Scrive una stringa nel DataView.
 * @param {DataView} view Il DataView di destinazione.
 * @param {number} offset L'offset iniziale.
 * @param {string} string La stringa da scrivere.
 */
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

async function getAudioDurationFromCache() {
    try {
        console.log('Recupero la durata dell\'audio dalla cache...');
        
        // Apri la cache e cerca il file audio
        const cache = await caches.open('audio-samples-cache');
        const response = await cache.match('/audio-sample');
        
        if (!response) {
            console.error('Nessun audio trovato nella cache.');
            return null; // Nessun file audio nella cache
        }

        // Decodifica il blob audio
        const audioBlob = await response.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Calcola la durata dell'audio
        const durationInSeconds = audioBuffer.duration;

        console.log(`Durata dell'audio: ${durationInSeconds.toFixed(2)} secondi`);
        return durationInSeconds;
    } catch (error) {
        console.error('Errore durante il recupero della durata dell\'audio:', error);
        return null; // Restituisce null in caso di errore
    }
}

async function calculateAudioSamplesPerFrame() {
    try {
        console.log('Calcolo della durata in campioni audio per frame...');

        // Recupera la durata dell'audio dalla cache
        const audioDurationInSeconds = await getAudioDurationFromCache();
        if (audioDurationInSeconds === null) {
            console.error('Impossibile calcolare: durata audio non disponibile.');
            return null;
        }

        // Recupera il numero totale di frame dal video
        if (typeof frameIndexMax !== 'number' || frameIndexMax <= 0) {
            console.error('Numero totale di frame non valido o non definito.');
            return null;
        }

        // Calcola la frequenza di campionamento dall'AudioContext
        const audioContext = new AudioContext();
        const sampleRate = audioContext.sampleRate;

        // Calcola il totale dei campioni audio
        const totalAudioSamples = Math.floor(audioDurationInSeconds * sampleRate);

        // Calcola il numero di campioni per ogni frame
        const samplesPerFrame = Math.floor(totalAudioSamples / frameIndexMax);

        console.log(`Numero di campioni audio per frame: ${samplesPerFrame}`);
        return samplesPerFrame;
    } catch (error) {
        console.error('Errore durante il calcolo dei campioni per frame:', error);
        return null;
    }
}
