document.addEventListener('DOMContentLoaded', () => {
    const assignJobForm = document.getElementById('assignJobForm');
    const descripcionInput = document.getElementById('descripcion');
    const estudianteInput = document.getElementById('estudiante');
    const tiempoInput = document.getElementById('tiempo');

    assignJobForm.addEventListener('submit', function(event) {
        event.preventDefault();

        let isValid = true;
        let errorMessage = '';

        const descripcion = descripcionInput.value.trim();
        const estudiante = estudianteInput.value.trim();
        const tiempo = tiempoInput.value.trim();

        if (descripcion === '') {
            isValid = false;
            errorMessage += 'La descripción no puede estar vacía.<br>';
            descripcionInput.style.borderColor = 'red';
        } else {
            descripcionInput.style.borderColor = '';
        }

        if (estudiante === '') {
            isValid = false;
            errorMessage += 'El estudiante asignado no puede estar vacío.<br>';
            estudianteInput.style.borderColor = 'red';
        } else {
            estudianteInput.style.borderColor = '';
        }

        const tiempoRegex = /^\d+(\.\d+)?hrs$/i;
        if (tiempo === '') {
            isValid = false;
            errorMessage += 'El tiempo no puede estar vacío.<br>';
            tiempoInput.style.borderColor = 'red';
        } else if (!tiempoRegex.test(tiempo)) {
            isValid = false;
            errorMessage += 'El formato de tiempo debe ser (ej: 2hrs).<br>';
            tiempoInput.style.borderColor = 'red';
        } else {
            tiempoInput.style.borderColor = '';
        }

        if (isValid) {
            Swal.fire({
                title: '¡Éxito!',
                html: 'El trabajo ha sido asignado correctamente.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            }).then(() => {
                // Optionally, redirect or clear the form after success
                // window.location.href = 'bitacora-actu.html';
                assignJobForm.reset();
            });
        } else {
            Swal.fire({
                title: 'Error',
                html: errorMessage,
                icon: 'error',
                confirmButtonText: 'Entendido',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                }
            });
        }
    });
});