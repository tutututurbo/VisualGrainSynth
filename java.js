var knobs = document.getElementsByClassName('knob');
var angles = [0, 270]; // Store angles for each knob
var minangle = 0;
var maxangle = 270;
var isDragging = false;
var currentKnob = null;
var lastY = 0; // Track the last Y position
var lastAngle = 0; // Keep track of the last angle

function moveKnob(knobIndex, newAngle) {
    if (newAngle >= minangle && newAngle <= maxangle) {
        angles[knobIndex] = newAngle;
        setAngle(knobIndex, newAngle);
    }
}

function setAngle(knobIndex, angle) {
    var knob = knobs[knobIndex];
    knob.style.transform = 'rotate(' + angle + 'deg)';
    var pc = Math.round((angle / 270) * 128);
    document.getElementById('value' + (knobIndex + 1)).textContent = pc; // Update corresponding value
}

// Function to calculate the new angle based on mouse position
function calculateAngleDelta(lastY, currentY, currentAngle) {
    var deltaY = lastY - currentY; // Invert the change so up goes clockwise, down goes counterclockwise
    var sensitivity = 1; // Adjust sensitivity of angle change
    var newAngle = currentAngle + deltaY * sensitivity;
    
    // Ensure the new angle is clamped between the min and max angles
    if (newAngle < minangle) newAngle = minangle;
    if (newAngle > maxangle) newAngle = maxangle;
    
    return newAngle;
}

// Function to handle dragging
function onDrag(e) {
    if (isDragging && currentKnob !== null) {
        var newAngle = calculateAngleDelta(lastY, e.pageY, lastAngle);
        moveKnob(currentKnob, newAngle);
        lastY = e.pageY; // Update last Y position
        lastAngle = newAngle; // Update the angle for continuous movement
    }
}

// Function to stop dragging
function stopDrag() {
    isDragging = false;
    currentKnob = null; // Reset the current knob
    document.removeEventListener('mousemove', onDrag); // Remove drag listener
    document.removeEventListener('mouseup', stopDrag); // Remove mouseup listener
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

// Touch support for mobile devices (similar to mouse handling)
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


/*
var knobs = document.getElementsByClassName('knob');
var angles = [0, 0]; // Store angles for each knob
var minangle = 0;
var maxangle = 270;
var isDragging = false;
var startAngle = 0;
var currentKnob = null;

function moveKnob(knobIndex, newAngle) {
    if (newAngle >= minangle && newAngle <= maxangle) {
        angles[knobIndex] = newAngle;
        setAngle(knobIndex, angles[knobIndex]);
    }
}

function setAngle(knobIndex, angle) {
    var knob = knobs[knobIndex];
    knob.style.transform = 'rotate(' + angle + 'deg)';
    var pc = Math.round((angle / 270) * 128);
    document.getElementById('value' + (knobIndex + 1)).textContent = pc; // Update corresponding value
}

function getAngle(x, y, knob) {
    var rect = knob.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var dx = x - centerX;
    var dy = y - centerY;
    var radians = Math.atan2(dy, dx);
    var degrees = radians * (180 / Math.PI);
    return (degrees < 0) ? degrees + 360 : degrees;
}

Array.from(knobs).forEach((knob, index) => {
    knob.addEventListener('mousedown', function(e) {
        isDragging = true;
        currentKnob = index; // Set the current knob index
        var pageX = e.pageX || e.touches[0].pageX;
        var pageY = e.pageY || e.touches[0].pageY;
        startAngle = getAngle(pageX, pageY, knob) - angles[index];
        e.preventDefault();
    });
});

document.addEventListener('mousemove', function(e) {
    if (isDragging && currentKnob !== null) {
        var pageX = e.pageX || e.touches[0].pageX;
        var pageY = e.pageY || e.touches[0].pageY;
        var newAngle = getAngle(pageX, pageY, knobs[currentKnob]) - startAngle;
        moveKnob(currentKnob, newAngle);
        e.preventDefault();
    }
});

document.addEventListener('mouseup', function() {
    isDragging = false;
    currentKnob = null; // Reset the current knob
});

document.addEventListener('touchend', function() {
    isDragging = false;
    currentKnob = null; // Reset the current knob
});

*/