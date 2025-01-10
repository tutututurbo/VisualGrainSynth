// Funzione per aggiornare la lunghezza del grain basata sull'angolo del knob2
function updateGrainLengthFromKnob(angle) {           
    // Mappa i pixel sui frame totali del video
    index = activeLamp[0];      
    maxLength = maxPosition ; // Intervallo fino a 500px
    grainPixels = (angle / maxangle) * maxLength; // Mappa l'angolo di knob2 nell'intervallo in pixel

    if (grainPixels >= (maxPosition-lampPosition[index])) {
        grainPixels = maxPosition-lampPosition[index];
    }
    if (index == 6) {
        document.getElementById('manualWindow').style.width = `${grainPixels}px`;
    }
    else {
        document.getElementById(`window${index + 1}`).style.width = `${grainPixels}px`;
    }     
    anglesEnd[index] = angle; 
    grainLength[index] = Math.floor((grainPixels / maxPosition) * frameIndexMax);
    
}


// Function to show grain window on preview display
function showGrainWindow() {
    const windows = [
        document.getElementById('window1'),
        document.getElementById('window2'),
        document.getElementById('window3'),
        document.getElementById('window4'),
        document.getElementById('window5'),
        document.getElementById('window6')
    ];
    const manualWindow = document.getElementById("manualWindow");

    // Hide all windows initially
    windows.forEach(win => win.style.display = 'none');
    manualWindow.style.display = 'none';

    // Show the correct window based on the active lamp
    if(editModeActive){
        if(activeLamp[0] !== 6) {
            const activeIndex = activeLamp[0];
            windows[activeIndex].style.display = 'block'; // Show the relevant window
        } 
        else {
            manualWindow.style.display = 'block'; // Show manual window if no lamps are active
        }
    }
    if(!editModeActive && activePad != null) {
        if(activePad !== 6) {
            windows[activePad].style.display = 'block'; // Show the relevant window
        }
        else {
            manualWindow.style.display = 'block'; // Show manual window if no lamps are active
        }
    }
}