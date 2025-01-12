function getEffectValues() {
    return {
        grayscale: Math.round((fxAngles[0])), // Map angolo (0-100) -> grayscale (0-100%)
        invert: Math.round((fxAngles[1])),    // Map angolo (0-100) -> invert (0-100%)
        saturate: Math.round((fxAngles[2]) * 75),     // Map angolo (0-100) -> sepia (0-100%)
        hueRotate: Math.round((fxAngles[3] * 3.6)) // Map angolo (0-100) -> hue-rotate (0-360deg)
    };
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

function startFrameLoop(startFrame, grainLength, midiNote) {
    if (isLooping) {
        clearInterval(frameInterval); // Cancella il loop precedente
    }

    let outOfBound = null;
    let currentFrame = startFrame; 
    let oversampleCounter = 0; 
    
    isLooping = true;

    // Calcola il fattore in base alla nota MIDI
    const { mode, factor } = calculateFrameFactor(midiNote);

    // Calcola il numero di campioni per frame
    let samplesPerFrame = 0;
    calculateAudioSamplesPerFrame().then(result => {
        samplesPerFrame = result;
        console.log("Samples per frame:", samplesPerFrame);
    });

    frameInterval = setInterval(async () => {
   //     console.log("FX Angles:", fxAngles);
    
        // Calcola i campioni audio da riprodurre per il frame corrente
        const startSample = currentFrame * samplesPerFrame;
        const endSample = startSample + samplesPerFrame +100;
        console.log("Start Sample:", startSample, "End Sample:", endSample);
        // Calcola la durata di un frame in secondi
        const frameDuration = 1 / 30; // 30 fps = 1/30 secondi per frame
    
        // Calcola la velocità di riproduzione audio
      //  const playbackRate = samplesPerFrame / (frameDuration * currentAudioContext.sampleRate);
        const playbackRate = 0.5;
        // Imposta il playback rate corretto per la riproduzione
        playAudioBuffer(startSample, endSample, playbackRate);
    
        // Ottieni il frame dalla cache
        const frameFilename = `frame_${currentFrame}.jpg`;
        const cachedFrame = await getFrameFromCache(frameFilename);
    
        if (cachedFrame) {
            const frameBlob = await cachedFrame.blob();
            const frameUrl = URL.createObjectURL(frameBlob);
            videoDiv.src = frameUrl;
        } else {
            videoDiv.src = `/frames/${frameFilename}`;
        }
    
        // Applica gli effetti all'immagine
        let effects = getEffectValues();
        videoDiv.style.filter = `
            invert(${effects.invert}%)
            hue-rotate(${effects.hueRotate}deg)
            saturate(${effects.saturate}%)
            grayscale(${effects.grayscale}%)
        `;
    

        // Se c'è una finestra aperta, aggiorna anche lì
        if (newWindow && !newWindow.closed) {
            newWindow.document.getElementById("dynamicDiv").src = videoDiv.src;
            newWindow.document.getElementById("dynamicDiv").style.filter = videoDiv.style.filter;
        }

        // Gestione del ciclo Forward
        if (isForward) {
            if (mode === "downsample") {
                currentFrame += factor; // Salta frame per accelerare
            } else if (mode === "oversample") {
                oversampleCounter++;
                if (oversampleCounter >= factor) {
                    oversampleCounter = 0;
                    currentFrame++; // Mostra il frame successivo dopo ripetizioni
                }
            }

            // Loop dei frame
            if (currentFrame > startFrame + grainLength && outOfBound) {
                currentFrame = startFrame + grainLength; // Riparti dal primo frame del grain
                outOfBound = false;
            }
            if (currentFrame > startFrame + grainLength) {
                currentFrame = startFrame; // Riparti dal primo frame del grain
                outOfBound = true;
            }
        }

        // Gestione del ciclo Backward
        else if (isBackward) {
            if (mode === "downsample") {
                currentFrame -= factor; // Salta frame per accelerare
            } else if (mode === "oversample") {
                oversampleCounter++;
                if (oversampleCounter >= factor) {
                    oversampleCounter = 0;
                    currentFrame--; // Mostra il frame precedente dopo ripetizioni
                }
            }

            // Loop dei frame
            if (currentFrame < startFrame && outOfBound) {
                currentFrame = startFrame; // Riparti dal primo frame del grain
                outOfBound = false;
            }
            if (currentFrame < startFrame) {
                currentFrame = startFrame + grainLength; // Riparti dal primo frame del grain
                outOfBound = true;
            }
        }

        // Gestione del ciclo Forward and Backward
        else if (isForback) {
            if (typeof outOfBound === 'undefined' || outOfBound === null) {
                outOfBound = isForward; // Inizializza direzione
            }

            if (outOfBound === true) {
                if (mode === "downsample") {
                    currentFrame += factor; // Avanza velocemente
                } else if (mode === "oversample") {
                    oversampleCounter++;
                    if (oversampleCounter >= factor) {
                        oversampleCounter = 0;
                        currentFrame++;
                    }
                }

                if (currentFrame >= startFrame + grainLength) {
                    currentFrame = startFrame + grainLength;
                    outOfBound = false;
                }
            } else {
                if (mode === "downsample") {
                    currentFrame -= factor; // Indietro velocemente
                } else if (mode === "oversample") {
                    oversampleCounter++;
                    if (oversampleCounter >= factor) {
                        oversampleCounter = 0;
                        currentFrame--;
                    }
                }

                if (currentFrame <= startFrame) {
                    currentFrame = startFrame;
                    outOfBound = true;
                }
            }
        }
    }, 1000 / 30); // Mantieni il frame rate a 30 fps
}


// Funzione per interrompere il ciclo dei frame
function stopFrameLoop() {
    clearInterval(frameInterval);
    isLooping = false;
    // Mantieni gli effetti attuali sull'immagine
    let effects = getEffectValues();
    document.getElementById("video_frame").style.filter = `
       
        invert(${effects.invert}%) 
        hue-rotate(${effects.hueRotate}deg)
        saturate(${effects.saturate}%)

        grayscale(${effects.grayscale}%) 
    `;
}

// Assicurati di fermare il loop dei frame quando necessario, ad esempio se si clicca un altro pad
function deactivateAllPads() {
    document.querySelectorAll(".pad").forEach(function (pad) {
            pad.classList.remove('active'); 
    });
    stopFrameLoop(); // Ferma il loop quando tutti i pad vengono disattivati
}


function updateMode(selectedMode) {
    // Reset all the boolean values to false
    isForward = false;
    isBackward = false;
    isForback = false;

    // Set the corresponding boolean variable to true based on selected mode
    switch (selectedMode) {
        case 'forward':
            isForward = true;
            break;
        case 'backward':
            isBackward = true;
            break;
        case 'forback':
            isForback = true;
            break;
    }

    // Update the displayed current mode
    
    // Log the current boolean values for testing (optional)
    console.log('Forward:', isForward);
    console.log('Backward:', isBackward);
    console.log('Forback:', isForback);
}

// Listen for changes in the dropdown menu and update mode accordingly
modeSelect.addEventListener('change', (event) => {
    updateMode(event.target.value);
});

// Initialize with the default mode selected in the dropdown
updateMode(modeSelect.value);

// function forwardFramePosition(mode, currentFrame, startFrame, grainLength, factor, oversampleCounter, outOfBound) {
//     // Handle downsampling: Skip frames to accelerate
//     if (mode === "downsample") {
//         currentFrame += factor; // Skip frames for acceleration
//     }
//     // Handle oversampling: Repeat frames and show the next one after a certain number of repetitions
//     else if (mode === "oversample") {
//         oversampleCounter++;
//         if (oversampleCounter >= factor) {
//             oversampleCounter = 0;
//             currentFrame++; // Show the next frame after repetitions
//         }
//     }

//     // Ensure currentFrame stays within the bounds of the grain length
//     if (currentFrame > startFrame + grainLength && outOfBound) {
//         currentFrame = startFrame + grainLength; // Restart from the first frame of the grain
//         outOfBound = false;
//     }

//     if (currentFrame > startFrame + grainLength) {
//         currentFrame = startFrame; // Restart from the first frame of the grain if it exceeds the grain length
//         outOfBound = true;
//     }

//     // Return updated values
//     return { currentFrame, oversampleCounter, outOfBound };
// }


// function backwardFramePosition(mode, currentFrame, startFrame, grainLength, factor, oversampleCounter, outOfBound) {
//     // Handle downsampling: Skip frames to accelerate
//     if (mode === "downsample") {
//         currentFrame -= factor; // Skip frames for acceleration
//     }
//     // Handle oversampling: Repeat frames and show the next one after a certain number of repetitions
//     else if (mode === "oversample") {
//         oversampleCounter++;
//         if (oversampleCounter >= factor) {
//             oversampleCounter = 0;
//             currentFrame--; // Show the next frame after repetitions
//         }
//     }

//     // Ensure currentFrame stays within the bounds of the grain length
//     if (currentFrame < startFrame && outOfBound) {
//         currentFrame = startFrame + grainLength; // Restart from the first frame of the grain
//         outOfBound = false;
//     }

//     if (currentFrame < startFrame) {
//         currentFrame = startFrame + grainLength; // Restart from the first frame of the grain if it exceeds the grain length
//         outOfBound = true;
//     }

//     // Return updated values
//     return { currentFrame, oversampleCounter, outOfBound };
// }

