document.addEventListener('DOMContentLoaded', function() {

//--------------------- VIDEO -------------------------
const $input = document.querySelector('.box__file');
var videoDuration = 0; // Duration of the video
let videoElement = document.getElementById('videoElement');

$input.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('video/')) {
            const formData = new FormData();
            formData.append('video', file);

            // Invia il video al server Pytho
            fetch('http://localhost:5000/upload-video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                alert(data.message); // Mostra un messaggio di successo

                // Visualizza il video immediatamente nel browser
                const reader = new FileReader();
                reader.onload = function(event) {
                    const videoBuffer = event.target.result;
                    loadVideo(videoBuffer); // Chiamata per visualizzare il video
                };
                reader.readAsArrayBuffer(file); // Leggi il video come ArrayBuffer
            })
            .catch(error => {
                console.error('Error uploading video:', error);
                alert('Errore durante il caricamento del video');
            });
        } else {
            alert('Please upload a video file.');
        }
    }
});

function loadVideo(videoBuffer) {
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' }); // Aggiungi tipo MIME per MP4
    const videoUrl = URL.createObjectURL(videoBlob);
    
    const video = document.createElement('video');
    video.src = videoUrl;
    video.controls = true; // Aggiungi i controlli per l'utente

    const centerBox = document.querySelector('.center-box');
    centerBox.innerHTML = ''; // Cancella il contenuto precedente
    centerBox.appendChild(video); // Inserisci il video dentro la "center-box"
    
    videoElement = video;

    // Attendi che i metadati del video siano caricati per ottenere la durata
    video.addEventListener('loadedmetadata', function () {
        videoDuration = videoElement.duration; // Ottieni la durata del video in secondi
        console.log('Durata del video:', videoDuration);
    });
}

//SPACEBAR TO START/PAUSE VIDEO
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && videoElement) {
        event.preventDefault();
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    }
});




// Update the video start and end times based on knob angles
function updateVideoTime(knobIndex) {
    const lamp1 = document.querySelectorAll('.lamp')[0]; // Seleziona lamp1
    
    if (knobIndex === 0 && !lamp1.classList.contains('on')) {
        // knob1 controls the start time, but only if lamp1 is NOT on
        startVideoTime = (angles[0] / 270) * videoDuration;
        console.log('Knob 1 (Start):', startVideoTime, 'seconds');
        updateVideoFrame(startVideoTime); // Visualizza il frame corrispondente
    } else if (knobIndex === 0 && lamp1.classList.contains('on')) {
        console.log('Lamp 1 is ON. Start time will not be updated.');
    }

    if (knobIndex === 1) {
        // knob2 controls the end time
        endVideoTime = (angles[1] / 270) * videoDuration;
        console.log('Knob 2 (End):', endVideoTime, 'seconds');
    }

    // Ensure the start time is less than the end time
    if (startVideoTime >= endVideoTime) {
        endVideoTime = Math.min(startVideoTime + 0.01, videoDuration); // Imposta un end time minimo
        angles[1] = (endVideoTime / videoDuration) * 270;
        setAngle(1, angles[1]);
        console.log('Adjusting End Time:', endVideoTime, 'seconds');
    }
}


// Visualizza il frame corrispondente al tempo start
function updateVideoFrame(time) {
    videoElement.currentTime = time; // Imposta il video al tempo selezionato
    videoElement.pause(); // Pausa il video per visualizzare il frame
    console.log('Video Frame updated to:', time, 'seconds');
}

// --------------------- KNOBS ---------------------------
var knobs = document.getElementsByClassName('knob');
var angles = [0, 270]; // Store angles for each knob
var minangle = 0;
var maxangle = 270;
var isDragging = false;
var currentKnob = null;
var lastY = 0; // Track the last Y position
var lastAngle = 0; // Keep track of the last angle

// Function to move the knob
function moveKnob(knobIndex, newAngle) {
    if (newAngle >= minangle && newAngle <= maxangle) {
        angles[knobIndex] = newAngle;
        setAngle(knobIndex, newAngle);
    }
}

// Set angle and update corresponding value
function setAngle(knobIndex, angle) {
    var knob = knobs[knobIndex];
    knob.style.transform = 'rotate(' + angle + 'deg)';
    var pc = Math.round((angle / 270) * videoDuration); // Map angle to video duration
    //document.getElementById('knob' + (knobIndex + 1)).textContent = pc; // Update corresponding value
    
    if(knobIndex === 0){
        const lamps1 = document.querySelectorAll('.lamp');
        
        lamps1.forEach((lamp, index) => {
            
            if (lamps1[index].classList.contains('on')) {
                    // Mappa l'angolo da 0 a 270 gradi a una posizione orizzontale da 0px a 500px
                    const maxPosition = 500;
                    lampPosition[index] = (angles[0] / 270) * maxPosition; // Calcola la posizione orizzontale

                    // Trova la small_line e aggiorna la sua posizione
                    const smallLine = document.querySelectorAll('.small_line'); // Assicurati che la classe sia corretta
                if (smallLine[index]) {
                    smallLine[index].style.left = lampPosition[index] + 'px'; // Imposta la posizione orizzontale
                }         
            } 
        });
    }      
}

// Calculate the new angle based on mouse position
function calculateAngleDelta(lastY, currentY, currentAngle) {
    var deltaY = lastY - currentY; // Invert the change
    var sensitivity = 1; // Sensitivity of angle change
    var newAngle = currentAngle + deltaY * sensitivity;

    // Clamp the new angle between the min and max angles
    if (newAngle < minangle) newAngle = minangle;
    if (newAngle > maxangle) newAngle = maxangle;

    return newAngle;
}

Array.from(knobs).forEach((knob, index) => {
    knob.addEventListener('mousedown', function(e) {
        isDragging = true;
        currentKnob = index;
        lastY = e.pageY; // Store the initial Y position
        lastAngle = angles[currentKnob]; // Store the initial angle of the knob
        // Attach the move and mouseup event listeners to the document for global handling
        document.addEventListener('mousemove', onDrag);
    
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    });
});

// Handle dragging
function onDrag(e) {
    if (isDragging && currentKnob !== null) {
        var newAngle = calculateAngleDelta(lastY, e.pageY, lastAngle);
        moveKnob(currentKnob, newAngle);
        lastY = e.pageY; // Update last Y position
        lastAngle = newAngle; // Update the angle for continuous movement
    }
}

// Stop dragging
function stopDrag() {
    isDragging = false;
    currentKnob = null; // Reset the current knob
    document.removeEventListener('mousemove', onDrag); // Remove drag listener
    document.removeEventListener('mouseup', stopDrag); // Remove mouseup listener
}

// // Touch support for mobile devices
document.addEventListener('touchmove', function(e) {
    if (isDragging && currentKnob !== null) {
        var touch = e.touches[0];
        var newAngle = calculateAngleDelta(lastY, touch.pageY, lastAngle);
        moveKnob(currentKnob, newAngle);
        lastY = touch.pageY;
        lastAngle = newAngle;
        e.preventDefault();
    }
    });

document.addEventListener('touchend', function() {
    stopDrag();
});


//---------------- PAD BUTTONS -------------------
// Funzione per cambiare il colore di sfondo a rosso acceso
let activeElement = null;  // Variabile per tenere traccia dell'elemento attivo
let mapActive = false; // Stato di pad8 (Map pad)
let videoPosition = 0; // Posizione del video
let pad8 = document.getElementById('pad8'); 

// Funzione per disattivare tutti i pad (escluso pad8)
function deactivateAllPads(excludePad8 = false) {
    document.querySelectorAll(".pad").forEach(function(pad) {
        if (!excludePad8 || pad !== pad8) {
            pad.classList.remove('active'); // Rimuove la classe 'active' da tutti i pad
        }
    });
    if (!excludePad8) {
        activeElement = null;
    }
}

document.querySelectorAll(".pad").forEach(function(pad, index) {
    pad.addEventListener("click", function() {
        if (pad === pad8) {
            // Se clicchi su pad8
            if (mapActive) {
                // Se è già attivo, disattivalo e disattiva tutti gli altri pad
                pad8.classList.remove('active');
                mapActive = false;
                deactivateAllPads(); // Disattiva anche gli altri pad
            } else {
                // Altrimenti attivalo e disattiva tutti gli altri pad
                pad8.classList.add('active');
                mapActive = true;
                deactivateAllPads(true); // Disattiva tutti gli altri pad ma non pad8
                activeElement = pad8;
            }
        } else {
            // Se clicchi su un pad diverso da pad8 (da 1 a 7)
            if (mapActive) {
                // Se pad8 è attivo, non disattivarlo, ma attiva il nuovo pad e chiama la funzione 'salvatore'
                if (activeElement !== pad) {
                    // Attiva il nuovo pad solo se non è già attivo
                    if (activeElement && activeElement !== pad8) {
                        // Disattiva il vecchio pad attivo se non è pad8
                        activeElement.classList.remove('active');
                    }
                    pad.classList.add('active');
                    activeElement = pad; // Imposta il nuovo pad come attivo
                    midiConnectionFunction(pad); // Funzione da eseguire per fare la mappatura midi del bottone
                }
            } else {
                // Se pad8 non è attivo, attiva solo un pad alla volta
                if (activeElement) {
                    activeElement.classList.remove('active');
                }
                pad.classList.add('active');
                activeElement = pad;
                videoPosition = lampPosition[index]; // Aggiorna la posizione del video in base all'indice del pad
            }
        }
    });
});

// Funzione per avviare la mappatura MIDI
function midiConnectionFunction(pad) {
    alert("Premi una nota sulla tastiera MIDI per mappare questo pad.");
    awaitingMIDIInput = true;  // Imposta lo stato di attesa di input MIDI
    currentPadForMapping = pad; // Memorizza il pad da mappare
}

//---------------- LAMPS AND INDICATORS -------------------
// Seleziona tutti i bottoni, i lamp e le small_line
const lampButtons = document.querySelectorAll('.button');
const lamps = document.querySelectorAll('.lamp');
const movablePoint = document.querySelectorAll('.movablePoint');
const midiToggle = document.querySelector('.midiToggle');
lampButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
    // Spegni tutti i lamp
    lamps.forEach((lamp, lampIndex) => {
        if (lampIndex !== index) {
            lamp.classList.remove('on'); // Spegni lamp non selezionato
        }
    })
        // Toggle dello stato del lamp (accende/spegne)
        if (lamps[index]) {
            lamps[index].classList.toggle('on');
                // Aggiunge/rimuove la classe 'on'
        }
        movablePoint[index].style.visibility = 'visible';
    });      
}); 

// Map the position of the 7 indicators on the preview display
let lampPosition = new Array(7);
const previewDisplay = document.getElementById('preview_display');
const line = document.querySelector('.line');
previewDisplay.addEventListener('click', function (event) {
    const rect = previewDisplay.getBoundingClientRect();
    const x = event.clientX - rect.left;
    lampPosition[6] = Math.max(0, Math.min(x, previewDisplay.offsetWidth - line.offsetWidth));
    line.style.left = lampPosition[6] + 'px';
});

//---------------- MIDI -------------------
navigator.permissions.query({ name: "midi", sysex: true }).then((result) => {
    if (result.state === "granted") {
        alert('MIDI Connection Allowed');
    } else if (result.state === "prompt") {
        alert('Allow MIDI Connection');
    }
    // Permission was denied by user prompt or permission policy
});

let midi = null; // global MIDIAccess object
let midiMappings = {}; // Oggetto per memorizzare la mappatura tra note MIDI e pad
let awaitingMIDIInput = false; // Flag per sapere se stiamo aspettando una mappatura MIDI
let currentPadForMapping = null; // Memorizza il pad attualmente in fase di mappatura


function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!");
    midi = midiAccess; // store in the global object
    startLoggingMIDIInput(midiAccess);
    listInputsAndOutputs(midiAccess); // Optional: If you want to list inputs/outputs
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

// Funzione che gestisce i messaggi MIDI
function onMIDIMessage(event) {
    let midiNote = event.data[1];
    
    // Se stiamo aspettando un input MIDI per la mappatura
    if (awaitingMIDIInput && currentPadForMapping) {
        console.log(`Mappatura del pad a nota MIDI ${midiNote}`);
        midiMappings[midiNote] = currentPadForMapping; // Mappa la nota MIDI al pad
        awaitingMIDIInput = false;
        currentPadForMapping = null;
        alert(`Nota MIDI ${midiNote} mappata correttamente al pad!`);
    }

    // Controlla se la nota MIDI è mappata a un pad
    if (midiMappings[midiNote]) {
        let pad = midiMappings[midiNote];
        pad.click(); // Simula il click sul pad mappato
    }
}

function startLoggingMIDIInput(midiAccess) {
    midiAccess.inputs.forEach((input) => {
        console.log(`Listening to MIDI input: ${input.name}`);
        input.onmidimessage = onMIDIMessage; // Assign onMIDIMessage for each input
    });
}

// Request MIDI Access and set up MIDI message handling
navigator.requestMIDIAccess().then(
    (midiAccess) => {
        console.log("MIDI access obtained.");
        onMIDISuccess(midiAccess);
    },
    onMIDIFailure
);

// Handling MIDI pad toggle
navigator.requestMIDIAccess().then((midiAccess) => {
    midiAccess.inputs.forEach((input) => {
        input.onmidimessage = (msg) => {
            console.log(`MIDI message received on ${input.name}`);
            midiToggle.classList.toggle('on');
            setTimeout(() => {
                midiToggle.classList.toggle('on');
            }, 100);

            if (msg.data[1] === 24 && msg.data[2] > 0) {
                let pad1 = document.getElementById('pad1');
                if (pad1) {
                    pad1.click(); // Trigger click for pad1
                }
            }
        };
    });
});

// Funzione per la richiesta di accesso MIDI
navigator.requestMIDIAccess().then(
    (midiAccess) => {
        console.log("MIDI access obtained.");
        onMIDISuccess(midiAccess);
    },
    onMIDIFailure
);





});


