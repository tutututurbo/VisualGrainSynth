function getEffectValues() {
    return {
        grayscale: Math.round((fxAngles[0] )), // Map angolo (0-100) -> grayscale (0-100%)
        invert: Math.round((fxAngles[1] )),    // Map angolo (0-100) -> invert (0-100%)
        saturate: Math.round((fxAngles[2] )*75),     // Map angolo (0-100) -> sepia (0-100%)
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
    frameInterval = setInterval(() => {
        console.log("FX Angles:", fxAngles);
        // Aggiorna il frame mostrato
        document.getElementById("video_frame").src = `/frames/frame_${currentFrame}.jpg`;
        // Applica gli effetti all'immagine
        let effects = getEffectValues(); // Ottieni i valori degli effetti
        // document.getElementById("video_frame").style.filter = "grayscale(50%) invert(50%) hue-rotate(180deg) sepia(50%)";
        console.log(effects.grayscale, effects.invert, effects.hueRotate, effects.sepia);
        // Applica i valori degli effetti all'immagine
        document.getElementById("video_frame").style.filter = `
           
            invert(${effects.invert}%) 
            hue-rotate(${effects.hueRotate}deg)
            saturate(${effects.saturate}%)
            grayscale(${effects.grayscale}%) 
        `;

        //   
        
        // Se c'è una finestra aperta, applica anche lì
        if (newWindow && !newWindow.closed) {
            const dynamicImg = newWindow.document.getElementById("dynamicDiv");
            dynamicImg.src = `/frames/frame_${currentFrame}.jpg`;
            dynamicImg.style.filter = `
                
                invert(${effects.invert}%) 
                hue-rotate(${effects.hueRotate}deg)
                saturate(${effects.saturate}%)
                 grayscale(${effects.grayscale}%)
            `;
        }

        console.log("Applied filter:", document.getElementById("video_frame").style.filter);
        

        // if (newWindow && !newWindow.closed) {
        //     const dynamicImg = newWindow.document.getElementById("dynamicDiv");
        //     dynamicImg.src = `/frames/frame_${currentFrame}.jpg`;


       
        //     dynamicImg.style.filter = `grayscale(${bwValue}%) invert(${invertValue}%) hue-rotate(${hueValue}deg) sepia(${sepiaValue}%)`;
        //     document.getElementById("video_frame").style.filter = `grayscale(${bwValue}%) invert(${invertValue}%) hue-rotate(${hueValue}deg) sepia(${sepiaValue}%)`;
        //     // // Applica gli effetti all'immagine             
        //     // if(isInverted===true){
        //     //     dynamicImg.style.filter = "invert(1)";
                           
        //     // }else if (BWButton.classList.contains("active")){
        //     //     dynamicImg.style.filter = "grayscale(100%)";
        //     // }else if (sepiaButton.classList.contains("active")){
        //     //     dynamicImg.style.filter = "sepia(1)";
        //     // }else {
        //     //     dynamicImg.style.filter = "invert(0)";
        //     // }   
        // }

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
