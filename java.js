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
           // updateVideoTime();
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
                 const position = (angles[0] / 270) * maxPosition; // Calcola la posizione orizzontale

                  // Trova la small_line e aggiorna la sua posizione
                 const smallLine = document.querySelectorAll('.small_line'); // Assicurati che la classe sia corretta
             if (smallLine[index]) {
                 smallLine[index].style.left = position + 'px'; // Imposta la posizione orizzontale
              }         
            } 
        });
    }
    
    }

    // Funzione per aggiornare la posizione della small_line
// function updateSmallLinePosition(angle) {
//     // Mappa l'angolo da 0 a 270 gradi a una posizione orizzontale da 0px a 500px
//     const maxPosition = 500;
//     const position = (angle / 270) * maxPosition; // Calcola la posizione orizzontale

//     // Trova la small_line e aggiorna la sua posizione
//     const smallLine = document.querySelectorAll('.small_line'); // Assicurati che la classe sia corretta
//     if (smallLine[lamps1.index]) {
//         smallLine.style.left = position + 'px'; // Imposta la posizione orizzontale
//     }
// }

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

    // // Update the video time based on knob values
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

    // // Initialize the video duration and set up event listeners
   /* function initVideo() {
        var videoSource = document.getElementById('videoSource');
        videoSource.src = 'path_to_your_video.mp4'; // Set your video path here
        videoElement.load(); // Load the video

        videoElement.addEventListener('loadedmetadata', function() {
            videoDuration = videoElement.duration; // Get video duration
            angles = [0, Math.min(270, (videoDuration / videoDuration) * 270)]; // Set initial angles
            setAngle(0, angles[0]); // Set knob1 angle
            setAngle(1, angles[1]); // Set knob2 angle
        });
    }*/

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

   // Call initVideo to start everything
   // initVideo();


//#########################################################








