// Import the auth service
import { me } from './services/AuthInstructors/authInstructorService.js';

const API_BASE_URL = 'https://sgma-66ec41075156.herokuapp.com';

// -----------------------------------------------------
// REFERENCIAS A ELEMENTOS DEL DOM
// -----------------------------------------------------
const formulario = document.getElementById('formulario-modulo');
const nombreModuloEl = document.getElementById('nombreModulo');
const codigoModuloEl = document.getElementById('codigoModulo');
const idModuloEl = document.getElementById('idModulo');
const comboLevelEl = document.getElementById('comboLevel');
const comboInstructorEl = document.getElementById('comboInstructor');
const botonCancelar = document.getElementById('btn-cancelar');
const botonEnviar = document.getElementById('btn-enviar');
const cuerpoTabla = document.getElementById('cuerpo-tabla-modulos');
const buscadorModulosEl = document.getElementById('buscador-modulos');
const filtroAnoModuloEl = document.getElementById('filtro-ano-modulo');

// Variables para datos y paginación
let levels = [];
let instructors = [];
let modules = [];
let userRole = null;
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalElements = 0;

// -----------------------------------------------------
// 1. UTILERÍA DE API
// -----------------------------------------------------

async function apiFetch(url, options = {}) {
    const defaultOptions = { credentials: 'include', ...options };
    
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
        let errorMessage = `Error HTTP: ${response.status} - ${response.statusText}`;
        if (response.status === 403) {
            errorMessage = "Acceso denegado (403). Verifique su sesión.";
        }
        throw new Error(errorMessage);
    }

    // For DELETE operations, check if response has content
    if (options.method === 'DELETE' && response.status === 200) {
        // Some DELETE endpoints return empty body or just success message
        const text = await response.text();
        if (!text) {
            return { success: true, message: 'Eliminado exitosamente' };
        }
        
        try {
            const data = JSON.parse(text);
            return data;
        } catch {
            return { success: true, message: text };
        }
    }

    const responseData = await response.json();

    // Only check for success property if it exists in the response
    if (responseData.hasOwnProperty('success') && !responseData.success) {
        let errorMessage = responseData.message || 'Error en la operación';
        throw new Error(errorMessage);
    }

    return responseData;
}

// -----------------------------------------------------
// 2. CARGA DE DATOS Y POBLACIÓN DE COMBOS
// -----------------------------------------------------

async function loadLevels() {
    try {
        console.log('Iniciando carga de niveles...');
        const result = await apiFetch(`${API_BASE_URL}/api/levels/getAllLevels`);
        
        levels = result.data;
        console.log('Niveles extraídos:', levels);
        
        if (comboLevelEl) {
            populateLevelsCombo();
        }
    } catch (error) {
        console.error('Error al cargar niveles:', error);
        showMessage('Error al cargar niveles: ' + error.message, 'error');
    }
}

async function loadInstructors() {
    try {
        console.log('Iniciando carga de instructores...');
        const result = await apiFetch(`${API_BASE_URL}/api/instructors/getAllInstructors`);
        
        instructors = result.data.content || result.data;
        console.log('Instructores extraídos:', instructors);
        
        if (comboInstructorEl) {
            populateInstructorsCombo();
        }
    } catch (error) {
        console.error('Error al cargar instructores:', error);
        showMessage('Error al cargar instructores: ' + error.message, 'error');
    }
}

function populateLevelsCombo() {
    if (!comboLevelEl) return;
    
    comboLevelEl.innerHTML = '<option value="">Seleccione un nivel</option>';
    
    if (!levels || levels.length === 0) {
        comboLevelEl.innerHTML += '<option value="" disabled>No hay niveles disponibles</option>';
        return;
    }
    
    levels.forEach(level => {
        if (level && level.id && level.levelName) { 
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = level.levelName;
            comboLevelEl.appendChild(option);
        } else {
            console.warn('Nivel con formato inválido omitido:', level);
        }
    });
    
    populateYearFilter();
}

function populateYearFilter() {
    if (!filtroAnoModuloEl) return;
    
    filtroAnoModuloEl.innerHTML = '<option value="">Todos los años</option>';
    
    if (!levels || levels.length === 0) {
        return;
    }
    
    levels.forEach(level => {
        if (level && level.id && level.levelName) { 
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = level.levelName;
            filtroAnoModuloEl.appendChild(option);
        }
    });
}

function populateInstructorsCombo() {
    if (!comboInstructorEl) return;
    
    comboInstructorEl.innerHTML = '<option value="">Seleccione un instructor</option>';
    
    if (!instructors || instructors.length === 0) {
        comboInstructorEl.innerHTML += '<option value="" disabled>No hay instructores disponibles</option>';
        return;
    }
    
    instructors.forEach(instructor => {
        if (instructor && instructor.instructorId && instructor.firstName && instructor.lastName) {
            const option = document.createElement('option');
            option.value = instructor.instructorId;
            option.textContent = `${instructor.firstName} ${instructor.lastName}`;
            comboInstructorEl.appendChild(option);
        }
    });
}

// -----------------------------------------------------
// 3. LÓGICA DE MÓDULOS (CRUD) - ACTUALIZADA CON PAGINACIÓN
// -----------------------------------------------------

async function loadModules(page = 0, size = 10, searchTerm = '', levelId = '') {
    try {
        let url = `${API_BASE_URL}/api/modules/getAllModules?page=${page}&size=${size}`;
        
        // Agregar parámetros de búsqueda si existen
        if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
        }
        if (levelId) {
            url += `&levelId=${levelId}`;
        }
        
        const responseData = await apiFetch(url);
        
        // Extraer datos de paginación
        const { content, number, size: responseSize, totalPages: responseTotalPages, totalElements: responseTotalElements } = responseData.data;
        
        modules = content || [];
        currentPage = number;
        pageSize = responseSize;
        totalPages = responseTotalPages;
        totalElements = responseTotalElements;
        
        renderModulesTable();
        renderPagination();
        
    } catch (error) {
        console.error('Error al cargar módulos:', error);
        showMessage('Error al cargar módulos: ' + error.message, 'error');
    }
}

async function createModule(moduleData) {
    try {
        console.log('Enviando datos para crear módulo:', moduleData);

        await apiFetch(`${API_BASE_URL}/api/modules/newModule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });

    } catch (error) {
        throw new Error(error.message || 'Error desconocido al crear módulo.');
    }
}

async function updateModule(id, moduleData) {
    try {
        console.log('Enviando datos para actualizar módulo:', id, moduleData);

        await apiFetch(`${API_BASE_URL}/api/modules/updateModule/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(moduleData)
        });

    } catch (error) {
        throw new Error(error.message || 'Error desconocido al actualizar módulo.');
    }
}

async function deleteModule(id) {
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para eliminar módulos', 'error');
        return;
    }
    
    const result = await Swal.fire({
        title: '¿Está seguro?',
        text: '¿Desea eliminar este módulo? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) {
        return;
    }
    
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/modules/deleteModule/${id}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response:', response);
        
        // Recargar con paginación actual
        await loadModules(currentPage, pageSize, getCurrentSearchTerm(), getCurrentLevelFilter());
        showMessage('Módulo eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar módulo:', error);
        showMessage('Error al eliminar el módulo: ' + error.message, 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para crear o actualizar módulos', 'error');
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    const levelId = parseInt(comboLevelEl.value);
    const instructorId = parseInt(comboInstructorEl.value);

    const moduleData = {
        moduleCode: codigoModuloEl.value.trim(),
        moduleName: nombreModuloEl.value.trim(),
        levelId: levelId,
        instructorId: instructorId
    };
    
    const isEditing = idModuloEl.value !== '';
    
    try {
        if (botonEnviar) {
            botonEnviar.disabled = true;
            botonEnviar.innerHTML = isEditing ? '<i class="fas fa-sync-alt"></i><span>Actualizando...</span>' : '<i class="fas fa-spinner fa-spin"></i><span>Creando...</span>';
        }
        
        if (isEditing) {
            await updateModule(parseInt(idModuloEl.value), moduleData);
        } else {
            await createModule(moduleData);
        }
        
        resetForm();
        // Recargar módulos con paginación actual
        await loadModules(currentPage, pageSize, getCurrentSearchTerm(), getCurrentLevelFilter());
        showMessage(`Módulo ${isEditing ? 'actualizado' : 'creado'} exitosamente`, 'success');
        
    } catch (error) {
        console.error('Error al guardar módulo:', error);
        showMessage(`Error al guardar el módulo: ${error.message}`, 'error');
        
    } finally {
        if (botonEnviar) {
            botonEnviar.disabled = false;
            botonEnviar.innerHTML = isEditing ? '<i class="fas fa-sync-alt"></i><span>Actualizar Módulo</span>' : '<i class="fas fa-plus"></i><span>Agregar Módulo</span>';
        }
    }
}

// -----------------------------------------------------
// 4. RENDERING Y AUXILIARES - ACTUALIZADO CON PAGINACIÓN
// -----------------------------------------------------

function renderModulesTable() {
    if (!cuerpoTabla) return;
    cuerpoTabla.innerHTML = '';
    
    modules.forEach(module => {
        const row = document.createElement('tr');
        
        const instructorName = module.instructor?.instructorName || 'N/A';

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
                    <button class="btn-futurista btn-editar-futurista" onclick="editModule(${module.moduleId})" title="Editar módulo">
                        <i class="fas fa-edit"></i>
                        <span>Editar</span>
                    </button>
                    <button class="btn-futurista btn-eliminar-futurista" onclick="deleteModule(${module.moduleId})" title="Eliminar módulo">
                        <i class="fas fa-trash"></i>
                        <span>Eliminar</span>
                    </button>
                </div>
            `;
        }

        row.innerHTML = `
            <td>${module.moduleCode || 'N/A'}</td>
            <td>${module.moduleName || 'N/A'}</td>
            <td>${module.levelName || 'N/A'}</td>
            <td>${instructorName}</td>
            <td>${actionButtons}</td>
        `;
        cuerpoTabla.appendChild(row);
    });

    if (modules.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="5" class="tabla-vacia">
                    <i class="fas fa-puzzle-piece"></i>
                    <p>No se encontraron módulos que coincidan con los filtros aplicados.</p>
                </td>
            </tr>
        `;
    }
}

// Nueva función para renderizar paginación
function renderPagination() {
    // Eliminar paginación existente si existe
    const existingPagination = document.querySelector('.pagination-container');
    if (existingPagination) {
        existingPagination.remove();
    }

    // Solo mostrar paginación si hay más de una página
    if (totalPages <= 1) return;

    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';

    let paginationHTML = `
        <div class="pagination-info">
            <span>Mostrando ${(currentPage * pageSize) + 1} - ${Math.min((currentPage + 1) * pageSize, totalElements)} de ${totalElements} módulos</span>
        </div>
        <div class="pagination-controls">
    `;

    // Botón anterior
    if (currentPage > 0) {
        paginationHTML += `
            <button class="btn-pagination" onclick="changePage(${currentPage - 1})" title="Página anterior">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    } else {
        paginationHTML += `
            <button class="btn-pagination disabled" disabled>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }

    // Números de página
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        paginationHTML += `
            <button class="btn-pagination ${isActive ? 'active' : ''}" 
                    onclick="changePage(${i})" 
                    ${isActive ? 'disabled' : ''}>
                ${i + 1}
            </button>
        `;
    }

    // Botón siguiente
    if (currentPage < totalPages - 1) {
        paginationHTML += `
            <button class="btn-pagination" onclick="changePage(${currentPage + 1})" title="Página siguiente">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    } else {
        paginationHTML += `
            <button class="btn-pagination disabled" disabled>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;

    // Insertar después de la tabla
    const tablaContainer = document.querySelector('.tabla-revolucionaria');
    if (tablaContainer) {
        tablaContainer.insertAdjacentElement('afterend', paginationContainer);
    }
}

// Función para cambiar de página
async function changePage(page) {
    if (page >= 0 && page < totalPages && page !== currentPage) {
        await loadModules(page, pageSize, getCurrentSearchTerm(), getCurrentLevelFilter());
    }
}

// Funciones auxiliares para obtener filtros actuales
function getCurrentSearchTerm() {
    return buscadorModulosEl ? buscadorModulosEl.value.toLowerCase() : '';
}

function getCurrentLevelFilter() {
    return filtroAnoModuloEl ? filtroAnoModuloEl.value : '';
}

// Actualizar función de filtrado para usar paginación
function filterModules() {
    // Resetear a la primera página al filtrar
    loadModules(0, pageSize, getCurrentSearchTerm(), getCurrentLevelFilter());
}

function editModule(id) {
    if (userRole === 'Docente') {
        showMessage('No tiene permisos para editar módulos', 'error');
        return;
    }
    
    const module = modules.find(m => m.moduleId === id);
    if (!module) {
        showMessage('Error: Módulo no encontrado', 'error');
        return;
    }
    
    idModuloEl.value = module.moduleId;
    codigoModuloEl.value = module.moduleCode || '';
    nombreModuloEl.value = module.moduleName || '';
    
    if (module.levelId && comboLevelEl) {
        comboLevelEl.value = String(module.levelId); 
    }
    if (module.instructorId && comboInstructorEl) {
        comboInstructorEl.value = String(module.instructorId);
    }
    
    if (botonEnviar) {
        botonEnviar.innerHTML = '<i class="fas fa-sync-alt"></i><span>Actualizar Módulo</span>';
        botonEnviar.className = 'boton-moderno boton-primario';
    }
    
    if (botonCancelar) {
        botonCancelar.style.display = 'flex';
    }
    
    if (formulario) {
        formulario.scrollIntoView({ behavior: 'smooth' });
    }
    
    showMessage('Módulo cargado para edición', 'success');
}

function resetForm() {
    if (formulario) {
        formulario.reset();
    }
    if (idModuloEl) {
        idModuloEl.value = '';
    }
    if (botonEnviar) {
        botonEnviar.innerHTML = '<i class="fas fa-plus"></i><span>Agregar Módulo</span>';
        botonEnviar.className = 'boton-moderno boton-primario';
    }
    if (botonCancelar) {
        botonCancelar.style.display = 'none';
    }
}

function validateForm() {
    const codigo = codigoModuloEl.value.trim();
    const nombre = nombreModuloEl.value.trim();
    const levelValue = comboLevelEl.value;
    const instructorValue = comboInstructorEl.value;
    
    if (!codigo) {
        showMessage('El código del módulo es requerido', 'error');
        codigoModuloEl.focus();
        return false;
    }
    
    if (!nombre) {
        showMessage('El nombre del módulo es requerido', 'error');
        nombreModuloEl.focus();
        return false;
    }
    
    if (!levelValue) {
        showMessage('Debe seleccionar un nivel', 'error');
        comboLevelEl.focus();
        return false;
    }
    
    if (!instructorValue) {
        showMessage('Debe seleccionar un instructor', 'error');
        comboInstructorEl.focus();
        return false;
    }
    
    return true;
}

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
        position: 'top-end'
    });
}

// -----------------------------------------------------
// 5. INICIALIZACIÓN Y EVENT LISTENERS
// -----------------------------------------------------

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM cargado, iniciando carga de datos...');
    
    await getUserInfo();
    
    await Promise.all([
        loadLevels(),
        loadInstructors() 
    ]);
    await loadModules(); // Carga inicial con paginación
    setupEventListeners();
});

function setupEventListeners() {
    if (formulario) {
        formulario.addEventListener('submit', handleFormSubmit);
    }
    if (botonCancelar) {
        botonCancelar.addEventListener('click', resetForm);
    }
    if (buscadorModulosEl) {
        buscadorModulosEl.addEventListener('input', debounce(filterModules, 300));
    }
    if (filtroAnoModuloEl) {
        filtroAnoModuloEl.addEventListener('change', filterModules);
    }
}

// -----------------------------------------------------
// FUNCIÓN PARA OBTENER INFORMACIÓN DEL USUARIO
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
        
        if (glassCard && glassCard.contains(document.getElementById('formulario-modulo'))) {
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
        
        if (glassCard && glassCard.contains(document.getElementById('formulario-modulo'))) {
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
        border-radius: var(--radio-borde-principal);
        padding: var(--espaciado-xl);
        margin: var(--espaciado-xl) 0;
        color: var(--acento-azul);
        text-align: center;
        font-weight: 500;
        backdrop-filter: blur(20px);
    `;
    messageDiv.innerHTML = `
        <i class="fas fa-info-circle" style="margin-right: 8px; font-size: 1.2rem;"></i>
        Como usuario Docente, solo puede consultar la información de los módulos. 
        Las funciones de creación, edición y eliminación están restringidas.
    `;
    
    const firstCard = mainContainer.querySelector('.glass-card');
    if (firstCard) {
        firstCard.insertAdjacentElement('beforebegin', messageDiv);
    } else {
        mainContainer.insertBefore(messageDiv, mainContainer.firstChild);
    }
}

// Exportar funciones para uso global
window.editModule = editModule;
window.deleteModule = deleteModule;
window.changePage = changePage;