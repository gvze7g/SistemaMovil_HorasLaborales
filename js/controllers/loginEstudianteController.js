import { login, me } from '../services/authServiceStudents.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const loginButton = document.getElementById('login-btn');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';

            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            Swal.fire('Error', 'Completa el correo y la contraseña.', 'error');
            return;
        }

        try {
            loginButton.disabled = true;
            loginButton.textContent = 'Ingresando...';

            await login({ email, password });

            const info = await me();

            if (info.authenticated) {
                window.location.href = 'estudiante.html';
            } else {
                Swal.fire('Error', 'No se pudo validar la sesión.', 'error');
            }

        } catch (error) {
            Swal.fire('Error', error.message || 'Credenciales incorrectas.', 'error');
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Iniciar Sesión';
        }
    });
});