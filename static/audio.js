// Function to list available audio input devices
async function listAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === "audioinput");
    console.log("Available audio input devices:");
    audioDevices.forEach((device, index) => {
        console.log(`${index + 1}: ${device.label || 'Unnamed Device'} (ID: ${device.deviceId})`);
    });
}
listAudioDevices();


// SPECTRUM DRAW

// async function captureFromBlackHole(deviceId) {
//     try {
//         const constraints = {
//             audio: { deviceId: { exact: deviceId } } // Use the BlackHole device ID
//         };
//         const stream = await navigator.mediaDevices.getUserMedia(constraints);

//         const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//         const source = audioContext.createMediaStreamSource(stream);

//         const analyser = audioContext.createAnalyser();
//         analyser.fftSize = 2048 * 4; // Size of the FFT (frequency bins)

//         const dataArray = new Uint8Array(analyser.frequencyBinCount); // Array to store frequency data
//         source.connect(analyser);

//         // Access the new canvas for drawing
//         const canvas = document.getElementById('spectrum-canvas');
//         const canvasCtx = canvas.getContext('2d');
//         canvas.width = 770; // Set canvas width
//         canvas.height = 100; // Set canvas height

        
//         // Function to calculate RMS for a frequency band
//         function calculateRMSForBands() {
//             analyser.getByteFrequencyData(dataArray);

//             const nyquist = audioContext.sampleRate / 2;
//             const numBins = dataArray.length;

//             // Map frequency ranges to bin indices
//             const bandIndices = {
//                 subBass: { start: Math.floor((20 / nyquist) * numBins), end: Math.ceil((60 / nyquist) * numBins) },
//                 lowBass: { start: Math.floor((60 / nyquist) * numBins), end: Math.ceil((100 / nyquist) * numBins) },
//                 bass: { start: Math.floor((100 / nyquist) * numBins), end: Math.ceil((300 / nyquist) * numBins) },
//                 mid: { start: Math.floor((300 / nyquist) * numBins), end: Math.ceil((2000 / nyquist) * numBins) },
//                 high: { start: Math.floor((2000 / nyquist) * numBins), end: Math.ceil((20000 / nyquist) * numBins) },
//             };

//             // Helper to calculate RMS for a given band
//             function calculateRMS(startIndex, endIndex) {
//                 let sum = 0;
//                 const count = endIndex - startIndex;
//                 for (let i = startIndex; i < endIndex; i++) {
//                     sum += Math.pow(dataArray[i] / 255, 2); // Normalize dataArray[i] to [0, 1] and square it
//                 }
//                 return Math.sqrt(sum / count);
//             }

//             // Calculate RMS for each band
//             const subBassRMS = calculateRMS(bandIndices.subBass.start, bandIndices.subBass.end);
//             const lowBassRMS = calculateRMS(bandIndices.lowBass.start, bandIndices.lowBass.end);
//             const bassRMS = calculateRMS(bandIndices.bass.start, bandIndices.bass.end);
//             const midRMS = calculateRMS(bandIndices.mid.start, bandIndices.mid.end);
//             const highRMS = calculateRMS(bandIndices.high.start, bandIndices.high.end);

//             // Log RMS values
//             //console.log(`Sub Bass RMS: ${subBassRMS.toFixed(3)}, Bass RMS: ${bassRMS.toFixed(3)}, Mid RMS: ${midRMS.toFixed(3)}, High RMS: ${highRMS.toFixed(3)}`);

//             if(autoModeActive) {
//                 if(lowBassRMS >= 0.6 && subBassRMS >= 0.6 && bassRMS>=0.6) {
//                     document.getElementById("video_frame").style.filter = `
//                     invert(${Math.round(lowBassRMS * 110)}%)
//                     hue-rotate(${Math.round(midRMS * 100 * 3)}deg)
//                     saturate(${Math.round(subBassRMS * 100 * 40)}%)

//                 `;
//                 }
//                 else{
//                     document.getElementById("video_frame").style.filter = `
//                     hue-rotate(${Math.round(midRMS * 100 * 3)}deg)
//                     saturate(${Math.round(subBassRMS * 100 * 40)}%)
//                 `;
//                 }
                
//             }
//         }

//         function draw() {
//             requestAnimationFrame(draw);
        
//             analyser.getByteFrequencyData(dataArray);
        
//             // Clear canvas
//             canvasCtx.fillStyle = 'rgb(0, 0, 0)';
//             canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
//             // Draw frequency bars
//             const barWidth = (canvas.width / dataArray.length) * 4;
//             let barHeight;
//             const nyquisti = audioContext.sampleRate / 2;
//             let x = 0;
            
//             // Draw frequency bars logarithmically
//             let logX = 0; // Starting x position for logarithmic bar drawing
//             for (let i = 0; i < dataArray.length; i++) {
//                 const frequency = (i / dataArray.length) * nyquisti; // Frequency for current bin
//                 const logPosition = Math.log10(frequency / 10) / Math.log10(nyquisti / 10); // Logarithmic scaling
//                 const xPosition = Math.round(logPosition * canvas.width); // Map log scale to canvas width

//                 // Set bar height based on frequency data
//                 barHeight = dataArray[i];

//                 // Calculate width dynamically based on the gap between this bin and the next
//                 const nextFrequency = ((i + 1) / dataArray.length) * nyquisti;
//                 const nextLogPosition = Math.log10(nextFrequency / 10) / Math.log10(nyquisti / 10);
//                 const nextXPosition = Math.round(nextLogPosition * canvas.width);

//                 const logBarWidth = Math.max(1, 4); // Avoid zero-width bars

//                 // Draw the bar
//                 canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`; // Set bar color
//                 canvasCtx.fillRect(xPosition, canvas.height - barHeight/3, logBarWidth, barHeight / 2);

//                 logX = nextXPosition;
//             }

        
//             // Frequency band labels
//             const nyquist = audioContext.sampleRate / 2; // Nyquist frequency
//             const bandFrequencies = [20, 60, 100, 300, 2000, 20000]; // Frequency boundaries
//             const numBins = dataArray.length;
        
//             // Draw frequency labels logarithmically
//             canvasCtx.fillStyle = 'rgb(255, 215, 0)'; // Gold color for text
//             canvasCtx.font = '12px Arial'; // Font size and type
//             canvasCtx.textAlign = 'center'; // Center the text
//             canvasCtx.textBaseline = 'top'; // Position text above x-axis
        
//             bandFrequencies.forEach(freq => {
//                 // Calculate logarithmic position
//                 const logPosition = Math.log10(freq / bandFrequencies[0]) / Math.log10(bandFrequencies[bandFrequencies.length - 1] / bandFrequencies[0]);
//                 const xPosition = logPosition * canvas.width; // Map log scale to canvas width
//                 xBands[freq] = xPosition;
//                 canvasCtx.fillText(`${freq} Hz`, xPosition , canvas.height - 15); // Draw label
                
//                 // Debugging: Draw vertical lines at frequency positions
//                 canvasCtx.strokeStyle = 'white';
//                 canvasCtx.beginPath();
//                 canvasCtx.moveTo(xPosition, 0);
//                 canvasCtx.lineTo(xPosition, canvas.height);
//                 canvasCtx.stroke();               
//             });


        
//             // Calculate and log RMS values for each band
//             calculateRMSForBands();
//         }
        
        

//         draw(); // Start the visualization loop

//         console.log("Successfully capturing audio from BlackHole");
//     } catch (err) {
//         console.error("Error accessing audio:", err);
//         if (err.name === "OverconstrainedError") {
//             console.error("The requested device ID is not available or valid.");
//         }
//     }
// }

// RMS DRAW

async function captureFromBlackHole(deviceId) {
    try {
        const constraints = {
            audio: { deviceId: { exact: deviceId } } // Use the BlackHole device ID
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048 * 4; // Size of the FFT (frequency bins)

        const dataArray = new Uint8Array(analyser.frequencyBinCount); // Array to store frequency data
        source.connect(analyser);

        // Access the new canvas for drawing
        const canvas = document.getElementById('spectrum-canvas');
        const canvasCtx = canvas.getContext('2d');
        canvas.width = 770; // Set canvas width
        canvas.height = 100; // Set canvas height       

        // Function to calculate RMS for a frequency band
        function calculateRMSForBands() {
            analyser.getByteFrequencyData(dataArray);

            const nyquist = audioContext.sampleRate / 2;
            const numBins = dataArray.length;

            // Map frequency ranges to bin indices
            const bandIndices = {
                subBass: { start: Math.floor((20 / nyquist) * numBins), end: Math.ceil((xBands[0] / nyquist) * numBins) },
                lowBass: { start: Math.floor((xBands[0] / nyquist) * numBins), end: Math.ceil((xBands[1] / nyquist) * numBins) },
                bass: { start: Math.floor((xBands[1] / nyquist) * numBins), end: Math.ceil((xBands[2] / nyquist) * numBins) },
                mid: { start: Math.floor((xBands[2] / nyquist) * numBins), end: Math.ceil((xBands[3] / nyquist) * numBins) },
                high: { start: Math.floor((xBands[3] / nyquist) * numBins), end: Math.ceil((20000 / nyquist) * numBins) },
            };

            // Helper to calculate RMS for a given band
            function calculateRMS(startFreq, endFreq) {
                const startIndex = Math.floor((startFreq / nyquist) * dataArray.length);
                const endIndex = Math.ceil((endFreq / nyquist) * dataArray.length);
                
                let sum = 0;
                let count = 0;
        
                for (let i = startIndex; i < endIndex; i++) {
                    sum += Math.pow(dataArray[i] / 255, 2); // Normalizza i valori e calcola il quadrato
                    count++;
                }
        
                const rmsValue = count > 0 ? Math.sqrt(sum / count) : 0;
                return Math.min(canvas.height, rmsValue * canvas.height); // Normalizza a `canvas.height`
            }

            // Calculate RMS for each band
            const subBassRMS = calculateRMS(20, xBands[0]);
            const lowBassRMS = calculateRMS(xBands[0], xBands[1]);
            const bassRMS = calculateRMS(xBands[1], xBands[2]);
            const midRMS = calculateRMS(xBands[2], xBands[3]);
            const highRMS = calculateRMS(xBands[3], 20000);


// ------------------------------- NUOVA LOGICA DI LINK BANDA / EFFETTO -------------------------------------           
            // Valori RMS per banda in un array per semplificazione
            // Calcola i valori RMS per le bande
            const rmsValues = [subBassRMS, lowBassRMS, bassRMS, midRMS, highRMS];
            

            // Inizializza i valori degli effetti
            let grayscaleValue = 0;
            let invertValue = 0;
            let hueRotateValue = 0;
            let saturateValue = 0;

            // Itera su tutti gli effetti in `connections`
            for (const [effect, bands] of Object.entries(connections)) {
                let maxIntensity = 0; // Per memorizzare il massimo tra le bande collegate

                // Itera sulle bande collegate all'effetto corrente
                bands.forEach(band => {
                    const bandIndex = parseInt(band.replace('B', '')) - 1; // "B1" -> 0, "B2" -> 1, ...
                    const thresholdValue = 100 - threshold[bandIndex];
                    const rmsValue = rmsValues[bandIndex];
                    const ratioValue = ratios[bandIndex];
                    
                    // Calcola l'intensità per questa banda
                    const intensity = Math.max(0, (rmsValue - thresholdValue) * ratioValue);

                    // Aggiorna il massimo
                    maxIntensity = Math.max(maxIntensity, intensity);

                    console.log(`Effect: ${effect}, Band: ${band}, RMS: ${rmsValue}, Threshold: ${thresholdValue}, Ratio: ${ratioValue}, Intensity: ${intensity}`);
                });

                // Applica il massimo all'effetto corrispondente
                switch (effect) {
                    case "FX1": // Grayscale
                        grayscaleValue = Math.min(maxIntensity, 100); // Limita al 100%
                        break;
                    case "FX2": // Invert
                        invertValue = Math.min(maxIntensity, 100); // Limita al 100%
                        break;
                    case "FX3": // Hue Rotate
                        hueRotateValue = maxIntensity * 5; // Valore in gradi
                        break;
                    case "FX4": // Saturate
                        saturateValue = Math.min(maxIntensity * 30, 200); // Limita al 200%
                        break;
                }
            }


            if(autoModeActive) {
                // Applica gli effetti al video
                videoDiv.style.filter = `
                    grayscale(${grayscaleValue}%)
                    invert(${invertValue*5}%)
                    hue-rotate(${hueRotateValue}deg)
                    saturate(${saturateValue + 100}%)
                `;

                if (newWindow && !newWindow.closed) {
                        newWindow.document.getElementById("dynamicDiv").src = videoDiv.src;
                        newWindow.document.getElementById("dynamicDiv").style.filter = videoDiv.style.filter;
                    }

                // if(lowBassRMS >= 100-threshold[1] ) {
                //     videoDiv.style.filter = `
                //     grayscale(${Math.min(0, 0)}%)
                //     invert(${Math.min(Math.round((lowBassRMS - (100-threshold[1])) * 10), 100)}%)
                //     hue-rotate(${Math.round(midRMS * 5)}deg)
                //     saturate(${Math.min(Math.round(subBassRMS) * 30, 200)}%)
                // `;


                // if (newWindow && !newWindow.closed) {
                //     newWindow.document.getElementById("dynamicDiv").src = videoDiv.src;
                //     newWindow.document.getElementById("dynamicDiv").style.filter = videoDiv.style.filter;
                // }
     
                // }
                // else{
                //     document.getElementById("video_frame").style.filter = `
                //     hue-rotate(${Math.round(midRMS* 5)}deg)
                //     saturate(${Math.min(Math.round(subBassRMS)*30, 200)}%)
                // `;
                // }
                
            }
        }

        function draw() {
            requestAnimationFrame(draw);
        
            analyser.getByteFrequencyData(dataArray);
        
            // Clear canvas
            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        
            // Frequenza di Nyquist
            const nyquist = audioContext.sampleRate / 2;
        
            // Mappa le bande alle loro posizioni sull'asse x
            const bandFrequencies = [20, xBands[0], xBands[1], xBands[2], xBands[3], 20000]; // Frequenze dei limiti delle bande
            const bandXPositions = bandFrequencies.map(freq => {
                const logPosition = Math.log10(freq / bandFrequencies[0]) / Math.log10(bandFrequencies[bandFrequencies.length - 1] / bandFrequencies[0]);
                return Math.round(logPosition * canvas.width); // Converte in posizione X sul canvas
            });


            // Funzione per calcolare gli RMS normalizzati
            function calculateNormalizedRMS(startFreq, endFreq) {
                const startIndex = Math.floor((startFreq / nyquist) * dataArray.length);
                const endIndex = Math.ceil((endFreq / nyquist) * dataArray.length);
                
                let sum = 0;
                let count = 0;
        
                for (let i = startIndex; i < endIndex; i++) {
                    sum += Math.pow(dataArray[i] / 255, 2); // Normalizza i valori e calcola il quadrato
                    count++;
                }
        
                const rmsValue = count > 0 ? Math.sqrt(sum / count) : 0;
                return Math.min(canvas.height, rmsValue * canvas.height); // Normalizza a `canvas.height`
            }
        
            // Disegna le barre RMS per ciascuna banda
            const bandRMS = [
                calculateNormalizedRMS(20, xBands[0]),
                calculateNormalizedRMS(xBands[0], xBands[1]),
                calculateNormalizedRMS(xBands[1], xBands[2]),
                calculateNormalizedRMS(xBands[2], xBands[3]),
                calculateNormalizedRMS(xBands[3], 20000),
            ];
        
            bandRMS.forEach((rmsValue, index) => {
                const xStart = bandXPositions[index];
                const xEnd = bandXPositions[index + 1] || canvas.width; // Se ultima banda, usa la fine del canvas
                const bandWidth = xEnd - xStart;
        
                // Disegna barra normalizzata
                const barHeight = rmsValue; // L'RMS è già normalizzato tra 0 e canvas.height
                canvasCtx.fillStyle = `rgba(${240 - barHeight / 1.5}, ${50 + barHeight}, 100, 0.8)`; // Colore dinamico
                canvasCtx.fillRect(xStart, canvas.height - barHeight, bandWidth, barHeight);
            });
        
            // Disegna le etichette per le bande di frequenza
            canvasCtx.fillStyle = 'rgb(255, 215, 0)'; // Colore dorato per le etichette
            canvasCtx.font = '12px Arial';
            canvasCtx.textAlign = 'center';
        
            bandFrequencies.forEach(freq => {
                // Calculate logarithmic position
                const logPosition = Math.log10(freq / bandFrequencies[0]) / Math.log10(bandFrequencies[bandFrequencies.length - 1] / bandFrequencies[0]);
                const xPosition = logPosition * canvas.width; // Map log scale to canvas width
                xBands[freq] = xPosition;
                canvasCtx.fillText(`${parseInt(freq,10)} Hz`, xPosition - 30 , canvas.height - 5); // Draw label                            
            });
  
            // Calculate and log RMS values for each band
            calculateRMSForBands();
        }
        
        

        draw(); // Start the visualization loop

        console.log("Successfully capturing audio from BlackHole");
    } catch (err) {
        console.error("Error accessing audio:", err);
        if (err.name === "OverconstrainedError") {
            console.error("The requested device ID is not available or valid.");
        }
    }
}







// Dropdown menu to select audio input
async function setupAudioInputSelector() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === "audioinput");

    const audioSelect = document.getElementById("audio-devices");
    //audioSelect.innerHTML = '<option value="">Select an AUDIO device</option>'; // Reset options

    audioDevices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.textContent = device.label || `Unnamed Device (${device.deviceId})`;
        audioSelect.appendChild(option);
    });
}

setupAudioInputSelector();

// Handle audio device change
async function handleAudioDeviceChange() {
    const audioSelect = document.getElementById("audio-devices");
    const selectedDeviceId = audioSelect.value;

    if (selectedDeviceId) {
        captureFromBlackHole(selectedDeviceId);
    } else {
        console.warn("No audio device selected.");
    }
}


// Slider for BPM
slider.addEventListener("mousedown", (e) => {
    isDragging = true;
    sliderPenultimateY = null; // Reset penultimate position
    sliderLastY = e.pageY; // Initialize the last Y position

    const onMouseMove = (event) => {
        if (isDragging) {
            // Update penultimate Y position before modifying last Y
            sliderPenultimateY = sliderLastY;
            sliderLastY = event.pageY; // Update the last Y position

            if (sliderPenultimateY !== null) {
                // Calculate deltaY between current and previous positions
                const deltaY = sliderPenultimateY - sliderLastY;

                // Adjust BPM based on deltaY and sensitivity
                bpm += Math.round(deltaY * 1);

                // Clamp BPM between 20 and 300
                bpm = Math.max(20, Math.min(bpm, 300));

                // Update UI
                sliderValue.textContent = bpm;
            }
        }
    };

    const onMouseUp = () => {
        isDragging = false;
        sliderLastY = null;
        sliderPenultimateY = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});


// Rende i slider-band interattivi


sliderBands.forEach((sliderBand, index) => {
    let isDragging = false;
    let sliderLastY = null;

    const sliderIndicator = sliderBand.querySelector(".slider-indicator");

    sliderBand.addEventListener("mousedown", (e) => {
        isDragging = true;
        sliderLastY = e.pageY;

        const onMouseMove = (event) => {
            if (isDragging) {
                const deltaY = sliderLastY - event.pageY; // Calculate the difference in Y positions
                sliderLastY = event.pageY;

                // Modifica la height del .slider-indicator
                let newHeight = Math.max(0, sliderIndicator.offsetHeight - deltaY); // Ensure height >= 0
                sliderIndicator.style.height = `${newHeight}px`;
                threshold[index] = sliderIndicator.offsetHeight;
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
});
