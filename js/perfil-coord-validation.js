import { me, changePassword } from './services/AuthInstructors/authInstructorService.js';

// Helper para obtener el valor de una cookie por nombre
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Carga los datos del perfil
async function cargarPerfil() {
    try {
        const data = await me();

        if (!data.authenticated) {
            showErrorAlert('No autenticado. Por favor inicia sesión.');
            return;
        }

        const instructor = data.instructor;
        console.log('Datos del instructor:', instructor);
        
        // Guardar el ID del instructor para el cambio de contraseña
        window.instructorId = instructor.id;
        
        // Actualizar campos del perfil
        document.getElementById('nombreUsuario').textContent = instructor.names.toUpperCase();
        document.getElementById('nombreCompletoUsuario').textContent = `${instructor.names} ${instructor.lastNames}`;
        document.getElementById('rolUsuario').textContent = instructor.role;
        document.getElementById('emailUsuario').textContent = instructor.email;
        
        // Campos opcionales
        if (instructor.phone) {
            document.getElementById('telefonoUsuario').textContent = instructor.phone;
        }
        
        if (instructor.level) {
            document.getElementById('anioImpartidoUsuario').textContent = instructor.level;
        } else {
            document.getElementById('anioImpartidoUsuario').textContent = 'No especificado';
        }
        
        // Manejar la imagen del avatar
        const avatarElement = document.getElementById('fotoPerfil');
        console.log('instructorImage data:', instructor.instructorImage);
        
        if (instructor.instructorImage && instructor.instructorImage.trim() !== '') {
            avatarElement.src = instructor.instructorImage;
            console.log('Avatar src set to:', instructor.instructorImage);
        } else {
            avatarElement.src = 'https://placehold.co/120x120/333333/FFFFFF?text=Sin+Foto';
            console.log('Using default avatar');
        }
        
        // Error handler para la imagen
        avatarElement.onerror = function() {
            console.log('Error loading avatar, using default');
            this.src = 'https://placehold.co/120x120/333333/FFFFFF?text=Sin+Foto';
        };
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showErrorAlert('No se pudo cargar el perfil.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Cargar perfil al iniciar
    cargarPerfil();
    
    const form = document.getElementById('formularioCambioContrasena');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        await manejarCambioContrasena(event);
    });
    
    // Agregar funcionalidad de toggle password
    initializePasswordToggles();
    
    // Agregar indicador de fuerza de contraseña
    initializePasswordStrength();
    
    // Agregar validación en tiempo real
    initializePasswordValidation();
});

// Inicializar los toggles de mostrar/ocultar contraseña
function initializePasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
}

// Inicializar indicador de fuerza de contraseña
function initializePasswordStrength() {
    const passwordInput = document.getElementById('nuevaContrasena');
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        strengthBar.style.width = `${strength.percentage}%`;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

// Calcular fuerza de contraseña
function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    if (score < 30) {
        return { percentage: score, text: 'Débil', color: '#ef4444' };
    } else if (score < 60) {
        return { percentage: score, text: 'Moderada', color: '#f59e0b' };
    } else {
        return { percentage: score, text: 'Fuerte', color: '#10b981' };
    }
}

// Inicializar validación de contraseñas en tiempo real
function initializePasswordValidation() {
    const contrasenaActual = document.getElementById('contrasenaActual');
    const nuevaContrasena = document.getElementById('nuevaContrasena');
    const confirmarNuevaContrasena = document.getElementById('confirmarNuevaContrasena');
    
    // Validar contraseña actual
    contrasenaActual.addEventListener('blur', function() {
        validateCurrentPassword(this);
    });
    
    contrasenaActual.addEventListener('input', function() {
        clearValidationState(this);
    });
    
    // Validar nueva contraseña
    nuevaContrasena.addEventListener('blur', function() {
        validateNewPassword(this);
    });
    
    nuevaContrasena.addEventListener('input', function() {
        clearValidationState(this);
        // Revalidar confirmación si ya tiene contenido
        if (confirmarNuevaContrasena.value) {
            validatePasswordMatch(confirmarNuevaContrasena);
        }
    });
    
    // Validar confirmación de contraseña
    confirmarNuevaContrasena.addEventListener('blur', function() {
        validatePasswordMatch(this);
    });
    
    confirmarNuevaContrasena.addEventListener('input', function() {
        clearValidationState(this);
    });
}

// Validar contraseña actual
function validateCurrentPassword(input) {
    const value = input.value.trim();
    
    if (!value) {
        setValidationState(input, 'error', 'La contraseña actual es obligatoria');
        return false;
    }
    
    if (value.length < 4) {
        setValidationState(input, 'error', 'Contraseña demasiado corta');
        return false;
    }
    
    setValidationState(input, 'success');
    return true;
}

// Validar nueva contraseña
function validateNewPassword(input) {
    const value = input.value.trim();
    
    if (!value) {
        setValidationState(input, 'error', 'La nueva contraseña es obligatoria');
        return false;
    }
    
    if (value.length < 8) {
        setValidationState(input, 'error', 'La contraseña debe tener al menos 8 caracteres');
        return false;
    }
    
    // Validar complejidad
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    if (!hasUpperCase || !hasLowerCase) {
        setValidationState(input, 'warning', 'Se recomienda usar mayúsculas y minúsculas');
        return true;
    }
    
    if (!hasNumbers) {
        setValidationState(input, 'warning', 'Se recomienda incluir números');
        return true;
    }
    
    setValidationState(input, 'success', 'Contraseña segura');
    return true;
}

// Validar coincidencia de contraseñas
function validatePasswordMatch(input) {
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmacion = input.value;
    
    if (!confirmacion) {
        setValidationState(input, 'error', 'Confirma tu nueva contraseña');
        return false;
    }
    
    if (nuevaContrasena !== confirmacion) {
        setValidationState(input, 'error', 'Las contraseñas no coinciden');
        return false;
    }
    
    setValidationState(input, 'success', 'Las contraseñas coinciden');
    return true;
}

// Establecer estado de validación
function setValidationState(input, state, message = '') {
    // Limpiar estados anteriores
    input.classList.remove('error', 'success', 'warning');
    
    // Agregar nuevo estado
    input.classList.add(state);
    
    // Mostrar/ocultar mensaje
    let messageElement = input.parentNode.querySelector('.validation-message');
    
    if (message) {
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.className = 'validation-message';
            input.parentNode.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.className = `validation-message ${state}`;
    } else if (messageElement) {
        messageElement.remove();
    }
}

// Limpiar estado de validación
function clearValidationState(input) {
    input.classList.remove('error', 'success', 'warning');
    const messageElement = input.parentNode.querySelector('.validation-message');
    if (messageElement) {
        messageElement.remove();
    }
}

// Validar todo el formulario antes del envío
function validateForm() {
    const contrasenaActual = document.getElementById('contrasenaActual');
    const nuevaContrasena = document.getElementById('nuevaContrasena');
    const confirmarNuevaContrasena = document.getElementById('confirmarNuevaContrasena');
    
    const isCurrentValid = validateCurrentPassword(contrasenaActual);
    const isNewValid = validateNewPassword(nuevaContrasena);
    const isMatchValid = validatePasswordMatch(confirmarNuevaContrasena);
    
    return isCurrentValid && isNewValid && isMatchValid;
}

// Maneja el cambio de contraseña
async function manejarCambioContrasena(event) {
    event.preventDefault();
    
    // Validar formulario completo
    if (!validateForm()) {
        showErrorAlert('Por favor corrige los errores en el formulario');
        return;
    }
    
    const contrasenaActual = document.getElementById('contrasenaActual').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmarNuevaContrasena = document.getElementById('confirmarNuevaContrasena').value;
    
    // Validaciones adicionales
    if (!contrasenaActual || !nuevaContrasena || !confirmarNuevaContrasena) {
        showErrorAlert('Todos los campos son obligatorios.');
        return;
    }
    
    if (nuevaContrasena !== confirmarNuevaContrasena) {
        showErrorAlert('Las contraseñas nuevas no coinciden.');
        return;
    }
    
    if (nuevaContrasena.length < 8) {
        showErrorAlert('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
    }
    
    if (contrasenaActual === nuevaContrasena) {
        showErrorAlert('La nueva contraseña debe ser diferente a la actual.');
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Cambiando contraseña...',
            allowOutsideClick: false,
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-custom-title'
            },
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Usar la función de tu servicio existente (solo requiere instructorId y newPassword)
        const result = await changePassword(window.instructorId, nuevaContrasena);
        
        showSuccessAlert('Contraseña actualizada correctamente.');
        
        // Limpiar formulario y estados de validación
        document.getElementById('formularioCambioContrasena').reset();
        clearAllValidationStates();
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showErrorAlert('Error al cambiar la contraseña. Inténtalo de nuevo.');
    }
}

// Limpiar todos los estados de validación
function clearAllValidationStates() {
    const inputs = document.querySelectorAll('#formularioCambioContrasena input[type="password"]');
    inputs.forEach(input => {
        clearValidationState(input);
    });
    
    // Limpiar indicador de fuerza
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    if (strengthBar) strengthBar.style.width = '0%';
    if (strengthText) {
        strengthText.textContent = 'Fuerza de la contraseña';
        strengthText.style.color = 'var(--color-muted)';
    }
}

function showErrorAlert(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error de Validación',
        text: message,
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
        }
    });
}

function showSuccessAlert(message) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: message,
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
        }
    });
}