function updateLampPosition(index, newLeft) {
    const container = document.querySelectorAll('.movementContainer')[index];
    container.style.left = `${newLeft}px`;
}

// Function to load angles when activating a lamp
    function loadLampAngles(lampIndex, currentKnob) {
        angles[0] = anglesStart[lampIndex];
        angles[1] = anglesEnd[lampIndex];
        lastAngle = angles[currentKnob]; // Reset lastAngle to current lamp's angle to prevent carryover
    }
