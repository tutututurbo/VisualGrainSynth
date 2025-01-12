// Function to handle incoming MIDI messages
function onMIDIMessage(event) {
    midiStatus = event.data[0]; // Stato MIDI (es: 144 = nota ON)
    midiNote = event.data[1]; // Nota MIDI
    midiValue = event.data[2]; // Valore MIDI (es: velocità della nota)
    // Turn on the midiToggle Led 
    if (midiStatus === 144) {
        midiToggle.classList.add("on");
    }
    // Turn off midiToggle Led 
    if (midiStatus === 128) {
        midiToggle.classList.remove("on");
    }
    // Verifica se la nota è valida
    if ((midiStatus & 0xF0) === 0xB0) { // 0xB0 indica un Control Change
        console.log(`Control Change ricevuto: 
            Control Number: ${midiNote}, 
            Value: ${midiValue}`);
        if (midiNote >= 1 && midiNote <= 6) {
            const lampIndex = midiNote - 1;
            if (!lamps[lampIndex].classList.contains('on')) {
                lampButtons[lampIndex].click(); // Activate the corresponding lamp button
            }
            moveKnob(0, midiValue * maxangle / 127); // Map value to knob 1
            if (editModeActive) {
                updateFrameFromKnob(angles[0]); // Update frame based on knob 1
            }
        } else if (midiNote === 7) {
            line.style.left = `${midiValue}px`; // Move the line based on MIDI value
            if (activeLamp[0] !== 6) {
                lamps[activeLamp[0]].classList.remove('on'); // Spegni il lamp attivo
                activeLamp = [6]; // Imposta il lamp manuale come attivo
            }
            moveKnob(0, midiValue * maxangle / 127); // Map value to knob 1 for manual line
            if (editModeActive) {
                updateFrameFromKnob(angles[0]); // Update frame based on knob 1
            }
        } else if (midiNote === 8) {
            moveKnob(1, midiValue * maxangle / 127); // Map value to knob 2 for grain length
            updateGrainLengthFromKnob(angles[1]); // Update grain length based on knob 2
        }
    }
    if (editModeActive) {
        // Modalità mappatura: associa una nota MIDI a un pad
        if (awaitingMIDIInput && currentPadForMapping && midiStatus === 144) {
            console.log(`Mapping pad to MIDI note ${midiNote}`);
            midiMappings[midiNote] = currentPadForMapping; // Mappa la nota MIDI al pad      
            alert(`MIDI note ${midiNote} successfully mapped to the pad!`);
            awaitingMIDIInput = false;
            currentPadForMapping.classList.remove('active');
            currentPadForMapping = null;
        }
    } else {
        // Modalità normale: triggera il pad mappato
        if (midiMappings[midiNote]) {
            let pad = midiMappings[midiNote];
            pad.click(); // Simula un click sul pad mappato
        }
        if (!validMidiNotes.includes(midiNote)) {
            return; // Ignora note fuori dall'intervallo
        }
        // Se è una nota ON (144), gestisci il loop dei frame
        if (midiStatus === 144) {      
            if (isLooping) {
                stopFrameLoop(); // Ferma il loop corrente
                startFrameLoop(videoPosition, currentGrainLength, midiNote); // Passa i nuovi fattori
            }
        } 
    }
}


function calculateFrameFactor(note) {
    const c3 = 48; // Nota di riferimento (C3)
    const minNote = 36; // Nota MIDI più bassa
    const maxNote = 83; // Nota MIDI più alta
    const range = maxNote - minNote;
    const base = 1000; // Base esponenziale per amplificare l'effetto
    if (note >= c3 ) {
        // Calcolo downsampling per note sopra C3
        const normalizedNote = (note - c3) / (maxNote - c3); // Normalizza tra 0 e 1
        const downsampleFactor = Math.max(1, Math.round(1 + 250 * Math.pow(base, normalizedNote - 1)));
        return { mode: "downsample", factor: downsampleFactor };
    } else {
        // Calcolo oversampling per note sotto C3
        const normalizedNote = (c3 - note) / (c3 - minNote); // Normalizza tra 0 e 1
        const oversampleFactor = Math.max(1, Math.round(1 + 20 * Math.pow(base, normalizedNote - 1)));
        return { mode: "oversample", factor: oversampleFactor };
    }
}


function calculateVideoFrequency(midiNote = 60) {
    // Calcola la frequenza esponenziale basata sul valore di midiNote
    let videoFrequency =  [Math.exp(90/midiNote)]; // Dividendo per 20 per controllare l'esplosività
    console.log(videoFrequency);
    // Applica i limiti di frequenza tra 1 e 10
    videoFrequency = Math.max(1, Math.min(100, videoFrequency));
    return parseInt(videoFrequency);
}



// Funzione per avviare la mappatura MIDI
function midiConnectionFunction(pad) {
    alert("Premi una nota sulla tastiera MIDI per mappare questo pad.");
    awaitingMIDIInput = true;  // Imposta lo stato di attesa di input MIDI            
    currentPadForMapping = pad; // Memorizza il pad da mappare   
}


// Function to start logging MIDI inputs and set up listeners
function startLoggingMIDIInput(midiAccess) {            
    midiAccess.inputs.forEach((input) => {
        console.log(`Listening to MIDI input: ${input.name}`);
        input.onmidimessage = onMIDIMessage; // Assign message handler
    });
}





// Aggiorna il menu a tendina quando cambia lo stato dei dispositivi MIDI
function updateMIDIDevices(midiAccess) {
    const dropdown = document.getElementById("midi-devices");
    dropdown.innerHTML = '<option value="">-- Scegli un dispositivo --</option>'; // Reset del menu 
    startLoggingMIDIInput(midiAccess);
    const inputs = midiAccess.inputs.values();  
    for (let input of inputs) {
        const option = document.createElement("option");
        option.value = input.id;
        option.textContent = input.name;
        dropdown.appendChild(option);
    }
}







