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
    frameInterval = setInterval(() => {
        // Aggiorna il frame mostrato
        document.getElementById("video_frame").src = `/frames/frame_${currentFrame}.jpg`;

        if (newWindow && !newWindow.closed) {
            const dynamicImg = newWindow.document.getElementById("dynamicDiv");
            dynamicImg.src = `/frames/frame_${currentFrame}.jpg`;

            // Applica gli effetti all'immagine             
            if(isInverted===true){
                dynamicImg.style.filter = "invert(1)";
                           
            }else if (BWButton.classList.contains("active")){
                dynamicImg.style.filter = "grayscale(100%)";
            }else if (sepiaButton.classList.contains("active")){
                dynamicImg.style.filter = "sepia(1)";
            }else {
                dynamicImg.style.filter = "invert(0)";
            }   
        }

        // Logica per downsampling o oversampling
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
    }, 1000 / 30); // Mantieni il frame rate a 30 fps
}


// Funzione per interrompere il ciclo dei frame
function stopFrameLoop() {
    clearInterval(frameInterval);
    isLooping = false;
}

// Assicurati di fermare il loop dei frame quando necessario, ad esempio se si clicca un altro pad
function deactivateAllPads() {
    document.querySelectorAll(".pad").forEach(function (pad) {
            pad.classList.remove('active'); 
    });
    stopFrameLoop(); // Ferma il loop quando tutti i pad vengono disattivati
}
