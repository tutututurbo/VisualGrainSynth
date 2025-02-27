function getEffectValues() {
    return {
        grayscale: Math.round((fxAngles[0])), // Map angolo (0-100) -> grayscale (0-100%)
        invert: Math.round((fxAngles[1])),    // Map angolo (0-100) -> invert (0-100%)
        saturate: Math.min(Math.round((fxAngles[2])*70)+40),     // Map angolo (0-100) -> saturate (0-100%)
        hueRotate: Math.round((fxAngles[3] * 3.6)) // Map angolo (0-100) -> hue-rotate (0-360deg)
    };
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
    frameInterval = setInterval(async () => {  // Modifica per supportare operazioni asincrone


        // Ottieni il frame dalla cache
        const frameFilename = `frame_${currentFrame}.jpg`;
        const cachedFrame = await getFrameFromCache(frameFilename);

        if (cachedFrame) {
            // Se il frame è nella cache, crea un URL dal blob
            const frameBlob = await cachedFrame.blob();  // Converte la risposta in un blob
            const frameUrl = URL.createObjectURL(frameBlob);  // Crea un URL per il blob
            videoDiv.src = frameUrl;  // Imposta il src con il blob URL
        } else {
            // Se il frame non è nella cache, caricalo dal server
            videoDiv.src = `/frames/${frameFilename}`;
        }

        // Applica gli effetti all'immagine
        let effects = getEffectValues(); // Ottieni i valori degli effetti

        // Applica i valori degli effetti all'immagine
        videoDiv.style.filter = `
           
            invert(${effects.invert}%) 
            hue-rotate(${effects.hueRotate}deg)
            saturate(${effects.saturate}%)
            grayscale(${effects.grayscale}%) 
        `;

        //   
        if (newWindow && !newWindow.closed) {
            newWindow.document.getElementById("dynamicDiv").src = videoDiv.src;
            newWindow.document.getElementById("dynamicDiv").style.filter = videoDiv.style.filter;
        }



        // Forward
        if(isForward){
            //forwardFramePosition(mode, currentFrame, startFrame, grainLength, factor, oversampleCounter, outOfBound);
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

        // Backward
        else if(isBackward){
            //currentFrame = startFrame + grainLength;
            if (mode === "downsample") {
                currentFrame -= factor; // Salta frame per accelerare
            } else if (mode === "oversample") {
                oversampleCounter++;
                if (oversampleCounter >= factor) {
                    oversampleCounter = 0;
                    currentFrame--; // Mostra il frame successivo dopo ripetizioni
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

        // Forward and Backward
        else if (isForback) {
                // Initialize direction if undefined
                if (typeof outOfBound === 'undefined' || outOfBound === null) {
                    outOfBound = isForward; // Set the initial direction based on the last used (forward or backward)
                }
            
                // Handle forward direction
                if (outOfBound === true) {
                    if (mode === "downsample") {
                        currentFrame += factor; // Accelerate by skipping frames
                    } else if (mode === "oversample") {
                        oversampleCounter++;
                        if (oversampleCounter >= factor) {
                            oversampleCounter = 0;
                            currentFrame++; // Show next frame after repetitions
                        }
                    }
            
                    // Check for boundary to reverse direction
                    if (currentFrame >= startFrame + grainLength) {
                        currentFrame = startFrame + grainLength; // Ensure boundary limit
                        outOfBound = false; // Switch direction to backward
                    }
                }
            
                // Handle backward direction
                else {
                    if (mode === "downsample") {
                        currentFrame -= factor; // Accelerate by skipping frames
                    } else if (mode === "oversample") {
                        oversampleCounter++;
                        if (oversampleCounter >= factor) {
                            oversampleCounter = 0;
                            currentFrame--; // Show previous frame after repetitions
                        }
                    }
            
                    // Check for boundary to reverse direction
                    if (currentFrame <= startFrame) {
                        currentFrame = startFrame; // Ensure boundary limit
                        outOfBound = true; // Switch direction to forward
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
