document.addEventListener('DOMContentLoaded', () => {
    const fabButton = document.querySelector('.fab');
    const modal = document.getElementById('task-modal');
    const closeButton = document.querySelector('.close-button');
    const photoInputs = document.querySelectorAll('.photo-input');

    // Abre el modal al hacer clic en el botón FAB
    if (fabButton) {
        fabButton.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    // Cierra el modal al hacer clic en la "X"
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Cierra el modal si se hace clic fuera de su contenido
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Maneja la previsualización de las fotos tomadas
    photoInputs.forEach(input => {
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewContainer = input.parentElement;
                    let img = previewContainer.querySelector('img');
                    if (!img) {
                        img = document.createElement('img');
                        previewContainer.appendChild(img);
                    }
                    img.src = e.target.result;
                    previewContainer.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Puedes agregar aquí la lógica para manejar el envío del formulario
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Lógica para procesar la información del formulario y las imágenes
            console.log('Formulario enviado');
            // Aquí iría el código para enviar los datos a un servidor o procesarlos
            modal.style.display = 'none';
            alert('Orden de trabajo guardada con éxito.');
        });
    }
});