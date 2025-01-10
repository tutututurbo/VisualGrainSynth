// Function to move the knob
function moveKnob(knobIndex, newAngle, anglesArray) {
    if (newAngle >= minangle && newAngle <= maxangle && currentKnob !== null) {
        anglesArray[knobIndex] = newAngle;
        setAngle(knobIndex, newAngle);
    }
    if (newAngle >= minangle && newAngle <= 100 && fxCurrentKnob !== null) {
        anglesArray[knobIndex] = newAngle;
        setAngle(knobIndex, newAngle);
    }
}
    
function calculateRotationAngle(angle) {
    return angle * 270 / maxangle;
}

// Set angle and update corresponding value
function setAngle(knobIndex, angle) {
    
    if(currentKnob !== null){
        var knob = knobs[knobIndex];
        knob.style.transform = 'rotate(' + calculateRotationAngle(angle) + 'deg)';  
        if(knobIndex === 0 && editModeActive){
            const lamps1 = document.querySelectorAll('.lamp');
            if(activeLamp[0] === 6){
                anglesStart[6] = angles[0]; 
                lampPosition[6] = (angles[0] / maxangle) * maxPosition;
                updateLampPosition(0, lampPosition[6]);
                videoPosition = parseInt((lampPosition[6]) / maxPosition * frameIndexMax, 10);
            } 
            else {          
                lamps1.forEach((lamp, index) => {
                                
                    if (lamps1[index].classList.contains('on')) {
                        // Mappa l'angolo da 0 a 270 gradi a una posizione orizzontale da 0px a 500px
                        anglesStart[index] = angles[0];
                        lampPosition[index] = (angles[0] / maxangle) * maxPosition; // Calcola la posizione orizzontale
                        // Trova la small_line e aggiorna la sua posizione
                        const smallLine = document.querySelectorAll('.small_line'); // Assicurati che la classe sia corretta
                        if (smallLine[index]) {
                            updateLampPosition(index+1, lampPosition[index]); // Imposta la posizione orizzontale
                        }         
                    } 
                });
            }
        }  
        else {
            if (!editModeActive){
                // Activate Lamp 7 (Manual Lamp)
                activeLamp = [6];
                // Position of the Manual Line
                anglesStart[6] = angles[0]; 
                lampPosition[6] = (angles[0] / maxangle) * maxPosition;
                updateLampPosition(0, lampPosition[6]);
                if(activePad == 6) { 
                    // Grain Length of the Manual Line
                    videoPosition = parseInt((lampPosition[6]) / maxPosition * frameIndexMax, 10);
                    updateGrainLengthFromKnob(angles[1]);
                    currentGrainLength = Math.max(1, grainLength[index]); // Assicurati che grainLength sia almeno 1
                    startFrameLoop(videoPosition, currentGrainLength, midiNote);
                }
            }    
        }
    }
    if(fxCurrentKnob !== null){
        var knob = fxKnobs[knobIndex];
        knob.style.transform = 'rotate(' + angle/100 * 270 + 'deg)'; 
    }
}

// Calculate the new angle based on mouse position
function calculateAngleDelta(lastY, currentY, currentAngle) {
    var deltaY = lastY - currentY; // Invert the change
    var sensitivity = 1; // Sensitivity of angle change
    var newAngle = currentAngle + deltaY * sensitivity;
    // Clamp the new angle between the min and max angles
    if(currentKnob !== null){
    if (newAngle < minangle) newAngle = minangle;
    if (newAngle > maxangle) newAngle = maxangle;  
    }
    if(fxCurrentKnob !== null){
        if (newAngle < minangle) newAngle = minangle;
        if (newAngle > 100) newAngle = 100;  
    }
    return newAngle;
}

// Funzione per aggiornare il frame in base all'angolo del knob
async function updateFrameFromKnob(degrees) {   
    videoPosition = Math.floor((degrees / maxangle) * (frameIndexMax - 1));  // Calcola il frameIndex usando la proporzione      
    // Imposta il percorso dell'immagine corrispondente al frame
    if (editModeActive){
        const cachedFrame = await getFrameFromCache(`frame_${videoPosition}.jpg`);
        
        if (cachedFrame) {
            // Se il frame è nella cache, usa il suo URL
            document.getElementById("video_frame").src = cachedFrame.url;
        } else {
            console.log(`Frame ${videoPosition} non trovato nella cache.`);
            // Se non è nella cache, puoi decidere di caricarlo dal server o gestire l'errore
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`; // O fallback alla cartella
        }
    }
}

// Handle dragging
async function onDrag(e) {
    if (isDragging) {
        if(currentKnob !== null) {
            var newAngle = calculateAngleDelta(lastY, e.pageY, lastAngle);
            moveKnob(currentKnob, newAngle, angles);
            lastY = e.pageY; // Update last Y position
            lastAngle = newAngle; // Update the angle for continuous movement
            // Aggiorna il frame o il grain durante il drag
            if(editModeActive){
                if (currentKnob === 0 ) {
                    updateFrameFromKnob(angles[0]);
                } else if(currentKnob === 1){
                    videoPosition = Math.floor((angles[0] / maxangle) * (frameIndexMax - 1));  // Calcola la posizione del frame
                    const cachedFrame = await getFrameFromCache(`frame_${videoPosition + grainLength[index]}.jpg`);
                    
                    if (cachedFrame) {
                        // Se il frame è nella cache, usa il suo URL
                        document.getElementById("video_frame").src = cachedFrame.url;
                    } else {
                        console.log(`Frame ${videoPosition + grainLength[index]} non trovato nella cache.`);
                        // Se non è nella cache, fallback al percorso classico
                        document.getElementById("video_frame").src = `/frames/frame_${videoPosition + grainLength[index]}.jpg`;
                    }
                }               
                updateGrainLengthFromKnob(angles[1]);
            }  
        }
        if(fxCurrentKnob !== null) {
            
            var fxNewAngle = calculateAngleDelta(fxLastY, e.pageY, fxLastAngle);
            moveKnob(fxCurrentKnob, fxNewAngle, fxAngles);
            fxLastY = e.pageY; // Update last Y position
            fxLastAngle = fxNewAngle; // Update the angle for continuous movement
            // Aggiorna i filtri con i nuovi valori
            if(fxCurrentKnob < 4){
            let effects = getEffectValues();
            document.getElementById("video_frame").style.filter = `
                grayscale(${effects.grayscale}%) 
                invert(${effects.invert}%) 
                hue-rotate(${effects.hueRotate}deg) 
                saturate(${effects.saturate}%)
            `;
            } else {
                if (fxCurrentKnob >= 4) {
                    let mappedAngle = fxNewAngle - 50; // Shift zero to the middle
                    if (mappedAngle < -20) {
                    ratios[fxCurrentKnob-4] =  -  Math.pow(Math.abs(mappedAngle) / 20, 3);
                    } else if (mappedAngle > 20) {
                    ratios[fxCurrentKnob-4] =  + Math.pow(Math.abs(mappedAngle) / 20, 3);
                    } else {
                        let ratio = Math.sign(mappedAngle) * Math.pow(Math.abs(mappedAngle) / 20, 2);
                        if (Math.abs(ratio) > 1) {
                            if (Math.abs(ratio) <= 1) {
                                ratios[fxCurrentKnob-4] = Math.sign(ratio) * 1;
                            } else if (Math.abs(ratio) <= 2) {
                                ratios[fxCurrentKnob-4] = Math.sign(ratio) * 2;
                            } else if (Math.abs(ratio) <= 5) {
                                ratios[fxCurrentKnob-4] = Math.sign(ratio) * 5;
                            } else {
                                ratios[fxCurrentKnob-4] = Math.sign(ratio) * 10;
                            }
                        } else {
                            ratios[fxCurrentKnob-4] = ratio;
                        }
                    }
                }
            }

        }
    }
    

}

// Stop dragging
function stopDrag() {
    isDragging = false;
    // Stop dragging the knob for frame and grain
    if (currentKnob !== null) {
        if ((grainPixels > (maxPosition-lampPosition[index])))  {
            grainPixels = maxPosition-lampPosition[index];
            console.log(grainPixels);
            grainLength[index] = Math.floor((grainPixels / maxPosition) * frameIndexMax);
        }
        currentKnob = null; // Reset the current knob for frame and grain
    }
    // Stop dragging the knob for FX
    if (fxCurrentKnob !== null) {
        fxCurrentKnob = null; // Reset the current knob for FX
    }
  
    
    
    document.removeEventListener('mousemove', onDrag); // Remove drag listener
    document.removeEventListener('mouseup', stopDrag); // Remove mouseup listener
}
