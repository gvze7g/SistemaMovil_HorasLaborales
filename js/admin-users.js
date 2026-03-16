// Import the auth service
import { me } from './services/AuthInstructors/authInstructorService.js';

//Variable para la URL base de la API
const API_BASE = "https://sgma-66ec41075156.herokuapp.com/api";

// Endpoints
const ROLES_API_URL = `${API_BASE}/Roles/getAllRoles`;
const INSTRUCTORS_API_URL = `${API_BASE}/instructors/getAllInstructors`;
const LEVELS_API_URL = `${API_BASE}/levels/getAllLevels`;
const GRADES_API_URL = `${API_BASE}/grades/getAllGrades`;
const ADD_INSTRUCTOR_API_URL = `${API_BASE}/instructors/newInstructor`;
const UPDATE_INSTRUCTOR_API_URL = `${API_BASE}/instructors/updateInstructor/`; 

// Variables para obtener ID
const getById = (id) => document.getElementById(id);

// Elementos del formulario - adaptados a los IDs del HTML móvil
const formulario = getById('formulario-usuario');
const nombreCompletoEl = getById('nombreCompleto');
const apellidosEl = getById('apellidos');
const correoEl = getById('correo');
const contrasenaEl = getById('contrasena');
const idRolEl = getById('idRol');
const idLevelEl = getById('idLevel');
const fotoPerfilArchivoEl = getById('fotoPerfil-archivo');
const urlFotoPerfilEl = getById('url-foto-perfil');
const previsualizacionFotoPerfilEl = getById('previsualizacion-foto-perfil');
const idUsuarioEl = getById('idUsuario');

// Botones - adaptados a los IDs del HTML móvil
const btnCancelar = getById('btn-cancelar');
const btnEnviar = getById('btn-enviar');

// Tabla - adaptado al ID del HTML móvil
const cuerpoTablaUsuarios = getById('cuerpo-tabla-usuarios');

// Filtros y buscador - adaptados a los IDs del HTML móvil
const filtroAnoEl = getById('filtro-ano');
const filtroGrupoEl = getById('filtro-grupo');
const buscadorUsuariosEl = getById('buscador-usuarios');

let roles = [];
let instructoresOriginal = [];
let grades = [];
let userRole = null; // Variable para almacenar el rol del usuario

// -----------------------------------------------------
// FUNCIÓN PARA OBTENER INFORMACIÓN DEL USUARIO
// -----------------------------------------------------

/**
 * Obtiene la información del usuario autenticado y su rol
 */
async function getUserInfo() {
    try {
        const userInfo = await me();
        console.log('User info received:', userInfo);
        
        if (userInfo.authenticated && userInfo.instructor && userInfo.instructor.role) {
            userRole = userInfo.instructor.role;
            console.log('User role set to:', userRole);
            handleRoleBasedUI();
            return userInfo.instructor;
        }
        return null;
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        return null;
    }
}

/**
 * Controla la visibilidad y funcionalidad de la UI según el rol del usuario
 */
function handleRoleBasedUI() {
    const formContainer = document.querySelector('.form-container');
    const glassCard = document.querySelector('.glass-card');
    
    console.log('Handling UI for role:', userRole);
    
    if (userRole === 'Docente') {
        // Ocultar el formulario para usuarios Docente
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.style.visibility = 'hidden';
            console.log('Form hidden for Docente role');
        }
        
        // También ocultar la glass-card si es necesario
        if (glassCard && glassCard.contains(document.getElementById('formulario-usuario'))) {
            glassCard.style.display = 'none';
            glassCard.style.visibility = 'hidden';
        }
        
        // Agregar mensaje informativo
        addDocenteMessage();
    } else {
        // Mostrar el formulario para otros roles
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.style.visibility = 'visible';
            console.log('Form shown for role:', userRole);
        }
        
        if (glassCard && glassCard.contains(document.getElementById('formulario-usuario'))) {
            glassCard.style.display = 'block';
            glassCard.style.visibility = 'visible';
        }
    }
}

/**
 * Agrega un mensaje informativo para usuarios Docente
 */
function addDocenteMessage() {
    const mainContainer = document.querySelector('.contenedor-principal');
    
    // Verificar si ya existe el mensaje
    if (document.querySelector('.docente-info-message')) {
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'docente-info-message glass-card';
    messageDiv.style.cssText = `
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: var(--border-radius-main);
        padding: var(--spacing-xl);
        margin: var(--spacing-xl) 0;
        color: var(--accent-blue);
        text-align: center;
        font-weight: 500;
        backdrop-filter: blur(20px);
    `;
    messageDiv.innerHTML = `
        <i class="fas fa-info-circle" style="margin-right: 8px; font-size: 1.2rem;"></i>
        Como usuario Docente, solo puede consultar la información de los docentes. 
        Las funciones de creación, edición y eliminación están restringidas.
    `;
    
    // Insertar el mensaje después del hero-header
    const heroHeader = mainContainer.querySelector('.hero-header');
    if (heroHeader) {
        heroHeader.insertAdjacentElement('afterend', messageDiv);
    } else {
        mainContainer.insertBefore(messageDiv, mainContainer.firstChild);
    }
}

async function cargarRoles() {
  try {
    const res = await fetch(ROLES_API_URL, { credentials: 'include' });
    const data = await res.json();
    roles = Array.isArray(data) ? data : (data.data || []);
    if (idRolEl) {
      idRolEl.innerHTML = '<option value="">Seleccione un rol</option>';
      roles.forEach(rol => {
        const opcion = document.createElement('option');
        opcion.value = rol.rolId;
        opcion.textContent = rol.rolName;
        idRolEl.appendChild(opcion);
      });
    }
  } catch (error) {
    console.error('Error al cargar los roles:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los roles. Intenta de nuevo más tarde.',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
  }
}

async function cargarLevels() {
  try {
    const res = await fetch(LEVELS_API_URL, { credentials: 'include' });
    const data = await res.json();
    const levels = Array.isArray(data) ? data : (data.data || []);
    
    if (idLevelEl) {
      idLevelEl.innerHTML = '<option value="">Seleccione el año</option>';
      levels.forEach(level => {
        const opcion = document.createElement('option');
        opcion.value = level.levelId || level.id;
        opcion.textContent = `${level.levelName} (${level.levelId || level.id})`;
        idLevelEl.appendChild(opcion);
      });
    }
    
    // Also populate filter dropdown
    if (filtroAnoEl) {
      filtroAnoEl.innerHTML = '<option value="">Todos los años</option>';
      levels.forEach(level => {
        const opcion = document.createElement('option');
        opcion.value = level.levelId || level.id;
        opcion.textContent = `${level.levelName}`;
        filtroAnoEl.appendChild(opcion);
      });
    }
  } catch (error) {
    console.error('Error al cargar los niveles:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los niveles académicos. Intenta de nuevo más tarde.',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
  }
}

async function cargarGrupos() {
  try {
    const res = await fetch(GRADES_API_URL, { credentials: 'include' });
    const data = await res.json();
    grades = Array.isArray(data) ? data : (data.data || []);
    if (filtroGrupoEl) {
      filtroGrupoEl.innerHTML = '<option value="">Todos los grupos</option>';
      grades.forEach(grade => {
        const opcion = document.createElement('option');
        opcion.value = grade.gradeGroup;
        opcion.textContent = `Grupo ${grade.gradeGroup}`;
        filtroGrupoEl.appendChild(opcion);
      });
    }
  } catch (error) {
    console.error('Error al cargar los grupos:', error);
  }
}

async function cargarUsuarios() {
  try {
    const res = await fetch(INSTRUCTORS_API_URL, { credentials: 'include' });
    const data = await res.json();
    let instructores = [];
    if (data && data.data && Array.isArray(data.data.content)) {
      instructores = data.data.content;
    }
    instructoresOriginal = instructores;
    filtrarYMostrarUsuarios();
  } catch (error) {
    console.error('Error al cargar los instructores:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los instructores. Intenta de nuevo más tarde.',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
  }
}

function filtrarYMostrarUsuarios() {
  let lista = instructoresOriginal.slice();

  // Filtro por año
  if (filtroAnoEl) {
    const levelId = filtroAnoEl.value;
    if (levelId) {
      lista = lista.filter(i => String(i.levelId) === levelId);
    }
  }

  // Filtro por grupo
  if (filtroGrupoEl) {
    const grupo = filtroGrupoEl.value;
    if (grupo) {
      lista = lista.filter(i => String(i.gradeGroup) === grupo);
    }
  }

  // Filtro por texto buscador
  if (buscadorUsuariosEl) {
    const texto = buscadorUsuariosEl.value.trim().toLowerCase();
    if (texto) {
      lista = lista.filter(i =>
        `${i.firstName} ${i.lastName}`.toLowerCase().includes(texto) ||
        (i.email && i.email.toLowerCase().includes(texto))
      );
    }
  }

  cargarTabla(lista);
}

function cargarTabla(instructores) {
  if (!cuerpoTablaUsuarios) return;
  
  cuerpoTablaUsuarios.innerHTML = '';
  instructores.forEach(instructor => {
    // Generar botones de acción según el rol
    let actionButtons = '';
    if (userRole === 'Docente') {
      actionButtons = `
        <div class="acciones-futuristas">
          <button class="btn-futurista btn-ver-futurista" disabled style="opacity: 0.5; cursor: not-allowed;" title="Sin permisos para ver detalles">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      `;
    } else {
      actionButtons = `
        <div class="acciones-futuristas">
          <button class="btn-futurista btn-editar-futurista" onclick="cargarParaEditarUsuario('${instructor.instructorId}')" title="Editar usuario">
            <i class="fas fa-edit"></i>
            <span>Editar</span>
          </button>
          <button class="btn-futurista btn-eliminar-futurista" onclick="borrarUsuario('${instructor.instructorId}')" title="Eliminar usuario">
            <i class="fas fa-trash"></i>
            <span>Eliminar</span>
          </button>
        </div>
      `;
    }

    cuerpoTablaUsuarios.innerHTML += `
        <tr>
            <td>
              <img src="${instructor.instructorImage || 'https://i.ibb.co/N6fL89pF/yo.jpg'}" 
                   alt="Avatar de ${instructor.firstName} ${instructor.lastName}" 
                   class="avatar-futurista" />
            </td>
            <td>${instructor.firstName} ${instructor.lastName}</td>
            <td>${instructor.email}</td>
            <td>${instructor.roleName || 'N/A'}</td>
            <td>${instructor.levelName || 'N/A'}</td>
            <td>${actionButtons}</td>
        </tr>
    `;
  });

  // Si no hay instructores, mostrar mensaje vacío
  if (instructores.length === 0) {
    cuerpoTablaUsuarios.innerHTML = `
      <tr>
        <td colspan="6" class="tabla-vacia">
          <i class="fas fa-users"></i>
          <p>No se encontraron docentes que coincidan con los filtros aplicados.</p>
        </td>
      </tr>
    `;
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  // Primero obtener información del usuario
  await getUserInfo();
  
  await cargarRoles();
  await cargarLevels();
  await cargarGrupos();
  await cargarUsuarios();

  if (filtroAnoEl) filtroAnoEl.addEventListener('change', filtrarYMostrarUsuarios);
  if (filtroGrupoEl) filtroGrupoEl.addEventListener('change', filtrarYMostrarUsuarios);
  if (buscadorUsuariosEl) buscadorUsuariosEl.addEventListener('input', filtrarYMostrarUsuarios);
});

// Event listeners adaptados a los elementos del HTML móvil
if (fotoPerfilArchivoEl) {
  fotoPerfilArchivoEl.addEventListener('change', function() {
    const archivo = this.files[0];
    const previewContainer = document.getElementById('preview-container');
    
    if (archivo) {
      const lector = new FileReader();
      lector.onload = function(e) {
        if (previsualizacionFotoPerfilEl) {
          previsualizacionFotoPerfilEl.src = e.target.result;
        }
        if (previewContainer) {
          previewContainer.style.display = 'block';
        }
      };
      lector.readAsDataURL(archivo);
    } else {
      if (previewContainer) previewContainer.style.display = 'none';
      if (previsualizacionFotoPerfilEl) {
        previsualizacionFotoPerfilEl.src = urlFotoPerfilEl ? urlFotoPerfilEl.value || '' : '';
      }
    }
  });
}

if (btnCancelar) {
  btnCancelar.addEventListener('click', () => {
    if (formulario) formulario.reset();
    if (idUsuarioEl) idUsuarioEl.value = '';
    if (btnEnviar) btnEnviar.textContent = 'Agregar Usuario';
    if (btnCancelar) btnCancelar.style.display = 'none';
    if (fotoPerfilArchivoEl) fotoPerfilArchivoEl.value = '';
    if (previsualizacionFotoPerfilEl) previsualizacionFotoPerfilEl.src = '';
    
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) previewContainer.style.display = 'none';
    
    if (contrasenaEl) {
      contrasenaEl.disabled = false;
      contrasenaEl.placeholder = 'Contraseña segura';
    }
    
    const contrasenaGroup = document.getElementById('campo-contrasena');
    if (contrasenaGroup) contrasenaGroup.style.display = '';
  });
}

async function subirImagen(archivo) {
  const fd = new FormData();
  fd.append('image', archivo);
  fd.append('folder', 'instructors');
  try {
    const res = await fetch(`${API_BASE}/images/upload-to-folder`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    });
    const obj = await res.json();
    if (obj.url) {
      return obj.url;
    } else {
      throw new Error('URL de imagen no encontrada en la respuesta de Cloudinary.');
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error de Subida',
      text: 'No se pudo subir la imagen. Intenta de nuevo.',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
    return null;
  }
}

if (formulario) {
  formulario.addEventListener('submit', async e => {
    e.preventDefault();

    // Verificar permisos antes de permitir creación/actualización
    if (userRole === 'Docente') {
      Swal.fire({
        icon: 'error',
        title: 'Sin permisos',
        text: 'No tiene permisos para crear o actualizar docentes',
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          content: 'swal-custom-content',
          confirmButton: 'swal-custom-confirm-button'
        }
      });
      return;
    }

    const firstName = nombreCompletoEl ? nombreCompletoEl.value.trim() : '';
    const lastName = apellidosEl ? apellidosEl.value.trim() : '';
    const email = correoEl ? correoEl.value.trim() : '';
    let password = contrasenaEl ? contrasenaEl.value.trim() : '';
    const isEditing = !!(idUsuarioEl && idUsuarioEl.value);
    const roleId = idRolEl ? idRolEl.value : '';
    const levelId = idLevelEl ? idLevelEl.value : '';

    // Validaciones frontend según DTO
    let errores = [];

    // firstName
    if (!firstName) {
      errores.push('El nombre es obligatorio.');
    } else {
      if (firstName.length < 5) errores.push('El nombre debe tener al menos 5 caracteres.');
      if (firstName.length > 50) errores.push('El nombre no puede exceder los 50 caracteres.');
    }

    // lastName
    if (!lastName) {
      errores.push('El apellido es obligatorio.');
    } else {
      if (lastName.length < 5) errores.push('El apellido debe tener al menos 5 caracteres.');
      if (lastName.length > 50) errores.push('El apellido no puede exceder los 50 caracteres.');
    }

    // email
    if (!email) {
      errores.push('El correo institucional es obligatorio.');
    } else {
      const emailRegex = /^[A-Za-z_]+@ricaldone\.edu\.sv$/;
      if (!emailRegex.test(email)) errores.push('Debe ser un correo institucional de instructor válido (ejemplo@ricaldone.edu.sv).');
    }

    // password validation - required for new users, optional for updates
    if (!isEditing) {
      if (!password) {
        errores.push('La contraseña es obligatoria.');
      } else {
        if (password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres.');
        if (password.length > 255) errores.push('La contraseña no puede exceder los 255 caracteres.');
      }
    } else {
      // When editing, password is optional but if provided, must meet criteria
      if (password && password.length > 0) {
        if (password.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres.');
        if (password.length > 255) errores.push('La contraseña no puede exceder los 255 caracteres.');
      }
    }

    // levelId
    if (!levelId || isNaN(levelId) || Number(levelId) <= 0) {
      errores.push('Selecciona un año académico válido.');
    }

    // roleId
    if (!roleId || isNaN(roleId) || Number(roleId) <= 0) {
      errores.push('Selecciona un rol válido.');
    }

    // instructorImage (se valida después de la subida)
    let instructorImage = urlFotoPerfilEl ? urlFotoPerfilEl.value : '';
    if (fotoPerfilArchivoEl && fotoPerfilArchivoEl.files.length > 0) {
      const nuevaUrlFoto = await subirImagen(fotoPerfilArchivoEl.files[0]);
      if (nuevaUrlFoto) {
        instructorImage = nuevaUrlFoto;
      } else {
        errores.push('No se pudo subir la imagen del instructor.');
      }
    } else if (!instructorImage) {
      instructorImage = '';
    }
    if (!instructorImage) {
      errores.push('La imagen del instructor es obligatoria.');
    }

    // Si hay errores, muestra todos y no envía la solicitud
    if (errores.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Errores en el formulario',
        html: '<ul style="text-align:left;">' + errores.map(e => `<li>${e}</li>`).join('') + '</ul>',
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          content: 'swal-custom-content',
          confirmButton: 'swal-custom-confirm-button'
        }
      });
      return;
    }

    // Estructura para el registro/actualización de instructores
    const cargaUtil = {
      firstName,
      lastName,
      email,
      levelId: Number(levelId),
      roleId: Number(roleId),
      instructorImage
    };
    
    // Include password for new users or when updating with a new password
    if (!isEditing || (isEditing && password && password.length > 0)) {
      cargaUtil.password = password;
    }
    
    if (isEditing) {
      cargaUtil.instructorId = Number(idUsuarioEl.value);
    }

    try {
      if (isEditing) {
        await fetch(`${UPDATE_INSTRUCTOR_API_URL}${idUsuarioEl.value}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(cargaUtil)
        });
        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'El instructor ha sido actualizado correctamente.',
          customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
          }
        });
      } else {
        await fetch(ADD_INSTRUCTOR_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(cargaUtil)
        });
        Swal.fire({
          icon: 'success',
          title: '¡Agregado!',
          text: 'El instructor ha sido agregado correctamente.',
          customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar instructor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el instructor. Intenta de nuevo.',
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          content: 'swal-custom-content',
          confirmButton: 'swal-custom-confirm-button'
        }
      });
    }

    // Reset form after successful submission
    if (formulario) formulario.reset();
    if (idUsuarioEl) idUsuarioEl.value = '';
    if (btnCancelar) btnCancelar.style.display = 'none';
    if (btnEnviar) btnEnviar.textContent = 'Agregar Usuario';
    if (fotoPerfilArchivoEl) fotoPerfilArchivoEl.value = '';
    if (previsualizacionFotoPerfilEl) previsualizacionFotoPerfilEl.src = '';
    if (contrasenaEl) contrasenaEl.disabled = false;
    
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) previewContainer.style.display = 'none';
    
    cargarUsuarios();
  });
}

async function cargarParaEditarUsuario(id) {
  // Verificar permisos antes de permitir edición
  if (userRole === 'Docente') {
    Swal.fire({
      icon: 'error',
      title: 'Sin permisos',
      text: 'No tiene permisos para editar docentes',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/instructors/getInstructorById/${id}`, {
      credentials: 'include'
    });
    const result = await res.json();
    const instructor = result.data || {};

    if (nombreCompletoEl) nombreCompletoEl.value = instructor.firstName || '';
    if (apellidosEl) apellidosEl.value = instructor.lastName || '';
    if (correoEl) correoEl.value = instructor.email || '';
    
    // Keep password field visible and empty for optional password update
    const contrasenaGroup = document.getElementById('campo-contrasena');
    if (contrasenaGroup) contrasenaGroup.style.display = '';
    if (contrasenaEl) {
      contrasenaEl.value = '';
      contrasenaEl.placeholder = 'Dejar vacío para mantener contraseña actual';
    }

    if (idRolEl) idRolEl.value = instructor.roleId || '';
    
    // Use setTimeout to ensure the options are loaded
    if (idLevelEl) {
      setTimeout(() => {
        idLevelEl.value = instructor.levelId || '';
      }, 100);
    }

    if (urlFotoPerfilEl) urlFotoPerfilEl.value = instructor.instructorImage || '';
    
    // Show existing image in preview if available
    const previewContainer = document.getElementById('preview-container');
    if (instructor.instructorImage && previsualizacionFotoPerfilEl) {
      previsualizacionFotoPerfilEl.src = instructor.instructorImage;
      if (previewContainer) previewContainer.style.display = 'block';
    } else {
      if (previewContainer) previewContainer.style.display = 'none';
    }
    
    if (fotoPerfilArchivoEl) fotoPerfilArchivoEl.value = '';
    if (idUsuarioEl) idUsuarioEl.value = instructor.instructorId || '';

    if (btnEnviar) btnEnviar.textContent = 'Actualizar Usuario';
    if (btnCancelar) btnCancelar.style.display = 'inline-flex';
  } catch (error) {
    console.error('Error al cargar usuario para editar:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar la información del usuario para editar.',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
  }
}

async function borrarUsuario(id) {
  // Verificar permisos antes de permitir eliminación
  if (userRole === 'Docente') {
    Swal.fire({
      icon: 'error',
      title: 'Sin permisos',
      text: 'No tiene permisos para eliminar docentes',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
        content: 'swal-custom-content',
        confirmButton: 'swal-custom-confirm-button'
      }
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción eliminará el usuario de forma permanente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    customClass: {
      popup: 'swal-custom-popup',
      title: 'swal-custom-title',
      content: 'swal-custom-content',
      confirmButton: 'swal-custom-confirm-button',
      cancelButton: 'swal-custom-cancel-button'
    }
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`${API_BASE}/instructors/deleteInstructor/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'El instructor ha sido eliminado correctamente.',
          customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
          }
        });
        cargarUsuarios();
      } else {
        throw new Error('No se pudo eliminar el instructor');
      }
    } catch (error) {
      console.error('Error al eliminar instructor:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el instructor. Intenta de nuevo.',
        customClass: {
          popup: 'swal-custom-popup',
          title: 'swal-custom-title',
          content: 'swal-custom-content',
          confirmButton: 'swal-custom-confirm-button'
        }
      });
    }
  }
}

// Exportar funciones para uso global (necesario para onclick en el HTML)
window.cargarParaEditarUsuario = cargarParaEditarUsuario;
window.borrarUsuario = borrarUsuario;