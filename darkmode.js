document.addEventListener('DOMContentLoaded', () => {
    const footerRight = document.querySelector('.footer-right');
    if (!footerRight) return;

    const toggleButton = document.createElement('a');
    toggleButton.href = '#';
    toggleButton.classList.add('dark-mode-toggle');
    toggleButton.innerHTML = `
        <div class="icon moon-icon"></div>
        <div class="icon sun-icon"></div>
    `;
    footerRight.appendChild(toggleButton);

    toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        body.classList.toggle('dark-mode');
        let theme = 'light';
        if (body.classList.contains('dark-mode')) {
            theme = 'dark';
        }
        localStorage.setItem('theme', theme);
    });

    const body = document.body;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        body.classList.add('dark-mode');
    }

    // The button is now part of the footer, so the reveal animation will be handled by the footer's observer.
    // We can remove the explicit visibility toggle.
});
