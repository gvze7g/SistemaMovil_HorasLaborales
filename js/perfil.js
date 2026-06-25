import { me, changePassword } from './services/authServiceStudents.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userData = await me();

        if (userData && userData.student) {
            const student = userData.student;
            window.studentId = student.id;

            document.getElementById('nombreCompletoUsuario').textContent = `${student.names} ${student.lastNames}`;
            document.getElementById('correoUsuario').textContent = student.email;
            document.getElementById('rolUsuario').textContent = 'Estudiante';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }

    const formularioCambioContrasena = document.getElementById('formularioCambioContrasena');
    const contrasenaActualInput = document.getElementById('contrasenaActual');
    const nuevaContrasenaInput = document.getElementById('nuevaContrasena');
    const confirmarNuevaContrasenaInput = document.getElementById('confirmarNuevaContrasena');
    const mensajeContrasenaDiv = document.getElementById('mensajeContrasena');

    formularioCambioContrasena.addEventListener('submit', function(event) {
        event.preventDefault();

        const contrasenaActual = contrasenaActualInput.value;
        const nuevaContrasena = nuevaContrasenaInput.value;
        const confirmarNuevaContrasena = confirmarNuevaContrasenaInput.value;

        let isValid = true;
        let errorMessage = '';

        contrasenaActualInput.style.borderColor = '';
        nuevaContrasenaInput.style.borderColor = '';
        confirmarNuevaContrasenaInput.style.borderColor = '';
        mensajeContrasenaDiv.style.display = 'none';
        mensajeContrasenaDiv.className = 'mensaje-alerta';

        if (contrasenaActual === '') {
            isValid = false;
            errorMessage += 'La contraseña actual no puede estar vacía.<br>';
            contrasenaActualInput.style.borderColor = 'red';
        }

        if (nuevaContrasena === '') {
            isValid = false;
            errorMessage += 'La nueva contraseña no puede estar vacía.<br>';
            nuevaContrasenaInput.style.borderColor = 'red';
        } else if (nuevaContrasena.length < 6) {
            isValid = false;
            errorMessage += 'La nueva contraseña debe tener al menos 6 caracteres.<br>';
            nuevaContrasenaInput.style.borderColor = 'red';
        }

        if (confirmarNuevaContrasena === '') {
            isValid = false;
            errorMessage += 'La confirmación de la nueva contraseña no puede estar vacía.<br>';
            confirmarNuevaContrasenaInput.style.borderColor = 'red';
        } else if (nuevaContrasena !== confirmarNuevaContrasena) {
            isValid = false;
            errorMessage += 'La nueva contraseña y la confirmación no coinciden.<br>';
            nuevaContrasenaInput.style.borderColor = 'red';
            confirmarNuevaContrasenaInput.style.borderColor = 'red';
        }

        if (!isValid) {
            mensajeContrasenaDiv.innerHTML = errorMessage;
            mensajeContrasenaDiv.style.display = 'block';
            mensajeContrasenaDiv.classList.add('error');
            return;
        }

        // Hacer la petición a la API
        changePassword(window.studentId, contrasenaActual, nuevaContrasena)
            .then(() => {
                mensajeContrasenaDiv.innerHTML = 'Contraseña actualizada correctamente.';
                mensajeContrasenaDiv.style.display = 'block';
                mensajeContrasenaDiv.classList.remove('error');
                mensajeContrasenaDiv.classList.add('success');
                formularioCambioContrasena.reset();
            })
            .catch((error) => {
                mensajeContrasenaDiv.innerHTML = error.message;
                mensajeContrasenaDiv.style.display = 'block';
                mensajeContrasenaDiv.classList.remove('success');
                mensajeContrasenaDiv.classList.add('error');
            });
    });
});