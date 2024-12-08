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

// // Function to capture default audio
// async function captureDefaultAudio() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         console.log("Successfully captured default audio stream:", stream);
//     } catch (err) {
//         console.error("Error capturing audio:", err);
//     }
// }
// captureDefaultAudio();

async function captureFromBlackHole(deviceId) {
    try {
        const constraints = {
            audio: { deviceId: { exact: deviceId } } // Use the specified device ID
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Size of the FFT (frequency bins)
        analyser.smoothingTimeConstant = 0.8; // Smooth the frequency data (to avoid spikes)

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength); // Array to store frequency data
        source.connect(analyser);

        // Variables to store RMS values and decay
        let bassRMS = 0, midRMS = 0, highRMS = 0;

        // Function to compute RMS for a frequency range
        function computeRMS(startFreq, endFreq) {
            const nyquist = audioContext.sampleRate / 2;
            const startBin = Math.floor((startFreq / nyquist) * bufferLength);
            const endBin = Math.ceil((endFreq / nyquist) * bufferLength);

            let sum = 0;
            let count = 0;

            // Sum up the squared values and avoid negative or NaN values
            for (let i = startBin; i < endBin; i++) {
                const value = Math.max(0, dataArray[i]);  // Ensure no negative values
                sum += value * value;
                count++;
            }
            return count === 0 ? 0 : Math.sqrt(sum / count);
        }

        // Function to process audio and calculate RMS values
        function processAudio() {
            analyser.getFloatFrequencyData(dataArray);

            // Debugging: Log the first few values to check data
            console.log("Frequency data:", dataArray.slice(0, 10));  // Log the first 10 frequency values

            // Calculate the RMS for each band
            const newBassRMS = computeRMS(30, 300);
            const newMidRMS = computeRMS(300, 2000);
            const newHighRMS = computeRMS(2000, 20000);

            // If RMS values are 0, do not increase indefinitely; decay instead
            bassRMS = Math.max(0, bassRMS * 0.9 + newBassRMS * 0.1); // Decay factor
            midRMS = Math.max(0, midRMS * 0.9 + newMidRMS * 0.1);
            highRMS = Math.max(0, highRMS * 0.9 + newHighRMS * 0.1);

            // Log the RMS values
            console.log(`Bass RMS: ${bassRMS.toFixed(3)}, Mid RMS: ${midRMS.toFixed(3)}, High RMS: ${highRMS.toFixed(3)}`);
            console.log('buffer length: ',bufferLength);
        }

        // Call processAudio every 30ms (buffer length)
        setInterval(processAudio, 1000);

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

    const select = document.createElement("select");
    audioDevices.forEach(device => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.textContent = device.label || `Unnamed Device (${device.deviceId})`;
        select.appendChild(option);
    });

    document.body.appendChild(select);

    select.addEventListener("change", (event) => {
        const selectedDeviceId = event.target.value;
        captureFromBlackHole(selectedDeviceId);
    });
}
setupAudioInputSelector();
