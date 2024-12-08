function updateLampPosition(index, newLeft) {
    const container = document.querySelectorAll('.movementContainer')[index];
    container.style.left = `${newLeft}px`;
}