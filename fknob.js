   // Define necessary variables

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
export function loadLampAngles(lampIndex, currentKnob, ) {
    angles[0] = anglesStart[lampIndex];
    angles[1] = anglesEnd[lampIndex];
    lastAngle = angles[currentKnob]; // Reset lastAngle to current lamp's angle to prevent carryover
}
    // Function to move the knob
export function moveKnob(knobIndex, newAngle) {
    if (newAngle >= minangle && newAngle <= maxangle) {
        angles[knobIndex] = newAngle;
        setAngle(knobIndex, newAngle);
    }
}
    
