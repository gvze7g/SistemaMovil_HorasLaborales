document.addEventListener('DOMContentLoaded', function() {
    const elementosNav = document.querySelectorAll('.navegacion-inferior .elemento-nav');

    function establecerActivoNavItem() {
        const rutaActual = window.location.pathname.split('/').pop();
        const hashActual = window.location.hash;

        elementosNav.forEach(item => {
            item.classList.remove('activo');
            const itemHref = item.getAttribute('href');

            if (rutaActual === 'estudiante.html' && (itemHref.includes('estudiante.html#inicio') || (itemHref === '#inicio' && !hashActual) || itemHref === 'estudiante.html')) {
                item.classList.add('activo');
            } else if (itemHref && itemHref.includes(rutaActual) && rutaActual !== 'estudiante.html') {
                item.classList.add('activo');
            }
        });
    }

    elementosNav.forEach(item => {
        item.addEventListener('click', function(e) {
            const itemHref = this.getAttribute('href');
            const esDisparadorModal = this.hasAttribute('data-toggle') && this.getAttribute('data-toggle') === 'modal';

            if (itemHref.includes('estudiante.html#inicio') || (itemHref === '#inicio' && !esDisparadorModal) || itemHref === 'estudiante.html') {

            } else if (!esDisparadorModal) {

            }
        });
    });

    establecerActivoNavItem();
});