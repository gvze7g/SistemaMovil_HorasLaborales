document.addEventListener('DOMContentLoaded', () => {
    const sendUpdateButton = document.getElementById('sendUpdateButton');
    const observationsTextarea = document.getElementById('observationsTextarea');

    sendUpdateButton.addEventListener('click', () => {
        if (observationsTextarea.value.trim() === '') {
            // Show SweetAlert2 error for empty observations
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, escribe una observación antes de enviar.',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                },
                buttonsStyling: false,
                confirmButtonText: 'Entendido'
            });
        } else {
            // Show SweetAlert2 success and then redirect
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'La observación ha sido enviada correctamente.',
                customClass: {
                    popup: 'swal-custom-popup',
                    title: 'swal-custom-title',
                    content: 'swal-custom-content',
                    confirmButton: 'swal-custom-confirm-button'
                },
                buttonsStyling: false,
                confirmButtonText: 'Aceptar'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'bitacora-actu.html';
                }
            });
        }
    });
});