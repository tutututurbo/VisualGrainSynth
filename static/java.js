// ============================================ VARIABLES DECLARATION =============================================

//--------------------- VIDEO -------------------------
const $input = document.querySelector('.box__file');
let videoElement = document.getElementById('videoElement');
let videoPosition = 0; // Frame of the current video position for each grain
let videoDiv = document.getElementById("video_frame");;
let isnewWindwOpen = false;
let newWindow = null;
let frameIndexMax = parseInt(localStorage.getItem('frameIndexMax')) || 0;     // Retrieve the stored frameIndexMax value, or default to 0
let isForward = true;
let isBackward = false;
let isForback = false;
const modeSelect = document.getElementById('modeSelect');

// --------------------- EFFECTS -------------------------
// let invertButton = document.getElementById('colorInvertButton');
// let BWButton = document.getElementById('B&WButton');
// let sepiaButton = document.getElementById('sepiaButton');
// let isInverted = false;
var autoModeActive = false;
var fxKnobs = document.getElementsByClassName('knob_filter');
let fxAngles = new Array(8).fill(0);
var fxLastAngle = 0;
var fxCurrentKnob = null;
var fxLastY = 0; // Track the last Y position for FX


// Initialize the last four fxKnobs (5, 6, 7, 8) to half their maximum value
for (let i = 4; i < 8; i++) {
    fxAngles[i] = 135; // Assuming the maximum value is 360 degrees
    fxKnobs[i].style.transform = 'rotate(' + fxAngles[i] + 'deg)';
}

// --------------------- KNOBS ---------------------------
var knobs = document.getElementsByClassName('knob');
var angles = [0, 0]; // Store angles for each knob
var anglesStart = new Array(7).fill(0); // Keeps track of the angles related to the start of the grains
var anglesEnd = new Array(7).fill(0); // Keeps track of the angles related to the end of the grains
var minangle = 0;
var maxangle = frameIndexMax;
var isDragging = false;
var currentKnob = null;
var lastY = 0; // Track the last Y position
var lastAngle = 0; // Keep track of the last angle
const maxPosition = 500; // Length in pixel of the previewDisplay
let grainPixels = 0; 
let maxLength = 0;

// --------------------- SWITCH ------------------
let editModeActive = true; 

// --------------------- PADS --------------------
let activePad = null;  // Variabile per tenere traccia del pad attivo
let padManual = document.getElementById('padManual');  // Seleziona pad7, il pad che attiva la modalità manuale
let frameInterval; // Variabile per tenere traccia dell'interval
let isLooping = false; // Flag per sapere se il loop è in esecuzione

//---------------- LAMPS AND INDICATORS -------------------
// Seleziona tutti i bottoni, i lamp e le small_line
const lampButtons = document.querySelectorAll('.button');
const lamps = document.querySelectorAll('.lamp');
const movablePoint = document.querySelectorAll('.movablePoint');
const midiToggle = document.querySelector('.midiToggle');
let activeLamp = [6];  // Array che tiene traccia dell'indice del lamp attivo
let lampPosition = new Array(7).fill(0);  // Map the position of the 7 indicators on the preview display
const previewDisplay = document.getElementById('preview_display');
const line = document.querySelector('.line');
let grainLength = new Array(7).fill(0); // Number of frames to play for each pad button

//---------------- MIDI -------------------
let midi = null; // Global MIDIAccess object
let midiMappings = {}; // Mapping between MIDI notes and pads
let awaitingMIDIInput = false; // Flag to track if waiting for MIDI mapping
let currentPadForMapping = null; // Stores the pad being mapped
let midiStatus = null; // Stores the MIDI status
let midiNote = 48; // Stores the MIDI note
const validMidiNotes = Array.from({ length: 48 }, (_, i) => i + 36);     // Definisci l'intervallo di note supportate (2 ottave sotto e sopra C3) : [36, 37, ..., 83]

//---------------- BPM SLIDER -------------------
let bpm = 120; // Global variable to store the BPM
let sliderLastY = null; // Track the last Y position
let sliderPenultimateY = null; // Track the penultimate Y position
const slider = document.getElementById("tempo-slider");
const sliderValue = document.getElementById("slider-value");

//---------------- SPECTRUM -------------------
let xBands = [60, 100, 300, 2000];
const sliderBands = document.querySelectorAll(".slider-band");
let threshold = new Array(5).fill(0);
const bandLines = document.getElementsByClassName("band-line");
let rectWidths = [122, 57, 123, 211, 257];
const ratios = new Array(5).fill(0);


// ============================================== LOGIC IMPLEMENTATION ==============================================


let isProcessing = true; // Flag to indicate video processing state
let staticFrameIndex = 0; // Index for the TV_STATIC frames
const staticFramesPath = "/static/TV_STATIC"; // Path to the folder with static frames

// Function to show static frames
function showStaticFrames() {
    if (isProcessing) {
        videoDiv.src = `${staticFramesPath}/frame_${staticFrameIndex}.jpg`;
        staticFrameIndex = (staticFrameIndex + 1) % 10; // Assuming you have 10 static frames
        setTimeout(showStaticFrames, 100); // Update frame every 100ms
    }
}


//--------------------- VIDEO -------------------------
document.getElementById('uploadButton').addEventListener('click', function() {
    const videoInput = document.getElementById('videoInput');
    const file = videoInput.files[0];       
    if (!file) {
        alert('Please select a video file first.');
        return;
    }     

    isProcessing = true;
    showStaticFrames();

    const formData = new FormData();
    formData.append('video', file); 

    fetch(' https://visualgrainsynth-265d067aa5d1.herokuapp.com/upload-video', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        frameIndexMax = parseInt(data.message);
        
        // Save frameIndexMax to localStorage
        localStorage.setItem('frameIndexMax', frameIndexMax);

        isProcessing = false;
        // Stop showing static frames
        clearCache('video-frames-cache');   
        videoDiv.src = `/frames/frame_0.jpg`;   
        
        // Aggiungi i frame alla cache
        cacheFrames(data.frames);

    })
    .catch(error => {
        console.error('Errore:', error);
        alert('Errore nella comunicazione con il server');
    });
});


// Full Screen
window.openNewWindow = function() {
    // Apri una nuova finestra
    newWindow = window.open("", "_blank", "width=800,height=600");    
    if (newWindow) {
        // Imposta il contenuto iniziale della nuova finestra          
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">                  
                <style>
                    body {
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background-color: black;
                    }
                    #dynamicImg {
                        max-width: 200%;
                        max-height: 200%;
                        object-fit: contain; /* Mantiene le proporzioni */
                        background-color: black; /* Evita zone bianche */
                    }
                </style>
            </head>
            <body>
            </body>
            </html>
        `);
        // Aggiungi la div dinamicamente alla nuova finestra
        newWindow.document.body.innerHTML = `
            <img id="dynamicDiv"></img>
        `;
        newWindow.document.title = "Les Lunettes de Dalì";  // Imposta il titolo della nuova finestra
        // (Facoltativo) Mostra un log per confermare
        console.log("Div inizializzata nella nuova finestra.");
    } else {
        alert("Impossibile aprire la finestra. Controlla che i popup non siano bloccati.");
    }
}



// --------------------- EFFECTS -------------------------
// invertButton.addEventListener("click", function() {
//     console.log("Invert button clicked");
//     // BWButton.classList.remove("active");
//     // sepiaButton.classList.remove("active");
//     if(editModeActive) {     
//         midiConnectionFunction(invertButton);
//     } else {
//         let videoFrame = document.getElementById("video_frame");
//         if (videoFrame) {
//             console.log("Video frame trovato");
//             if (invertButton.classList.contains("active")) {       
//                 invertButton.classList.remove("active");
//                 isInverted = false;
//                 videoFrame.style.filter = "invert(0)";
//                 console.log("Filtro invert disattivato");
//             } else {
//                 invertButton.classList.add("active");
//                 isInverted = true;
//                 videoFrame.style.filter = "invert(1)";
//                 console.log("Filtro invert attivato");
//             }
//         } else {
//             console.error("Elemento video_frame non trovato!");
//         }
//     }
// });
        
// BWButton.addEventListener("click", function() {
//     console.log("B&W button clicked");
//     // invertButton.classList.remove("active");
//     // sepiaButton.classList.remove("active");
//     if(editModeActive){
//         midiConnectionFunction(BWButton);
//     } else {
//         let videoFrame = document.getElementById("video_frame");
//         if (videoFrame) {
//             console.log("Video frame trovato");
//             if (BWButton.classList.contains("active")) {
//                 BWButton.classList.remove("active");
//                 videoFrame.style.filter = "grayscale(0)";
//                 console.log("Filtro B&W disattivato");
//             } else {
//                 BWButton.classList.add("active");
//                 videoFrame.style.filter = "grayscale(100%)";
//                 console.log("Filtro B&W attivato");
//             }
//         } else {
//             console.error("Elemento video_frame non trovato!");
//         }
//     }
// });

// sepiaButton.addEventListener("click", function() {  
//     console.log("Sepia button clicked");
//     // BWButton.classList.remove("active");
//     // invertButton.classList.remove("active");   
//     if(editModeActive){
//         midiConnectionFunction(sepiaButton);
//     } else{
//         let videoFrame = document.getElementById("video_frame");
//         if (videoFrame) {
//             console.log("Video frame trovato");
//             if (sepiaButton.classList.contains("active")) {
//                 sepiaButton.classList.remove("active");
//                 videoFrame.style.filter = "sepia(0)";
//                 console.log("Filtro sepia disattivato");
//             } else {
//                 sepiaButton.classList.add("active");
//                 videoFrame.style.filter = "sepia(1)";
//                 console.log("Filtro sepia attivato");
//             }
//         } else {
//             console.error("Elemento video_frame non trovato!");
//         }
//     }
// });
        
// --------------------- KNOBS ---------------------------    

Array.from(knobs).forEach((knob, index) => {
    knob.addEventListener('mousedown', function(e) {
        isDragging = true;
        currentKnob = index;
        lastY = e.pageY; // Store the initial Y position       
        lastAngle = angles[currentKnob]; // Store the initial angle of the knob
        // Attach the move and mouseup event listeners to the document for global handling
        loadLampAngles(activeLamp[0], currentKnob);
        if (index === 1 && editModeActive) {
            updateGrainLengthFromKnob(angles[1]);
        }
        if(index === 0 && editModeActive){
            updateFrameFromKnob(angles[0]); 
        } 
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    });
});


// FX Knobs
Array.from(fxKnobs).forEach((knob, index) => {
    knob.addEventListener('mousedown', function(e) {
        isDragging = true;
        fxLastY = e.pageY; // Store the initial Y position    
        fxCurrentKnob = index;   
        fxLastAngle = fxAngles[index]; // Store the initial angle of the knob
        // Attach the move and mouseup event listeners to the document for global handling
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
    });
});


// Touch support for mobile devices
document.addEventListener('touchmove', function(e) {
    if (isDragging){
        if( currentKnob !== null) {
        var touch = e.touches[0];
        var newAngle = calculateAngleDelta(fxLastY, touch.pageY, lastAngle);
        moveKnob(currentKnob, newAngle, angles);
        lastY = touch.pageY;
        lastAngle = newAngle;
        e.preventDefault();
      }

      if(fxCurrentKnob !== null){
        var touch = e.touches[0];
        var newAngle = calculateAngleDelta(lastY, touch.pageY, fxLastAngle);
        moveKnob(fxCurrentKnob, newAngle, fxAngles);
        fxLastY = touch.pageY;
        fxLastAngle = newAngle;
        e.preventDefault();
      }

    }
});

document.addEventListener('touchend', function() {
    stopDrag();
});


// --------------------- LED TOGGLE ------------------

// Aggiunge un evento per ascoltare la pressione del tasto "E"
document.addEventListener('keydown', function(event) {
    if (event.key === 'e' || event.key === 'E') { // Verifica se il tasto è "E" o "e"
        toggleSwitch();
        if(!editModeActive){
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
            activePad === null;
        }
        else {
            showGrainWindow();
        }   
    }
});

// Funzione per gestire l'accensione e lo spegnimento di un interruttore
document.getElementById('editMode').addEventListener('click', function() {
    toggleSwitch(this);
});

        
//---------------- PAD BUTTONS -------------------

document.addEventListener('keydown', (event) => {
    const key = event.key; // Nome del tasto premuto
    const output = document.getElementById('output');

    // Controlla se il tasto è un numero tra 1 e 6 o la barra spaziatrice
    if (key >= '1' && key <= '6') {
        const index = parseInt(key, 10) - 1; // Converti il tasto in un indice
        const pad = document.querySelectorAll('.pad')[index]; // Seleziona il pad corrispondente
        pad.click(); // Simula un click sul pad
    } else if (key === '7') { // Tasto 7
        padManual.click(); // Simula un click sul pad manuale
    }
});

document.querySelectorAll(".pad").forEach(function (pad, index) {
    pad.addEventListener("click", function () {
        deactivateAllPads();
        if (editModeActive) {
            if (activePad !== index) {
                if (activePad) {
                    activePad = null;
                }
                midiConnectionFunction(pad);     
            }                         
        }
        else {
            videoPosition = parseInt((lampPosition[index]) / maxPosition * frameIndexMax, 10);
            if (grainPixels > (maxPosition-lampPosition[6])) {
                grainPixels = maxPosition-lampPosition[6];
                grainLength[6] = Math.floor((grainPixels / maxPosition) * frameIndexMax);
            }
            currentGrainLength = Math.max(1, grainLength[index]); // Assicurati che grainLength sia almeno 1                   
            // Avvia il loop dei frame
            startFrameLoop(videoPosition, currentGrainLength, midiNote);
            //showGrainWindow();
            // if (activePad) {
            //     activePad.classList.remove('active');
            // }
        }  
        activePad = index;
        showGrainWindow();
        pad.classList.add('active');   
    });
});

        
//---------------- LAMPS AND INDICATORS -------------------

lampButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        // Spegni tutti i lamp tranne quello selezionato
        if(editModeActive){
            lamps.forEach((lamp, lampIndex) => {
                if (lampIndex !== index) {
                    lamp.classList.remove('on'); // Spegni i lampi non selezionati
                }
            });
            // Toggle dello stato del lamp selezionato (accende o spegne)
            if (lamps[index].classList.contains('on')) {
                lamps[index].classList.remove('on'); // Spegni il lamp selezionato se è già acceso
                // Rimuovi l'indice dal array activeLamps
                activeLamp = activeLamp.filter(activeIndex => activeIndex !== index);
            } else {
                lamps[index].classList.add('on'); // Accendi il lamp selezionato
                // Aggiungi l'indice al array activeLamps
                activeLamp = [index]; // Solo un lamp può essere attivo, quindi lo sovrascriviamo
            }
            if (activeLamp.length === 0) {
                activeLamp = [6];
            }
            // Mostra il movablePoint corrispondente
            movablePoint[index].style.visibility = 'visible';
            showGrainWindow();
            knobs[0].style.transform = 'rotate(' + calculateRotationAngle(anglesStart[activeLamp[0]]) + 'deg)';
            knobs[1].style.transform = 'rotate(' + calculateRotationAngle(anglesEnd[activeLamp[0]]) + 'deg)';
            loadLampAngles(activeLamp[0], currentKnob);
            videoPosition = parseInt((lampPosition[activeLamp[0]]) / maxPosition * frameIndexMax, 10);  
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`; 
        }
    });    
});

previewDisplay.addEventListener('click', function (event) {
    
    const rect = previewDisplay.getBoundingClientRect();
    const x = event.clientX - rect.left;
    lampPosition[6] = Math.max(0, Math.min(x, previewDisplay.offsetWidth - line.offsetWidth));
    anglesStart[6] =  lampPosition[6] * maxangle / maxPosition;
    if(activeLamp[0] === 6 || activePad === 6) {
        document.querySelectorAll('.movementContainer')[0].style.left = lampPosition[6] + 'px';
        videoPosition = parseInt((lampPosition[6]) / maxPosition * frameIndexMax, 10);  
        if(editModeActive){
            knobs[0].style.transform = 'rotate(' + calculateRotationAngle(anglesStart[6]) + 'deg)';
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`; 
        }
    }
    if (!editModeActive) {
        document.querySelectorAll('.movementContainer')[0].style.left = lampPosition[6] + 'px';
        knobs[0].style.transform = 'rotate(' + calculateRotationAngle(anglesStart[6]) + 'deg)';
        videoPosition = parseInt((lampPosition[6]) / maxPosition * frameIndexMax, 10);  
        if(activePad == 6) {
            
            if (grainPixels > (maxPosition-lampPosition[6])) {
                grainPixels = maxPosition-lampPosition[6];
                grainLength[6] = Math.floor((grainPixels / maxPosition) * frameIndexMax);
            }
            //updateGrainLengthFromKnob(angles[1]);
            currentGrainLength = Math.max(1, grainLength[6]);      
            startFrameLoop(videoPosition, currentGrainLength, midiNote);   
        }  
    }     
});


//---------------- MIDI -------------------

// Request MIDI permissions
navigator.permissions.query({ name: "midi", sysex: true }).then((result) => {
    if (result.state === "granted") {
        console.log("MIDI connection allowed.");
    } else if (result.state === "prompt") {
        alert("Please allow MIDI connection.");
    }
    // If permission is denied, the user will not see this message as it's restricted by the policy.
});

// Callback for successful MIDI access
function onMIDISuccess(midiAccess) {
    console.log("MIDI ready!");
    midi = midiAccess; // Store in the global object
    startLoggingMIDIInput(midiAccess);
}

// Callback for failed MIDI access
function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}
    

// Request MIDI access and set up message handling
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);


async function initMIDI() {
    // Controlla se l'API MIDI è supportata
    if (!navigator.requestMIDIAccess) {
        alert("Le API Web MIDI non sono supportate dal tuo browser.");
        return;
    }
    try {
        // Richiedi l'accesso ai dispositivi MIDI
        const midiAccess = await navigator.requestMIDIAccess();
        // Ottenere i dispositivi MIDI
        const inputs = midiAccess.inputs.values();
        // Trova il menu a tendina
        const dropdown = document.getElementById("midi-devices");
        // Aggiungi i dispositivi MIDI al menu
        for (let input of inputs) {
            const option = document.createElement("option");
            option.value = input.id; // Usa l'ID del dispositivo come valore
            option.textContent = input.name; // Usa il nome del dispositivo come testo
            dropdown.appendChild(option);
        }
        // Listener per cambiamenti nei dispositivi MIDI
        midiAccess.onstatechange = (event) => {
            console.log(`Stato cambiato: ${event.port.name} (${event.port.state})`);      
            updateMIDIDevices(midiAccess);
        };
    } catch (error) {
        console.error("Errore durante l'accesso ai dispositivi MIDI:", error);
    }
}

// Funzione chiamata quando l'utente seleziona un dispositivo
window.handleDeviceChange = function() {
    const selectedDevice = document.getElementById("midi-devices").value;
    console.log("Dispositivo selezionato:", selectedDevice);
    // Aggiungi qui il codice per interagire con il dispositivo MIDI selezionato
    if (midi) {
        const input = midi.inputs.get(selectedDevice);
        if (input) {
            console.log("Input MIDI selezionato:", input);
            input.onmidimessage = onMIDIMessage; // Assegna il gestore dei messaggi
        } else {
            console.error("Dispositivo MIDI non trovato.");
        }
    }
    
}

// Inizializza l'app MIDI
initMIDI();


//--------------------------------- SPECTRUM ---------------------------------------

function updateRectangles() {
    sliderBands[0].style.width = `${rectWidths[0]}px`;
    sliderBands[1].style.width = `${rectWidths[1]}px`;
    sliderBands[2].style.width = `${rectWidths[2]}px`;
    sliderBands[3].style.width = `${rectWidths[3]}px`;
    sliderBands[4].style.width = `${rectWidths[4]}px`;

    bandLines[0].style.left = `${rectWidths[0] + 15}px`;
    bandLines[1].style.left = `${rectWidths[0] + rectWidths[1]+ 15}px`;
    bandLines[2].style.left = `${rectWidths[0] + rectWidths[1] + rectWidths[2]+ 15}px`;
    bandLines[3].style.left = `${rectWidths[0] + rectWidths[1] + rectWidths[2] + rectWidths[3]+ 15}px`;
}

Array.from(bandLines).forEach((line, index) => {
    let isDragging = false;
    let startX = 0;
    console.log(startX);
    line.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX;
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;

        // Update widths
        const newWidth1 = rectWidths[index] + deltaX;
        const newWidth2 = rectWidths[index + 1] - deltaX;

        // Ensure rectangles stay within bounds
        const minWidth = 20; // Minimum width for each rectangle
        if (newWidth1 >= minWidth && newWidth2 >= minWidth) {
            rectWidths[index] = newWidth1;
            rectWidths[index + 1] = newWidth2;
            startX = e.clientX; // Update startX for smooth dragging
            updateRectangles();
        }

        xBands[index] =  pixelToFrequency(parseInt(bandLines[index].style.left, 10));
        console.log(xBands[index])
        
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

});


function pixelToFrequency(pixelPosition) {
    // Estrai i limiti delle frequenze
    const minFreq = 20;
    const maxFreq = 20000;

    // Inverte la formula originale
    const freq = minFreq * Math.pow(maxFreq / minFreq, (pixelPosition - 15) / 770);
    return freq;
}

// -------------------------------------- SERVICE WORKER ------------------------------------------------------
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
            console.log('Service Worker registrato con successo:', registration.scope);
        })
        .catch(error => {
            console.error('Registrazione del Service Worker fallita:', error);
        });
}

// ----------------------------------------- FX LINK ------------------------------------------------------



// const points = document.querySelectorAll(".point");
// const holes = document.querySelectorAll(".hole");

// const connections = {}; // Gestisce i collegamenti punta-buco
// let selectedPoint = null; // Punta selezionata (B1, B2, ecc.)
// let selectedHole = null;  // L'hole selezionato per la rimozione del cavo

// // Gestione della selezione delle punte (collegamento iniziale)
// points.forEach(point => {
//     point.addEventListener("click", () => {
//         if (selectedHole) {
//             // Se un hole è selezionato, collega il punto all'hole
//             const pointId = point.id; // Es. "B1"
//             const holeId = selectedHole.id; // Es. "FX1"

//             // Salva il collegamento tra banda ed effetto
//             if (!connections[holeId]) {
//                 connections[holeId] = [];
//             }
//             if (!connections[holeId].includes(pointId)) {
//                 connections[holeId].push(pointId);
//                 drawCable(point, selectedHole); // Disegna il cavo visivamente
//                 console.log(`${pointId} collegato a ${holeId}`);
//             }

//             // Resetta la selezione
//             selectedPoint = null;
//             selectedHole.classList.remove("selected");
//             selectedHole = null;
//             updateHoleCursors();  // Aggiorna i cursori per gli hole
//         } else {
//             // Se un hole non è selezionato, seleziona il punto
//             points.forEach(p => p.classList.remove("selected"));
//             point.classList.add("selected");
//             selectedPoint = point; // Memorizza la punta selezionata
//         }
//     });
// });

// // Gestione della selezione dell'hole (cliccare sull'hole per scollegare)
// holes.forEach(hole => {
//     hole.addEventListener("click", () => {
//         // Se c'è una connessione, seleziona l'hole
//         if (connections[hole.id] && connections[hole.id].length > 0) {
//             selectedHole = hole;
//             hole.classList.add("selected"); // Aggiungi la classe di selezione
//             console.log(`Hole selezionato: ${hole.id}`);
//         }
//     });
// });

// // Gestione della selezione della banda (cliccare sulla banda per rimuoverla)
// points.forEach(point => {
//     point.addEventListener("click", () => {
//         if (selectedHole && selectedHole.id) {
//             const holeId = selectedHole.id;
//             const pointId = point.id;

//             // Controlla se la banda è collegata all'hole
//             if (connections[holeId] && connections[holeId].includes(pointId)) {
//                 // Rimuovi il cavo SVG
//                 const cables = document.querySelectorAll(`#cable-svg path`);
//                 cables.forEach(cable => {
//                     // Verifica se il cavo è collegato a questa banda e hole
//                     if (cable.getAttribute("data-hole-id") === holeId && cable.getAttribute("data-point-id") === pointId) {
//                         cable.remove(); // Rimuovi il cavo
//                     }
//                 });

//                 // Rimuovi la connessione da 'connections'
//                 const index = connections[holeId].indexOf(pointId);
//                 if (index > -1) {
//                     connections[holeId].splice(index, 1);
//                 }

//                 // Se non ci sono più connessioni per quell'hole, rimuovilo
//                 if (connections[holeId].length === 0) {
//                     delete connections[holeId];
//                 }

//                 // Reset delle selezioni
//                 selectedHole.classList.remove("selected");
//                 selectedHole = null;
//                 selectedPoint = null;

//                 // Rimuovi il cursore pointer se non ci sono più connessioni
//                 updateHoleCursors();

//                 console.log(`Cavo rimosso tra ${pointId} e ${holeId}`);
//             }
//         }
//     });
// });

// // Funzione per aggiornare il cursore sugli hole
// function updateHoleCursors() {
//     holes.forEach(hole => {
//         const holeId = hole.id;
//         if (connections[holeId] && connections[holeId].length > 0) {
//             hole.style.cursor = "pointer";  // Mostra il cursore pointer se c'è una connessione
//         } else {
//             hole.style.cursor = "default";  // Altrimenti, normale
//         }
//     });
// }

// // Funzione per disegnare il cavo (con dati extra per associarlo correttamente)
// function drawCable(point, hole) {
//     const svg = document.getElementById("cable-svg");
//     const pointRect = point.getBoundingClientRect();
//     const holeRect = hole.getBoundingClientRect();

//     // Calcola le coordinate relative al viewport
//     const x1 = pointRect.left + pointRect.width / 2 + window.scrollX;
//     const y1 = pointRect.top + pointRect.height / 2 + window.scrollY;
//     const x2 = holeRect.left + holeRect.width / 2 + window.scrollX;
//     const y2 = holeRect.top + holeRect.height / 2 + window.scrollY;

//     // Crea un nuovo cavo SVG
//     const cable = document.createElementNS("http://www.w3.org/2000/svg", "path");
//     cable.setAttribute("d", `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`);
//     cable.setAttribute("stroke", `#000`); // Nero
//     cable.setAttribute("stroke-width", "5");
//     cable.setAttribute("fill", "none");
//     cable.setAttribute("stroke-linecap", "round");

//     // Aggiungi attributi per identificare questo cavo
//     cable.setAttribute("data-hole-id", hole.id);
//     cable.setAttribute("data-point-id", point.id);

//     // Aggiungi il cavo allo SVG
//     svg.appendChild(cable);

//     // Aggiungi il cavo alle connessioni
//     if (!connections[hole.id]) {
//         connections[hole.id] = [];
//     }
//     if (!connections[hole.id].includes(point.id)) {
//         connections[hole.id].push(point.id);
//     }

//     // Mostra il cursore pointer sugli hole con connessioni
//     updateHoleCursors();
// }






const points = document.querySelectorAll(".point");
const holes = document.querySelectorAll(".hole");

const connections = {}; // Gestisce i collegamenti banda-effetto
let selectedPoint = null; // Punta selezionata (B1, B2, ecc.)
let selectedHole = null; // Hole selezionato per scollegare

// Gestione della selezione delle punte
points.forEach(point => {
    point.addEventListener("click", () => {
        // Se il selettore di punte è già attivo, cancella la selezione
        if (selectedPoint === point) {
            point.classList.remove("selected");
            selectedPoint = null;
            return;
        }

        // Se è già selezionato un punto, rimuovi la selezione
        points.forEach(p => p.classList.remove("selected"));
        point.classList.add("selected");
        selectedPoint = point; // Memorizza la punta selezionata

        holes.forEach(hole => {
            const holeId = hole.id;
            if (!connections[holeId] && selectedPoint!= null) {
                hole.style.cursor = "pointer";  // Mostra il cursore pointer se c'è una connessione
            }
        });
    });
});

// Gestione della selezione dell'hole per scollegare il cavo
holes.forEach(hole => {
    hole.addEventListener("click", () => {

        // Se c'è un punto selezionato
        if (selectedPoint) {
            const pointId = selectedPoint.id;
            const holeId = hole.id;

            // Salva il collegamento tra banda ed effetto
            if (!connections[holeId]) {
                connections[holeId] = [];
            }
            if (!connections[holeId].includes(pointId)) {
                connections[holeId].push(pointId);
                drawCable(selectedPoint, hole); // Disegna il cavo visivamente
                console.log(`${pointId} collegato a ${holeId}`);
            }

            selectedPoint.classList.remove("selected");
            selectedPoint = null; // Resetta la selezione
        } else if (connections[hole.id] && connections[hole.id].length > 0) {
            // Se c'è una connessione esistente per questo hole, permetti la rimozione
            selectedHole = hole;
            hole.classList.add("selected");
            console.log(`Hole selezionato per rimuovere il cavo: ${hole.id}`);
        }
    });
});

// Gestione della rimozione del cavo
points.forEach(point => {
    point.addEventListener("click", () => {
        if (selectedHole) {
            const holeId = selectedHole.id;
            const pointId = point.id;

            // Se il punto è collegato all'hole selezionato
            if (connections[holeId] && connections[holeId].includes(pointId)) {
                // Rimuovi il cavo SVG
                removeCable(holeId, pointId);

                // Rimuovi la connessione da 'connections'
                const index = connections[holeId].indexOf(pointId);
                if (index > -1) {
                    connections[holeId].splice(index, 1);
                }

                // Se non ci sono più connessioni per quell'hole, rimuovilo
                if (connections[holeId].length === 0) {
                    delete connections[holeId];
                }

                console.log(`Cavo rimosso tra ${pointId} e ${holeId}`);
            }

            // Resetta la selezione
            selectedHole.classList.remove("selected");
            selectedHole = null;
        }
    });
});

// Funzione per disegnare il cavo
function drawCable(point, hole) {
    const svg = document.getElementById("cable-svg");
    const pointRect = point.getBoundingClientRect();
    const holeRect = hole.getBoundingClientRect();

    // Calcola le coordinate
    const x1 = pointRect.left + pointRect.width / 2;
    const y1 = pointRect.top + pointRect.height / 2;
    const x2 = holeRect.left + holeRect.width / 2;
    const y2 = holeRect.top + holeRect.height / 2;

    // Crea un nuovo cavo SVG
    const cable = document.createElementNS("http://www.w3.org/2000/svg", "path");
    cable.setAttribute("d", `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`);
    cable.setAttribute("stroke", "#000"); // Nero
    cable.setAttribute("stroke-width", "5");
    cable.setAttribute("fill", "none");
    cable.setAttribute("stroke-linecap", "round");

    // Aggiungi identificatori per il cavo
    cable.setAttribute("data-hole-id", hole.id);
    cable.setAttribute("data-point-id", point.id);

    // Aggiungi il cavo allo SVG
    svg.appendChild(cable);
}

// Funzione per rimuovere il cavo
function removeCable(holeId, pointId) {
    const cables = document.querySelectorAll(`#cable-svg path`);
    cables.forEach(cable => {
        // Verifica se il cavo è collegato a questa banda e hole
        if (cable.getAttribute("data-hole-id") === holeId && cable.getAttribute("data-point-id") === pointId) {
            cable.remove(); // Rimuovi il cavo
        }
    });
}

// Funzione per aggiornare il cursore sugli hole
function updateHoleCursors() {
    holes.forEach(hole => {
        const holeId = hole.id;
        if (connections[holeId] && connections[holeId].length > 0) {
            hole.style.cursor = "pointer";  // Mostra il cursore pointer se c'è una connessione
        } else {
            hole.style.cursor = "default";  // Altrimenti, normale
        }
    });
}





// DA FIXARE
// -> Il video si ferma quando mi sposto da un pad all'altro con la tastiera (non dovrebbe)
// -> Il video si ferma quando muovo il knob0 (in setAngle dovrei fare l'update della videoPosition prima di fare startFrameLoop solo una volta aver smesso di muovere il knob0 -> stopDrag)
// -> Quando esco dalla perfermance mode activeLamp è uguale a 6 ma dovrebbe mantenere l'ultimo lamp attivo della editMode

// DA IMPLEMENTARE
// -> Estrazione di feature (RMS su almeno tre bande: basse, medie e alte) da traccia/ingresso audio
// -> Effetti come: 
//    - Distorsione dinamica immagine
//    - LFO da mappare su un parametro
//    - Effetti di colore
//    - Effetti di overlay
//    - Moltiplicazione di video
// -> Possibilità di modificare la curva di velocità dell'oversampling e del downsampling
// -> Video buffering
// -> Pitch Bend per cambiare la distorsione del video in tempo reale (?)
// -> Mod Wheel (?) per qualcosa

    // AGGIUNTIVI
    // -> Tutta la parte più "grafica" come: 
    //    - Cambiare il colore dei pad
    //    - Effetto di inserimento del dvd/cassetta all'interno della TV al posto del caricamento del video
    //    - Effetto di caricamento del video (televisione grigia in movimento -> video)
    // -> Riordinare il codice in modo più pulito
