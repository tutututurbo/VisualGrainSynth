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


async function captureFromBlackHole(deviceId) {
    try {
        const constraints = {
            audio: { deviceId: { exact: deviceId } } // Use the BlackHole device ID
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Size of the FFT (frequency bins)

        const dataArray = new Uint8Array(analyser.frequencyBinCount); // Array to store frequency data
        source.connect(analyser);

        // Access the new canvas for drawing
        const canvas = document.getElementById('spectrum-canvas');
        const canvasCtx = canvas.getContext('2d');
        canvas.width = 800; // Set canvas width
        canvas.height = 200; // Set canvas height

        // Function to calculate RMS for a frequency band
        function calculateRMSForBands() {
            analyser.getByteFrequencyData(dataArray);

            const nyquist = audioContext.sampleRate / 2;
            const numBins = dataArray.length;

            // Map frequency ranges to bin indices
            const bandIndices = {
                subBass: { start: Math.floor((20 / nyquist) * numBins), end: Math.ceil((60 / nyquist) * numBins) },
                lowBass: { start: Math.floor((60 / nyquist) * numBins), end: Math.ceil((100 / nyquist) * numBins) },
                bass: { start: Math.floor((100 / nyquist) * numBins), end: Math.ceil((300 / nyquist) * numBins) },
                mid: { start: Math.floor((300 / nyquist) * numBins), end: Math.ceil((2000 / nyquist) * numBins) },
                high: { start: Math.floor((2000 / nyquist) * numBins), end: Math.ceil((20000 / nyquist) * numBins) },
            };

            // Helper to calculate RMS for a given band
            function calculateRMS(startIndex, endIndex) {
                let sum = 0;
                const count = endIndex - startIndex;
                for (let i = startIndex; i < endIndex; i++) {
                    sum += Math.pow(dataArray[i] / 255, 2); // Normalize dataArray[i] to [0, 1] and square it
                }
                return Math.sqrt(sum / count);
            }

            // Calculate RMS for each band
            const subBassRMS = calculateRMS(bandIndices.subBass.start, bandIndices.subBass.end);
            const lowBassRMS = calculateRMS(bandIndices.lowBass.start, bandIndices.lowBass.end);
            const bassRMS = calculateRMS(bandIndices.bass.start, bandIndices.bass.end);
            const midRMS = calculateRMS(bandIndices.mid.start, bandIndices.mid.end);
            const highRMS = calculateRMS(bandIndices.high.start, bandIndices.high.end);

            // Log RMS values
            console.log(`Sub Bass RMS: ${subBassRMS.toFixed(3)}, Bass RMS: ${bassRMS.toFixed(3)}, Mid RMS: ${midRMS.toFixed(3)}, High RMS: ${highRMS.toFixed(3)}`);

            if(autoModeActive) {
                if(lowBassRMS >= 0.58 && subBassRMS>= 0.25) {
                    document.getElementById("video_frame").style.filter = `
                    invert(${Math.round(lowBassRMS * 110)}%)
                    hue-rotate(${Math.round(midRMS * 100 * 3)}deg)
                    saturate(${Math.round(subBassRMS * 100 * 40)}%)

                `;
                }
                else{
                    document.getElementById("video_frame").style.filter = `
                    hue-rotate(${Math.round(midRMS * 100 * 3)}deg)
                    saturate(${Math.round(subBassRMS * 100 * 40)}%)
                `;
                }
                
            }
        }

        // Visualization function
        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            // Clear canvas
            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw frequency bars
            const barWidth = (canvas.width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i];
                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
                x += barWidth + 1;
            }

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
