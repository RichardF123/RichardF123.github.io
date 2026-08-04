(function() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    let ticking = false;
    const threshold = 360;

    function update() {
        button.classList.toggle('is-visible', window.scrollY > threshold);
        ticking = false;
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    button.setAttribute('aria-label', 'Back to top');
    button.setAttribute('title', 'Back to top');
    update();

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    button.addEventListener('click', function(event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}());
