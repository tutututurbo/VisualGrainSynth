document.addEventListener('DOMContentLoaded', function() {
  
    //--------------------- VIDEO -------------------------
    const $input = document.querySelector('.box__file');
    let videoElement = document.getElementById('videoElement');
    let frameIndexMax = 0;
    let videoPosition = 0; // Frame of the current video position
    
    document.getElementById('uploadButton').addEventListener('click', function() {
        const videoInput = document.getElementById('videoInput');
        const file = videoInput.files[0];
    
        if (!file) {
            alert('Please select a video file first.');
            return;
        }
    
        const formData = new FormData();
        formData.append('video', file);
    
        fetch('http://localhost:5001/upload-video', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            frameIndexMax = parseInt(data.message);
            alert(frameIndexMax);
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore nella comunicazione con il server');
        });
    });
    
    // //SPACEBAR TO START/PAUSE VIDEO
    // document.addEventListener('keydown', function(event) {
    //     if (event.code === 'Space' && videoElement) {
    //         event.preventDefault();
    //         if (videoElement.paused) {
    //             videoElement.play();
    //         } else {
    //             videoElement.pause();
    //         }
    //     }
    // });
    
    // Funzione per aggiornare il frame in base all'angolo del knob
    function updateFrameFromKnob(degrees) {   
        videoPosition = Math.floor((degrees / maxangle) * (frameIndexMax - 1));  // Calcola il frameIndex usando la proporzione      
        // Imposta il percorso dell'immagine corrispondente al frame
        if (activeElement == null){
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`;
        }
    }
    
    // Funzione per gestire l'aggiornamento del knob (simulazione dell'input)
    document.getElementById("knob1").addEventListener("mousedown", function(event) {
        // Supponendo che l'angolo sia in gradi da 0 a 270
        updateFrameFromKnob(angles[0]); // Aggiorna il frame corrispondente
    })
    
    // --------------------- KNOBS ---------------------------
    var knobs = document.getElementsByClassName('knob');
    var angles = [0, 0]; // Store angles for each knob
    var minangle = 0;
    var maxangle = 270;
    var isDragging = false;
    var currentKnob = null;
    var lastY = 0; // Track the last Y position
    var lastAngle = 0; // Keep track of the last angle
    const maxPosition = 500; // Length in pixel of the previewDisplay

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
        
        if(knobIndex === 0 && editModeActive){
 
            const lamps1 = document.querySelectorAll('.lamp');
            if(activeLamp.length==0){
    
                lampPosition[6] = (angles[0] / 270) * maxPosition;
                line.style.left = lampPosition[6] + 'px';
                videoPosition = parseInt((lampPosition[6])/500 * frameIndexMax, 10);
            }else{
                
                lamps1.forEach((lamp, index) => {
                    
                    if (lamps1[index].classList.contains('on')) {
                            // Mappa l'angolo da 0 a 270 gradi a una posizione orizzontale da 0px a 500px
                   
                            lampPosition[index] = (angles[0] / 270) * maxPosition; // Calcola la posizione orizzontale
        
                            // Trova la small_line e aggiorna la sua posizione
                            const smallLine = document.querySelectorAll('.small_line'); // Assicurati che la classe sia corretta
                        if (smallLine[index]) {
                            smallLine[index].style.left = lampPosition[index] + 'px'; // Imposta la posizione orizzontale
                        }         
                    } 
                });
            }


        }  else {

            // Qui non siamo più in edit mode: il knob ora sarà assegnato all'effetto speciale live

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
            updateFrameFromKnob(angles[0]);
            if (index === 1 && activeLamp.length > 0) {
                updateGrainLengthFromKnob(angles[1]);
            }
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            e.preventDefault();
        });
    });


    
    let grainLength = new Array(7).fill(0); // Number of frames to play for each pad button

    // Funzione per aggiornare la lunghezza del grain basata sull'angolo del knob2
    function updateGrainLengthFromKnob(angle) {

        const maxLength = 500 - lampPosition[activeLamp]; // Intervallo fino a 500px
        const grainPixels = (angle / 270) * maxLength; // Mappa l'angolo di knob2 nell'intervallo in pixel

        // Mappa i pixel sui frame totali del video
        grainLength[activeLamp] = Math.floor((grainPixels / 500) * frameIndexMax);
        console.log(`Grain length in frames for active lamp ${activeLamp}:`, grainLength[activeLamp]);
        if (activeElement == null){
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition + grainLength[activeLamp]}.jpg`;
        }
    }
    
    // Handle dragging
    function onDrag(e) {
        if (isDragging && currentKnob !== null)  {
            var newAngle = calculateAngleDelta(lastY, e.pageY, lastAngle);
            moveKnob(currentKnob, newAngle);
            lastY = e.pageY; // Update last Y position
            lastAngle = newAngle; // Update the angle for continuous movement
            // Aggiorna il frame o il grain durante il drag
            if (currentKnob === 0) {
                updateFrameFromKnob(angles[0]);
            } else if (currentKnob === 1) {
                updateGrainLengthFromKnob(angles[1]);
            }
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
    

    // --------------------- SWITCH ------------------

    let editModeActive = true; 
   
     // Funzione per gestire l'accensione e lo spegnimento della levetta e del LED
     function toggleSwitch() {
        const switchElement = document.getElementById('editMode');
        const led = document.getElementById('led');
        switchElement.classList.toggle('off');
        led.classList.toggle('off');
        editModeActive = !editModeActive; // Inverti lo stato di editModeActive
        deactivateAllPads();



    
    if (!editModeActive) {
        // Rimuovi tutti i lampButton dal DOM e li memorizza per il ripristino
        // lampButtons.forEach(button => {
        //     button.remove();
        // });
        // lamps.forEach(button => {
        //     button.remove();
        // });


    } else {
        // Reinserisce tutti i lampButton nel loro contenitore originale
        // lampButtons.forEach(button => {
       
        //     document.getElementsByClassName("row button-row").appendChild(button);
        // });
        //   lamps.forEach(button => {
        //     document.getElementsByClassName("row lamp-row").appendChild(button);
        // });



    }
  
    }


    // Aggiunge un evento per ascoltare la pressione del tasto "E"
    document.addEventListener('keydown', function(event) {
        if (event.key === 'e' || event.key === 'E') { // Verifica se il tasto è "E" o "e"
            toggleSwitch();
        }
    });
    // Funzione per gestire l'accensione e lo spegnimento di un interruttore

    document.getElementById('editMode').addEventListener('click', function() {
        toggleSwitch(this);
    });

    
    //---------------- PAD BUTTONS -------------------
    // Funzione per cambiare il colore di sfondo a rosso acceso
    let activeElement = null;  // Variabile per tenere traccia dell'elemento attivo
    let mapActive = false; // Stato di pad8 (Map pad)
    let pad8 = document.getElementById('pad8');  // Seleziona pad8, il pad che mappa i tasti MIDI
    let padManual = document.getElementById('padManual');  // Seleziona pad7, il pad che attiva la modalità manuale
    
    
    let frameInterval; // Variabile per tenere traccia dell'interval
    let isLooping = false; // Flag per sapere se il loop è in esecuzione
    
    document.querySelectorAll(".pad").forEach(function (pad, index) {
        pad.addEventListener("click", function () {

            deactivateAllPads();
            // Quando viene cliccato pad8, attiva/disattiva la modalità mappatura MIDI
            if (editModeActive) {
                if (activeElement !== pad) {
                    if (activeElement && activeElement !== pad8) {
                        activeElement.classList.remove('active');
                    }
                    midiConnectionFunction(pad);
                }
                } else {
                    videoPosition = parseInt((lampPosition[index]) / 500 * frameIndexMax, 10);
                    currentGrainLength = Math.max(1, grainLength[index]); // Assicurati che grainLength sia almeno 1
                    
                    // Avvia il loop dei frame
                    startFrameLoop(videoPosition, currentGrainLength);
    
                    // Aggiorna la classe 'active' per gestire la selezione di un solo pad
                    if (activeElement) {
                        activeElement.classList.remove('active');
                    }
                   
              
                }
                pad.classList.add('active');
                activeElement = pad;
        
            
        });
    });
    
    // Funzione per avviare il ciclo dei frame
    function startFrameLoop(startFrame, grainLength) {
        if (isLooping) {
            clearInterval(frameInterval); // Cancella l'eventuale loop precedente
        }
    
        let currentFrame = startFrame; // Imposta il frame iniziale
        isLooping = true; // Indica che il loop è attivo
    
        frameInterval = setInterval(() => {
            // Aggiorna il frame dell'immagine
            document.getElementById("video_frame").src = `/frames/frame_${currentFrame}.jpg`;
            
            // Incrementa il frame corrente e ricomincia se ha raggiunto il limite del grain
            currentFrame++;
            if (currentFrame >= startFrame + grainLength) {
                currentFrame = startFrame; // Ritorna al primo frame del grain
            }
        }, 1); // Intervallo in millisecondi (puoi regolarlo per la velocità di visualizzazione)
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
     
            activeElement = null;
            stopFrameLoop(); // Ferma il loop quando tutti i pad vengono disattivati
    
    }
    
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
    let activeLamp = [];  // Array che tiene traccia dell'indice del lamp attivo

    
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

            // Mostra il movablePoint corrispondente
            movablePoint[index].style.visibility = 'visible';

            console.log('Active lamps:', activeLamp); // Visualizza l'array activeLamps per il debug
        }
        });
        
    });
    
    // Map the position of the 7 indicators on the preview display
    let lampPosition = new Array(7).fill(0);
    const previewDisplay = document.getElementById('preview_display');
    const line = document.querySelector('.line');
    previewDisplay.addEventListener('click', function (event) {
        const rect = previewDisplay.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        lampPosition[6] = Math.max(0, Math.min(x, previewDisplay.offsetWidth - line.offsetWidth));
        
        line.style.left = lampPosition[6] + 'px';
        
        videoPosition = parseInt((lampPosition[6])/500 * frameIndexMax, 10);  
        document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`; 
        if (!editModeActive && padManual.classList.contains('active')) {
           startFrameLoop(videoPosition, currentGrainLength);
        }     
    });
    

    //---------------- MIDI -------------------
    let midiConnectionCounter = true;
    navigator.permissions.query({ name: "midi", sysex: true }).then((result) => {
        if (result.state === "granted" && midiConnectionCounter) {
          //  alert('MIDI Connection Allowed');
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
       // listInputsAndOutputs(midiAccess); // Optional: If you want to list inputs/outputs
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
    
