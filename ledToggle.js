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


function autoSwitch() {
    const switchElement = document.getElementById('autoMode');
    const led = document.getElementById('ledAutoMode');
    switchElement.classList.toggle('off');
    led.classList.toggle('off');
    autoModeActive = !autoModeActive; 
}
