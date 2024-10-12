var videoElement = document.getElementById('videoElement');
    var knobs = document.getElementsByClassName('knob');
    var angles = [0, 270]; // Store angles for each knob
    var minangle = 0;
    var maxangle = 270;
    var isDragging = false;
    var currentKnob = null;
    var lastY = 0; // Track the last Y position
    var lastAngle = 0; // Keep track of the last angle
    var videoDuration = 0; // Duration of the video
    var minVideoDuration = 0.01; // Minimum duration for the video

    // Function to move the knob
    function moveKnob(knobIndex, newAngle) {
        if (newAngle >= minangle && newAngle <= maxangle) {
            angles[knobIndex] = newAngle;
            setAngle(knobIndex, newAngle);
            updateVideoTime();
        }
    }

    // Set angle and update corresponding value
    function setAngle(knobIndex, angle) {
        var knob = knobs[knobIndex];
        knob.style.transform = 'rotate(' + angle + 'deg)';
        var pc = Math.round((angle / 270) * videoDuration); // Map angle to video duration
        document.getElementById('value' + (knobIndex + 1)).textContent = pc; // Update corresponding value
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

    // Update the video time based on knob values
    function updateVideoTime() {
        var startAngle = angles[0];
        var endAngle = angles[1];

        var startTime = (startAngle / 270) * videoDuration;
        var endTime = (endAngle / 270) * videoDuration;

        // Ensure start time is less than end time and respects min video duration
        if (startTime >= endTime) {
            endTime = Math.min(startTime + minVideoDuration, videoDuration); // set end time
            angles[1] = (endTime / videoDuration) * 270; // Update knob2 angle
            setAngle(1, angles[1]); // Update visual knob2
        }

        // Update the video playback range
        videoElement.currentTime = startTime; // Set the current time to the start time
        videoElement.play(); // Start playing the video
        videoElement.pause(); // Pause immediately to allow seeking
    }

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

    // Initialize the video duration and set up event listeners
    function initVideo() {
        var videoSource = document.getElementById('videoSource');
        videoSource.src = 'path_to_your_video.mp4'; // Set your video path here
        videoElement.load(); // Load the video

        videoElement.addEventListener('loadedmetadata', function() {
            videoDuration = videoElement.duration; // Get video duration
            angles = [0, Math.min(270, (videoDuration / videoDuration) * 270)]; // Set initial angles
            setAngle(0, angles[0]); // Set knob1 angle
            setAngle(1, angles[1]); // Set knob2 angle
        });
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

    // Touch support for mobile devices
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

    // Call initVideo to start everything
    initVideo();

/* VIDEO OVERLAY*/ 

reader.onload = function(event) {
    videoElement = document.createElement('video'); // Creiamo un elemento video
    videoElement.classList.add('custom-video'); // Aggiungiamo una classe per lo stile
    videoElement.src = event.target.result; // Imposta la sorgente del video dal file caricato
    videoElement.muted = true; // Muto per prevenire audio automatico
    videoElement.controls = false; // Disabilita i controlli nativi

    // Pulisce eventuali video precedenti dalla center-box
    $form.innerHTML = ''; 

    // Inserisce il video dentro la center-box
    $form.appendChild(videoElement);

    // Aggiungi l'overlay per effetto 3D
    var overlay = document.createElement('div'); // Crea un nuovo div per l'overlay
    overlay.classList.add('video-overlay'); // Aggiungi la classe per l'overlay
    $form.appendChild(overlay); // Aggiungi l'overlay alla center-box
};

document.addEventListener('DOMContentLoaded', function() {
    const previewDisplay = document.getElementById('preview_display');
    const movingLine = document.getElementById('movingLine');

    previewDisplay.addEventListener('mousemove', function(event) {
        const rect = previewDisplay.getBoundingClientRect(); // Ottiene la posizione del display
        const mouseX = event.clientX - rect.left; // Calcola la posizione orizzontale del mouse all'interno del display

        // Calcola l'increspatura della linea in base alla posizione del mouse
        const maxHeight = 30; // Altezza massima dell'increspatura
        const width = previewDisplay.clientWidth; // Larghezza del display
        const heightArray = [];

        for (let x = 0; x < width; x++) {
            // Calcola la distanza del mouse dalla posizione X attuale
            const distance = Math.abs(x - mouseX);
            
            // Usa la funzione gaussiana per calcolare l'altezza
            const gaussianHeight = maxHeight * Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(50, 2))); // 50 è la deviazione standard
            heightArray.push(gaussianHeight);
        }

        // Costruisci un SVG per rappresentare la linea increspata
        let svgPath = '';
        for (let x = 0; x < width; x++) {
            const y = heightArray[x]; // Ottieni l'altezza calcolata
            svgPath += (x === 0 ? 'M' : 'L') + x + ' ' + (50 - y); // Inverti y per l'SVG
        }
        svgPath += ' L ' + width + ' 50 L 0 50 Z'; // Chiudi il percorso

        // Crea un SVG e impostalo come sfondo della linea
        movingLine.innerHTML = `<svg width="${width}" height="100" style="position:absolute; top:0; left:0;">
            <path d="${svgPath}" fill="black" />
        </svg>`;
    });
});

