// Import the auth service
import { me } from './services/AuthInstructors/authInstructorService.js';

const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com';

// API URLs
const STUDENTS_API_URL = `${API_BASE_URL}/api/students/getAllStudents`;
const ADD_STUDENT_API_URL = `${API_BASE_URL}/api/students/newStudent`;
const UPDATE_STUDENT_API_URL = `${API_BASE_URL}/api/students/updateStudent/`;
const DELETE_STUDENT_API_URL = `${API_BASE_URL}/api/students/deleteStudent/`;
const LEVELS_API_URL = `${API_BASE_URL}/api/levels/getAllLevels`;
const GRADES_API_URL = `${API_BASE_URL}/api/grades/getAllGrades`;

// DOM Elements
const form = document.getElementById('user-form');
const fullNameEl = document.getElementById('fullName');
const apellidosEl = document.getElementById('apellidos');
const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const studentCardEl = document.getElementById('studentCard');
const idGradeEl = document.getElementById('idGrade');
const userIdEl = document.getElementById('userId');
const cancelBtn = document.getElementById('btn-cancel');
const submitBtn = document.getElementById('btn-submit');
const tbody = document.getElementById('users-tbody');
const filtroAnoEl = document.getElementById('filtro-ano');
const filtroGrupoEl = document.getElementById('filtro-grupo');
const buscadorUsuariosEl = document.getElementById('buscador-usuarios');

// Data variables
let studentsOriginal = [];
let levels = [];
let grades = [];
let userRole = null;

// -----------------------------------------------------
// API UTILITY FUNCTION
// -----------------------------------------------------

async function apiFetch(url, options = {}) {
    const defaultOptions = { credentials: 'include', ...options };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    let responseData;
    try {
        const text = await response.text();
        if (text) {
            responseData = JSON.parse(text);
        } else {
            return { datos: [], paginacion: {} };
        }
    } catch (parseError) {
        console.warn('Response was not valid JSON but HTTP was successful:', parseError);
        return { datos: [], paginacion: {} };
    }

    if (responseData.success === false) {
        let errorMessage = responseData.message || 'Error en la operación';
        if (response.status === 403) {
            errorMessage = "Acceso denegado (403). Verifique su sesión.";
        }
        throw new Error(errorMessage);
    }

    let extractedData = responseData.data || responseData;
    let paginationInfo = {};

    if (extractedData) {
        if (extractedData.content && Array.isArray(extractedData.content)) {
            extractedData = extractedData.content;
            paginationInfo = { number: extractedData.number, totalPages: extractedData.totalPages }; 
        } else if (Array.isArray(extractedData)) {
            // Already an array
        }
    } else {
        extractedData = [];
    }

    return { 
        datos: extractedData, 
        paginacion: paginationInfo 
    };
}

// -----------------------------------------------------
// USER ROLE MANAGEMENT
// -----------------------------------------------------

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

function handleRoleBasedUI() {
    const formContainer = document.querySelector('.form-container');
    const glassCard = document.querySelector('.glass-card');
    
    console.log('Handling UI for role:', userRole);
    
    if (userRole === 'Docente') {
        if (formContainer) {
            formContainer.style.display = 'none';
            formContainer.style.visibility = 'hidden';
            console.log('Form hidden for Docente role');
        }
        
        if (glassCard && glassCard.contains(document.getElementById('user-form'))) {
            glassCard.style.display = 'none';
            glassCard.style.visibility = 'hidden';
        }
        
        addDocenteMessage();
    } else {
        if (formContainer) {
            formContainer.style.display = 'block';
            formContainer.style.visibility = 'visible';
            console.log('Form shown for role:', userRole);
        }
        
        if (glassCard && glassCard.contains(document.getElementById('user-form'))) {
            glassCard.style.display = 'block';
            glassCard.style.visibility = 'visible';
        }
    }
}

function addDocenteMessage() {
    const mainContainer = document.querySelector('.contenedor-principal');
    
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
        Como usuario Docente, solo puede consultar la información de los estudiantes. 
        Las funciones de creación, edición y eliminación están restringidas.
    `;
    
    mainContainer.insertBefore(messageDiv, mainContainer.firstChild);
}

// -----------------------------------------------------
// DATA LOADING FUNCTIONS
// -----------------------------------------------------

async function cargarLevels() {
    try {
        const result = await apiFetch(LEVELS_API_URL);
        levels = result.datos;
        
        if (filtroAnoEl) {
            populateYearFilter();
        }
    } catch (error) {
        console.error('Error al cargar niveles:', error);
        showMessage('Error al cargar niveles: ' + error.message, 'error');
    }
}

function populateYearFilter() {
    if (!filtroAnoEl) return;
    
    filtroAnoEl.innerHTML = '<option value="">Todos los años</option>';
    
    if (!levels || levels.length === 0) {
        return;
    }
    
    levels.forEach(level => {
        if (level && level.id && level.levelName) { 
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = level.levelName;
            filtroAnoEl.appendChild(option);
        }
    });
}

async function cargarGrupos() {
    try {
        const result = await apiFetch(GRADES_API_URL);
        grades = result.datos;
        
        if (filtroGrupoEl) {
            filtroGrupoEl.innerHTML = '<option value="">Todos los grupos</option>';
            grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.gradeGroup;
                option.textContent = `Grupo ${grade.gradeGroup}`;
                filtroGrupoEl.appendChild(option);
            });
        }
        
        if (idGradeEl) {
            idGradeEl.innerHTML = '<option value="">Seleccione un grupo</option>';
            grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.gradeId;
                option.textContent = `Grupo ${grade.gradeGroup} - Nivel ${grade.levelId}`;
                idGradeEl.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar grupos:', error);
        showMessage('Error al cargar grupos: ' + error.message, 'error');
    }
}

async function cargarEstudiantes() {
    try {
        const result = await apiFetch(STUDENTS_API_URL);
        studentsOriginal = result.datos;
        filtrarYMostrarEstudiantes();
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        showMessage('Error al cargar estudiantes: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// FILTERING AND RENDERING
// -----------------------------------------------------

function filtrarYMostrarEstudiantes() {
    let lista = studentsOriginal.slice();
    
    const levelId = filtroAnoEl ? filtroAnoEl.value : '';
    if (levelId) {
        lista = lista.filter(i => String(i.levelId) === levelId);
    }
    
    const grupo = filtroGrupoEl ? filtroGrupoEl.value : '';
    if (grupo) {
        lista = lista.filter(i => String(i.gradeGroup) === grupo);
    }
    
    const texto = buscadorUsuariosEl ? buscadorUsuariosEl.value.trim().toLowerCase() : '';
    if (texto) {
        lista = lista.filter(i =>
            `${i.firstName} ${i.lastName}`.toLowerCase().includes(texto) ||
            (i.email && i.email.toLowerCase().includes(texto)) ||
            (i.studentCard && i.studentCard.toLowerCase().includes(texto))
        );
    }
    
    cargarTablaEstudiantes(lista);
}

function cargarTablaEstudiantes(students) {
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        
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
                    <button class="btn-futurista btn-editar-futurista" onclick="cargarParaEditarEstudiante('${student.studentId}')" title="Editar estudiante">
                        <i class="fas fa-edit"></i>
                        <span>Editar</span>
                    </button>
                    <button class="btn-futurista btn-eliminar-futurista" onclick="borrarEstudiante('${student.studentId}')" title="Eliminar estudiante">
                        <i class="fas fa-trash"></i>
                        <span>Eliminar</span>
                    </button>
                </div>
            `;
        }

        row.innerHTML = `
            <td>${student.studentCard || 'N/A'}</td>
            <td>${student.firstName || 'N/A'}</td>
            <td>${student.lastName || 'N/A'}</td>
            <td>${student.email || 'N/A'}</td>
            <td>Grupo ${student.gradeGroup || 'N/A'}</td>
            <td>${actionButtons}</td>
        `;
        tbody.appendChild(row);
    });

    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="tabla-vacia">
                    <i class="fas fa-graduation-cap"></i>
                    <p>No se encontraron estudiantes que coincidan con los filtros aplicados.</p>
                </td>
            </tr>
        `;
    }
}

// -----------------------------------------------------
// CRUD OPERATIONS
// -----------------------------------------------------

async function createStudent(studentData) {
    try {
        console.log('Enviando datos para crear estudiante:', studentData);
        const response = await fetch(ADD_STUDENT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        return true;
    } catch (error) {
        throw new Error(error.message || 'Error desconocido al crear estudiante.');
    }
}

async function updateStudent(id, studentData) {
    try {
        console.log('Enviando datos para actualizar estudiante:', id, studentData);
        const response = await fetch(`${UPDATE_STUDENT_API_URL}${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        return true;
    } catch (error) {
        throw new Error(error.message || 'Error desconocido al actualizar estudiante.');
    }
}

async function deleteStudent(id) {
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para eliminar estudiantes', 'error');
        return;
    }
    
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar este estudiante? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
        }
    });

    if (!result.isConfirmed) {
        return;
    }
    
    try {
        const response = await fetch(`${DELETE_STUDENT_API_URL}${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        await cargarEstudiantes();
        showMessage('Estudiante eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar estudiante:', error);
        showMessage('Error al eliminar el estudiante: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// FORM HANDLING
// -----------------------------------------------------

function validateForm() {
    const fullName = fullNameEl.value.trim();
    const lastName = apellidosEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    const studentCard = studentCardEl.value.trim();
    const gradeId = idGradeEl.value;
    const isEditing = !!userIdEl.value;

    if (!studentCard || studentCard.length < 5) {
        showMessage('El carnet debe tener al menos 5 caracteres', 'error');
        studentCardEl.focus();
        return false;
    }
    
    if (!fullName || fullName.length < 3) {
        showMessage('El nombre debe tener al menos 3 caracteres', 'error');
        fullNameEl.focus();
        return false;
    }
    
    if (!lastName || lastName.length < 2) {
        showMessage('El apellido debe tener al menos 2 caracteres', 'error');
        apellidosEl.focus();
        return false;
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage('Ingrese un email válido', 'error');
        emailEl.focus();
        return false;
    }
    
    if (!isEditing && (!password || password.length < 6)) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        passwordEl.focus();
        return false;
    }
    
    if (!gradeId) {
        showMessage('Debe seleccionar un grupo', 'error');
        idGradeEl.focus();
        return false;
    }
    
    return true;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para crear o actualizar estudiantes', 'error');
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    const isEditing = !!userIdEl.value;
    
    const studentData = {
        studentCard: studentCardEl.value.trim(),
        firstName: fullNameEl.value.trim(),
        lastName: apellidosEl.value.trim(),
        email: emailEl.value.trim(),
        gradeId: Number(idGradeEl.value),
        roleId: 5
    };
    
    if (!isEditing || (isEditing && passwordEl.value.trim())) {
        studentData.password = passwordEl.value.trim();
    }
    
    if (isEditing) {
        studentData.studentId = Number(userIdEl.value);
    }
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = isEditing ? '<i class="fas fa-sync-alt"></i><span>Actualizando...</span>' : '<i class="fas fa-spinner fa-spin"></i><span>Creando...</span>';
        }
        
        if (isEditing) {
            await updateStudent(userIdEl.value, studentData);
        } else {
            await createStudent(studentData);
        }
        
        resetForm();
        await cargarEstudiantes();
        showMessage(`Estudiante ${isEditing ? 'actualizado' : 'creado'} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al guardar estudiante:', error);
        showMessage(`Error al guardar el estudiante: ${error.message}`, 'error');
        
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEditing ? '<i class="fas fa-sync-alt"></i><span>Actualizar Estudiante</span>' : '<i class="fas fa-user-plus"></i><span>Agregar Estudiante</span>';
        }
    }
}

function resetForm() {
    if (form) {
        form.reset();
    }
    if (userIdEl) {
        userIdEl.value = '';
    }
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i><span>Agregar Estudiante</span>';
    }
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    const contrasenaGroup = document.getElementById('campo-contrasena');
    if (contrasenaGroup) contrasenaGroup.style.display = '';
    if (passwordEl) {
        passwordEl.disabled = false;
        passwordEl.placeholder = 'Contraseña segura';
    }
}

async function cargarParaEditarEstudiante(id) {
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para editar estudiantes', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/getStudentById/${id}`, { 
            credentials: 'include' 
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        const student = result.data || result;
        
        fullNameEl.value = student.firstName || '';
        apellidosEl.value = student.lastName || '';
        studentCardEl.value = student.studentCard || '';
        emailEl.value = student.email || '';
        passwordEl.value = '';
        passwordEl.placeholder = 'Dejar vacío para mantener contraseña actual';
        
        setTimeout(() => {
            idGradeEl.value = student.gradeId || '';
        }, 0);
        
        userIdEl.value = student.studentId || '';
        submitBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Actualizar Estudiante</span>';
        cancelBtn.style.display = 'inline-flex';
        
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
        }
        
        showMessage('Estudiante cargado para edición', 'success');
    } catch (error) {
        console.error('Error al cargar estudiante para editar:', error);
        showMessage('Error al cargar el estudiante para editar: ' + error.message, 'error');
    }
}

// -----------------------------------------------------
// UTILITY FUNCTIONS
// -----------------------------------------------------

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showMessage(message, type) {
    const iconType = type === 'error' ? 'error' : 'success';
    const title = type === 'error' ? 'Error' : 'Éxito';
    
    Swal.fire({
        title: title,
        text: message,
        icon: iconType,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
        toast: true,
        position: 'top-end',
        customClass: {
            popup: 'swal-custom-popup',
            title: 'swal-custom-title',
            content: 'swal-custom-content',
            confirmButton: 'swal-custom-confirm-button'
        }
    });
}

// -----------------------------------------------------
// EVENT LISTENERS AND INITIALIZATION
// -----------------------------------------------------

window.addEventListener('DOMContentLoaded', async () => {
    await getUserInfo();
    
    await Promise.all([
        cargarLevels(),
        cargarGrupos()
    ]);
    
    await cargarEstudiantes();
    setupEventListeners();
});

function setupEventListeners() {
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', resetForm);
    }
    if (filtroAnoEl) {
        filtroAnoEl.addEventListener('change', filtrarYMostrarEstudiantes);
    }
    if (filtroGrupoEl) {
        filtroGrupoEl.addEventListener('change', filtrarYMostrarEstudiantes);
    }
    if (buscadorUsuariosEl) {
        buscadorUsuariosEl.addEventListener('input', debounce(filtrarYMostrarEstudiantes, 300));
    }
}

// Export functions for global use
window.cargarParaEditarEstudiante = cargarParaEditarEstudiante;
window.borrarEstudiante = deleteStudent;