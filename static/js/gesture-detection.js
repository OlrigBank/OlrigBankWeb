// static/js/gesture-detection.js
document.addEventListener('DOMContentLoaded', () => {
    let startDistance = null;

    function getDistance(touches) {
        const [a, b] = touches;
        return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    }

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            startDistance = getDistance(e.touches);
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && startDistance !== null) {
            const newDistance = getDistance(e.touches);
            if (newDistance - startDistance > 100) {
                document.getElementById('add-offering-form').classList.remove('hidden');
                startDistance = null;
            }
        }
    });
});

