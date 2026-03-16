import { login, me } from '../../services/AuthInstructors/authInstructorService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('authForm');

  // Maneja el submit del formulario de login.
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtención de campos del formulario
    const email = (document.querySelector('#email, [name=email], input[type=email]')?.value || '').trim();
    const password = document.querySelector('#password, [name=password], input[type=password]')?.value || '';

    // Validación básica
    if (!email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor completa todos los campos'
      });
      return;
    }

    // Referencia y estado del botón "Iniciar Sesión"
    const btnIngresar = document.getElementById("authBtn");
    let originalText;

    try {
      // Desactiva botón para evitar reenvíos múltiples y muestra feedback de carga
      if (btnIngresar) {
        originalText = btnIngresar.innerHTML;
        btnIngresar.setAttribute("disabled", "disabled");
        btnIngresar.innerHTML = 'Ingresando…';
      }

      // Llama al servicio de login (envía credenciales, espera cookie de sesión)
      await login({ email, password });

      // Verifica sesión con /meInstructor para confirmar que la cookie quedó activa
      const info = await me();
      console.log("Información de sesión:", info); // Agrega este registro
      if (info?.authenticated) {
        // Redirección a la página principal si autenticado
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Inicio de sesión exitoso',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          console.log("Redirigiendo a coordi-index.html"); // Agrega este registro
          window.location.replace('coordi-index.html');
        });
      } else {
        // Si no se refleja autenticación, alerta de cookie/sesión
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error de Cookie o sesión no válida'
        });
      }
    } catch (err) {
      // Muestra mensaje de error de backend/red o fallback genérico
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.message || 'No fue posible iniciar sesión.'
      });
    } finally {
      // Restaura estado del botón (habilita y devuelve texto original)
      if (btnIngresar) {
        btnIngresar.removeAttribute("disabled");
        if (originalText) btnIngresar.innerHTML = originalText;
      }
    }
  });

  // Funcionalidad del toggle de contraseña
  const togglePassword = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      
      const icon = this.querySelector('i');
      if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      }
    });
  }
});
