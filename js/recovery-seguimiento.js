document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formRecoveryParent');
  const button = document.getElementById('recoveryBtn');
  
  const stepEmail = document.getElementById('stepEmail');
  const stepOtp = document.getElementById('stepOtp');
  const stepPassword = document.getElementById('stepPassword');
  const stepConfirmPassword = document.getElementById('stepConfirmPassword');

  let currentStep = 1;

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('recoveryEmail')?.value.trim() || '';

    if (!email) {
      Swal.fire('Error', 'Escribe tu correo.', 'error');
      return;
    }

    if (currentStep === 1) {
      // Step 1: Request OTP
      const endpoint = 'http://localhost:8080/api/parentsAuth/requestPasswordOtp';

      try {
        if (button) {
          button.disabled = true;
          button.textContent = 'Enviando código...';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudo procesar la recuperación.');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Código enviado',
          text: payload.message || 'Revisa tu correo para ver el código OTP.'
        });

        // Transition to Step 2
        currentStep = 2;
        stepEmail.style.display = 'none';
        stepOtp.style.display = 'block';
        stepPassword.style.display = 'block';
        stepConfirmPassword.style.display = 'block';
        
        button.textContent = 'Restablecer contraseña';
      } catch (error) {
        Swal.fire('Error', error.message || 'No fue posible enviar el código.', 'error');
        if (button) {
          button.textContent = 'Enviar código OTP';
        }
      } finally {
        if (button) button.disabled = false;
      }
    } else if (currentStep === 2) {
      // Step 2: Reset Password
      const otp = document.getElementById('otp')?.value.trim() || '';
      const newPassword = document.getElementById('newPassword')?.value.trim() || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value.trim() || '';

      if (!otp || otp.length !== 6) {
        Swal.fire('Error', 'Ingresa un código OTP válido de 6 dígitos.', 'error');
        return;
      }

      if (!newPassword || newPassword.length < 8) {
        Swal.fire('Error', 'La nueva contraseña debe tener al menos 8 caracteres.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
      }

      const endpoint = 'http://localhost:8080/api/parentsAuth/resetPasswordWithOtp';

      try {
        if (button) {
          button.disabled = true;
          button.textContent = 'Restableciendo...';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, otp, newPassword })
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'No se pudo restablecer la contraseña.');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Contraseña actualizada',
          text: payload.message || 'Tu contraseña ha sido actualizada exitosamente.'
        });

        window.location.href = 'auth-seguimiento.html';
      } catch (error) {
        Swal.fire('Error', error.message || 'No fue posible restablecer la contraseña.', 'error');
        if (button) {
          button.textContent = 'Restablecer contraseña';
        }
      } finally {
        if (button) button.disabled = false;
      }
    }
  });
});
