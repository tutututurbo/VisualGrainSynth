document.addEventListener('DOMContentLoaded', function() {
  
    //--------------------- VIDEO -------------------------
    const $input = document.querySelector('.box__file');
    let videoElement = document.getElementById('videoElement');
    let videoPosition = 0; // Frame of the current video position for each grain
    
    // Retrieve the stored frameIndexMax value, or default to 0
    let frameIndexMax = parseInt(localStorage.getItem('frameIndexMax')) || 0;

    document.getElementById('uploadButton').addEventListener('click', function() {
        const videoInput = document.getElementById('videoInput');
        const file = videoInput.files[0];
    
        if (!file) {
            alert('Please select a video file first.');
            return;
        }
    
        const formData = new FormData();
        formData.append('video', file);
 
        // Heroku server: 'https://visualgrainsynth-77df4d6f539a.herokuapp.com/upload-video'
        fetch('http://localhost:5001/upload-video', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            frameIndexMax = parseInt(data.message);
            
            // Save frameIndexMax to localStorage
            localStorage.setItem('frameIndexMax', frameIndexMax);
            
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Errore nella comunicazione con il server');
        });
    });
    
    // Funzione per aggiornare il frame in base all'angolo del knob
    function updateFrameFromKnob(degrees) {   
        videoPosition = Math.floor((degrees / maxangle) * (frameIndexMax - 1));  // Calcola il frameIndex usando la proporzione      
        // Imposta il percorso dell'immagine corrispondente al frame
        if (activeElement == null){
            document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`;
        }
    }
    
    // Funzione per gestire l'aggiornamento del knob (simulazione dell'input)
    // document.getElementById("knob1").addEventListener("mousedown", function(event) {
    //     // Supponendo che l'angolo sia in gradi da 0 a 270
    //     updateFrameFromKnob(angles[0]); // Aggiorna il frame corrispondente
    // })
    
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
    

    // Function to load angles when activating a lamp
    function loadLampAngles(lampIndex, currentKnob) {
        angles[0] = anglesStart[lampIndex];
        angles[1] = anglesEnd[lampIndex];
        lastAngle = angles[currentKnob]; // Reset lastAngle to current lamp's angle to prevent carryover
    }


    // Function to move the knob
    function moveKnob(knobIndex, newAngle) {
        if (newAngle >= minangle && newAngle <= maxangle) {
            angles[knobIndex] = newAngle;
            setAngle(knobIndex, newAngle);
        }
    }
    
    function calculateRotationAngle(angle) {
        return angle * 270 / maxangle;
    }

    // Set angle and update corresponding value
    function setAngle(knobIndex, angle) {
        var knob = knobs[knobIndex];
        knob.style.transform = 'rotate(' + calculateRotationAngle(angle) + 'deg)';
        
        if(knobIndex === 0 && editModeActive){
 
            const lamps1 = document.querySelectorAll('.lamp');
            if(activeLamp[0] === 6){
                anglesStart[6] = angles[0]; 
                lampPosition[6] = (angles[0] / maxangle) * maxPosition;
                updateLampPosition(0, lampPosition[6]);
                videoPosition = parseInt((lampPosition[6]) / maxPosition * frameIndexMax, 10);
            } else {
                
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


        }  else {

            // Qui non siamo più in edit mode: il knob ora sarà assegnato all'effetto speciale live

        }    
    }

    function updateLampPosition(index, newLeft) {
        const container = document.querySelectorAll('.movementContainer')[index];
        container.style.left = `${newLeft}px`;
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
            loadLampAngles(activeLamp[0], currentKnob);

            if (index === 1 && editModeActive) {
                updateGrainLengthFromKnob(angles[1]);
            }

            updateFrameFromKnob(angles[0]);
            document.addEventListener('mousemove', onDrag);

            document.addEventListener('mouseup', stopDrag);

            e.preventDefault();
        });
    });


    
    let grainLength = new Array(7).fill(0); // Number of frames to play for each pad button
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
        if (activeLamp[0] !== 6) {
            const activeIndex = activeLamp[0];
            windows[activeIndex].style.display = 'block'; // Show the relevant window
        } else {
            manualWindow.style.display = 'block'; // Show manual window if no lamps are active

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
            if(editModeActive){
            if (currentKnob === 0 ) {
                updateFrameFromKnob(angles[0]);
            }else if(currentKnob === 1){
                document.getElementById("video_frame").src = `/frames/frame_${videoPosition + grainLength[index]}.jpg`;  
            }
            updateGrainLengthFromKnob(angles[1]);
          }

    }
    }
    
    // Stop dragging
    function stopDrag() {
        isDragging = false;
        if (grainPixels > (maxPosition-lampPosition[index])) {
            grainPixels = maxPosition-lampPosition[index];
            grainLength[index] = Math.floor((grainPixels / maxPosition) * frameIndexMax);

        }


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
    const lampElements = document.querySelectorAll('.lamp, .button'); 
    switchElement.classList.toggle('off');
    led.classList.toggle('off');
    editModeActive = !editModeActive; // Inverti lo stato di editModeActive
    deactivateAllPads();
  
    if (!editModeActive) {
               
        lampElements.forEach(element => {
            element.style.display = 'none';
        });
        
        } else {
       
        lampElements.forEach(element => {
            element.style.display = 'flex';
      
        });

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
    let padManual = document.getElementById('padManual');  // Seleziona pad7, il pad che attiva la modalità manuale
    
    
    let frameInterval; // Variabile per tenere traccia dell'interval
    let isLooping = false; // Flag per sapere se il loop è in esecuzione
    
    document.querySelectorAll(".pad").forEach(function (pad, index) {
        pad.addEventListener("click", function () {

            deactivateAllPads();

            if (editModeActive) {
                if (activeElement !== pad) {
                    if (activeElement) {
                        activeElement.classList.remove('active');
                        activeElement = null;
                    }

                    midiConnectionFunction(pad);   
                }     
                          
            } else {

                videoPosition = parseInt((lampPosition[index]) / maxPosition * frameIndexMax, 10);
                currentGrainLength = Math.max(1, grainLength[index]); // Assicurati che grainLength sia almeno 1
                
                // Avvia il loop dei frame
                startFrameLoop(videoPosition, currentGrainLength);

                // Aggiorna la classe 'active' per gestire la selezione di un solo pad
                if (activeElement) {
                    activeElement.classList.remove('active');
                }
           
            }

         
                pad.classList.add('active');
                
        
            
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
            stopFrameLoop(); // Ferma il loop quando tutti i pad vengono disattivati
    }
    


    
    //---------------- LAMPS AND INDICATORS -------------------
    // Seleziona tutti i bottoni, i lamp e le small_line
    const lampButtons = document.querySelectorAll('.button');
    const lamps = document.querySelectorAll('.lamp');
    const movablePoint = document.querySelectorAll('.movablePoint');
    const midiToggle = document.querySelector('.midiToggle');
    let activeLamp = [6];  // Array che tiene traccia dell'indice del lamp attivo

    
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
  
        lampPosition[activeLamp[0]] = Math.max(0, Math.min(x, previewDisplay.offsetWidth - line.offsetWidth));
        anglesStart[activeLamp[0]] =  lampPosition[activeLamp[0]] * maxangle / maxPosition;
        
        document.querySelectorAll('.movementContainer')[0].style.left = lampPosition[activeLamp[0]] + 'px';
        videoPosition = parseInt((lampPosition[activeLamp[0]]) / maxPosition * frameIndexMax, 10);  
        if(editModeActive){
        knobs[0].style.transform = 'rotate(' + calculateRotationAngle(anglesStart[activeLamp[0]]) + 'deg)';
     
        document.getElementById("video_frame").src = `/frames/frame_${videoPosition}.jpg`; 
        }
        if (!editModeActive && padManual.classList.contains('active')) {
            startFrameLoop(videoPosition, currentGrainLength);

        }     
    });
    



    //---------------- MIDI -------------------

  

    let midi = null; // Global MIDIAccess object
    let midiMappings = {}; // Mapping between MIDI notes and pads
    let awaitingMIDIInput = false; // Flag to track if waiting for MIDI mapping
    let currentPadForMapping = null; // Stores the pad being mapped

    
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
    
    // Function to handle incoming MIDI messages
    function onMIDIMessage(event) {
        let midiStatus = event.data[0];
        let midiNote = event.data[1];
        if (editModeActive) {
            // If waiting for a MIDI input to map
            if (awaitingMIDIInput && currentPadForMapping && midiStatus === 144) {
                console.log(`Mapping pad to MIDI note ${midiNote}`);
                midiMappings[midiNote] = currentPadForMapping; // Map MIDI note to the pad  
                
                alert(`MIDI note ${midiNote} successfully mapped to the pad!`);
                awaitingMIDIInput = false;
                currentPadForMapping.classList.remove('active');   
                currentPadForMapping = null;
            }   


        } else {
    
        // Trigger the mapped pad if the MIDI note matches
            if (midiMappings[midiNote]) {
                let pad = midiMappings[midiNote];
                pad.click(); // Simulate a click on the mapped pad
                // deactivateAllPads();  
                
            }

        }
    }
    
    
    // Function to start logging MIDI inputs and set up listeners
    function startLoggingMIDIInput(midiAccess) {
        
        midiAccess.inputs.forEach((input) => {
            console.log(`Listening to MIDI input: ${input.name}`);
            input.onmidimessage = onMIDIMessage; // Assign message handler
        });
    }
    
    // Request MIDI access and set up message handling
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

        // Funzione per avviare la mappatura MIDI
    function midiConnectionFunction(pad) {
        alert("Premi una nota sulla tastiera MIDI per mappare questo pad.");
            awaitingMIDIInput = true;  // Imposta lo stato di attesa di input MIDI            
            currentPadForMapping = pad; // Memorizza il pad da mappare
         
        }



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
    

    });