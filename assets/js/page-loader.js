// Page Loader - Simple animation trigger
document.addEventListener('DOMContentLoaded', function() {
    // Add loaded class to body after a short delay
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});
